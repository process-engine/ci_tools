import chalk from 'chalk';
import { readFileSync } from 'fs';

import { sh } from '../cli/shell';

const BADGE = '[npm-install-only]\t';

export async function run(...args): Promise<boolean> {
  const isDryRun = args.indexOf('--dry') !== -1;

  const allPackageNamesWithVersionRequirements = getAllPackageNamesWithVersionRequirements();
  const patternList = args.filter((arg: string): boolean => !arg.startsWith('-'));
  const foundPatternMatchingPackages = getPackageNamesMatchingPattern(
    allPackageNamesWithVersionRequirements,
    patternList
  );
  const npmInstallArguments = foundPatternMatchingPackages.join(' ');

  console.log(`${BADGE}`);
  console.log(`${BADGE}allPackageNames:`, allPackageNamesWithVersionRequirements);
  console.log(`${BADGE}patternList:`, patternList);
  console.log(`${BADGE}foundPatternMatchingPackages:`, foundPatternMatchingPackages);

  console.log(`${BADGE}`);

  annotatedSh(`npm install ${npmInstallArguments}`, isDryRun);

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

function getAllPackageNamesWithVersionRequirements(): string[] {
  const content = readFileSync('package.json').toString();
  const json = JSON.parse(content);

  const dependencies: string[] = Object.keys(json.dependencies);
  const devDependencies: string[] = Object.keys(json.devDependencies);
  const allPackageNames: string[] = [...dependencies].concat(devDependencies).sort();

  const allPackageNamesWithVersionRequirements = allPackageNames.map((name: string): string => {
    const versionRequirement = json.dependencies[name] || json.devDependencies[name];
    return `${name}@${versionRequirement}`;
  });

  return allPackageNamesWithVersionRequirements;
}
