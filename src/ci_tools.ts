import { run as runAutoPublishIfApplicable } from './commands/auto-publish-if-applicable';
import { run as runNpmInstallOnly } from './commands/npm-install-only';
import { run as runCreateChangelog } from './commands/create-changelog';
import { run as runUpdateGithubRelease } from './commands/update-github-release';
import { run as runIncrementVersion } from './commands/increment-version';
import { run as runSetupGitAndNpm } from './commands/setup-git-and-npm';

const COMMAND_HANDLERS = {
  'auto-publish-if-applicable': runAutoPublishIfApplicable,
  'create-changelog': runCreateChangelog,
  'increment-version': runIncrementVersion,
  'npm-install-only': runNpmInstallOnly,
  'update-github-release': runUpdateGithubRelease,
  'setup-git-and-npm': runSetupGitAndNpm
};

const [, , ...args] = process.argv;

if (args.length === 0) {
  console.log('Usage: ci_tools <COMMAND>');
  console.log('');
  console.log('COMMAND can be any of:');
  Object.keys(COMMAND_HANDLERS).forEach((commandName: string): void => console.log(`  ${commandName}`));
  process.exit(1);
}
const [commandName, ...restArgs] = args;

if (!COMMAND_HANDLERS[commandName]) {
  console.log(`No handler found for command: ${commandName}`);
  process.exit(1);
}

COMMAND_HANDLERS[commandName](...restArgs);
