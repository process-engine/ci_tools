import * as yargsParser from 'yargs-parser';
import chalk from 'chalk';

import { getChangelogText } from './internal/create-changelog';
import { getGitBranch, gitAdd, gitCommit, gitPush, gitPushTags, gitTag } from '../git/git';
import { getPackageVersion, getPackageVersionTag } from '../versions/package_version';
import { getPrevVersionTag } from '../versions/git_helpers';
import { setupGit } from './internal/setup-git-and-npm-connections';
import { sh } from '../cli/shell';
import { isRedundantRunTriggeredBySystemUserPush, isRetryRunForPartiallySuccessfulBuild } from '../versions/retry_run';
import { printMultiLineString } from '../cli/printMultiLineString';

const COMMAND_NAME = 'commit-and-tag-version';
const BADGE = `[${COMMAND_NAME}]\t`;

const DOC = `
Commits, tags and pushes the current version (when on one of the applicable branches).
`;
// DOC: see above
export async function run(...args): Promise<boolean> {
  const argv = yargsParser(args, { alias: { help: ['h'] } });
  const isDryRun = argv.dry === true;
  const isForced = process.env.CI_TOOLS_FORCE_PUBLISH === 'true' || argv.force === true;

  setupGit();

  printInfo(isDryRun, isForced);

  if (isRedundantRunTriggeredBySystemUserPush()) {
    const currentVersionTag = getPackageVersionTag();
    console.error(chalk.yellow(`${BADGE}Current commit is tagged with "${currentVersionTag}".`));
    console.error(chalk.yellowBright(`${BADGE}Nothing to do here, since this is the current package version!`));

    process.exit(0);
  }

  if (isRetryRunForPartiallySuccessfulBuild()) {
    console.error(chalk.yellow(`${BADGE}This seems to be a retry run for a partially successful build.`));
    console.error(chalk.yellowBright(`${BADGE}Nothing to do here!`));

    process.exit(0);
  }

  annotatedSh('git config user.name');
  annotatedSh('git config user.email');

  const packageVersion = getPackageVersion();
  const changelogText = await getChangelogText(getPrevVersionTag());
  const commitSuccessful = pushCommitAndTagCurrentVersion(packageVersion, changelogText);

  if (commitSuccessful) {
    console.log(
      chalk.greenBright(
        `${BADGE}Commited package.json with version ${packageVersion} and tagged that commit as "v${packageVersion}"`
      )
    );
  }

  return true;
}

export function getShortDoc(): string {
  return DOC.trim().split('\n')[0];
}

export function printHelp(): void {
  console.log(`Usage: ci_tools ${COMMAND_NAME} <package-pattern> [<package-pattern>...] [--dry] [--force]`);
  console.log('');
  console.log(DOC.trim());
}

function annotatedSh(cmd: string): string {
  console.log(`${BADGE}|>>> ${cmd}`);
  const output = sh(cmd);
  printMultiLineString(output, `${BADGE}| `);

  return output;
}

function printInfo(isDryRun: boolean, isForced: boolean): void {
  const packageVersion = getPackageVersion();
  const packageVersionTag = getPackageVersionTag();
  const branchName = getGitBranch();

  console.log(`${BADGE}isDryRun:`, isDryRun);
  console.log(`${BADGE}isForced:`, isForced);
  console.log('');
  console.log(`${BADGE}packageVersion:`, packageVersion);
  console.log(`${BADGE}packageVersionTag:`, packageVersionTag);
  console.log(`${BADGE}branchName:`, branchName);
  console.log('');
}

function pushCommitAndTagCurrentVersion(currentVersion: string, changelogText: string): boolean {
  const branchName = getGitBranch();
  const currentVersionTag = `v${currentVersion}`;

  sh(`git checkout ${branchName}`);

  gitAdd('package.json');
  gitAdd('package-lock.json');

  sh('git status');

  gitCommit(`Release ${currentVersionTag}\n\n${changelogText}\n\n[skip ci]`);
  gitTag(currentVersionTag);
  gitPush('origin', branchName);
  gitPushTags();

  // TODO: we should check if these were successful!
  return true;
}
