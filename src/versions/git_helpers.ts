import { getGitBranch, getGitCommitSha1, getGitTagList } from '../git/git';
import { getPackageVersion } from './package_version';
import { incrementVersion } from './increment_version';
import { previousStableVersion } from './previous_stable_version';

export async function getNextVersion(mode: string): Promise<string | null> {
  const packageVersion = await getPackageVersion(mode);
  const branchName = getGitBranch();
  const gitTagList = getGitTagList();
  const incrementedVersion = incrementVersion(packageVersion, branchName, gitTagList);

  return incrementedVersion || getPreVersionForGitCommit(packageVersion, branchName, getGitCommitSha1());
}

export function getPreVersionForGitCommit(packageVersion: string, branchName: string, ref: string): string {
  const baseVersion = packageVersion.split('-')[0];
  const branchPrefix = branchName.split('/')[0];
  const refShort = ref.slice(0, 6);
  const suffix = getRandomSuffix();

  return `${baseVersion}-${branchPrefix}-${refShort}-${suffix}`;
}

/**
 * Returns the version tag fora given `version`.
 */
export function getVersionTag(version: string): string {
  return `v${version}`;
}

/**
 * Returns the "prev" version according to the rules described in `run`.
 */
export async function getPrevVersion(mode: string): Promise<string> {
  const packageVersion = await getPackageVersion(mode);
  const gitTagList = getGitTagList();

  return previousStableVersion(packageVersion, gitTagList);
}

/**
 * Returns the "previous" version tag according to the rules described in `run`.
 */
export async function getPrevVersionTag(mode: string): Promise<string> {
  const previousVersion = await getPrevVersion(mode);

  return previousVersion == null ? null : `v${previousVersion}`;
}

function getRandomSuffix(): string {
  return Date.now().toString(36);
}
