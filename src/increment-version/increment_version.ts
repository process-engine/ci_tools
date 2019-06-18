const NO_PRE_VERSION = 'NO_PRE_VERSION';
const PRE_VERSION_SUFFIX_MAP = {
  develop: 'alpha',
  beta: 'beta',
  master: NO_PRE_VERSION
};

export const VERSION_INCREMENTER_BRANCHES = Object.keys(PRE_VERSION_SUFFIX_MAP);

export function findNextSuffixNumber(baseVersion: string, branchName: string, tagList: string): number | null {
  const targetVersion = getTargetVersion(baseVersion);
  const preVersionSuffix = getPreVersionSuffix(branchName);

  if (preVersionSuffix == null) {
    return null;
  }

  const versionPrefix = `v${targetVersion}-${preVersionSuffix}`;
  const existingTags = tagList.split('\n').filter((tag: string): boolean => tag.trim().indexOf(versionPrefix) === 0);

  if (existingTags.length === 0) {
    return 1;
  }

  const existingNumbers = existingTags.map((tag: string): number => {
    const matchData = tag.match(/(\d+)$/);

    return parseInt(matchData[0]);
  });
  const sortedNumbersDesc = existingNumbers.sort((a: number, b: number): number => b - a);

  return sortedNumbersDesc[0] + 1; // TODO: implement me
}

export function incrementVersion(packageVersion: string, branchName: string, gitTagList: string): string | null {
  const targetVersion = getTargetVersion(packageVersion);
  const preVersionSuffix = getPreVersionSuffix(branchName);

  if (preVersionSuffix === NO_PRE_VERSION) {
    return targetVersion;
  }
  if (preVersionSuffix == null) {
    return null;
  }

  const nextSuffixNumber = findNextSuffixNumber(packageVersion, branchName, gitTagList);

  return `${targetVersion}-${preVersionSuffix}${nextSuffixNumber}`;
}

function getTargetVersion(baseVersion: string): string {
  const targetBase = baseVersion.split('-')[0];

  return targetBase.trim().replace(/^v/, '');
}

function getPreVersionSuffix(branchName: string): string {
  return PRE_VERSION_SUFFIX_MAP[branchName];
}
