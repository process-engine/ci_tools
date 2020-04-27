import * as fs from 'fs-extra';
import * as yargsParser from 'yargs-parser';

import { printMultiLineString } from '../cli/printMultiLineString';
import { sh } from '../cli/shell';
import { gitAdd, gitCommit, isDirty } from '../git/git';
import {
  Dependency,
  convertToDependencyArray,
  getDependencyAsString,
  getLatestRevision,
  getRegistryInfo,
} from '../npm/dependency';
import { ParsedVersion, parseVersion } from '../versions/parse_version';

type DependencyType = 'prod' | 'dev' | 'optional';

const COMMAND_NAME = 'replace-dist-tags-with-real-versions';
const BADGE = `[${COMMAND_NAME}]\t`;

const DOC = `
Replaces dist tags (see npm help dist-tag) for all dependencies matching the given pattern with the latest version found
for the respective dist tag in the npm registry.

OPTIONS

-d, --dist-tags-to-replace  specifies which dist tags should be replaced
--create-git-commit         creates a Git commit when any changes were performed
--dry                       performs a dry which does not make any persistent changes

EXAMPLES

Your package.json file contains the following dependencies:

    @atlas-engine/iam: feature~new_awesome_feature
    @atlas-engine/timing: 2.3.0-alpha.3
    bluebird: 3.7.2

After running "ci_tools replace-dist-tags-with-real-versions @atlas-engine/ -d feature" the result will be:

    @atlas-engine/iam: 1.1.0-alpha.1
    @atlas-engine/timing: 2.3.0-alpha.3
    bluebird: 3.7.2
`;

export async function run(...args): Promise<boolean> {
  const argv = parseArguments(args);
  const isDryRun = argv.dry === true;
  const shouldCreateGitCommit = argv.createGitCommit === true;
  const distTagsToReplace = argv.distTagsToReplace;
  const packagePatterns = argv._;

  if (!distTagsToReplace) {
    throw new Error('No dist tags to replace were specified');
  }

  const packagePatternFilter = getPackagePatternFilter(packagePatterns);
  const distTagFilter = getDistTagFilter(distTagsToReplace);

  const packageContentRaw = await fs.readFile('package.json', 'utf-8');
  const packageContent = JSON.parse(packageContentRaw);

  const dependencies = convertToDependencyArray(packageContent.dependencies ?? {})
    .filter(packagePatternFilter)
    .filter(distTagFilter);

  const devDependencies = convertToDependencyArray(packageContent.devDependencies ?? {})
    .filter(packagePatternFilter)
    .filter(distTagFilter);

  const optionalDependencies = convertToDependencyArray(packageContent.optionalDependencies ?? {})
    .filter(packagePatternFilter)
    .filter(distTagFilter);

  if (dependencies.length === 0 && devDependencies.length === 0 && optionalDependencies.length === 0) {
    annotatedLog('No dependencies to update.');
    return true;
  }

  replaceDistTagsWithRealVersions(dependencies, 'prod', isDryRun);
  replaceDistTagsWithRealVersions(devDependencies, 'dev', isDryRun);
  replaceDistTagsWithRealVersions(optionalDependencies, 'optional', isDryRun);

  if (shouldCreateGitCommit && isDirty('package.json')) {
    createGitCommit(isDryRun);
  }

  return true;
}

export function getShortDoc(): string {
  return DOC.trim().split('\n')[0];
}

export function printHelp(): void {
  console.log(`Usage: ci_tools ${COMMAND_NAME} <package-pattern> [<package-pattern>...] [OPTIONS]`);
  console.log('');
  console.log(DOC.trim());
}

function parseArguments(args): yargsParser.Arguments {
  return yargsParser(args, {
    alias: { help: ['h'], distTagsToReplace: ['d'] },
    boolean: ['dry', 'create-git-commit'],
    array: ['dist-tags-to-replace'],
  });
}

function annotatedLog(message: string): void {
  console.log(`${BADGE}${message}`);
}

function annotatedSh(cmd: string): string {
  console.log(`${BADGE}|>>> ${cmd}`);
  const output = sh(cmd);
  printMultiLineString(output, `${BADGE}| `);

  return output;
}

function getPackagePatternFilter(packagePatterns: string[]): (dependency: Dependency) => boolean {
  return (dependency: Dependency) => {
    for (const packagePattern of packagePatterns) {
      if (dependency.name.startsWith(packagePattern)) {
        return true;
      }
    }

    return false;
  };
}

function getDistTagFilter(distTags: string[]): (dependency: Dependency) => boolean {
  return (dependency: Dependency) => {
    for (const distTag of distTags) {
      if (dependency.version === distTag) {
        return true;
      }

      if (distTag === 'feature' && dependency.version.match(/^feature~/) != null) {
        return true;
      }

      if (dependency.version.match(/^\d+\.\d+\.\d+-/) != null) {
        const parsedVersion = parseVersion(dependency.version);

        if (parsedVersion && parsedVersion.releaseChannelName === distTag) {
          return true;
        }
      }
    }

    return false;
  };
}

function getNextReleaseChannel(releaseChannel: string): string {
  switch (releaseChannel) {
    case 'feature':
      return 'alpha';
    case 'alpha':
      return 'beta';
    case 'beta':
      return 'latest';
    default:
      throw new Error(`Could not determine next release channel for '${releaseChannel}'`);
  }
}

function resolveFeatureDistTag(dependency: Dependency): string {
  const dependencyRegistryInfo = getRegistryInfo(dependency.name);
  const distTags = dependencyRegistryInfo['dist-tags'];
  const featureVersion = distTags[dependency.version];

  if (!featureVersion) {
    throw new Error(`Could not resolve feature dist tag '${dependency.version}' for dependency '${dependency.name}'`);
  }

  return featureVersion;
}

function parseFeatureVersion(version: string): ParsedVersion {
  const parts = version.split('-');
  const baseString = parts[0];

  return {
    baseString: baseString,
    releaseChannelName: 'feature',
  };
}

function replaceVersionWithNextReleaseChannelVersion(dependency: Dependency): Dependency {
  if (dependency.version === 'latest') {
    return dependency;
  }

  if (dependency.version === 'alpha' || dependency.version === 'beta') {
    return {
      name: dependency.name,
      version: getNextReleaseChannel(dependency.version),
    };
  }

  let parsedVersion: ParsedVersion;

  if (dependency.version.match(/^feature~/) != null) {
    const featureVersion = resolveFeatureDistTag(dependency);
    parsedVersion = parseFeatureVersion(featureVersion);
  } else {
    parsedVersion = parseVersion(dependency.version);
  }

  if (!parsedVersion) {
    annotatedLog(`${dependency.name}: Could not parse version '${dependency.version}'. Keeping current version.`);
    return dependency;
  }

  const nextReleaseChannel = getNextReleaseChannel(parsedVersion.releaseChannelName);
  const latestRevisionForNextReleaseChannel = getLatestRevision(dependency.name, parsedVersion.baseString, nextReleaseChannel);

  if (!latestRevisionForNextReleaseChannel) {
    annotatedLog(`${dependency.name}: Could not find version '${parsedVersion.baseString}' for release channel '${nextReleaseChannel}'. Keeping current version.`);
    return dependency;
  }

  return {
    name: dependency.name,
    version: latestRevisionForNextReleaseChannel,
  };
}

function replaceDistTagsWithRealVersions(dependencies: Dependency[], dependencyType: DependencyType, isDryRun = false): void {
  if (dependencies.length === 0) {
    return;
  }

  const dependenciesWithReplacedVersions = dependencies.map(replaceVersionWithNextReleaseChannelVersion);

  const concattedDependencies = dependenciesWithReplacedVersions
    .map(getDependencyAsString)
    .join(' ');

  let command: string;

  switch (dependencyType) {
    case 'prod':
      command = `npm install --save-exact ${concattedDependencies}`;
      break;
    case 'dev':
      command = `npm install --save-exact --save-dev ${concattedDependencies}`;
      break;
    case 'optional':
      command = `npm install --save-exact --save-optional ${concattedDependencies}`;
      break;
    default:
      throw new Error(`Unknown dependency type '${dependencyType}' encountered`);
  }

  if (isDryRun) {
    console.log(`${BADGE}|>>> ${command}`);
  } else {
    const npmOutput = annotatedSh(command);

    if (npmOutput.includes('npm ERR!')) {
      throw new Error('npm error occurred');
    }
  }
}

function createGitCommit(isDryRun = false): void {
  annotatedLog('Creating Git commit');

  if (!isDryRun) {
    gitAdd('package.json', 'package-lock.json');
    gitCommit('Harmonize dependency versions');
  }
}
