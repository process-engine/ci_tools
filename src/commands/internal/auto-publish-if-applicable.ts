import { run as incrementVersionRun } from '../increment-version';
import { run as setupGitAndNpmRun } from './setup-git-and-npm';

const BADGE = '[auto-publish-if-applicable]\t';

export async function run(...args): Promise<boolean> {
  console.log(`${BADGE}`);
  return setupGitAndNpmRun(...args) && incrementVersionRun(...args);
}
