import { StdioOptions, execSync } from 'child_process';
import * as fs from 'fs';

export function getPackageVersionPython(): string {
  // Pass stderr to the parent process
  const stdioOptions: StdioOptions = ['pipe', 'pipe', 'inherit'];

  const versionRaw = execSync('python3 setup.py --version', { encoding: 'utf-8', stdio: stdioOptions });
  const version = versionRaw.trim();

  return version;
}

export function setPackageVersionPython(version: string): void {
  // It seems that the setup.py cli does not provide a command to set the package version, so this function will resort
  // to simply string-replacing the version in the setup.py file.
  // Loading the whole file into memory should be fine as setup.py files tend to be quite small in file size.
  const currentVersion = getPackageVersionPython();
  const setupContent = fs.readFileSync('setup.py', { encoding: 'utf-8' });

  fs.writeFileSync('setup.py', setupContent.replace(currentVersion, version));
}
