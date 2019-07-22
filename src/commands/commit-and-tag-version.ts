import chalk from 'chalk';

import { getChangelogText } from './internal/create-changelog';
import { getGitBranch, gitAdd, gitCommit, gitPush, gitPushTags, gitTag } from '../git/git';
import { getPackageVersion, getPackageVersionTag } from '../versions/package_version';
import { getPrevVersionTag } from '../versions/git_helpers';
import { sh } from '../git/shell';

const BADGE = '[commit-and-tag-version]\t';

/**
 * Commits, tags and pushes the current version
 * (when on one of the applicable branches).
 *
 */
export async function run(...args): Promise<boolean> {
  const isDryRun = args.indexOf('--dry') !== -1;
  const isForced = process.env.CI_TOOLS_FORCE_PUBLISH === 'true' || args.indexOf('--force') !== -1;

  printInfo(isDryRun, isForced);

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

function commitPushAndTagCurrentVersion(currentVersion: string, changelogText: string): boolean {
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
