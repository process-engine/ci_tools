import { getPackageVersionDotnet, setPackageVersionDotnet } from './package_version/dotnet';
import { getPackageVersionNode, setPackageVersionNode } from './package_version/node';

const PACKAGE_MODE_DOTNET = 'dotnet';
const PACKAGE_MODE_NODE = 'node';
const versionRegex: RegExp = /^(\d+)\.(\d+).(\d+)/;

export function getPackageVersion(mode: string): string {
  switch (mode) {
    case PACKAGE_MODE_DOTNET:
      return getPackageVersionDotnet();
    case PACKAGE_MODE_NODE:
      return getPackageVersionNode();
    default:
      throw new Error(`Unknown value for \`mode\`: ${mode}`);
  }
}

export function getMajorPackageVersion(mode: string): string {
  return getMajorVersion(getPackageVersion(mode));
}

export function getPackageVersionTag(mode): string {
  return `v${getPackageVersion(mode)}`;
}

export function setPackageVersion(mode: string, version: string): void {
  switch (mode) {
    case PACKAGE_MODE_DOTNET:
      setPackageVersionDotnet(version);
    case PACKAGE_MODE_NODE:
      setPackageVersionNode(version);
    default:
      throw new Error(`Unknown value for \`mode\`: ${mode}`);
  }
}

function getMajorVersion(version: string): string {
  const regexResult: RegExpExecArray = versionRegex.exec(version);
  const majorVersion: string = regexResult[1];

  return majorVersion;
}
