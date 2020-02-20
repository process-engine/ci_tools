import * as yargsParser from 'yargs-parser';
import { setDotnetPackageVersion } from '../versions/package_version';

const COMMAND_NAME = 'set-version';
const DOC = `
Sets the package version.
`;

export async function run(...args): Promise<boolean> {
  const argv = yargsParser(args, { alias: { help: ['h'] } });
  const csprojPath = argv.csprojPath;
  const version = argv.version;

  if (!version || !csprojPath) {
    printHelp();
    return false;
  }

  setDotnetPackageVersion(version, csprojPath);

  return true;
}

export function getShortDoc(): string {
  return DOC.trim().split('\n')[0];
}

export function printHelp(): void {
  console.log(`.Net Usage: ci_tools ${COMMAND_NAME} [--version="<version>"] [--csprojPath="<path-to-csproj>"]`);
  console.log('');
  console.log(DOC.trim());
}
