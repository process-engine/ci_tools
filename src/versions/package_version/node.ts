import * as fs from 'fs';
import { sh } from '../../cli/shell';

/**
 * Internal: Used by package_version.ts
 */
export function getPackageVersionNode(): string {
  const rawdata = fs.readFileSync('package.json').toString();
  const packageJson = JSON.parse(rawdata);

  return packageJson.version;
}

/**
 * Internal: Used by package_version.ts
 */
export function setPackageVersionNode(version: string): void {
  sh(`npm version ${version} --no-git-tag-version`);
}
