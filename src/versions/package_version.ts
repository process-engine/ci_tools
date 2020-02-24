import * as fs from 'fs';
import * as parser from 'xml2json';
import { sh } from '../cli/shell';

const PACKAGE_MODE_DOTNET = 'dotnet';
const versionRegex: RegExp = /^(\d+)\.(\d+).(\d+)/;

export function getPackageVersion(mode: string): string {
  if (mode === PACKAGE_MODE_DOTNET) {
    return getDotnetPackageVersion();
  }

  const rawdata = fs.readFileSync('package.json').toString();
  const packageJson = JSON.parse(rawdata);

  return packageJson.version;
}

export function getMajorPackageVersion(mode: string): string {
  return getMajorVersion(getPackageVersion(mode));
}

export function getPackageVersionTag(mode): string {
  return `v${getPackageVersion(mode)}`;
}

export function getDotnetPackageVersion(): string {
  const pathToCsproj = getCsprojPath();
  const version = JSON.parse(getJsonFromFile(pathToCsproj)).Project.PropertyGroup.Version;

  return version;
}

export function setPackageVersion(mode: string, version: string): void {
  if (mode === PACKAGE_MODE_DOTNET) {
    setDotnetPackageVersion(version);
    return;
  }

  sh(`npm version ${version} --no-git-tag-version`);
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

function setDotnetPackageVersion(version: string): void {
  const pathToCsproj = getCsprojPath();
  const csProj = fs.readFileSync(pathToCsproj, { encoding: 'utf8' });
  const csProjWithNewVersion = csProj.replace(getDotnetPackageVersion().toString(), version);
  fs.writeFileSync(pathToCsproj, csProjWithNewVersion);
}

function getCsprojPath(): string {
  if (process.platform === 'win32') {
    const csprojPath = sh('where /r . *.csproj');
    return csprojPath.trim();
  }

  const csprojPath = sh('find . -print | grep -i .csproj');
  return csprojPath.trim();
}
