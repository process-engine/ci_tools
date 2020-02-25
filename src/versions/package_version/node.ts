import { sh } from '../../cli/shell';

export function getPackageVersionNode(): string {
  const rawdata = fs.readFileSync('package.json').toString();
  const packageJson = JSON.parse(rawdata);

  return packageJson.version;
}

export function setPackageVersionNode(version: string): void {
  sh(`npm version ${version} --no-git-tag-version`);
}
