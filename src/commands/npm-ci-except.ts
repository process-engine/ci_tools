import chalk from 'chalk';
import { readFileSync } from 'fs';

import { sh } from '../git/shell';

const BADGE = '[npm-ci-except]\t';

/**
 * Runs `npm ci` and then runs `npm install <PACKAGE_NAME>` for the packages with a
 * name starting with one of the given args.
 *
 * Example:
 *
 *    ci_tools npm-ci-except @process-engine/
 *
 * installs all deps using `npm ci`, but all deps starting with `@process-engine/`
 * will be installed using `npm install`.
 */
export async function run(...args): Promise<boolean> {
  const isDryRun = args.indexOf('--dry') !== -1;

  const allPackageNames = getAllPackageNames();
  const patternList = args.filter((arg: string): boolean => !arg.startsWith('-'));
  const foundPatternMatchingPackages = getPackageNamesMatchingPattern(allPackageNames, patternList);
  const foundPackageNames = foundPatternMatchingPackages.join(' ');

  console.log(`${BADGE}`);
  console.log(`${BADGE}allPackageNames:`, allPackageNames);
  console.log(`${BADGE}patternList:`, patternList);
  console.log(`${BADGE}foundPatternMatchingPackages:`, foundPatternMatchingPackages);

  console.log(`${BADGE}`);

  annotatedSh('npm ci', isDryRun);

  annotatedSh(`npm install ${foundPackageNames}`, isDryRun);

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

function getAllPackageNames(): string[] {
  const content = readFileSync('package.json').toString();
  const json = JSON.parse(content);

  const dependencies: string[] = Object.keys(json.dependencies);
  const devDependencies: string[] = Object.keys(json.devDependencies);
  const allPackageNames: string[] = [...dependencies].concat(devDependencies).sort();

  return allPackageNames;
}