import * as fs from 'fs';

const versionRegex: RegExp = /(\d+)\.(\d+).(\d+)/;

export function getPackageVersion(): string {
  const rawdata = fs.readFileSync('package.json').toString();
  const packageJson = JSON.parse(rawdata);

  return packageJson.version;
}

export function getMajorPackageVersion(): string {
  const rawdata = fs.readFileSync('package.json').toString();
  const packageJson = JSON.parse(rawdata);

  const regexResult: RegExpExecArray = versionRegex.exec(packageJson.version);
  const majorVersion: string = regexResult[1];

  return majorVersion;
}

export function getPackageVersionTag(): string {
  return `v${getPackageVersion()}`;
}
