import { run as createChangelogRun } from './create-changelog/index';
import { run as incrementVersionRun } from './increment-version/index';

const HANDLERS = { 'create-changelog': createChangelogRun, 'increment-version': incrementVersionRun };

const [, , ...args] = process.argv;

if (args.length === 0) {
  console.log('Usage: TODO');
  process.exit(1);
}
const [commandName, ...restArgs] = args;

if (!HANDLERS[commandName]) {
  console.log(`No handler found for command: ${commandName}`);
  process.exit(1);
}

HANDLERS[commandName](...restArgs);
