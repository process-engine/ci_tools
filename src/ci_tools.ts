import { run as runAutoPublishIfApplicable } from './commands/internal/auto-publish-if-applicable';
import { run as runCommitAndTagVersion } from './commands/commit-and-tag-version';
import { run as runCreateChangelog } from './commands/internal/create-changelog';
import { run as runNpmInstallOnly } from './commands/npm-install-only';
import { run as runPrepareVersion } from './commands/prepare-version';
import { run as runSetupGitAndNpmConnections } from './commands/internal/setup-git-and-npm-connections';
import { run as runUpdateGithubRelease } from './commands/update-github-release';

const COMMAND_HANDLERS = {
  'commit-and-tag-version': runCommitAndTagVersion,
  'prepare-version': runPrepareVersion,
  'npm-install-only': runNpmInstallOnly,
  'update-github-release': runUpdateGithubRelease
};

// Internal commands are only used to develop ci_tools and are not intended for public consumption.
const INTERNAL_COMMAND_HANDLERS = {
  'auto-publish-if-applicable': runAutoPublishIfApplicable,
  'create-changelog': runCreateChangelog,
  'setup-git-and-npm-connections': runSetupGitAndNpmConnections
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

const foundCommand = COMMAND_HANDLERS[commandName] || INTERNAL_COMMAND_HANDLERS[commandName];

if (foundCommand == null) {
  console.log(`No handler found for command: ${commandName}`);
  process.exit(1);
}

foundCommand(...restArgs);
