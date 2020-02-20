import * as yargsParser from 'yargs-parser';
import { getMajorPackageVersion, getPackageVersion } from '../versions/package_version';

const COMMAND_NAME = 'get-version';
const DOC = `
Returns the package version.
`;

export async function run(...args): Promise<boolean> {
  const argv = yargsParser(args, { alias: { help: ['h'] } });
  const majorRequired = argv.major;

  if (majorRequired) {
    const majorVersion = getMajorPackageVersion();
    console.log(majorVersion);

    return true;
  }

  const packageVersion = getPackageVersion();
  console.log(packageVersion);

  return true;
}

export function getShortDoc(): string {
  return DOC.trim().split('\n')[0];
}

export function printHelp(): void {
  console.log(`Usage: ci_tools ${COMMAND_NAME} [--major]`);
  console.log('');
  console.log(DOC.trim());
}
