import chalk from 'chalk';
import fetch from 'node-fetch';
import * as moment from 'moment';
import * as yargsParser from 'yargs-parser';

import { PullRequest, getMergedPullRequests } from '../../github/pull_requests';
import { getCurrentApiBaseUrlWithAuth, getCurrentRepoNameWithOwner, getGitCommitListSince } from '../../git/git';
import { getPrevVersionTag, getVersionTag } from '../../versions/git_helpers';
import { getPackageVersion } from '../../versions/package_version';

type CommitFromApi = any;

const COMMIT_API_URI = getCurrentApiBaseUrlWithAuth('/commits/:commit_sha');

const BADGE = '[create-changelog-announcement]\t';

const DEFAULT_MODE = 'node';

const MERGED_PULL_REQUEST_LENGTH_THRESHOLD = 100;

// two weeks for feature-freeze period plus one week buffer for late releases
const CONSIDER_PULL_REQUESTS_WEEKS_BACK = 3;

/**
 * Creates an announcement based on data available in Git and GitHub:
 *
 * - Git: latest commits and tags
 * - GitHub: PRs
 */
export async function run(...args): Promise<boolean> {
  const argv = yargsParser(args, { alias: { help: ['h'] }, default: { mode: DEFAULT_MODE } });
  const mode = argv.mode;
  const text = await getReleaseAnnouncement(mode);

  console.log(text);
  return true;
}

export async function getReleaseAnnouncement(mode: string): Promise<string> {
  const startRef: string = await getPrevVersionTag(mode);
  const nextVersion = await getPackageVersion(mode);
  const nextVersionTag = getVersionTag(nextVersion);
  const repoUrl = `http://github.com/${getCurrentRepoNameWithOwner()}`;
  const releaseTagUrl = `${repoUrl}/releases/tag/${nextVersionTag}`;
  const getPrUrl = (number: number): string => `${repoUrl}/pull/${number}`;

  const releaseHeadline = `*${nextVersionTag}* was released!`;
  const releaseTagLinkFooter = `Please see the <${releaseTagUrl}|full CHANGELOG> for details.`;

  if (startRef == null) {
    const changelogText = `
${releaseHeadline}

${releaseTagLinkFooter}
  `
      .replace('`', "'")
      .trim();

    return changelogText;
  }

  const apiResponse = await getCommitFromApi(startRef);

  if (apiResponse.commit === undefined) {
    console.error(chalk.red(`${BADGE}API responded with: ${apiResponse.message}`));

    process.exit(3);
  }

  const startCommitDate = apiResponse.commit.committer.date;
  const startDate = moment(startCommitDate)
    .subtract(CONSIDER_PULL_REQUESTS_WEEKS_BACK, 'weeks')
    .toISOString();

  const endRef = 'HEAD';

  if (nextVersion == null) {
    console.error(chalk.red(`${BADGE}Could not determine nextVersion!`));
    process.exit(3);
  }

  printInfo(startRef, startDate, endRef, nextVersion, nextVersionTag);

  const mergedPullRequestsSince = await getMergedPullRequests(startDate);
  const mergedPullRequests = filterPullRequestsForBranch(mergedPullRequestsSince, '', startRef, startDate);

  if (mergedPullRequests.length >= MERGED_PULL_REQUEST_LENGTH_THRESHOLD) {
    console.error(chalk.red(`${BADGE}Sanity check failed!`));
    console.error(chalk.red(`${BADGE}Found an unexpectedly high number of merged pull requests:`));
    console.error(
      chalk.red(`${BADGE}${mergedPullRequests.length} (threshold is ${MERGED_PULL_REQUEST_LENGTH_THRESHOLD})`)
    );
    process.exit(2);
  }

  const hasBreakingChanges = mergedPullRequests.some((pr) => pr.isBreakingChange);
  const breakingChangesHint = hasBreakingChanges
    ? 'Please note there are *BREAKING CHANGES*:'
    : 'The new version includes the following changes:';

  const mergedPullRequestsText = mergedPullRequests
    .map((pr: PullRequest): string => {
      let title = ensureSpaceAfterLeadingEmoji(pr.title);
      if (pr.isBreakingChange) {
        title = `*BREAKING CHANGE:* ${title}`;
      }

      return `- <${getPrUrl(pr.number)}|#${pr.number}> ${title}`;
    })
    .join('\n');

  const changelogText = `
${releaseHeadline}

${breakingChangesHint}

${mergedPullRequestsText}

${releaseTagLinkFooter}
  `
    .replace('`', "'")
    .trim();

  return changelogText;
}

async function getCommitFromApi(ref: string): Promise<CommitFromApi> {
  const url = COMMIT_API_URI.replace(':commit_sha', ref);
  const response = await fetch(url);

  return response.json();
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
