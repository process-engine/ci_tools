import chalk from 'chalk';

import {
  getGitBranch,
  getGitTagList,
  getGitTagsFromCommit,
  gitAdd,
  gitCommit,
  gitPush,
  gitPushTags,
  gitTag,
  isCurrentTag,
  isDirty,
  isExistingTag
} from '../git/git';
import { getPackageVersion, getPackageVersionTag } from '../versions/package_version';
import { getNextVersion, getNextVersionTag, getPrevVersionTag } from '../versions/git_helpers';
import { sh } from '../git/shell';
import { APPLICABLE_BRANCHES } from '../versions/increment_version';
import { getChangelogText } from './create-changelog';

const BADGE = '[increment-version]\t';

/**
 * Increments the pre-version in `package.json` automatically, leave the "base"-version alone.
 *
 * Example:
 *
 * Your package.json's version field is
 *
 *    1.2.0-alpha13
 *
 * if you push to develop again, it gets incremented:
 *
 *    1.2.0-alpha14
 *
 * If you merge into `beta`, the suffix is automatically changed and incremented with each subsequent merge/commit:
 *
 *    1.2.0-beta1
 *    1.2.0-beta2
 *    1.2.0-beta3
 *
 * IMPORTANT: This script always keeps the "base"-version and never changes that!
 *
 *    1.2.0-alpha14
 *    1.2.0-beta2
 *    1.2.0
 *    ^^^^^ base version
 *
 * For alpha and beta releases, it adds the suffix, if not present.
 * For stable releases, it removes the suffix to the version, if present.
 *
 * It then writes package.json, commits, tags and pushes it
 * (when on one of the applicable branches).
 *
 */
export async function run(...args): Promise<void> {
  const isDryRun = args.indexOf('--dry') !== -1;
  const isForced = args.indexOf('--force') !== -1;
  const isDirtyAndNotForced = isDirty() && !isForced;

  const currentVersionTag = getPackageVersionTag();
  const nextVersion = getNextVersion();
  const nextVersionTag = getNextVersionTag();
  const notOnApplicableBranch = nextVersion == null;

  printInfo(isDryRun, isForced);

  if (isCurrentTag(currentVersionTag)) {
    console.error(
      chalk.yellow(
        `${BADGE}Current commit is tagged with "${currentVersionTag}", which is the current package version.`
      )
    );
    console.error(chalk.yellow(`${BADGE}Nothing to do here!`));

    process.exit(1);
  }

  if (isDirtyAndNotForced) {
    const workdirState = sh('git status --porcelain --untracked-files=no').trim();

    console.error(chalk.red(`${BADGE}Can not proceed due to dirty git workdir:`));
    printMultiLineString(workdirState);

    process.exit(1);
  }

  if (notOnApplicableBranch) {
    console.error(chalk.red(`${BADGE}Aborting since we are not on one of these branches:`));
    console.error(chalk.red(`${BADGE}  ${APPLICABLE_BRANCHES.join(', ')}`));
    process.exit(1);
  }

  if (isExistingTag(nextVersionTag)) {
    console.error(chalk.red(`${BADGE}Sanity check failed!`));
    console.error(chalk.red(`${BADGE}Tag "${nextVersionTag}" already exists!`));

    process.exit(1);
  }

  if (isDryRun) {
    console.log(chalk.yellow(`${BADGE}I would commit version ${nextVersion} and tag that commit as "v${nextVersion}"`));
    console.log(chalk.yellow(`${BADGE}Aborting due to --dry.`));

    process.exit(1);
  }

  const changelogText = await getChangelogText(getPrevVersionTag());
  commitPushAndTagNextVersion(nextVersion, changelogText);

  console.log(
    chalk.greenBright(
      `${BADGE}Commited package.json with version ${nextVersion} and tagged that commit as "v${nextVersion}"`
    )
  );
}

function printInfo(isDryRun: boolean, isForced: boolean): void {
  const packageVersion = getPackageVersion();
  const packageVersionTag = getPackageVersionTag();
  const branchName = getGitBranch();
  const gitTagList = getGitTagList();

  console.log(`${BADGE}isDryRun:`, isDryRun);
  console.log(`${BADGE}isForced:`, isForced);
  console.log('');
  console.log(`${BADGE}packageVersion:`, packageVersion);
  console.log(`${BADGE}packageVersionTag:`, packageVersionTag);
  console.log(`${BADGE}branchName:`, branchName);
  console.log(`${BADGE}gitTagList:`);
  printMultiLineString(gitTagList);
  console.log(`${BADGE}tagsForHEAD:`);
  printMultiLineString(getGitTagsFromCommit('HEAD'));
  console.log(`${BADGE}nextVersionTag:`, getNextVersionTag());
  console.log('');
}

function printMultiLineString(text: string | string[]): void {
  const lines = Array.isArray(text) ? text : text.split('\n');

  lines.forEach((line: string): void => console.log(`${BADGE}  ${line}`));
}

function commitPushAndTagNextVersion(nextVersion: string, changelogText: string): void {
  const nextVersionTag = `v${nextVersion}`;
  sh(`npm version ${nextVersion} --no-git-tag-version`);

  gitAdd('package.json');
  gitAdd('package-lock.json');

  sh('git status');

  gitCommit(`Release ${nextVersionTag}\n\n${changelogText}\n\n[skip ci]`);
  gitTag(nextVersionTag);

  gitPush();
  gitPushTags();
}