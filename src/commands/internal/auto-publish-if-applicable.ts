import { run as prepareVersionRun } from '../prepare-version';
import { run as setupGitAndNpmConnectionsRun } from './setup-git-and-npm-connections';

const BADGE = '[auto-publish-if-applicable]\t';

export async function run(...args): Promise<boolean> {
  console.log(`${BADGE}`);
  return setupGitAndNpmConnectionsRun(...args) && prepareVersionRun(...args);
}
