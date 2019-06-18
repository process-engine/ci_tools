import { getPackageVersion } from './package_version';
import { getGitBranch, getGitTagList, gitAdd, gitCommit, gitPush, gitPushTags, gitTag, isDirty } from './git';
import { APPLICABLE_BRANCHES, incrementVersion } from './increment_version';
import { sh } from './shell';

const BADGE = '[increment-version]\t';

export async function run(...args): Promise<void> {
  const isDryRun = args.indexOf('--dry') !== -1;
  const isForced = args.indexOf('--force') !== -1;
  const isDirtyAndNotForced = isDirty() && !isForced;

  const packageVersion = getPackageVersion();
  const branchName = getGitBranch();
  const gitTagList = getGitTagList();

  const nextVersion = incrementVersion(packageVersion, branchName, gitTagList);
  const notOnApplicableBranch = nextVersion == null;
  const nextCommitMessage = `Bump version to ${nextVersion}`;
  const nextTag = `v${nextVersion}`;

  printInfo(packageVersion, branchName, gitTagList, isDryRun, isForced);

  if (isDirtyAndNotForced) {
    const workdirState = sh('git status --porcelain --untracked-files=no').trim();

    console.error(`${BADGE}Can not proceed due to dirty git workdir:`);
    printMultiLineString(workdirState);

    process.exit(1);
  }

  if (notOnApplicableBranch) {
    console.error(`${BADGE}Aborting since we are not on one of these branches:`);
    console.error(`${BADGE}  ${APPLICABLE_BRANCHES.join(', ')}`);
    process.exit(1);
  }

  if (isDryRun) {
    console.log(`${BADGE}I would commit version ${nextVersion} in package.json with message "${nextCommitMessage}"`);
    console.log(`${BADGE}I would tag the last commit as "${nextTag}"`);

    return;
  }

  commitPushAndTagNextVersion(nextVersion, nextTag, nextCommitMessage);
}

function printInfo(
  packageVersion: string,
  branchName: string,
  gitTagList: string,
  isDryRun: boolean,
  isForced: boolean
): void {
  console.log(`${BADGE}isDryRun:`, isDryRun);
  console.log(`${BADGE}isForced:`, isForced);
  console.log('');
  console.log(`${BADGE}packageVersion:`, packageVersion);
  console.log(`${BADGE}branchName:`, branchName);
  console.log(`${BADGE}gitTagList:`);
  printMultiLineString(gitTagList);
  console.log('');
}

function printMultiLineString(text: string): void {
  text.split('\n').forEach((line: string): void => console.log(`${BADGE}  ${line}`));
}

function commitPushAndTagNextVersion(nextVersion: string, nextTag: string, nextCommitMessage: string): void {
  sh(`npm version ${nextVersion}`);
  gitAdd('package.json');
  gitCommit(nextCommitMessage);
  gitTag(nextTag);
  gitPush();
  gitPushTags();
}
