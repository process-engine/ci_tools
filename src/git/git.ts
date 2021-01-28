import { escapeForShell, sh } from '../cli/shell';
import { parseVersion } from '../versions/parse_version';

const CURRENT_BRANCH_MARKER = /^\* /;

const RELEASE_CHANNEL_NAME_TO_BRANCH_MAP = {
  alpha: 'develop',
  beta: 'beta',
  stable: 'master'
};

type GitCommitMessage = {
  subject: string;
  body: string | null;
};
type GitOperationResult = string;

export function getGitTagList(): string {
  return sh('git tag --sort=-creatordate').trim();
}

export function getGitTagDate(tag: string): string {
  return sh(`git log -1 --format=%ai ${tag}`).trim();
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
    const gitRefIsTagReference = gitRef.startsWith('refs/tags/');
    if (gitRefIsTagReference) {
      return getBranchFromRefTag(gitRef);
    }
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

export function isDirty(...pathspec: string[]): boolean {
  return sh(`git status --porcelain --untracked-files=no ${pathspec.join(' ')}`).trim() !== '';
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

export function mapReleaseChannelNameToBranch(releaseChannelName: string): string {
  return RELEASE_CHANNEL_NAME_TO_BRANCH_MAP[releaseChannelName];
}

export function getBranchFromRefTag(gitRef: string): string | null {
  const adjustedGitRef = gitRef.replace(/^refs\/tags\//, '').replace(/^v/, '');
  const versionFromGitRef = parseVersion(adjustedGitRef);

  if (versionFromGitRef == null) {
    return null;
  }

  return mapReleaseChannelNameToBranch(versionFromGitRef.releaseChannelName);
}

function getGitBranchFromGit(): string {
  const outputLines = sh('git branch')
    .trim()
    .split('\n');
  const branchLine = outputLines.find((name: string): boolean => !!name.match(CURRENT_BRANCH_MARKER));

  return branchLine.replace(CURRENT_BRANCH_MARKER, '');
}
