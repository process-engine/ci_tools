import { existsSync, writeFileSync } from 'fs';

import { getCurrentRepoNameWithOwner, isGitHubRemote } from '../../git/git';
import { sh } from '../../cli/shell';

const BADGE = '[setup-git-and-npm]\t';
const NPMRC_FILE = '.npmrc';
const NPMRC_REGISTRY = '//registry.npmjs.org/';

const GIT_USER_EMAIL = 'ci@process-engine.io';
const GIT_USER_NAME = 'ProcessEngine Bot';
const GIT_REMOTE_NAME = 'origin';

const TOKEN_MASK = '*****';

/**
 * Sets up Git remotes, Npm registry and access tokens based on environement variables.
 */
export async function run(...args): Promise<boolean> {
  setupNpm();
  setupGit();

  return true;
}

export function setupGit(): void {
  if (!isGitHubRemote()) {
    console.log(`${BADGE}Not a GitHub remote, leaving Git config as is.`);
    return;
  }

  if (!(process.env.GH_USER && process.env.GH_TOKEN)) {
    console.log(`${BADGE}Did not find env variables GH_USER and GH_TOKEN, leaving Git config as is.`);
    return;
  }

  const noGitUserEmail = sh('git config user.email').trim() === '';
  if (noGitUserEmail) {
    console.log(`${BADGE}No Git user email found, setting it to '${GIT_USER_EMAIL}'.`);
    sh(`git config user.email "${GIT_USER_EMAIL}"`);
  }

  const noGitUserName = sh('git config user.name').trim() === '';
  if (noGitUserName) {
    console.log(`${BADGE}No Git user name found, setting it to '${GIT_USER_NAME}'.`);
    sh(`git config user.name "${GIT_USER_NAME}"`);
  }

  if (process.env.GH_USER != null && process.env.GH_TOKEN != null) {
    const repoNameWithOwner = getCurrentRepoNameWithOwner();
    const maskedRemoteUrl = `https://${process.env.GH_USER}:${TOKEN_MASK}@github.com/${repoNameWithOwner}.git`;
    const remoteUrl = maskedRemoteUrl.replace(TOKEN_MASK, process.env.GH_TOKEN);
    sh(`git remote set-url ${GIT_REMOTE_NAME} ${remoteUrl}`);

    console.log(`${BADGE}Found env variables GH_USER and GH_TOKEN, setting remote '${GIT_REMOTE_NAME}' to:`);
    console.log(`${BADGE}${maskedRemoteUrl}`);
    console.log('');
  }
}

export function setupNpm(): void {
  if (existsSync(NPMRC_FILE)) {
    console.log(`${BADGE}${NPMRC_FILE} exists, leaving npm config as is.`);
    return;
  }

  if (process.env.NPM_TOKEN) {
    const content = `${NPMRC_REGISTRY}:_authToken=\${NPM_TOKEN}`;
    writeFileSync(NPMRC_FILE, content);
    console.log(`${BADGE}Found env variable NPM_TOKEN, but did not find file ${NPMRC_FILE}`);
    console.log(`${BADGE}${NPMRC_FILE} was created with this content (npm will swap in NPM_TOKEN on publish):`);
    console.log(`${BADGE}${content}`);
    console.log('');
  }
}
