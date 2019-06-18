import fetch from 'node-fetch';

import { getNextVersion, getNextVersionTag } from '../increment-version';
import { getMergedPullRequests } from './pull_requests';
import { getCurrentRepoNameWithOwner } from '../increment-version/git';

type CommitFromApi = any;
type IssueFromApi = any;

const GITHUB_REPO = getCurrentRepoNameWithOwner();
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_REPO}`;
const COMMIT_API_URI = `${GITHUB_API_BASE}/commits/:commit_sha`;
const ISSUES_API_URI = `${GITHUB_API_BASE}/issues?since=:since`;

/**
 * Single source of truth is shared between Git and GitHub:
 * - Git: latest tags and commits
 * - GitHub: PRs and Issues
 */
export async function run(...args): Promise<void> {
  const startRef = args[0];
  const startCommit = await getCommitFromApi(startRef);
  const startDate = startCommit.commit.committer.date;

  const endRef = 'HEAD';

  const nextVersion = getNextVersion();
  const nextVersionTag = getNextVersionTag();

  const mergedPullRequests = await getMergedPullRequests(startRef, endRef, startDate);
  const issues = await getClosedIssuesFromApi(startDate);

  const closedPRsText = mergedPullRequests
    .map((commit: any): string => {
      return `- ${commit.pullRequestNumber ? `#${commit.pullRequestNumber} ` : ''}${commit.title}`;
    })
    .join('\n');
  const closedIssuesText = issues
    .map((issue: IssueFromApi): string => {
      return `- #${issue.number} ${issue.title}`;
    })
    .join('\n');
  const text = `
# Changelog ${nextVersionTag}

This changelog covers the changes between [${startRef} and ${nextVersion}](https://github.com/${GITHUB_REPO}/compare/${startRef}...${nextVersionTag}).

For further reference, please refer to the changelog of the previous version, [${startRef}](https://github.com/${GITHUB_REPO}/releases/tag/${startRef}).

## Merged PullRequests

${closedPRsText || 'none'}

## Closed Issues

${closedIssuesText || 'none'}

  `.trim();

  console.log(text);
}

async function getCommitFromApi(ref: string): Promise<CommitFromApi> {
  const url = COMMIT_API_URI.replace(':commit_sha', ref);
  const response = await fetch(url);
  return response.json();
}

async function getClosedIssuesFromApi(since: string): Promise<IssueFromApi[]> {
  // TODO: Add state=closed to URL!
  const url = ISSUES_API_URI.replace(':since', since);
  const response = await fetch(url);
  return response.json();
}
