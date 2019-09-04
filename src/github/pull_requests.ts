import * as moment from 'moment';
import fetch from 'node-fetch';

import { getCurrentApiBaseUrlWithAuth } from '../git/git';

type PullRequestFromApi = any;
export type PullRequest = {
  hash: string;
  mergedAt: string;
  number: number;
  title: string;
};

const PULL_REQUEST_INDEX_API_URI = getCurrentApiBaseUrlWithAuth('/pulls?state=closed');

export async function getMergedPullRequests(since: string): Promise<PullRequest[]> {
  const list = await fetchPullRequests(since);

  return list.filter((pr: PullRequest): boolean => !!pr.mergedAt);
}

async function fetchPullRequests(since: string): Promise<PullRequest[]> {
  const pullRequestsSince = await fetchPullRequestsFromApi(since);

  return pullRequestsSince.map(
    (pr: PullRequestFromApi): PullRequest => {
      return { hash: pr.merge_commit_sha, mergedAt: pr.merged_at, number: pr.number, title: pr.title };
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
