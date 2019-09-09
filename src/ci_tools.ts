#!/usr/bin/env node

import chalk from 'chalk';
import * as yargsParser from 'yargs-parser';

import { run as runAutoPublishIfApplicable } from './commands/internal/auto-publish-if-applicable';
import { run as runCommitAndTagVersion } from './commands/commit-and-tag-version';
import { run as runCreateChangelog } from './commands/internal/create-changelog';
import { run as runFailOnPreVersionDependencies } from './commands/fail-on-pre-version-dependencies';
import { run as runNpmInstallOnly } from './commands/npm-install-only';
import { run as runPrepareVersion } from './commands/prepare-version';
import { run as runPublishNpmPackage } from './commands/publish-npm-package';
import { run as runSetupGitAndNpmConnections } from './commands/internal/setup-git-and-npm-connections';
import { run as runUpdateGithubRelease } from './commands/update-github-release';

import { getGitBranch } from './git/git';
import { PRIMARY_BRANCHES } from './versions/increment_version';

const COMMAND_HANDLERS = {
  'commit-and-tag-version': runCommitAndTagVersion,
  'fail-on-pre-version-dependencies': runFailOnPreVersionDependencies,
  'prepare-version': runPrepareVersion,
  'publish-npm-package': runPublishNpmPackage,
  'npm-install-only': runNpmInstallOnly,
  'update-github-release': runUpdateGithubRelease
};

// Internal commands are only used to develop ci_tools and are not intended for public consumption.
const INTERNAL_COMMAND_HANDLERS = {
  'auto-publish-if-applicable': runAutoPublishIfApplicable,
  'create-changelog': runCreateChangelog,
  'update-github-release': runUpdateGithubRelease,
  'setup-git-and-npm-connections': runSetupGitAndNpmConnections
};

function run(argv: string[]): void {
  const [, , ...args] = argv;

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

  enforceUniversalCommandLineSwitches(commandName, args);

  foundCommand(...restArgs);
}

function enforceUniversalCommandLineSwitches(commandName: string, args: string[]): void {
  const badge = `[${commandName}]\t`;
  const argv = yargsParser(args);

  if (argv.onlyOnPrimaryBranches && argv.exceptOnPrimaryBranches) {
    console.error(chalk.red(`${badge}Both --only-on-primary-branches and --except-on-primary-branches given.`));
    console.error(chalk.red(`${badge}This can not work! Aborting.`));
    process.exit(1);
  } else if (argv.onlyOnPrimaryBranches) {
    ensureOnPrimaryBranchOrExit(badge);
  } else if (argv.exceptOnPrimaryBranches) {
    ensureNotOnPrimaryBranchOrExit(badge);
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

run(process.argv);
