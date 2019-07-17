import * as Octokit from '@octokit/rest';
import * as yargsParser from 'yargs-parser';
import { getCurrentRepoNameWithOwner } from '../git/git';

const BADGE = '[update-github-release]\t';

type GitTag = string;
type GitHubRepo = {
  owner: string;
  name: string;
};

export async function run(...args): Promise<boolean> {
  const argv = yargsParser(args);

  console.log(`${BADGE}`, argv);

  const success = await updateGitHubRelease(argv.versionTag, argv.title, argv.text, argv.dry);

  if (success) {
    console.log(`${BADGE}Success.`);
  }

  return success;
}

/**
 * Updates the corresponding GitHub release for `versionTag` using the given `title` and `text`.
 */
export async function updateGitHubRelease(
  versionTag: GitTag,
  title: string,
  text: string,
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

    return updateExistingRelease(octokit, repo, releaseId, title, text);
  }

  if (dryRun) {
    console.log(`${BADGE}Would now create a new release. Skipping since this is a dry run!`);

    return true;
  }

  console.log(`${BADGE}Creating new release for ${versionTag} ...`);

  return createNewRelease(octokit, repo, versionTag, title, text);
}

async function updateExistingRelease(
  octokit: Octokit,
  repo: GitHubRepo,
  releaseId: number,
  title: string,
  text: string
): Promise<boolean> {
  const response = await octokit.repos.editRelease({
    owner: repo.owner,
    repo: repo.name,
    release_id: releaseId,
    name: title,
    body: text
  });

  return response.status === 200;
}

async function createNewRelease(
  octokit: Octokit,
  repo: GitHubRepo,
  versionTag: GitTag,
  title: string,
  text: string
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

  return response.status === 200;
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