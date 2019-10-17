import * as yargsParser from 'yargs-parser';
import { readFileSync } from 'fs';
import chalk from 'chalk';

import { getGitBranch } from '../git/git';
import { getNpmTag } from '../npm/tag';
import { getPackageVersion } from '../versions/package_version';
import { printMultiLineString } from '../cli/printMultiLineString';
import { setupNpm } from './internal/setup-git-and-npm-connections';
import { sh } from '../cli/shell';
import { isRedundantRunTriggeredBySystemUserPush } from '../versions/retry_run';

const COMMAND_NAME = 'publish-npm-package';
const BADGE = `[${COMMAND_NAME}]\t`;

const DOC = `
Publishes the current package to npm.

Does not complain if re-run (providing idempotency for CI).
`;
// DOC: see above
export async function run(...args): Promise<boolean> {
  const argv = yargsParser(args);
  const isDryRun = argv.dry === true;
  const createTagFromBranchName = argv.createTagFromBranchName === true;

  const packageName = getPackageName();
  const packageVersion = getPackageVersion();

  const npmPublishShellCommand = getNpmPublishShellCommand(createTagFromBranchName, isDryRun);

  setupNpm();

  const npmPublishShellCommandOutput = annotatedSh(npmPublishShellCommand);

  const lines = npmPublishShellCommandOutput.trim().split('\n');
  const expectedMessage = `+ ${packageName}@${packageVersion}`;
  const publishCommandSuccessful = lines[lines.length - 1] === expectedMessage;

  if (publishCommandSuccessful) {
    await ensureVersionIsAvailable(packageName, packageVersion);
  } else {
    const isAlreadyPublished =
      npmPublishShellCommandOutput.match(/You cannot publish over the previously published versions/gi) != null;

    if (isAlreadyPublished) {
      console.log(chalk.yellow(`${BADGE}This package version was already published: '${packageVersion}'.`));
    }
    if (isRedundantRunTriggeredBySystemUserPush()) {
      console.error(chalk.yellowBright(`${BADGE}Nothing to do here!`));

      process.exit(0);
    }
  }

  return publishCommandSuccessful;
}

export function getShortDoc(): string {
  return DOC.trim().split('\n')[0];
}

export function printHelp(): void {
  console.log(`Usage: ci_tools ${COMMAND_NAME} [--create-tag-from-branch-name] [--dry]`);
  console.log('');
  console.log(DOC.trim());
}

function getNpmPublishShellCommand(useBranchForTag: boolean, isDryRun: boolean): string {
  const dryRun = isDryRun ? '--dry-run ' : '';
  const npmTag = getNpmTag(getGitBranch());
  const tag = useBranchForTag && npmTag ? `--tag ${npmTag} ` : '';

  return `npm publish ${dryRun}${tag}`.trim();
}

function annotatedSh(cmd: string): string {
  console.log(`${BADGE}|>>> ${cmd}`);
  const output = sh(cmd);
  printMultiLineString(output, `${BADGE}| `);

  return output;
}

function getPackageName(): string {
  const content = readFileSync('package.json').toString();
  const json = JSON.parse(content);

  return json.name;
}

async function ensureVersionIsAvailable(packageName: string, packageVersion: string): Promise<void> {

  const viewCommand = `npm view ${packageName} versions --json`;
  let packageVersionFound = false;

  // TODO: It is certainly debatable on what the best settings would be here.
  // For now, a window of 30 seconds is granted, before the publishing is regarded as failure.
  const maxNumberOfRetries = 60;
  const timeoutBetweenRetriesInMs = 500;
  let currentTry = 0;

  while (packageVersionFound === false && currentTry < maxNumberOfRetries) {
    const versions = sh(viewCommand);
    packageVersionFound = versions.includes(packageVersion);

    if (packageVersionFound) {
      break;
    } else {
      console.log(chalk.yellow(`${BADGE}Version '${packageVersion}' not found. Retrying in 500ms...`));
      currentTry++;
      await new Promise((resolve): any => setTimeout(resolve, timeoutBetweenRetriesInMs));
    }
  }

  if (packageVersionFound) {
    console.log(chalk.green(`${BADGE}Successfully published version '${packageVersion}'.`));
  } else {
    console.error(chalk.red(`${BADGE}Version '${packageVersion}' is not reported by 'npm view'.`));

    process.exit(1);
  }
}
