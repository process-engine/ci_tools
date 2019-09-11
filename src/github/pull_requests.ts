import * as moment from 'moment';
import fetch from 'node-fetch';

import { getCurrentApiBaseUrlWithAuth } from '../git/git';

type PullRequestFromApi = any;
export type PullRequest = {
  number: number;
  title: string;
  closedIssueNumbers: number[];
  headSha: string;
  mergeCommitSha: string;
  mergedAt: string;
};

const PULL_REQUEST_INDEX_API_URI = getCurrentApiBaseUrlWithAuth('/pulls?state=closed');

export async function getMergedPullRequests(since: string): Promise<PullRequest[]> {
  const list = await fetchPullRequests(since);
  const listMergedBefore = list.filter((pr: PullRequest): boolean => !!pr.mergedAt);

  return listMergedBefore;
}

async function fetchPullRequests(since: string): Promise<PullRequest[]> {
  const pullRequestsSince = await fetchPullRequestsFromApi(since);

  return pullRequestsSince.map(
    (pr: PullRequestFromApi): PullRequest => {
      return {
        number: pr.number,
        title: pr.title,
        closedIssueNumbers: findIssueNumbers(pr.body),
        mergeCommitSha: pr.merge_commit_sha,
        headSha: pr.head.sha,
        mergedAt: pr.merged_at
      };
    }
  );
}

async function fetchPullRequestsFromApi(since: string, page: number = 1): Promise<PullRequestFromApi[]> {
  const response = await fetch(`${PULL_REQUEST_INDEX_API_URI}&page=${page}`);
  const results = await response.json();
  const pullRequestsSince = results.filter((pr: PullRequestFromApi): boolean => moment(pr.merged_at).isAfter(since));

  if (pullRequestsSince.length > 0) {
    const nextPagePullRequests = await fetchPullRequestsFromApi(since, page + 1);
    return [...pullRequestsSince].concat(nextPagePullRequests);
  }

  return pullRequestsSince;
}

function findIssueNumbers(body: string): number[] {
  const lines = body.split('\n').filter((line: string): boolean => line.match(/^(closes|fixes)/i) != null);
  const matchedNumbers = [];

  lines.forEach((line: string): void => {
    const matched = line.match(/(#(\d+))/gi);
    if (matched == null) {
      return;
    }

    for (const matchedString of matched) {
      const numberAsString = matchedString.replace('#', '');

      matchedNumbers.push(parseInt(numberAsString));
    }
  });

  return matchedNumbers;
}
