import { getPackageVersion, getPackageVersionTag } from './package_version';
import { getNextVersion, getVersionTag } from './git_helpers';
import { getGitBranch, getGitCommitSha1, getGitTagList, isExistingTag } from '../git/git';
import { getExpectedLatestVersion } from './increment_version';

export function getPartiallySuccessfulBuildVersion(): string {
  return getSuspectedPartiallySuccessfulBuildVersion();
}

export function isRetryRunForPartiallySuccessfulBuild(): boolean {
  const latestVersion = getSuspectedPartiallySuccessfulBuildVersion();
  const latestVersionTag = getVersionTag(latestVersion);
  const latestVersionTagAlreadyExists = isExistingTag(latestVersionTag);

  return latestVersionTagAlreadyExists && currentCommitIsCommitBeforeTag(latestVersionTag);
}

export function isRedundantRunTriggeredBySystemUserPush(): boolean {
  const currentVersionTag = getPackageVersionTag();
  const nextVersion = getNextVersion();
  const nextVersionTag = getVersionTag(nextVersion);
  const currentVersionReleaseChannel = getReleaseChannelFromTagOrVersion(currentVersionTag);
  const nextVersionReleaseChannel = getReleaseChannelFromTagOrVersion(nextVersionTag);
  const isSameReleaseChannel = currentVersionReleaseChannel === nextVersionReleaseChannel;

  const result = isSameReleaseChannel && currentCommitIsTag(currentVersionTag);

  return result;
}

function getSuspectedPartiallySuccessfulBuildVersion(): string {
  const packageVersion = getPackageVersion();
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
