import { readFileSync } from 'fs';

import chalk from 'chalk';

const BADGE = '[fail-on-pre-version-dependencies]\t';

/**
 * Fails if there are any requirements containing pre-versions in `package.json`.
 */
export async function run(...args): Promise<boolean> {
  const content = readFileSync('package.json').toString();
  const json = JSON.parse(content);

  const dependencies = Object.assign({}, json.dependencies, json.devDependencies);

  const dependenciesWithPreVersions = Object.keys(dependencies).filter((packageName: string): boolean => {
    const version = dependencies[packageName];
    const isPreVersion = version.indexOf('-') !== -1;

    return isPreVersion;
  });

  if (dependenciesWithPreVersions.length > 0) {
    console.error(chalk.red(`${BADGE}Found dependencies with pre-version requirements:`));
    console.error(chalk.red(`${BADGE}`));

    dependenciesWithPreVersions.forEach((packageName: string): void => {
      console.error(chalk.red(`${BADGE}  - ${packageName}@${dependencies[packageName]}`));
    });

    process.exit(1);
  }

  return true;
}
