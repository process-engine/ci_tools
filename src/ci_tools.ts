#!/usr/bin/env node

import chalk from 'chalk';
import * as yargsParser from 'yargs-parser';

import * as AutoPublishIfApplicable from './commands/internal/auto-publish-if-applicable';
import * as CommitAndTagVersion from './commands/commit-and-tag-version';
import * as CreateChangelog from './commands/internal/create-changelog';
import * as FailOnPreVersionDependencies from './commands/fail-on-pre-version-dependencies';
import * as NpmInstallOnly from './commands/npm-install-only';
import * as PrepareVersion from './commands/prepare-version';
import * as PublishNpmPackage from './commands/publish-npm-package';
import * as SetupGitAndNpmConnections from './commands/internal/setup-git-and-npm-connections';
import * as UpdateGithubRelease from './commands/update-github-release';
import * as UpgradeDependenciesWithPreVersions from './commands/upgrade-dependencies-with-pre-versions';
import * as PublishReleasenotesOnSlack from './commands/publish-releasenotes-on-slack';
import * as GetVersion from './commands/get-version';

import { getGitBranch } from './git/git';
import { PRIMARY_BRANCHES } from './versions/increment_version';

const COMMAND_HANDLERS = {
  'commit-and-tag-version': CommitAndTagVersion,
  'fail-on-pre-version-dependencies': FailOnPreVersionDependencies,
  'prepare-version': PrepareVersion,
  'publish-npm-package': PublishNpmPackage,
  'npm-install-only': NpmInstallOnly,
  'update-github-release': UpdateGithubRelease,
  'upgrade-dependencies-with-pre-versions': UpgradeDependenciesWithPreVersions,
  'publish-releasenotes-on-slack': PublishReleasenotesOnSlack,
  'get-version': GetVersion
};

// Internal commands are only used to develop ci_tools and are not intended for public consumption.
const INTERNAL_COMMAND_HANDLERS = {
  'auto-publish-if-applicable': AutoPublishIfApplicable,
  'create-changelog': CreateChangelog,
  'update-github-release': UpdateGithubRelease,
  'setup-git-and-npm-connections': SetupGitAndNpmConnections
};

async function run(originalArgv: string[]): Promise<void> {
  const [, , ...args] = originalArgv;
  const argv = yargsParser(args, { alias: { help: ['h'] } });

  if (args.length === 0 || (args.length === 1 && argv.help === true)) {
    printHelp();
    process.exit(1);
  }
  const [commandName, ...restArgs] = args;

  const commandHandler = COMMAND_HANDLERS[commandName] || INTERNAL_COMMAND_HANDLERS[commandName];

  if (commandHandler == null) {
    console.error(`No handler found for command: ${commandName}`);
    process.exit(1);
  }

  enforceUniversalCommandLineSwitches(commandHandler, commandName, args);

  try {
    await commandHandler.run(...restArgs);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

function enforceUniversalCommandLineSwitches(commandHandler: any, commandName: string, args: string[]): void {
  const badge = `[${commandName}]\t`;
  const argv = yargsParser(args, { alias: { help: ['h'] } });

  if (argv.help) {
    printHelpForCommand(commandHandler, commandName);
    process.exit(0);
  }

  if (argv.onlyOnPrimaryBranches && argv.exceptOnPrimaryBranches) {
    console.error(chalk.red(`${badge}Both --only-on-primary-branches and --except-on-primary-branches given.`));
    console.error(chalk.red(`${badge}This can not work! Aborting.`));
    process.exit(1);
  } else if (argv.onlyOnPrimaryBranches) {
    ensureOnPrimaryBranchOrExit(badge);
  } else if (argv.exceptOnPrimaryBranches) {
    ensureNotOnPrimaryBranchOrExit(badge);
  }

  if (argv.onlyOnBranch) {
    ensureOnBranchOrExit(badge, argv.onlyOnBranch);
  }
}

function ensureOnBranchOrExit(badge: string, requestedBranchName: string): void {
  const branchName = getGitBranch();
  const currentlyOnBranch = requestedBranchName === branchName;

  if (!currentlyOnBranch) {
    console.log(chalk.yellow(`${badge}--only-on-branch given: ${requestedBranchName}`));
    console.log(chalk.yellow(`${badge}Current branch is '${branchName}'.`));
    console.log(chalk.yellow(`${badge}Nothing to do here. Exiting.`));

    process.exit(0);
  }
}

function ensureOnPrimaryBranchOrExit(badge: string): void {
  const branchName = getGitBranch();
  const currentlyOnPrimaryBranch = PRIMARY_BRANCHES.includes(branchName);

  if (!currentlyOnPrimaryBranch) {
    console.log(chalk.yellow(`${badge}--only-on-primary-branches given.`));
    console.log(
      chalk.yellow(`${badge}Current branch is '${branchName}' (primary branches are ${PRIMARY_BRANCHES.join(', ')}).`)
    );
    console.log(chalk.yellow(`${badge}Nothing to do here. Exiting.`));

    process.exit(0);
  }
}

function ensureNotOnPrimaryBranchOrExit(badge: string): void {
  const branchName = getGitBranch();
  const currentlyOnPrimaryBranch = PRIMARY_BRANCHES.includes(branchName);

  if (currentlyOnPrimaryBranch) {
    console.log(chalk.yellow(`${badge}--except-on-primary-branches given.`));
    console.log(
      chalk.yellow(`${badge}Current branch is '${branchName}' (primary branches are ${PRIMARY_BRANCHES.join(', ')}).`)
    );
    console.log(chalk.yellow(`${badge}Nothing to do here. Exiting.`));

    process.exit(0);
  }
}

function printHelp(): void {
  console.log('Usage: ci_tools <COMMAND>');
  console.log('');
  console.log('COMMAND can be any of:');
  Object.keys(COMMAND_HANDLERS).forEach((commandName: string): void => console.log(`  ${commandName}`));
}

function printHelpForCommand(commandHandler: any, commandName: string): void {
  if (commandHandler.printHelp != null) {
    commandHandler.printHelp();
    return;
  }

  console.log(`Usage: ci_tools ${commandName}`);
  console.log('');
  console.log('No further instructions available.');
}

run(process.argv);
