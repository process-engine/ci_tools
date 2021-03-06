import chalk from 'chalk';
import fetch from 'node-fetch';
import * as moment from 'moment';
import * as yargsParser from 'yargs-parser';

import { PullRequest, getMergedPullRequests } from '../../github/pull_requests';
import {
  getCurrentApiBaseUrlWithAuth,
  getCurrentRepoNameWithOwner,
  getGitCommitListSince,
  getGitTagDate,
  getGitTagList
} from '../../git/git';
import { getNextVersion, getPrevVersionTag, getVersionTag } from '../../versions/git_helpers';
import { parseVersion } from '../../versions/parse_version';

type CommitFromApi = any;
type IssueFromApi = any;
type PreviousPreVersion = {
  tag: string;
  date: Date;
};

const GITHUB_REPO = getCurrentRepoNameWithOwner();
const COMMIT_API_URI = getCurrentApiBaseUrlWithAuth('/commits/:commit_sha');
const ISSUES_API_URI = getCurrentApiBaseUrlWithAuth('/issues?state=closed&since=:since&page=:page');

const BADGE = '[create-changelog]\t';
const DEFAULT_MODE = 'node';

const MERGED_PULL_REQUEST_LENGTH_THRESHOLD = 100;
const CLOSED_ISSUE_LENGTH_THRESHOLD = 100;

// two weeks for feature-freeze period plus one week buffer for late releases
const CONSIDER_PULL_REQUESTS_WEEKS_BACK = 3;

/**
 * Creates a changelog based on data available in Git and GitHub:
 *
 * - Git: latest commits and tags
 * - GitHub: PRs and Issues
 */
export async function run(...args): Promise<boolean> {
  const argv = yargsParser(args, { alias: { help: ['h'] }, default: { mode: DEFAULT_MODE } });
  const mode = argv.mode;
  let startRef = args[0];
  if (!startRef) {
    startRef = await getPrevVersionTag(mode);
    console.log(`${BADGE}No start ref given, using: "${startRef}"`);
  }
  const changelogText = await getChangelogText(mode, startRef);

  console.log(changelogText);
  return true;
}

export async function getChangelogText(mode: string, startRef: string): Promise<string> {
  if (startRef == null) {
    return '';
  }

  const apiResponse = await getCommitFromApi(startRef);

  if (apiResponse.commit == null) {
    console.error(chalk.red(`${BADGE} API responded with: ${apiResponse.message}`));

    process.exit(3);
  }

  const startCommitDate = apiResponse.commit.committer.date;
  const startDate = moment(startCommitDate)
    .subtract(CONSIDER_PULL_REQUESTS_WEEKS_BACK, 'weeks')
    .toISOString();

  const endRef = 'HEAD';

  const nextVersion = await getNextVersion(mode);
  if (nextVersion == null) {
    console.error(chalk.red(`${BADGE}Could not determine nextVersion!`));
    process.exit(3);
  }

  const nextVersionTag = getVersionTag(nextVersion);

  printInfo(startRef, startDate, endRef, nextVersion, nextVersionTag);

  const mergedPullRequestsSince = await getMergedPullRequests(startDate);
  const mergedPullRequests = filterPullRequestsForBranch(mergedPullRequestsSince, '', startRef, startDate);

  if (mergedPullRequests.length >= MERGED_PULL_REQUEST_LENGTH_THRESHOLD) {
    console.error(chalk.red(`${BADGE}Sanity check failed!`));
    console.error(chalk.red(`${BADGE}Found an unexpectedly high number of merged pull requests:`));
    console.error(
      chalk.red(`${BADGE}  ${mergedPullRequests.length} (threshold is ${MERGED_PULL_REQUEST_LENGTH_THRESHOLD})`)
    );
    process.exit(2);
  }

  const closedIssuesSince = await getClosedIssuesFromApi(startDate);
  const issuesClosedByPullRequest = closedIssuesSince.filter((issue: any): boolean => {
    const pullRequestClosingThisIssue = mergedPullRequests.find(
      (pr: PullRequest): boolean => pr.closedIssueNumbers.indexOf(issue.number) !== -1
    );
    return pullRequestClosingThisIssue != null;
  });
  if (issuesClosedByPullRequest.length >= CLOSED_ISSUE_LENGTH_THRESHOLD) {
    console.error(chalk.red(`${BADGE}Sanity check failed!`));
    console.error(chalk.red(`${BADGE}Found an unexpectedly high number of closed issues:`));
    console.error(
      chalk.red(`${BADGE}  ${issuesClosedByPullRequest.length} (threshold is ${CLOSED_ISSUE_LENGTH_THRESHOLD})`)
    );
    process.exit(2);
  }

  const previousPreVersions = getPreviousPreVersionsInReleaseChannel(nextVersion);
  const shouldShowPreviousPreVersions = previousPreVersions.length > 0;
  let currentPreviousPreVersion = shouldShowPreviousPreVersions ? { tag: nextVersionTag, date: new Date() } : null;
  let currentPreviousPreVersionIndex = -1;

  const mergedPullRequestsText = mergedPullRequests
    .map((pr: PullRequest): string => {
      let text = '';
      const mergedAtDate = moment(pr.mergedAt);
      const mergedAtString = mergedAtDate.format('YYYY-MM-DD');
      const introducedInCurrentPreviousPreVersion =
        currentPreviousPreVersion != null && mergedAtDate.isBefore(currentPreviousPreVersion.date);

      if (introducedInCurrentPreviousPreVersion) {
        const header =
          currentPreviousPreVersionIndex === -1
            ? `${currentPreviousPreVersion.tag} (this release)`
            : `[${currentPreviousPreVersion.tag}](https://github.com/${GITHUB_REPO}/releases/tag/${currentPreviousPreVersion.tag})`;

        currentPreviousPreVersionIndex += 1;
        currentPreviousPreVersion = previousPreVersions[currentPreviousPreVersionIndex];

        text += `\n**${header}**\n\n`;
      }

      const title = ensureSpaceAfterLeadingEmoji(pr.title);
      let breakingPrefix = '';
      if (pr.isBreakingChange && !title.toLowerCase().includes('breaking')) {
        breakingPrefix = `**BREAKING CHANGE:** `;
      }

      text += `- ${breakingPrefix}#${pr.number} ${title} (merged ${mergedAtString})`;

      return text;
    })
    .join('\n');
  const issuesClosedByPullRequestText = issuesClosedByPullRequest
    .map((issue: IssueFromApi): string => {
      const title = ensureSpaceAfterLeadingEmoji(issue.title);
      let breakingPrefix = '';
      if (issue.isBreakingChange && !title.toLowerCase().includes('breaking')) {
        breakingPrefix = `**BREAKING CHANGE:** `;
      }

      return `- ${breakingPrefix}#${issue.number} ${title}`;
    })
    .join('\n');

  const now = moment();
  const changelogText = `
# Changelog ${nextVersionTag} (${now.format('YYYY-MM-DD')})

This changelog covers the changes between [${startRef} and ${nextVersionTag}](https://github.com/${GITHUB_REPO}/compare/${startRef}...${nextVersionTag}).

For further reference, please refer to the changelog of the previous version, [${startRef}](https://github.com/${GITHUB_REPO}/releases/tag/${startRef}).

## Merged Pull Requests

${mergedPullRequestsText || '- none'}

## Corresponding Issues

${issuesClosedByPullRequestText || '- none'}

  `.trim();

  return changelogText;
}

function getPreviousPreVersionsInReleaseChannel(nextVersion: string): PreviousPreVersion[] {
  const nextVersionParsed = parseVersion(nextVersion);
  const addPreviousBetaVersions = nextVersionParsed.releaseChannelName === 'beta';
  let previousPreVersions = [];

  if (addPreviousBetaVersions) {
    const nextVersionTag = getVersionTag(nextVersion);
    const versionWithoutReleaseChannelNumber = nextVersionTag.replace(/\d$/, '');
    const gitTagList = getGitTagList();
    previousPreVersions = gitTagList
      .split('\n')
      .filter((line: string): boolean => line.startsWith(versionWithoutReleaseChannelNumber))
      .map((tag) => {
        return {
          tag: tag,
          date: moment(getGitTagDate(tag)).toDate()
        };
      });
  }

  return previousPreVersions;
}

async function getCommitFromApi(ref: string): Promise<CommitFromApi> {
  const url = COMMIT_API_URI.replace(':commit_sha', ref);
  const response = await fetch(url);
  return response.json();
}

async function getClosedIssuesFromApi(since: string, page: number = 1): Promise<IssueFromApi[]> {
  const url = ISSUES_API_URI.replace(':since', since).replace(':page', page.toString());
  const response = await fetch(url);
  const issues = await response.json();
  const relevantIssues = issues
    .filter((issue: IssueFromApi): boolean => !issue.pull_request)
    .map((issue: IssueFromApi) => {
      const isBreakingChange = issue.labels.find((label: any): boolean =>
        label.name.toLowerCase().includes('breaking')
      );

      return {
        ...issue,
        isBreakingChange
      };
    });

  if (relevantIssues.length > 0) {
    const nextPageIssues = await getClosedIssuesFromApi(since, page + 1);

    return [...relevantIssues].concat(nextPageIssues);
  }

  return relevantIssues;
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

function ensureSpaceAfterLeadingEmoji(text: string): string {
  const emojiWithoutTrailingSpaceRegex = /([\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}])(\S)/gu;

  return text.replace(
    emojiWithoutTrailingSpaceRegex,
    (substring: string, emojiMatch: string, characterAfterEmojiMatch: string): string => {
      return `${emojiMatch} ${characterAfterEmojiMatch}`;
    }
  );
}

function filterPullRequestsForBranch(
  prs: PullRequest[],
  branchName: string,
  startRef: string,
  since: string
): PullRequest[] {
  const allShaInCurrentBranch = getGitCommitListSince(branchName, since).split('\n');
  const allShaInStartRef = getGitCommitListSince(startRef, since).split('\n');
  const newShaInCurrentBranch = allShaInCurrentBranch.filter(
    (currentSha: string): boolean => allShaInStartRef.indexOf(currentSha) === -1
  );
  const filteredPrs = prs.filter(
    (pr: PullRequest): boolean =>
      newShaInCurrentBranch.indexOf(pr.headSha) !== -1 || newShaInCurrentBranch.indexOf(pr.mergeCommitSha) !== -1
  );

  return filteredPrs;
}
