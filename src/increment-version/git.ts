import { sh } from './shell';

const CURRENT_BRANCH_MARKER = /^\*\ /;

export function getGitTagList(): string {
  return sh('git tag --list').trim();
}

export function getGitBranch(): string {
  return process.env.GIT_BRANCH || getGitBranchFromGit();
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

export function gitAdd(...files): string {
  return sh(`git add ${files.join(' ')}`);
}

export function gitCommit(commitMessage): string {
  return sh(`git commit -m "${commitMessage}"`);
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
