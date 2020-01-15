import { escapeForShell, sh } from '../cli/shell';

const CURRENT_BRANCH_MARKER = /^\* /;

type GitCommitMessage = {
  subject: string;
  body: string | null;
};
type GitOperationResult = string;

export function getGitTagList(): string {
  return sh('git tag --sort=-creatordate').trim();
}

export function getGitCommitListSince(ref: string, since: string): string {
  return sh(`git log --format="%H" --since ${since} ${ref}`).trim();
}

export function getGitCommitSha1(ref: string = 'HEAD'): string {
  return sh(`git rev-parse ${ref}`).trim();
}

export function getGitBranch(): string {
  const gitRef = process.env.GIT_BRANCH || process.env.GITHUB_REF;
  if (gitRef != null) {
    return gitRef.replace(/^refs\/heads\//, '');
  }

  return getGitBranchFromGit();
}

export function getGitTagsFromCommit(ref: string): string[] {
  const tags = sh(`git tag -l --points-at ${ref}`).trim();

  return tags.split('\n');
}

export function getFullCommitMessageFromRef(tagOrCommit: string): GitCommitMessage | null {
  const output = sh(`git show -s --format=%B ${tagOrCommit}`);
  const lines = output.split('\n');
  const subject = lines[0];
  const body = lines
    .slice(1, lines.length - 2)
    .join('\n')
    .trim();

  return { subject, body };
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

export function gitAdd(...files: string[]): GitOperationResult {
  return sh(`git add ${files.join(' ')}`);
}

export function gitCommit(commitMessage: string): GitOperationResult {
  const escapedCommitMessage = escapeForShell(commitMessage);

  return sh(`git commit --allow-empty -m "${escapedCommitMessage}"`);
}

export function gitTag(newTag: string): GitOperationResult {
  return sh(`git tag ${newTag}`);
}

export function gitPush(remoteName: string, branchName: string): GitOperationResult {
  const cmd = `git push ${remoteName} ${branchName}`;
  console.log(`>> ${cmd}`);
  const output = sh(cmd).trim();
  console.log(output);

  return output;
}

export function gitPushTags(): GitOperationResult {
  const cmd = 'git push --tags';
  console.log(`>> ${cmd}`);
  const output = sh(cmd).trim();
  console.log(output);

  return output;
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

export function isGitHubRemote(): boolean {
  const url = sh('git remote get-url origin');
  const matchData = url.match(/github.com[:/](.+)$/m);

  return matchData != null;
}

function getGitBranchFromGit(): string {
  const outputLines = sh('git branch')
    .trim()
    .split('\n');
  const branchLine = outputLines.find((name: string): boolean => !!name.match(CURRENT_BRANCH_MARKER));

  return branchLine.replace(CURRENT_BRANCH_MARKER, '');
}
