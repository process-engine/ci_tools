import chalk from 'chalk';

import { getPackageVersion } from './package_version';
import { getGitBranch, getGitTagList, gitPush, gitPushTags, isDirty, isExistingTag } from './git';
import { APPLICABLE_BRANCHES, incrementVersion } from './increment_version';
import { sh } from './shell';
import { previousStableVersion } from './previous_stable_version';

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

  const nextVersion = getNextVersion();
  const nextVersionTag = getNextVersionTag();
  const notOnApplicableBranch = nextVersion == null;

  printInfo(isDryRun, isForced);

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

    return;
  }

  commitPushAndTagNextVersion(nextVersion);
}

/**
 * Returns the "next" version according to the rules described in `run`.
 */
export function getNextVersion(): string {
  const packageVersion = getPackageVersion();
  const branchName = getGitBranch();
  const gitTagList = getGitTagList();

  return incrementVersion(packageVersion, branchName, gitTagList);
}

/**
 * Returns the "next" version tag according to the rules described in `run`.
 */
export function getNextVersionTag(): string {
  return `v${getNextVersion()}`;
}

/**
 * Returns the "prev" version according to the rules described in `run`.
 */
export function getPrevVersion(): string {
  const packageVersion = getPackageVersion();
  const gitTagList = getGitTagList();

  return previousStableVersion(packageVersion, gitTagList);
}

/**
 * Returns the "previous" version tag according to the rules described in `run`.
 */
export function getPrevVersionTag(): string {
  return `v${getPrevVersion()}`;
}

function printInfo(isDryRun: boolean, isForced: boolean): void {
  const packageVersion = getPackageVersion();
  const branchName = getGitBranch();
  const gitTagList = getGitTagList();

  console.log(`${BADGE}isDryRun:`, isDryRun);
  console.log(`${BADGE}isForced:`, isForced);
  console.log('');
  console.log(`${BADGE}packageVersion:`, packageVersion);
  console.log(`${BADGE}branchName:`, branchName);
  console.log(`${BADGE}gitTagList:`);
  printMultiLineString(gitTagList);
  console.log(`${BADGE}nextVersionTag:`, getNextVersionTag());
  console.log('');
}

function printMultiLineString(text: string): void {
  text.split('\n').forEach((line: string): void => console.log(`${BADGE}  ${line}`));
}

function commitPushAndTagNextVersion(nextVersion: string): void {
  sh(`npm version ${nextVersion}`);
  gitPush();
  gitPushTags();
}
