import chalk from 'chalk';
import { readFileSync } from 'fs';

import { asyncSh } from '../cli/shell';

const COMMAND_NAME = 'npm-install-only';
const BADGE = `[${COMMAND_NAME}]\t`;

const DOC = `
Uses \`npm install [--save-exact] <PACKAGE_NAME>\` on all dependencies matching the given patterns.

Example:

   ci_tools ${COMMAND_NAME} @process-engine/

installs only deps starting with \`@process-engine/\`, honoring their '~' and '^' requirements.
`;
// DOC: see above
export async function run(...args): Promise<boolean> {
  const isDryRun = args.indexOf('--dry') !== -1;

  const allPackageNamesWithNoStrictVersion = getAllPackageNamesWithNoStrictVersion();
  const allPackageNamesWithStrictVersion = getAllPackageNamesWithStrictVersion();
  const patternList = args.filter((arg: string): boolean => !arg.startsWith('-'));
  const foundPatternMatchingPackagesWithNoStrictVersion = getPackageNamesMatchingPattern(
    allPackageNamesWithNoStrictVersion,
    patternList
  );
  const foundPatternMatchingPackagesWithStrictVersion = getPackageNamesMatchingPattern(
    allPackageNamesWithStrictVersion,
    patternList
  );
  const npmInstallArguments = foundPatternMatchingPackagesWithNoStrictVersion.join(' ');
  const npmInstallSaveExactArguments = foundPatternMatchingPackagesWithStrictVersion.join(' ');

  console.log(`${BADGE}`);
  console.log(`${BADGE}allPackageNamesWithNoStrictVersion:`, allPackageNamesWithNoStrictVersion);
  console.log(`${BADGE}allPackageNamesWithStrictVersion:`, allPackageNamesWithStrictVersion);
  console.log(`${BADGE}patternList:`, patternList);
  console.log(
    `${BADGE}foundPatternMatchingPackagesWithNoStrictVersion:`,
    foundPatternMatchingPackagesWithNoStrictVersion
  );
  console.log(`${BADGE}foundPatternMatchingPackagesWithStrictVersion:`, foundPatternMatchingPackagesWithStrictVersion);

  console.log(`${BADGE}`);

  if (npmInstallArguments.length !== 0) {
    await annotatedSh(`npm install ${npmInstallArguments}`, isDryRun);
  }

  if (npmInstallSaveExactArguments.length !== 0) {
    await annotatedSh(`npm install --save-exact ${npmInstallSaveExactArguments}`, isDryRun);
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

function getPackageNamesMatchingPattern(allPackageNames: string[], patternList: string[]): string[] {
  let foundPatternMatchingPackages = [];

  patternList.forEach((nameStart: string): void => {
    const packages = allPackageNames.filter((packageName: string): boolean => {
      return packageName.startsWith(nameStart);
    });

    foundPatternMatchingPackages = foundPatternMatchingPackages.concat(packages);
  });

  return foundPatternMatchingPackages;
}

function getAllPackageNamesWithNoStrictVersion(): string[] {
  const content = readFileSync('package.json').toString();
  const json = JSON.parse(content);
  let dependencies: string[] = [];
  let devDependencies: string[] = [];

  if (json.dependencies) {
    dependencies = Object.keys(json.dependencies)
      .filter((dependency): boolean => {
        const version: string = json.dependencies[dependency];

        const versionIsNotStrict: boolean = version.startsWith('^') || version.startsWith('~');

        return versionIsNotStrict;
      })
      .map((dependency: string): string => {
        const version: string = json.dependencies[dependency];

        return `${dependency}@${version}`;
      });
  }

  if (json.devDependencies) {
    devDependencies = Object.keys(json.devDependencies)
      .filter((devDependency): boolean => {
        const version: string = json.devDependencies[devDependency];

        const versionIsNotStrict: boolean = version.startsWith('^') || version.startsWith('~');

        return versionIsNotStrict;
      })
      .map((devDependency: string): string => {
        return `${devDependency}@${json.devDependencies[devDependency]}`;
      });
  }

  const allPackageNames: string[] = [...dependencies].concat(devDependencies).sort();

  return allPackageNames;
}

function getAllPackageNamesWithStrictVersion(): string[] {
  const content = readFileSync('package.json').toString();
  const json = JSON.parse(content);
  let dependencies: string[] = [];
  let devDependencies: string[] = [];

  if (json.dependencies) {
    dependencies = Object.keys(json.dependencies)
      .filter((dependency): boolean => {
        const version: string = json.dependencies[dependency];

        const versionIsStrict: boolean = !(version.startsWith('^') || version.startsWith('~'));

        return versionIsStrict;
      })
      .map((dependency: string): string => {
        const version: string = json.dependencies[dependency];

        return `${dependency}@${version}`;
      });
  }

  if (json.devDependencies) {
    devDependencies = Object.keys(json.devDependencies)
      .filter((devDependency): boolean => {
        const version: string = json.devDependencies[devDependency];

        const versionIsNotStrict: boolean = !(version.startsWith('^') || version.startsWith('~'));

        return versionIsNotStrict;
      })
      .map((devDependency: string): string => {
        return `${devDependency}@${json.devDependencies[devDependency]}`;
      });
  }

  const allPackageNames: string[] = [...dependencies].concat(devDependencies).sort();

  return allPackageNames;
}
