import * as glob from 'glob';
import * as mime from 'mime-types';
import * as Octokit from '@octokit/rest';
import * as Path from 'path';
import * as yargsParser from 'yargs-parser';
import { readFileSync, statSync } from 'fs';

import { getCurrentRepoNameWithOwner, getFullCommitMessageFromRef, isExistingTag } from '../git/git';
import { getPackageVersionTag } from '../versions/package_version';
import { setupGit } from './internal/setup-git-and-npm-connections';

type GitTag = string;
type GitHubRepo = {
  owner: string;
  name: string;
};

const COMMAND_NAME = 'update-github-release';
const BADGE = `[${COMMAND_NAME}]\t`;
const SKIP_CI_MESSAGE = '[skip ci]';

const DOC = `
Updates or creates a GitHub release using the current version (or given \`--version-tag\`).

Uploads all given \`--assets\`, resolving globs and updating existing assets on GitHub.
`;
// DOC: see above
export async function run(...args): Promise<boolean> {
  const argv = yargsParser(args);
  const isDryRun = argv.dry;
  let versionTag = argv.versionTag;
  let title = argv.title;
  let text = argv.text;

  setupGit();

  if (versionTag == null) {
    versionTag = getPackageVersionTag();

    console.log(`${BADGE}No --version-tag given, versionTag set to:`, versionTag);
  }

  if (argv.useTitleAndTextFromGitTag) {
    if (!isExistingTag(versionTag)) {
      console.error(`${BADGE}Tag does not exists: ${versionTag}`);
      console.error(`${BADGE}Aborting.`);
      return false;
    }

    const { subject, body } = getFullCommitMessageFromRef(versionTag);

    title = subject;
    text = body.replace(SKIP_CI_MESSAGE, '').trim();

    console.log(`${BADGE}`);
    console.log(`${BADGE}Option --use-title-and-text-from-git-tag was given.`);
    console.log(`${BADGE}title set to:`, title);
    console.log(`${BADGE}text set to:`, text);
  }

  let assets = [];
  if (argv.assets) {
    const list = Array.isArray(argv.assets) ? argv.assets : [argv.assets];
    list.forEach((pattern: string): void => {
      const files = glob.sync(pattern);
      assets = assets.concat(files);
    });

    console.log(`${BADGE}`);
    console.log(`${BADGE}Option --assets was given:`, assets);
  }

  const success = await updateGitHubRelease(versionTag, title, text, assets, isDryRun);

  if (success) {
    console.log(`${BADGE}Success.`);
  }

  return success;
}

export function getShortDoc(): string {
  return DOC.trim().split('\n')[0];
}

export function printHelp(): void {
  console.log(
    `Usage: ci_tools ${COMMAND_NAME} [--use-title-and-text-from-git-tag | --title [--text]] [--assets <asset-name-or-glob> ...] [--version-tag] [--dry]`
  );
  console.log('');
  console.log(DOC.trim());
}

/**
 * Updates the corresponding GitHub release for `versionTag` using the given `title` and `text`.
 */
export async function updateGitHubRelease(
  versionTag: GitTag,
  title: string,
  text: string,
  assets: string[],
  dryRun: boolean = false
): Promise<boolean> {
  const repo = getCurrentRepoNameWithOwnerAsObject(getCurrentRepoNameWithOwner());
  const octokit = await createOctokit(process.env.GH_TOKEN);
  const releaseId = await getExistingReleaseId(octokit, repo, versionTag);
  const releaseExists = releaseId != null;

  if (releaseExists) {
    if (dryRun) {
      console.log(`${BADGE}Would now update existing release. Skipping since this is a dry run!`);

      return true;
    }

    console.log(`${BADGE}Updating existing release for ${versionTag} ...`);

    return updateExistingRelease(octokit, repo, releaseId, title, text, assets);
  }

  if (dryRun) {
    console.log(`${BADGE}Would now create a new release. Skipping since this is a dry run!`);

    return true;
  }

  console.log(`${BADGE}Creating new release for ${versionTag} ...`);

  return createNewRelease(octokit, repo, versionTag, title, text, assets);
}

async function updateExistingRelease(
  octokit: Octokit,
  repo: GitHubRepo,
  releaseId: number,
  title: string,
  text: string,
  assets: string[]
): Promise<boolean> {
  const response = await octokit.repos.editRelease({
    owner: repo.owner,
    repo: repo.name,
    release_id: releaseId,
    name: title,
    body: text
  });

  let success = response.status === 200;
  if (success) {
    const uploadUrl = response.data.upload_url;

    for (const filename of assets) {
      console.log(`${BADGE}- Uploading '${filename}' ...`);

      try {
        const uploadSuccess = await uploadAsset(octokit, uploadUrl, filename);
        success = success && uploadSuccess;
      } catch (e) {
        const data = JSON.parse(e.message);
        const alreadyExists = data.errors.length === 1 && data.errors[0].code === 'already_exists';

        if (alreadyExists) {
          console.log(`${BADGE}  INFO: Asset '${filename}' already exists.`);
        } else {
          throw e;
        }
      }
    }
  }

  return success;
}

async function uploadAsset(octokit: Octokit, uploadUrl: string, filename: string): Promise<boolean> {
  const buffer: Buffer = readFileSync(filename);
  const name: string = Path.basename(filename).replace(' ', '_');
  const contentLength: number = statSync(filename).size;
  const contentType: string = mime.lookup(filename) || 'text/plain';
  const options: any = {
    url: uploadUrl,
    file: buffer,
    contentType: contentType,
    contentLength: contentLength,
    name: name
  };

  const uploadResponse = await octokit.repos.uploadAsset(options);

  return uploadResponse.status === 200;
}

async function createNewRelease(
  octokit: Octokit,
  repo: GitHubRepo,
  versionTag: GitTag,
  title: string,
  text: string,
  assets: string[]
): Promise<boolean> {
  const isPrerelease = versionTag.match(/-/) != null;

  const response = await octokit.repos.createRelease({
    owner: repo.owner,
    repo: repo.name,
    tag_name: versionTag,
    name: title,
    body: text,
    prerelease: isPrerelease
  });

  const success = response.status === 200;
  if (success) {
    const releaseId = response.data.id;

    await updateExistingRelease(octokit, repo, releaseId, null, null, assets);
  }

  return success;
}

async function createOctokit(githubAuthToken: string): Promise<Octokit> {
  const octokit = new Octokit();

  await octokit.authenticate({
    type: 'token',
    token: githubAuthToken
  });

  return octokit;
}

function getCurrentRepoNameWithOwnerAsObject(nameWithOwner: string): GitHubRepo {
  const parts = nameWithOwner.split('/');

  return {
    name: parts[1],
    owner: parts[0]
  };
}

async function getExistingReleaseId(octokit: Octokit, repo: GitHubRepo, versionTag: GitTag): Promise<number | null> {
  try {
    const response = await octokit.repos.getReleaseByTag({
      owner: repo.owner,
      repo: repo.name,
      tag: versionTag
    });

    return response.data.id;
  } catch (error) {
    return null;
  }
}
