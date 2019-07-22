const NO_NPM_TAG = 'NO_BRANCH_TAG';
const BRANCH_TO_NPM_TAG_MAP = {
  develop: 'alpha',
  beta: 'beta',
  master: NO_NPM_TAG
};

export function getNpmTag(branchName: string): string | null {
  const tag = BRANCH_TO_NPM_TAG_MAP[branchName];

  if (tag === NO_NPM_TAG) {
    return null;
  }
  if (tag != null) {
    return tag;
  }

  return getBranchTag(branchName);
}

function getBranchTag(branchName: string): string {
  return branchName.replace(/\//g, '~');
}
