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

const BADGE = '[publish-npm-package]\t';

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
    const viewCommand = `npm view ${packageName} versions --json`;
    const versions = sh(viewCommand);
    const packageWasActuallyPublished = versions.includes(packageVersion);

    if (packageWasActuallyPublished) {
      console.log(chalk.green(`${BADGE}Successfully published version '${packageVersion}'.`));
    } else {
      console.error(chalk.red(`${BADGE}Version '${packageVersion}' is not reported by '${viewCommand}'.`));

      process.exit(1);
    }
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

function getPackageName(): string[] {
  const content = readFileSync('package.json').toString();
  const json = JSON.parse(content);

  return json.name;
}
