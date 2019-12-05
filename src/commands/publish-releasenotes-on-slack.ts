import { getGitBranch } from '../git/git';
import { getPackageVersion, getPackageVersionTag } from '../versions/package_version';
import { setupGit } from './internal/setup-git-and-npm-connections';
import { sh } from '../cli/shell';
import { printMultiLineString } from '../cli/printMultiLineString';
import { sendSlackMessage } from '../slack/notifier';
import { getReleaseAnnouncement } from './internal/create-release-announcement';

const COMMAND_NAME = 'publish-releasenotes-on-slack';
const BADGE = `[${COMMAND_NAME}]\t`;

const DOC = `
Publishes the releasenotes for the current version on slack.

To use this command, an incoming webhook for slack is required and must be configured as an environment variable named 'SLACK_WEBHOOK'.
`;
// DOC: see above
export async function run(): Promise<boolean> {
  setupGit();

  printInfo();

  annotatedSh('git config user.name');
  annotatedSh('git config user.email');

  const releasenotes = await getReleaseAnnouncement();

  await sendSlackMessage(releasenotes);

  return true;
}

export function getShortDoc(): string {
  return DOC.trim().split('\n')[0];
}

export function printHelp(): void {
  console.log(`Usage: ci_tools ${COMMAND_NAME}`);
  console.log('');
  console.log(DOC.trim());
}

function annotatedSh(cmd: string): string {
  console.log(`${BADGE}|>>> ${cmd}`);
  const output = sh(cmd);
  printMultiLineString(output, `${BADGE}| `);

  return output;
}

function printInfo(): void {
  const packageVersion = getPackageVersion();
  const packageVersionTag = getPackageVersionTag();
  const branchName = getGitBranch();

  console.log(`${BADGE}packageVersion:`, packageVersion);
  console.log(`${BADGE}packageVersionTag:`, packageVersionTag);
  console.log(`${BADGE}branchName:`, branchName);
  console.log('');
}
