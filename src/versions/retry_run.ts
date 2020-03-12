import { getPackageVersion, getPackageVersionTag } from './package_version';
import { getNextVersion, getVersionTag } from './git_helpers';
import { getGitBranch, getGitCommitSha1, getGitTagList, isExistingTag } from '../git/git';
import { getExpectedLatestVersion } from './increment_version';

export async function getPartiallySuccessfulBuildVersion(mode: string): Promise<string> {
  return getSuspectedPartiallySuccessfulBuildVersion(mode);
}

export async function isRetryRunForPartiallySuccessfulBuild(mode: string): Promise<boolean> {
  const latestVersion = await getSuspectedPartiallySuccessfulBuildVersion(mode);
  const latestVersionTag = getVersionTag(latestVersion);
  const latestVersionTagAlreadyExists = isExistingTag(latestVersionTag);

  return latestVersionTagAlreadyExists && currentCommitIsCommitBeforeTag(latestVersionTag);
}

export async function isRedundantRunTriggeredBySystemUserPush(mode: string): Promise<boolean> {
  const currentVersionTag = await getPackageVersionTag(mode);
  const nextVersion = await getNextVersion(mode);
  const nextVersionTag = getVersionTag(nextVersion);
  const currentVersionReleaseChannel = getReleaseChannelFromTagOrVersion(currentVersionTag);
  const nextVersionReleaseChannel = getReleaseChannelFromTagOrVersion(nextVersionTag);
  const isSameReleaseChannel = currentVersionReleaseChannel === nextVersionReleaseChannel;

  const result = isSameReleaseChannel && currentCommitIsTag(currentVersionTag);

  return result;
}

async function getSuspectedPartiallySuccessfulBuildVersion(mode: string): Promise<string> {
  const packageVersion = await getPackageVersion(mode);
  const branchName = getGitBranch();
  const gitTagList = getGitTagList();
  const latestVersion = getExpectedLatestVersion(packageVersion, branchName, gitTagList);

  return latestVersion;
}

function currentCommitIsCommitBeforeTag(tag: string): boolean {
  return currentCommitIsTag(`${tag}^`);
}

function currentCommitIsTag(tag: string): boolean {
  const isParentCommit = getGitCommitSha1('HEAD') === getGitCommitSha1(tag);

  return isParentCommit;
}

function getReleaseChannelFromTagOrVersion(tagNameOrVersion: string): string {
  const matched = tagNameOrVersion.match(/^v?\d+\.\d+\.\d+-([^.]+)/);

  return matched == null ? null : matched[0];
}
