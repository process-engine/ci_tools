import * as fs from 'fs';
import * as parser from 'xml2json';
import * as path from 'path';
import { sh } from '../../cli/shell';

/**
 * Internal: Used by package_version.ts
 */
export function getPackageVersionDotnet(): string {
  const pathToCsproj = getCsprojPath();
  const version = JSON.parse(getJsonFromFile(pathToCsproj)).Project.PropertyGroup.Version;

  return version;
}

/**
 * Internal: Used by package_version.ts
 */
export function setPackageVersionDotnet(newVersion: string): void {
  const currentVersion = getPackageVersionDotnet();
  if (currentVersion == null) {
    throw new Error('Unexpected value: `currentVersion` should not be null here.');
  }

  const pathToCsproj = getCsprojPath();
  const csProj = fs.readFileSync(pathToCsproj, { encoding: 'utf8' });
  const csProjWithNewVersion = csProj.replace(
    `<Version>${currentVersion}</Version>`,
    `<Version>${newVersion}</Version>`
  );

  fs.writeFileSync(pathToCsproj, csProjWithNewVersion);
}

function getJsonFromFile(filePath: string): string {
  const csproj = fs.readFileSync(filePath, { encoding: 'utf8' });

  const jsonString = parser.toJson(csproj);

  return jsonString;
}

function getCsprojPath(): string {
  if (process.platform === 'win32') {
    return getCsprojPathOnWindows();
  }

  return getCsprojPathOnNonWindows();
}

function getCsprojPathOnWindows(): string {
  const result = sh('where /r . *.csproj');
  const paths = result.split('\n');

  const relativeCsprojPath = findRelativeCsprojPath(paths);
  return relativeCsprojPath.replace(/\r/g, '');
}

function getCsprojPathOnNonWindows(): string {
  const result = sh('find . -print | grep -i .csproj');
  const paths = result.split('\n');

  return findRelativeCsprojPath(paths);
}

function findRelativeCsprojPath(paths: Array<string>): string {
  const filteredPaths = paths.filter((filePath: string) => {
    // Replace the current working dir, because Windows returns absolute paths when using `where`
    const relativePathToCsproj = filePath.trim().replace(process.cwd(), '');
    const parsedPath = path.parse(relativePathToCsproj);

    return (
      relativePathToCsproj.endsWith('.csproj') && !parsedPath.dir.includes('test') && !parsedPath.dir.includes('tests')
    );
  });

  if (filteredPaths.length > 1) {
    throw new Error(`More than one .csproj file found: ${filteredPaths}`);
  }

  return filteredPaths[0];
}
