import { sh } from './shell';

const CURRENT_BRANCH_MARKER = /^\* /;

export function getGitTagList(): string {
  return sh('git tag --sort=-creatordate').trim();
}

export function getGitBranch(): string {
  return process.env.GIT_BRANCH ? process.env.GIT_BRANCH.replace(/^refs\/heads\//, '') : getGitBranchFromGit();
}

function getGitBranchFromGit(): string {
  const outputLines = sh('git branch')
    .trim()
    .split('\n');
  const branchLine = outputLines.find((name: string): boolean => !!name.match(CURRENT_BRANCH_MARKER));

  return branchLine.replace(CURRENT_BRANCH_MARKER, '');
}

export function isDirty(): boolean {
  return sh('git status --porcelain --untracked-files=no').trim() !== '';
}

export function isExistingTag(name: string): boolean {
  const foundTag = getGitTagList()
    .split('\n')
    .find((line: string): boolean => line === name);

  return foundTag != null;
}

export function isCurrentTag(tagName: string): boolean {
  const tags = getGitTagsFromCommit('HEAD');

  return tags.includes(tagName);
}

export function getGitTagsFromCommit(ref: string): string[] {
  const tags = sh(`git tag -l --points-at ${ref}`).trim();

  return tags.split('\n');
}

export function gitAdd(...files): string {
  return sh(`git add ${files.join(' ')}`);
}

export function gitCommit(commitMessage): string {
  const escapedCommitMessage = commitMessage.replace(/"/g, '\\"');

  return sh(`git commit -m "${escapedCommitMessage}"`);
}

export function gitTag(newTag): string {
  return sh(`git tag ${newTag}`);
}

export function gitPush(): string {
  return sh('git push');
}

export function gitPushTags(): string {
  return sh('git push --tags');
}

export function getCurrentRepoNameWithOwner(): string {
  const url = sh('git remote get-url origin');
  const matchData = url.match(/github.com[:/](.+)$/m);

  if (matchData == null) {
    return null;
  }

  return matchData[1].replace(/\.git$/, '');
}

export function getGitHubAuthPart(): string {
  if (process.env.GH_USER != null && process.env.GH_TOKEN != null) {
    console.log('--- Using GH_USER & GH_TOKEN');
    return `${process.env.GH_USER}:${process.env.GH_TOKEN}@`;
  }

  return '';
}

export function getCurrentApiBaseUrlWithAuth(route: string): string {
  const gitHubRepo = getCurrentRepoNameWithOwner();
  if (gitHubRepo == null) {
    return null;
  }
  const authPart = getGitHubAuthPart();

  return `https://${authPart}api.github.com/repos/${gitHubRepo}${route}`;
}
