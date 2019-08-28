import chalk from 'chalk';
import { readFileSync } from 'fs';

import { sh } from '../cli/shell';

const BADGE = '[npm-install-only]\t';

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

  annotatedSh(`npm install ${npmInstallArguments}`, isDryRun);
  annotatedSh(`npm install --save-exact ${npmInstallSaveExactArguments}`, isDryRun);

  return true;
}

function annotatedSh(command: string, isDryRun: boolean): void {
  console.log(`${BADGE}`);
  console.log(`${BADGE}Running: ${chalk.cyan(command)}`);

  if (isDryRun) {
    console.log(chalk.yellow('\n  [skipping execution due to --dry]\n'));
    return;
  }

  const output = sh(command);
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

  const dependencies: string[] = Object.keys(json.dependencies)
    .filter((dependency): boolean => {
      const version: string = json.dependencies[dependency];

      const versionIsNotStrict: boolean = version.startsWith('^') || version.startsWith('~');

      return versionIsNotStrict;
    })
    .map((dependency: string): string => {
      const version: string = json.dependencies[dependency];

      return `${dependency}@${version}`;
    });

  const devDependencies: string[] = Object.keys(json.devDependencies)
    .filter((devDependency): boolean => {
      const version: string = json.devDependencies[devDependency];

      const versionIsNotStrict: boolean = version.startsWith('^') || version.startsWith('~');

      return versionIsNotStrict;
    })
    .map((devDependency: string): string => {
      return `${devDependency}@${json.devDependencies[devDependency]}`;
    });

  const allPackageNames: string[] = [...dependencies].concat(devDependencies).sort();

  return allPackageNames;
}

function getAllPackageNamesWithStrictVersion(): string[] {
  const content = readFileSync('package.json').toString();
  const json = JSON.parse(content);

  const dependencies: string[] = Object.keys(json.dependencies)
    .filter((dependency): boolean => {
      const version: string = json.dependencies[dependency];

      const versionIsStrict: boolean = !(version.startsWith('^') || version.startsWith('~'));

      return versionIsStrict;
    })
    .map((dependency: string): string => {
      const version: string = json.dependencies[dependency];

      return `${dependency}@${version}`;
    });

  const devDependencies: string[] = Object.keys(json.devDependencies)
    .filter((devDependency): boolean => {
      const version: string = json.devDependencies[devDependency];

      const versionIsNotStrict: boolean = !(version.startsWith('^') || version.startsWith('~'));

      return versionIsNotStrict;
    })
    .map((devDependency: string): string => {
      return `${devDependency}@${json.devDependencies[devDependency]}`;
    });

  const allPackageNames: string[] = [...dependencies].concat(devDependencies).sort();

  return allPackageNames;
}
