import { getPackageVersionTag } from './package_version';
import { getNextVersion, getVersionTag } from './git_helpers';
import { isCurrentTag } from '../git/git';

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

function getReleaseChannelFromTagOrVersion(tagNameOrVersion: string): string {
  const matched = tagNameOrVersion.match(/^v?\d+\.\d+\.\d+-([^.]+)/);

  return matched == null ? null : matched[0];
}
