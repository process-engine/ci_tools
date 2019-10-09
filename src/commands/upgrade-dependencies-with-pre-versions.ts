import chalk from 'chalk';
import { readFileSync } from 'fs';

import { asyncSh, sh } from '../cli/shell';
import { parseVersion } from '../versions/parse_version';

type Pattern = string | RegExp;

const COMMAND_NAME = 'upgrade-dependencies-with-pre-versions';
const BADGE = `[${COMMAND_NAME}]\t`;

const DOC = `
Upgrades alpha- and beta-pre-versions for the packages with a name starting with one of the given args.

Example:

   ci_tools upgrade-dependencies-with-pre-versions @process-engine/

Upgrades all deps starting with \`@process-engine/\` if there is a newer version available in their
release channel or if a stable version of the same base version has been released.

This command does not change base version!
`;
// DOC: see above
export async function run(...args): Promise<boolean> {
  const isDryRun = args.indexOf('--dry') !== -1;
  const patternList = args.filter((arg: string): boolean => !arg.startsWith('-'));

  const dependencies = getAllDependencies();
  const dependenciesFilteredByName = filterDependenciesByName(dependencies, patternList);
  const dependenciesFilteredByRequirement = filterDependenciesByRequirement(dependencies, [/-(alpha|beta)\./]);

  console.log(`${BADGE}patternList:\n`, patternList);
  console.log(`${BADGE}dependenciesFilteredByName:\n`, dependenciesFilteredByName);
  console.log(`${BADGE}dependenciesFilteredByRequirement:\n`, dependenciesFilteredByRequirement);

  const versionsToInstall = [];
  Object.keys(dependenciesFilteredByRequirement).forEach((packageName: string): void => {
    const requirement = dependenciesFilteredByRequirement[packageName];
    const parsedRequirement = parseVersion(requirement);

    if (parsedRequirement == null) {
      return;
    }

    const output = sh(`npm view ${packageName} --json`);
    let json = null;
    try {
      json = JSON.parse(output);
    } catch (e) {
      console.error('Parsing result from npm view did not work:');
      console.error(e);
    }

    if (json != null) {
      const allPackageVersions = json.versions;

      const versionUpgradeTo = getVersionToUpgradeTo(requirement, allPackageVersions);
      if (versionUpgradeTo) {
        versionsToInstall.push(`${packageName}@${versionUpgradeTo}`);
      }
    }
  });

  console.log(`${BADGE}versionsToInstall\n`, versionsToInstall);

  if (versionsToInstall.length > 0) {
    await annotatedSh(`npm install --save-exact ${versionsToInstall.join(' ')}`, isDryRun);
  }

  return true;
}

export function getShortDoc(): string {
  return DOC.trim().split('\n')[0];
}

export function printHelp(): void {
  console.log(`Usage: ci_tools ${COMMAND_NAME} <package-pattern> [<package-pattern>...] [--dry]`);
  console.log('');
  console.log(DOC.trim());
}

export function getVersionToUpgradeTo(requirement: string, versions: string[]): string | null {
  const parsedRequirement = parseVersion(requirement);
  if (parsedRequirement == null) {
    return null;
  }

  const versionsWithSameBaseVersion = getVersionsWithSameBaseVersion(requirement, versions);

  let upgradeToVersion = null;

  if (parsedRequirement.releaseChannelNumber != null) {
    let currentParsedVersion = parsedRequirement;

    versionsWithSameBaseVersion.forEach((versionString: string): void => {
      const parsedVersion = parseVersion(versionString);
      const hasGreaterNumber =
        parsedVersion.releaseChannelNumber != null &&
        parsedVersion.releaseChannelNumber > currentParsedVersion.releaseChannelNumber;

      if (hasGreaterNumber) {
        upgradeToVersion = versionString;
        currentParsedVersion = parsedVersion;
      }
    });
  }

  const exactMatchForBaseVersion = versionsWithSameBaseVersion.find(
    (versionString: string): boolean => versionString === parsedRequirement.baseString
  );

  if (exactMatchForBaseVersion != null) {
    upgradeToVersion = exactMatchForBaseVersion;
  }

  return upgradeToVersion === requirement ? null : upgradeToVersion;
}

function getVersionsWithSameBaseVersion(requirement: string, versions: string[]): string[] {
  const parsedRequirement = parseVersion(requirement);

  return versions.filter((versionString: string): boolean => {
    const parsedVersion = parseVersion(versionString);
    if (parsedVersion == null) {
      return false;
    }

    const isSameBaseVersion = parsedVersion.baseString === parsedRequirement.baseString;
    const isStableVersion = parsedVersion.releaseChannelName === 'stable';
    const isSameReleaseChannel = parsedVersion.releaseChannelName === parsedRequirement.releaseChannelName;
    const hasNoNumber = parsedVersion.releaseChannelNumber == null;
    const hasGreaterNumber =
      parsedVersion.releaseChannelNumber != null &&
      parsedVersion.releaseChannelNumber > parsedRequirement.releaseChannelNumber;

    return (
      parsedVersion != null &&
      isSameBaseVersion &&
      (isStableVersion || isSameReleaseChannel) &&
      (hasNoNumber || hasGreaterNumber)
    );
  });
}

function filterDependenciesByName(dependencyObject: any, patternList: Pattern[]): any {
  const result = {};
  Object.keys(dependencyObject).forEach((packageName: string): void => {
    const patternMatched = matchesPatternList(packageName, patternList);
    if (patternMatched) {
      result[packageName] = dependencyObject[packageName];
    }
  });
  return result;
}

function filterDependenciesByRequirement(dependencyObject: any, patternList: Pattern[]): any {
  const result = {};
  Object.keys(dependencyObject).forEach((packageName: string): void => {
    const requirement = dependencyObject[packageName];
    const patternMatched = matchesPatternList(requirement, patternList);
    if (patternMatched) {
      result[packageName] = requirement;
    }
  });
  return result;
}

function matchesPatternList(value: string, patternList: Pattern[]): boolean {
  return patternList.some((pattern: Pattern): boolean => {
    if (typeof pattern === 'string') {
      return value.startsWith(pattern);
    }

    return value.match(pattern) != null;
  });
}

function getAllDependencies(): any {
  const packageJson = getPackageJson();
  const allPackages = Object.assign({}, packageJson.dependencies, packageJson.devDependencies);
  return allPackages;
}

function getPackageJson(): any {
  const content = readFileSync('package.json').toString();
  const json = JSON.parse(content);
  return json;
}

async function annotatedSh(command: string, isDryRun: boolean): Promise<void> {
  console.log(`${BADGE}`);
  console.log(`${BADGE}Running: ${chalk.cyan(command)}`);

  if (isDryRun) {
    console.log(chalk.yellow('\n  [skipping execution due to --dry]\n'));
    return;
  }

  const output = await asyncSh(command);
  console.log(output);
}
