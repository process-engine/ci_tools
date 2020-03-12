import { getPackageVersionDotnet, setPackageVersionDotnet } from './package_version/dotnet';
import { getPackageVersionNode, setPackageVersionNode } from './package_version/node';

const PACKAGE_MODE_DOTNET = 'dotnet';
const PACKAGE_MODE_NODE = 'node';
const versionRegex = /^(\d+)\.(\d+).(\d+)/;

export async function getPackageVersion(mode: string): Promise<string> {
  switch (mode) {
    case PACKAGE_MODE_DOTNET:
      return getPackageVersionDotnet();
    case PACKAGE_MODE_NODE:
      return getPackageVersionNode();
    default:
      throw new Error(`Unknown value for \`mode\`: ${mode}`);
  }
}

export async function getMajorPackageVersion(mode: string): Promise<string> {
  const packageVersion = await getPackageVersion(mode);
  return getMajorVersion(packageVersion);
}

export async function getPackageVersionTag(mode): Promise<string> {
  const packageVersion = await getPackageVersion(mode);
  return `v${packageVersion}`;
}

export async function setPackageVersion(mode: string, version: string): Promise<void> {
  switch (mode) {
    case PACKAGE_MODE_DOTNET:
      await setPackageVersionDotnet(version);
      return;
    case PACKAGE_MODE_NODE:
      setPackageVersionNode(version);
      return;
    default:
      throw new Error(`Unknown value for \`mode\`: ${mode}`);
  }
}

function getMajorVersion(version: string): string {
  const regexResult: RegExpExecArray = versionRegex.exec(version);
  const majorVersion: string = regexResult[1];

  return majorVersion;
}
