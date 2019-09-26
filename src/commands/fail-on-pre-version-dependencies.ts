import { readFileSync } from 'fs';

import chalk from 'chalk';

const COMMAND_NAME = 'fail-on-pre-version-dependencies';
const BADGE = `[${COMMAND_NAME}]\t`;

const DOC = `
Fails if there are any dependencies containing pre-versions in \`package.json\`.
`;
// DOC: see above
export async function run(...args): Promise<boolean> {
  const content = readFileSync('package.json').toString();
  const json = JSON.parse(content);

  const dependencies = Object.assign({}, json.dependencies, json.devDependencies);

  const dependenciesWithPreVersions = Object.keys(dependencies).filter((packageName: string): boolean => {
    const version = dependencies[packageName];
    const isPreVersionOrDistTag = version.indexOf('-') !== -1 || version.indexOf('~') > 0;

    return isPreVersionOrDistTag;
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

export function getShortDoc(): string {
  return DOC.trim().split('\n')[0];
}

export function printHelp(): void {
  console.log(`Usage: ci_tools ${COMMAND_NAME}`);
  console.log('');
  console.log(DOC.trim());
}
