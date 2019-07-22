const BRANCH_TO_NPM_TAG_MAP = {
  develop: 'alpha',
  beta: 'beta',
  master: 'stable'
};

export function getNpmTag(branchName: string): string {
  const tag = BRANCH_TO_NPM_TAG_MAP[branchName];

  if (tag != null) {
    return tag;
  }

  return getFeatureBranchTag(branchName);
}

function getFeatureBranchTag(branchName: string): string {
  return branchName.replace(/\//g, '~');
}
