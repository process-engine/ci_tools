import * as compareVersions from 'compare-versions';

const PRE_VERSION_REGEX = /-/;

export function previousStableVersion(currentVersionTag: string, gitTagList: string): string | null {
  const currentVersion = currentVersionTag.replace(/^v/, '');
  const allVersions = getSortedListOfAllVersions(gitTagList);
  const stableVersions = removePreVersions(allVersions);
  const stableVersionsAndCurrentVersion = stableVersions.concat(currentVersion).sort(compareVersions);

  const index = stableVersionsAndCurrentVersion.findIndex((version: string): boolean => version === currentVersion);
  const previousIndex = index - 1;

  if (previousIndex < 0) {
    return null;
  }

  return stableVersionsAndCurrentVersion[previousIndex];
}

export function getSortedListOfAllVersions(gitTagList: string): string[] {
  const versions = gitTagList.split('\n').map((version: string): string => version.replace(/^v/, ''));

  return versions.sort(compareVersions);
}

function removePreVersions(versions: string[]): string[] {
  return versions.filter((version: string): boolean => !version.match(PRE_VERSION_REGEX));
}
