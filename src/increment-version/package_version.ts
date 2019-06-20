import * as fs from 'fs';

export function getPackageVersion(): string {
  const rawdata = fs.readFileSync('package.json').toString();
  const packageJson = JSON.parse(rawdata);

  return packageJson.version;
}

export function getPackageVersionTag(): string {
  return `v${getPackageVersion()}`;
}
