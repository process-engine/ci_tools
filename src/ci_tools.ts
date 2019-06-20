import { run as autoPublishIfApplicableRun } from './commands/auto-publish-if-applicable';
import { run as createChangelogRun } from './commands/create-changelog';
import { run as incrementVersionRun } from './commands/increment-version';
import { run as setupGitAndNpmRun } from './commands/setup-git-and-npm';

const COMMAND_HANDLERS = {
  'auto-publish-if-applicable': autoPublishIfApplicableRun,
  'create-changelog': createChangelogRun,
  'increment-version': incrementVersionRun,
  'setup-git-and-npm': setupGitAndNpmRun
};

const [, , ...args] = process.argv;

if (args.length === 0) {
  console.log('Usage: TODO');
  process.exit(1);
}
const [commandName, ...restArgs] = args;

if (!COMMAND_HANDLERS[commandName]) {
  console.log(`No handler found for command: ${commandName}`);
  process.exit(1);
}

COMMAND_HANDLERS[commandName](...restArgs);
