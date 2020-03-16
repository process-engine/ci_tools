import { execSync } from 'child_process';
import { join, resolve } from 'path';

import * as fsExtra from 'fs-extra';

export const ROOT_DIR = resolve(join(__dirname, '..'));
const CI_TOOLS_EXECUTABLE = join(ROOT_DIR, 'dist', 'ci_tools.js');

export function run(ciToolsCommand: string): string {
  return shell(`node ${CI_TOOLS_EXECUTABLE} ${ciToolsCommand}`);
}

export function shell(shellCommand: string): string {
  console.log('      shell:', shellCommand);

  const env = { ...process.env };
  delete env['GIT_BRANCH'];
  delete env['GITHUB_REF'];

  const output = execSync(`${shellCommand} 2>&1`, { encoding: 'utf-8', env: env });

  return output;
}

/**
 * Changes the current working directory (cwd) to the given `directory` and executes the given `callback`.
 * Resets the cwd afterwards.
 *
 * Example:
 *
 *    await inDir('test/fixtures/node-simple', async () => {
 *      const packageVersion = await getPackageVersion('dotnet');
 *      assert.equal(packageVersion, '1.2.3');
 *    });
 */
export async function inDir(directory: string, callback: () => Promise<void>): Promise<void> {
  const oldDir = process.cwd();
  try {
    process.chdir(directory);
    await callback.apply(null);
  } catch (err) {
    console.error(`inDir(${directory}): ${err}`);
    throw err;
  } finally {
    process.chdir(oldDir);
  }
}

export function inDirSync(directory: string, callback: () => void): void {
  const oldDir = process.cwd();
  try {
    process.chdir(directory);
    callback.apply(null);
  } catch (err) {
    console.error(`inDir(${directory}): ${err}`);
    throw err;
  } finally {
    process.chdir(oldDir);
  }
}

/**
 * Sets up a working copy of a sample repo, including a Git remote that integration tests can safely push to.
 */
export function setupGitWorkingCopyForTest(): string {
  const gitRemoteForTest = createGitRemoteToCloneFrom();
  const gitTempWorkingCopy = cloneTestRepoFromRemote(gitRemoteForTest);
  return gitTempWorkingCopy;
}

function createGitRemoteToCloneFrom(): string {
  // this is a Git bare repo that we can easily clone locally for testing purposes
  const gitFixtureDir = resolve(join(ROOT_DIR, 'test', 'fixtures', 'simple.git'));
  const newGitRemote = resolve(join(ROOT_DIR, 'tmp', 'origin'));

  fsExtra.removeSync(newGitRemote);
  fsExtra.copySync(gitFixtureDir, newGitRemote);

  return newGitRemote;
}

function cloneTestRepoFromRemote(remote: string): string {
  const workingCopyDir = resolve(join(ROOT_DIR, 'tmp', 'working-copy'));

  fsExtra.removeSync(workingCopyDir);
  shell(`git clone ${remote} ${workingCopyDir}`);

  return workingCopyDir;
}
