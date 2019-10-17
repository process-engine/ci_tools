import chalk from 'chalk';

import { getGitBranch, getGitTagList, getGitTagsFromCommit, isDirty, isExistingTag } from '../git/git';
import { getNextVersion, getVersionTag } from '../versions/git_helpers';
import { getPackageVersion, getPackageVersionTag } from '../versions/package_version';
import {
  getPartiallySuccessfulBuildVersion,
  isRedundantRunTriggeredBySystemUserPush,
  isRetryRunForPartiallySuccessfulBuild
} from '../versions/retry_run';
import { printMultiLineString } from '../cli/printMultiLineString';
import { sh } from '../cli/shell';

const COMMAND_NAME = 'prepare-version';
const BADGE = `[${COMMAND_NAME}]\t`;

const DOC = `
Adjusts the pre-version in \`package.json\` automatically.

Example:

Your package.json's version field is

1.2.0-alpha13

   if you push to develop again, it gets incremented:

1.2.0-alpha14

   If you merge into \`beta\`, the suffix is automatically changed and incremented with each subsequent merge/commit:

1.2.0-beta1
   1.2.0-beta2
   1.2.0-beta3

   IMPORTANT: This script always keeps the "base" of the version and never changes that!

1.2.0-alpha14
   1.2.0-beta2
   1.2.0
   ^^^^^ base version

   For alpha and beta releases, it adds the suffix, if not present.
For stable releases, it removes the suffix to the version, if present.

It then writes package.json, commits, tags and pushes it
(when on one of the applicable branches).
`;
// DOC: see above
export async function run(...args): Promise<boolean> {
  const allowDirtyWorkdir = args.indexOf('--allow-dirty-workdir') !== -1;
  const isDryRun = args.indexOf('--dry') !== -1;
  const isForced = process.env.CI_TOOLS_FORCE_PUBLISH === 'true' || args.indexOf('--force') !== -1;

  let nextVersion = getNextVersion();
  let nextVersionTag = getVersionTag(nextVersion);

  printInfo(nextVersion, isDryRun, isForced);

  if (isRetryRunForPartiallySuccessfulBuild()) {
    console.error(chalk.yellow(`${BADGE}This seems to be a retry run for a partially successful build.`));

    nextVersion = getPartiallySuccessfulBuildVersion();
    nextVersionTag = getVersionTag(nextVersion);

    console.log('');
    console.log(`${BADGE}resetting nextVersionTag:`, nextVersionTag);
  }

  abortIfRetryRun();
  abortIfDirtyWorkdir(allowDirtyWorkdir, isForced);
  abortIfTagAlreadyExistsAndIsNoRetryRun(nextVersionTag, isForced);
  abortIfDryRun(nextVersion, isDryRun, isForced);

  sh(`npm version ${nextVersion} --no-git-tag-version`);

  return true;
}

export function getShortDoc(): string {
  return DOC.trim().split('\n')[0];
}

export function printHelp(): void {
  console.log(`Usage: ci_tools ${COMMAND_NAME} [--dry] [--force]`);
  console.log('');
  console.log(DOC.trim());
}

function abortIfRetryRun(): void {
  if (isRedundantRunTriggeredBySystemUserPush()) {
    const currentVersionTag = getPackageVersionTag();
    console.error(chalk.yellow(`${BADGE}Current commit is tagged with "${currentVersionTag}".`));
    console.error(chalk.yellowBright(`${BADGE}Nothing to do here, since this is the current package version!`));

    process.exit(0);
  }
}

function abortIfDirtyWorkdir(allowDirtyWorkdir: boolean, isForced: boolean): void {
  if (isDirty() && !allowDirtyWorkdir) {
    const workdirState = sh('git status --porcelain --untracked-files=no').trim();

    if (isForced) {
      console.error(chalk.yellow(`${BADGE}Git workdir is dirty:`));
      printMultiLineString(workdirState);
      console.error(chalk.yellowBright(`${BADGE}Resuming since --force was provided.`));
      console.log('');
    } else {
      console.error(chalk.red(`${BADGE}Can not proceed due to dirty git workdir:`));
      printMultiLineString(workdirState);

      process.exit(1);
    }
  }
}

function abortIfTagAlreadyExistsAndIsNoRetryRun(nextVersionTag: string, isForced: boolean): void {
  if (isExistingTag(nextVersionTag) && !isRetryRunForPartiallySuccessfulBuild()) {
    console.error(chalk.red(`${BADGE}Sanity check failed!`));
    console.error(chalk.red(`${BADGE}Tag "${nextVersionTag}" already exists!`));

    if (isForced) {
      console.error(chalk.yellowBright(`${BADGE}Resuming since --force was provided.`));
      console.log('');
    } else {
      console.error(chalk.yellow(`${BADGE}Aborting!`));

      process.exit(1);
    }
  }
}

function abortIfDryRun(nextVersion: string, isDryRun: boolean, isForced: boolean): void {
  if (isDryRun) {
    console.log(chalk.yellow(`${BADGE}I would write version ${nextVersion} to package.json.`));
    console.log(chalk.yellow(`${BADGE}Aborting due to --dry.`));

    if (isForced) {
      console.error(chalk.yellow(`${BADGE}Even though --force was provided, --dry takes precedence.`));
    }

    process.exit(1);
  }
}

function printInfo(nextVersion: string, isDryRun: boolean, isForced: boolean): void {
  const packageVersion = getPackageVersion();
  const packageVersionTag = getVersionTag(packageVersion);
  const branchName = getGitBranch();
  const gitTagList = getGitTagList();

  console.log(`${BADGE}isDryRun:`, isDryRun);
  console.log(`${BADGE}isForced:`, isForced);
  console.log('');
  console.log(`${BADGE}packageVersion:`, packageVersion);
  console.log(`${BADGE}packageVersionTag:`, packageVersionTag);
  console.log(`${BADGE}branchName:`, branchName);
  console.log(`${BADGE}gitTagList:`);
  printMultiLineString(gitTagList);
  console.log(`${BADGE}tagsForHEAD:`);
  printMultiLineString(getGitTagsFromCommit('HEAD'));
  console.log(`${BADGE}nextVersionTag:`, getVersionTag(nextVersion));
  console.log('');
}
