import chalk from 'chalk';
import * as fs from 'fs';

import { existsSync } from 'fs';
import * as yargsParser from 'yargs-parser';

import { getGitBranch, getGitTagList, getGitTagsFromCommit, gitAdd, gitCommit, gitPush } from '../git/git';
import { getVersionTag } from '../versions/git_helpers';
import { getPackageVersion, setPackageVersion } from '../versions/package_version';
import { printMultiLineString } from '../cli/printMultiLineString';
import { sh } from '../cli/shell';
import { PACKAGE_MODE_DOTNET, PACKAGE_MODE_NODE, PACKAGE_MODE_PYTHON } from '../contracts/modes';
import { getCsprojAsObject, getCsprojPath } from '../versions/package_version/dotnet';

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
  await abortIfRetryRun(mode, mainPackageVersion, subpackageLocationWithSlash);
  abortIfSubpackageLocationIsMissing(subpackageLocation);
  abortIfDryRun(mainPackageVersion, isDryRun, isForced);

  const cwd = process.cwd();
  process.chdir(subpackageLocationWithSlash);
  await setPackageVersion(mode, mainPackageVersion);
  process.chdir(cwd);

  const branchName = getGitBranch();
  const filename = getSubpackageFilename(mode, subpackageLocationWithSlash);
  gitAdd(`${subpackageLocationWithSlash}${filename}`);

  sh('git status');

  const subpackageName = await getSubpackageName(mode, subpackageLocationWithSlash);
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

async function abortIfRetryRun(mode: string, mainPackageVersion: string, subpackageLocation: string): Promise<void> {
  const subpackageVersion = await getSubpackageVersion(mode, subpackageLocation);
  if (subpackageVersion === mainPackageVersion) {
    console.error(chalk.yellow(`${BADGE}Subpackage version is already "${mainPackageVersion}".`));
    console.error(chalk.yellowBright(`${BADGE}Nothing to do here, since this is the current package version!`));

    process.exit(0);
  }
}

async function getSubpackageVersion(mode: string, subpackageLocation: string): Promise<string> {
  const cwd = process.cwd();
  process.chdir(subpackageLocation);
  const subpackageVersion = await getPackageVersion(mode);
  process.chdir(cwd);

  return subpackageVersion;
}

async function getSubpackageName(mode: string, subpackageLocation: string): Promise<string> {
  const subpackage = await getSubpackage(mode, subpackageLocation);
  switch (mode) {
    case PACKAGE_MODE_DOTNET:
      const propertyGroup = subpackage?.Project?.PropertyGroup;
      const name = Array.isArray(propertyGroup) ? propertyGroup[0]?.Product[0] : null;

      if (name == null) {
        return subpackageLocation;
      }

      return name;
    case PACKAGE_MODE_NODE:
      return subpackage.name;
    case PACKAGE_MODE_PYTHON:
      return subpackageLocation;
    default:
      break;
  }
}

async function getSubpackage(mode: string, subpackageLocation: string): Promise<any> {
  switch (mode) {
    case PACKAGE_MODE_DOTNET:
      return getSubpackageDotnet(subpackageLocation);
    case PACKAGE_MODE_NODE:
      return getSubpackageNode(subpackageLocation);
    case PACKAGE_MODE_PYTHON:
      return null;
    default:
      throw new Error(`Unknown value for \`mode\`: ${mode}`);
  }
}

function getSubpackageNode(subpackageLocation: string): any {
  const rawdata = fs.readFileSync(`${subpackageLocation}package.json`).toString();
  const packageJson = JSON.parse(rawdata);

  return packageJson;
}

async function getSubpackageDotnet(subpackageLocation: string): Promise<any> {
  const cwd = process.cwd();
  process.chdir(subpackageLocation);

  const filename = getCsprojPath();
  const json = await getCsprojAsObject(filename);

  process.chdir(cwd);

  if (json == null) {
    throw new Error(`Could not convert csproj to JSON: ${filename}`);
  }

  return json;
}

function getSubpackageFilename(mode: string, subpackageLocation: string): string {
  switch (mode) {
    case PACKAGE_MODE_DOTNET:
      const cwd = process.cwd();
      process.chdir(subpackageLocation);
      const filename = getCsprojPath();
      process.chdir(cwd);

      return filename;
    case PACKAGE_MODE_NODE:
      return 'package.json';
    case PACKAGE_MODE_PYTHON:
      return 'setup.py';
    default:
      break;
  }
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
