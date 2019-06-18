import { getPackageVersion } from './package_version';
import { getGitBranch, getGitTagList, gitAdd, gitCommit, gitPush, gitPushTags, gitTag, isDirty } from './git';
import { APPLICABLE_BRANCHES, incrementVersion } from './increment_version';
import { sh } from './shell';

const BADGE = '[increment-version]\t';

/**
 * Increments the version in `package.json` automatically, adds a suffix to the version, tags and pushes it
 * (when on one of the applicable branches).
 *
 * Example:
 *
 *    current version:  1.2.0-beta2
 *    new version:      1.2.0-beta3
 *    new tag:         v1.2.0-beta3
 */
export async function run(...args): Promise<void> {
  const isDryRun = args.indexOf('--dry') !== -1;
  const isForced = args.indexOf('--force') !== -1;
  const isDirtyAndNotForced = isDirty() && !isForced;

  const nextVersion = getNextVersion();
  const notOnApplicableBranch = nextVersion == null;

  printInfo(isDryRun, isForced);

  if (isDirtyAndNotForced) {
    const workdirState = sh('git status --porcelain --untracked-files=no').trim();

    console.error(`${BADGE}Can not proceed due to dirty git workdir:`);
    printMultiLineString(workdirState);

    process.exit(1);
  }

  if (notOnApplicableBranch) {
    console.error(`${BADGE}Aborting since we are not on one of these branches:`);
    console.error(`${BADGE}  ${APPLICABLE_BRANCHES.join(', ')}`);
    process.exit(1);
  }

  if (isDryRun) {
    console.log(`${BADGE}I would commit version ${nextVersion} and tag that commit as "v${nextVersion}"`);

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