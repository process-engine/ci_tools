import { getPackageVersion } from './package_version';
import { getGitBranch, getGitTagList, gitAdd, gitCommit, gitPush, gitPushTags, gitTag, isDirty } from './git';
import { VERSION_INCREMENTER_BRANCHES, incrementVersion } from './increment_version';
import { sh } from './shell';

const BADGE = '[increment-version]\t';

export async function run(...args): Promise<void> {
  const isDryRun = args.indexOf('--dry') !== -1;
  const isForced = args.indexOf('--force') !== -1;

  const packageVersion = getPackageVersion();
  const branchName = getGitBranch();
  const gitTagList = getGitTagList();

  const nextVersion = incrementVersion(packageVersion, branchName, gitTagList);

  console.log(`${BADGE}isDryRun:`, isDryRun);
  console.log(`${BADGE}isForced:`, isForced);
  console.log('');
  console.log(`${BADGE}packageVersion:`, packageVersion);
  console.log(`${BADGE}branchName:`, branchName);
  console.log(`${BADGE}gitTagList:`);
  gitTagList.split('\n').forEach((line: string): void => console.log(`${BADGE}  ${line}`));
  console.log('');

  if (nextVersion == null) {
    console.error(`${BADGE}Aborting since we are not on one of these branches:`);
    console.error(`${BADGE}  ${VERSION_INCREMENTER_BRANCHES.join(', ')}`);
    process.exit(1);
  }

  commitPushAndTagNextVersion(nextVersion, isForced, isDryRun);
}

function commitPushAndTagNextVersion(nextVersion: string, isForced: boolean, isDryRun: boolean): void {
  const nextTag = `v${nextVersion}`;
  const nextCommitMessage = `Bump version to ${nextVersion}`;

  if (isDirty() && !isForced) {
    const workdirState = sh('git status --porcelain --untracked-files=no').trim();

    console.error(`${BADGE}Can not proceed due to dirty git workdir:\n\n${workdirState}`);

    process.exit(1);
  }

  if (isDryRun) {
    console.log(`${BADGE}I would commit version ${nextVersion} in package.json with message "${nextCommitMessage}"`);
    console.log(`${BADGE}I would tag the last commit as "${nextTag}"`);

    return;
  }

  sh(`npm version ${nextVersion}`);
  gitAdd('package.json');
  gitCommit(nextCommitMessage);
  gitTag(nextTag);
  gitPush();
  gitPushTags();
}
