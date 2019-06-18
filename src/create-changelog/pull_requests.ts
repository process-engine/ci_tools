import fetch from 'node-fetch';
import { sh } from '../increment-version/shell';

import { getCurrentRepoNameWithOwner } from '../increment-version/git';

type MergeCommit = any;

const GITHUB_REPO = getCurrentRepoNameWithOwner();
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_REPO}`;
const PULL_REQUEST_API_URI = `${GITHUB_API_BASE}/pulls/:pull_number`;

export async function getMergedPullRequests(startRef: string, endRef: string, since: string): Promise<any[]> {
  const gitLogs = sh(`git log --merges --oneline ${startRef}..${endRef}`);
  const parsedLog = parseGitOneLinerLog(gitLogs);

  return addPullRequestInfo(parsedLog);
}

function parseGitOneLinerLog(text: string): any {
  const lines = text.split('\n');
  return lines
    .filter((line: string): boolean => line.trim() !== '')
    .map((line: string): any => {
      const matchData = line.match(/^([a-f0-9]+)(\s+)(.+)$/);
      const hash = matchData[1];
      const title = matchData[3];
      const pullRequestNumber = getPullRequestNumber(title);

      return { hash: hash, originalTitle: title, pullRequestNumber: pullRequestNumber };
    });
}

function getPullRequestNumber(commitTitle: string): number | null {
  const matchData = commitTitle.match(/Merge pull request #(\d+) from /);

  if (matchData) {
    return parseInt(matchData[1]);
  }

  return null;
}

async function addPullRequestInfo(gitCommits: MergeCommit[]): Promise<MergeCommit[]> {
  return Promise.all(gitCommits.map(fetchPullRequestInfoForCommit));
}

async function fetchPullRequestInfoForCommit(commit: MergeCommit): Promise<MergeCommit> {
  if (commit.pullRequestNumber == null) {
    return { ...commit, title: commit.originalTitle };
  }

  const url = PULL_REQUEST_API_URI.replace(':pull_number', commit.pullRequestNumber);
  const response = await fetch(url);
  const data = await response.json();

  return { ...commit, title: data.title };
}
