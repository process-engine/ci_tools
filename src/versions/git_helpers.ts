import { getGitBranch, getGitTagList } from '../git/git';
import { getPackageVersion } from './package_version';
import { incrementVersion } from './increment_version';
import { previousStableVersion } from './previous_stable_version';

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
