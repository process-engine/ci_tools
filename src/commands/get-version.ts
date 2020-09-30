import * as yargsParser from 'yargs-parser';
import { parseVersion } from '../versions/parse_version';
import { getMajorPackageVersion, getPackageVersion } from '../versions/package_version';

const COMMAND_NAME = 'get-version';
const DEFAULT_MODE = 'node';

const DOC = `
Returns the package version.

OPTIONS

--mode                    sets the package mode [dotnet, node, python] (default: node)
--major                   gets the major version segment (returns <X> for <X>.<Y>.<Z>)
--release-channel-name    gets the release channel name (returns <name> for <X>.<Y>.<Z>-<name>.<number>)
--release-channel-number  gets the release channel number (returns <number> for <X>.<Y>.<Z>-<name>.<number>)
`;

export async function run(...args): Promise<boolean> {
  const argv = yargsParser(args, { alias: { help: ['h'] }, default: { mode: DEFAULT_MODE } });
  const mode = argv.mode;
  const getMajor = argv.major;
  const getReleaseChannelName = argv.releaseChannelName;
  const getReleaseChannelNumber = argv.releaseChannelNumber;

  if (getMajor) {
    const majorVersion = await getMajorPackageVersion(mode);
    console.log(majorVersion);

    return true;
  }

  const packageVersion = await getPackageVersion(mode);

  if (getReleaseChannelName) {
    const parsedVersion = parseVersion(packageVersion);
    console.log(parsedVersion.releaseChannelName);

    return true;
  }

  if (getReleaseChannelNumber) {
    const parsedVersion = parseVersion(packageVersion);

    if (!parsedVersion.releaseChannelNumber) {
      console.log(`Could not determine release channel number for version "${packageVersion}"`);
      process.exit(1);
    }

    console.log(parsedVersion.releaseChannelNumber);

    return true;
  }

  console.log(packageVersion);

  return true;
}

export function getShortDoc(): string {
  return DOC.trim().split('\n')[0];
}

export function printHelp(): void {
  console.log(`Usage: ci_tools ${COMMAND_NAME} [--major] [--mode <MODE>]`);
  console.log('');
  console.log(DOC.trim());
}
