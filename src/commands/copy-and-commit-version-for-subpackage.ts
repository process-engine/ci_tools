import chalk from 'chalk';
import * as fs from 'fs';

import { existsSync } from 'fs';
import * as yargsParser from 'yargs-parser';

import { getGitBranch, getGitTagList, getGitTagsFromCommit, gitAdd, gitCommit, gitPush } from '../git/git';
import { getVersionTag } from '../versions/git_helpers';
import { getPackageVersion } from '../versions/package_version';
import { printMultiLineString } from '../cli/printMultiLineString';
import { sh } from '../cli/shell';

const COMMAND_NAME = 'copy-and-commit-version-for-subpackage';
const BADGE = `[${COMMAND_NAME}]\t`;
const DEFAULT_MODE = 'node';

const DOC = `
Copies the version from the main package to a subpackage and commits the change.

OPTIONS

--mode    sets the package mode [dotnet, node, python] (default: node)
`;
// DOC: see above

export async function run(...args): Promise<boolean> {
  const argv = yargsParser(args, { alias: { help: ['h'] }, default: { mode: DEFAULT_MODE } });
  const isDryRun = args.indexOf('--dry') !== -1;
  const isForced = process.env.CI_TOOLS_FORCE_PUBLISH === 'true' || args.indexOf('--force') !== -1;
  const mode = argv.mode;
  const subpackageLocation = getSubpackageLocationFromArgs(args);

  const mainPackageVersion = await getPackageVersion(mode);

  await printInfo(mode, mainPackageVersion, isDryRun, isForced);

  const subpackageLocationWithSlash = subpackageLocation.endsWith('/') ? subpackageLocation : `${subpackageLocation}/`;
  abortIfRetryRun(mainPackageVersion, subpackageLocationWithSlash);
  abortIfSubpackageLocationIsMissing(subpackageLocation);
  abortIfDryRun(mainPackageVersion, isDryRun, isForced);

  sh(`( cd ${subpackageLocation} && npm version ${mainPackageVersion} --no-git-tag-version )`);

  const branchName = getGitBranch();

  gitAdd(`${subpackageLocationWithSlash}package.json`);

  sh('git status');

  const subpackageName = getSubpackageName(subpackageLocationWithSlash);
  gitCommit(`Update ${subpackageName} version to v${mainPackageVersion}\n\n[skip ci]`);
  gitPush('origin', branchName);

  return true;
}

export function getShortDoc(): string {
  return DOC.trim().split('\n')[0];
}

export function printHelp(): void {
  console.log(`Usage: ci_tools ${COMMAND_NAME} <subpackageLocation> [--dry] [--force] [--mode <MODE>]`);
  console.log('');
  console.log(DOC.trim());
}

function abortIfRetryRun(mainPackageVersion: string, subpackageLocation: string): void {
  const subpackageVersion = getSubpackageVersion(subpackageLocation);
  if (subpackageVersion === mainPackageVersion) {
    console.error(chalk.yellow(`${BADGE}Subpackage version is already "${mainPackageVersion}".`));
    console.error(chalk.yellowBright(`${BADGE}Nothing to do here, since this is the current package version!`));

    process.exit(0);
  }
}

function getSubpackageVersion(subpackageLocation: string): string {
  return getSubpackageJson(subpackageLocation).version;
}

function getSubpackageName(subpackageLocation: string): string {
  return getSubpackageJson(subpackageLocation).name;
}

function getSubpackageJson(subpackageLocation: string): any {
  const rawdata = fs.readFileSync(`${subpackageLocation}package.json`).toString();
  const packageJson = JSON.parse(rawdata);

  return packageJson;
}

function getSubpackageLocationFromArgs(args): string | undefined {
  for (const arg of args) {
    console.log(arg);
    console.log(existsSync(arg));
    if (existsSync(arg)) {
      return arg;
    }
  }

  return undefined;
}

function abortIfSubpackageLocationIsMissing(subpackageLocation): void {
  if (subpackageLocation == null) {
    console.error(chalk.red(`${BADGE}Can not proceed since the subpackage location is missing.`));

    process.exit(1);
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

async function printInfo(mode: string, nextVersion: string, isDryRun: boolean, isForced: boolean): Promise<void> {
  const packageVersion = await getPackageVersion(mode);
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
