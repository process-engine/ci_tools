import * as fs from 'fs';
import * as glob from 'glob';
import * as xml2js from 'xml2js';

const CSPROJ_FILE_GLOB = '*.csproj';

const xmlParserOptions = {
  explicitArray: false,
  mergeAttrs: true,
};

const xmlParser = new xml2js.Parser(xmlParserOptions);

/**
 * Internal: Used by package_version.ts
 */
export function getPackageVersionDotnet(): string {
  const filename = getCsprojPath();
  const json = getCsprojAsObject(filename);
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

function getCsprojAsObject(filePath: string): any {
  const contents = fs.readFileSync(filePath, { encoding: 'utf8' });

  xmlParser.parseString(contents, (results) => {
    return results;
  });
}

function getCsprojPath(): string {
  const paths = glob.sync(CSPROJ_FILE_GLOB);

  if (paths.length > 1) {
    throw new Error(`More than one .csproj file found: ${paths.join('\n')}`);
  }

  return paths[0];
}
