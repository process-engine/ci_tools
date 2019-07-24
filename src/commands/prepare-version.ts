import chalk from 'chalk';

import { getGitBranch, getGitTagList, getGitTagsFromCommit, isCurrentTag, isDirty, isExistingTag } from '../git/git';
import { getNextVersion, getVersionTag } from '../versions/git_helpers';
import { getPackageVersion, getPackageVersionTag } from '../versions/package_version';
import { printMultiLineString } from '../cli/printMultiLineString';
import { sh } from '../cli/shell';

const BADGE = '[prepare-version]\t';

/**
 * Increments the pre-version in `package.json` automatically.
 *
 * Example:
 *
 * Your package.json's version field is
 *
 *    1.2.0-alpha13
 *
 * if you push to develop again, it gets incremented:
 *
 *    1.2.0-alpha14
 *
 * If you merge into `beta`, the suffix is automatically changed and incremented with each subsequent merge/commit:
 *
 *    1.2.0-beta1
 *    1.2.0-beta2
 *    1.2.0-beta3
 *
 * IMPORTANT: This script always keeps the "base" of the version and never changes that!
 *
 *    1.2.0-alpha14
 *    1.2.0-beta2
 *    1.2.0
 *    ^^^^^ base version
 *
 * For alpha and beta releases, it adds the suffix, if not present.
 * For stable releases, it removes the suffix to the version, if present.
 *
 * It then writes package.json, commits, tags and pushes it
 * (when on one of the applicable branches).
 *
 */
export async function run(...args): Promise<boolean> {
  const allowDirtyWorkdir = args.indexOf('--allow-dirty-workdir') !== -1;
  const isDryRun = args.indexOf('--dry') !== -1;
  const isForced = process.env.CI_TOOLS_FORCE_PUBLISH === 'true' || args.indexOf('--force') !== -1;

  const currentVersionTag = getPackageVersionTag();
  const nextVersion = getNextVersion();
  const nextVersionTag = getVersionTag(nextVersion);

  printInfo(nextVersion, isDryRun, isForced);

  if (isCurrentTag(currentVersionTag)) {
    console.error(
      chalk.yellow(
        `${BADGE}Current commit is tagged with "${currentVersionTag}", which is the current package version.`
      )
    );

    if (isForced) {
      console.error(chalk.yellowBright(`${BADGE}Resuming since --force was provided.`));
      console.log('');
    } else {
      console.error(chalk.yellow(`${BADGE}Nothing to do here!`));

      process.exit(1);
    }
  }

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

  if (isExistingTag(nextVersionTag)) {
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

  if (isDryRun) {
    console.log(chalk.yellow(`${BADGE}I would write version ${nextVersion} to package.json.`));
    console.log(chalk.yellow(`${BADGE}Aborting due to --dry.`));

    if (isForced) {
      console.error(chalk.yellow(`${BADGE}Even though --force was provided, --dry takes precedence.`));
    }

    process.exit(1);
  }

  sh(`npm version ${nextVersion} --no-git-tag-version`);

  return true;
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
