import { getPackageVersion, getPackageVersionTag } from './package_version';
import { getNextVersion, getVersionTag } from './git_helpers';
import { getGitBranch, getGitCommitSha1, getGitTagList, isCurrentTag, isExistingTag } from '../git/git';
import { getExpectedLatestVersion } from './increment_version';

export function isRetryRunForPartiallySuccessfulBuild(): boolean {
  const packageVersion = getPackageVersion();
  const branchName = getGitBranch();
  const gitTagList = getGitTagList();

  const latestVersion = getExpectedLatestVersion(packageVersion, branchName, gitTagList);
  const latestVersionTag = getVersionTag(latestVersion);
  const latestVersionTagAlreadyExists = isExistingTag(latestVersionTag);

  return latestVersionTagAlreadyExists && currentCommitIsCommitBeforeTag(latestVersionTag);
}

export function isRetryRun(): boolean {
  const currentVersionTag = getPackageVersionTag();
  const nextVersion = getNextVersion();
  const nextVersionTag = getVersionTag(nextVersion);
  const currentVersionReleaseChannel = getReleaseChannelFromTagOrVersion(currentVersionTag);
  const nextVersionReleaseChannel = getReleaseChannelFromTagOrVersion(nextVersionTag);
  const isSameReleaseChannel = currentVersionReleaseChannel === nextVersionReleaseChannel;

  const result = isSameReleaseChannel && isCurrentTag(currentVersionTag);

  return result;
}

function currentCommitIsCommitBeforeTag(tag: string): boolean {
  const nextVersionTagParentCommit = `${tag}^`;
  const isParentCommit = getGitCommitSha1('HEAD') === getGitCommitSha1(nextVersionTagParentCommit);

  return isParentCommit;
}

function getReleaseChannelFromTagOrVersion(tagNameOrVersion: string): string {
  const matched = tagNameOrVersion.match(/^v?\d+\.\d+\.\d+-([^.]+)/);

  return matched == null ? null : matched[0];
}
