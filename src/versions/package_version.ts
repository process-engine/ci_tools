import * as fs from 'fs';
import * as parser from 'xml2json';

const versionRegex: RegExp = /^(\d+)\.(\d+).(\d+)/;

export function getPackageVersion(): string {
  const rawdata = fs.readFileSync('package.json').toString();
  const packageJson = JSON.parse(rawdata);

  return packageJson.version;
}

export function getMajorPackageVersion(): string {
  return getMajorVersion(getPackageVersion());
}

export function getPackageVersionTag(): string {
  return `v${getPackageVersion()}`;
}

export function getDotnetPackageVersion(filePath: string): string {
  const version = JSON.parse(getJsonFromFile(filePath)).Project.PropertyGroup.Version;

  return version;
}

export function getDotnetMajorPackageVersion(filePath: string): string {
  const version = getDotnetPackageVersion(filePath);

  return getMajorVersion(version);
}

function getMajorVersion(version: string): string {
  const regexResult: RegExpExecArray = versionRegex.exec(version);
  const majorVersion: string = regexResult[1];

  return majorVersion;
}

function getJsonFromFile(filePath: string): string {
  const csproj = fs.readFileSync(filePath, { encoding: 'utf8' });

  const jsonString = parser.toJson(csproj);

  return jsonString;
}

export function setDotnetPackageVersion(version, filePath: string): void {
  const csProj = fs.readFileSync(filePath, { encoding: 'utf8' });
  const csProjWithNewVersion = csProj.replace(getDotnetPackageVersion(filePath).toString(), version);
  fs.writeFileSync(filePath, csProjWithNewVersion);
  console.log(`Version set to ${version}`);
}
