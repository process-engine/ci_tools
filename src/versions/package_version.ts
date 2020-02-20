import * as fs from 'fs';
import * as parser from 'xml2json';
import { sh } from '../cli/shell';

const versionRegex: RegExp = /^(\d+)\.(\d+).(\d+)/;

export function getPackageVersion(): string {
  if (process.env.MODE === 'dotnet') {
    return getDotnetPackageVersion();
  }

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

export function getDotnetPackageVersion(): string {
  const pathToCsproj = getCsprojPath();
  const version = JSON.parse(getJsonFromFile(pathToCsproj)).Project.PropertyGroup.Version;

  return version;
}

export function setPackageVersion(version): void {
  if (process.env.MODE === 'dotnet') {
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
    const result = sh('where /r . *.csproj');
    const paths = result.split('\n');

    const filteredPaths = paths.filter((path: string) => {
      // Replace the current working dir, because Windows returns absolute paths when using `where`
      const trimmedPath = path.trim().replace(process.cwd(), '');

      return trimmedPath.endsWith('.csproj') && !trimmedPath.includes('\\test\\') && !trimmedPath.includes('\\tests\\');
    });

    if (filteredPaths.length > 1) {
      throw new Error(`More than one .csproj file found: ${filteredPaths}`);
    }
    return filteredPaths[0].replace(/\r/g, '');
  }

  const result = sh('find . -print | grep -i .csproj');

  const paths = result.split('\n');
  const filteredPaths = paths.filter((path: string) => {
    const trimmedPath = path.trim();
    return trimmedPath.endsWith('.csproj') && !trimmedPath.includes('/test/') && !trimmedPath.includes('/tests/');
  });

  if (filteredPaths.length > 1) {
    throw new Error(`More than one .csproj file found: ${filteredPaths}`);
  }

  return filteredPaths[0];
}
