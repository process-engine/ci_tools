import * as fs from 'fs';
import * as glob from 'glob';
import { parseStringPromise } from 'xml2js';

const CSPROJ_FILE_GLOB = '*.csproj';

/**
 * Internal: Used by package_version.ts
 */
export async function getPackageVersionDotnet(): Promise<string> {
  const filename = getCsprojPath();
  const json = await getCsprojAsObject(filename);
  if (json == null) {
    throw new Error(`Could not convert csproj to JSON: ${filename}`);
  }
  const version = json?.Project?.PropertyGroup?.Version;
  if (version == null) {
    throw new Error(`Could not read version from converted JSON: ${filename}`);
  }

  return version;
}

/**
 * Internal: Used by package_version.ts
 */
export async function setPackageVersionDotnet(newVersion: string): Promise<void> {
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

function getCsprojAsObject(filePath: string): Promise<any> {
  const contents = fs.readFileSync(filePath, { encoding: 'utf8' });

  return parseStringPromise(contents.toString());
}

function getCsprojPath(): string {
  const paths = glob.sync(CSPROJ_FILE_GLOB);

  if (paths.length > 1) {
    throw new Error(`More than one .csproj file found: ${paths.join('\n')}`);
  }

  return paths[0];
}
