import * as yargsParser from 'yargs-parser';
import { setPackageVersion } from '../versions/package_version';

const COMMAND_NAME = 'set-version';
const DEFAULT_MODE = 'node';

const DOC = `
Sets the package version.
`;

export async function run(...args): Promise<boolean> {
  const argv = yargsParser(args, { alias: { help: ['h'] }, default: { mode: DEFAULT_MODE } });
  const version = argv.version;
  const mode = argv.mode;

  if (!version) {
    printHelp();
    return false;
  }

  setPackageVersion(mode, version);

  return true;
}

export function getShortDoc(): string {
  return DOC.trim().split('\n')[0];
}

export function printHelp(): void {
  console.log(`Usage: ci_tools ${COMMAND_NAME} [--version="<version>"]`);
  console.log('');
  console.log(DOC.trim());
}
