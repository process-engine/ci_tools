import chalk from 'chalk';
import fetch from 'node-fetch';
import * as moment from 'moment';

import { PullRequest, getMergedPullRequests } from '../../github/pull_requests';
import { getCurrentApiBaseUrlWithAuth, getCurrentRepoNameWithOwner } from '../../git/git';
import { getNextVersion, getNextVersionTag, getPrevVersionTag } from '../../versions/git_helpers';

type CommitFromApi = any;
type IssueFromApi = any;

const GITHUB_REPO = getCurrentRepoNameWithOwner();
const COMMIT_API_URI = getCurrentApiBaseUrlWithAuth('/commits/:commit_sha');
const ISSUES_API_URI = getCurrentApiBaseUrlWithAuth('/issues?state=closed&since=:since');

const BADGE = '[create-changelog]\t';

const MERGED_PULL_REQUEST_LENGTH_THRESHOLD = 50;
const CLOSED_ISSUE_LENGTH_THRESHOLD = 50;

/**
 * Creates a changelog based on data available in Git and GitHub:
 *
 * - Git: latest commits and tags
 * - GitHub: PRs and Issues
 */
export async function run(...args): Promise<boolean> {
  let startRef = args[0];
  if (!startRef) {
    startRef = getPrevVersionTag();
    console.log(`${BADGE}No start ref given, using: "${startRef}"`);
  }
  const changelogText = await getChangelogText(startRef);

  console.log(changelogText);
  return true;
}

export async function getChangelogText(startRef: string): Promise<string> {
  const startCommit = await getCommitFromApi(startRef);
  const startDate = startCommit.commit.committer.date;

  const endRef = 'HEAD';

  const nextVersion = getNextVersion();
  if (nextVersion == null) {
    console.error(chalk.red(`${BADGE}Could not determine nextVersion!`));
    process.exit(3);
  }

  const nextVersionTag = getNextVersionTag();

  printInfo(startRef, startDate, endRef, nextVersion, nextVersionTag);

  const mergedPullRequests = await getMergedPullRequests(startDate);
  if (mergedPullRequests.length >= MERGED_PULL_REQUEST_LENGTH_THRESHOLD) {
    console.error(chalk.red(`${BADGE}Sanity check failed!`));
    console.error(chalk.red(`${BADGE}Found an unexpectedly high number of merged pull requests:`));
    console.error(
      chalk.red(`${BADGE}  ${mergedPullRequests.length} (threshold is ${MERGED_PULL_REQUEST_LENGTH_THRESHOLD})`)
    );
    process.exit(2);
  }

  const closedIssues = await getClosedIssuesFromApi(startDate);
  if (closedIssues.length >= CLOSED_ISSUE_LENGTH_THRESHOLD) {
    console.error(chalk.red(`${BADGE}Sanity check failed!`));
    console.error(chalk.red(`${BADGE}Found an unexpectedly high number of closed issues:`));
    console.error(chalk.red(`${BADGE}  ${closedIssues.length} (threshold is ${CLOSED_ISSUE_LENGTH_THRESHOLD})`));
    process.exit(2);
  }

  const closedPRsText = mergedPullRequests
    .map((pr: PullRequest): string => {
      const mergedAt = moment(pr.mergedAt).format('YYYY-MM-DD');
      return `- #${pr.number} ${pr.title} (merged ${mergedAt})`;
    })
    .join('\n');
  const closedIssuesText = closedIssues
    .map((issue: IssueFromApi): string => {
      return `- #${issue.number} ${issue.title}`;
    })
    .join('\n');

  const now = moment();
  const changelogText = `
# Changelog ${nextVersionTag} (${now.format('YYYY-MM-DD')})

This changelog covers the changes between [${startRef} and ${nextVersionTag}](https://github.com/${GITHUB_REPO}/compare/${startRef}...${nextVersionTag}).

For further reference, please refer to the changelog of the previous version, [${startRef}](https://github.com/${GITHUB_REPO}/releases/tag/${startRef}).

## Merged Pull Requests

${closedPRsText || '- none'}

## Closed Issues

${closedIssuesText || '- none'}

  `.trim();

  return changelogText;
}

async function getCommitFromApi(ref: string): Promise<CommitFromApi> {
  const url = COMMIT_API_URI.replace(':commit_sha', ref);
  const response = await fetch(url);
  return response.json();
}

async function getClosedIssuesFromApi(since: string): Promise<IssueFromApi[]> {
  const url = ISSUES_API_URI.replace(':since', since);
  const response = await fetch(url);
  const issues = await response.json();
  return issues.filter((issue: IssueFromApi): boolean => !issue.pull_request);
}

function printInfo(
  startRef: string,
  startDate: string,
  endRef: string,
  nextVersion: string,
  nextVersionTag: string
): void {
  console.log(`${BADGE}startRef:`, startRef);
  console.log(`${BADGE}startDate:`, startDate);
  console.log(`${BADGE}endRef:`, endRef);
  console.log(`${BADGE}nextVersion:`, nextVersion);
  console.log(`${BADGE}nextVersionTag:`, nextVersionTag);
  console.log('');
}