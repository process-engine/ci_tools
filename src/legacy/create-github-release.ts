#!/usr/bin/env node

import * as Octokit from '@octokit/rest';
import { readFileSync, statSync } from 'fs';
import * as mime from 'mime-types';

if (process.argv.length < 7) {
  console.error(
    'Please supply arguments: ' +
      '<github namespace> <github repository> <version to release> <target commit> <is draft> <is prerelease> [files to upload...]'
  );
  process.exit(1);
}

if (
  !process.env['RELEASE_GH_TOKEN'] ||
  process.env['RELEASE_GH_TOKEN'] === null ||
  process.env['RELEASE_GH_TOKEN'] === undefined ||
  process.env['RELEASE_GH_TOKEN'] === ''
) {
  console.error('Please supply github token via RELEASE_GH_TOKEN environment variable.');
  process.exit(1);
}

const githubRepoNamespace: string = process.argv[2];
const githubRepoName: string = process.argv[3];
const versionToRelease: string = process.argv[4];
const targetCommit: string = process.argv[5];
const releaseIsDraft: boolean = process.argv[6] === 'true';
const releaseIsPrerelease: boolean = process.argv[7] === 'true';
const filesToUpload: string[] = process.argv.slice(8);

const githubAuthToken: string = process.env['RELEASE_GH_TOKEN'];

const versionTag: string = `v${versionToRelease}`;
const octokit: Octokit = new Octokit();

async function authenticate(): Promise<void> {
  await octokit.authenticate({
    type: 'token',
    token: githubAuthToken
  });
}

async function checkForExistingRelease(): Promise<boolean> {
  try {
    await octokit.repos.getReleaseByTag({
      owner: githubRepoNamespace,
      repo: githubRepoName,
      tag: versionTag
    });
  } catch (error) {
    return false;
  }

  return true;
}

async function createRelease(): Promise<Octokit.Response<Octokit.ReposCreateReleaseResponse>> {
  console.log('Creating GitHub Release.');

  return octokit.repos.createRelease({
    owner: githubRepoNamespace,
    repo: githubRepoName,
    tag_name: versionTag,
    target_commitish: targetCommit,
    name: versionToRelease,
    draft: releaseIsDraft,
    prerelease: releaseIsPrerelease
  });
}

function getFilename(path: string): string {
  const slashAt: number = path.lastIndexOf('/');
  if (slashAt < 0) {
    return path;
  }

  return path.substr(slashAt + 1);
}

async function uploadReleaseAsset(uploadUrl: string, file: string): Promise<Octokit.Response<any>> {
  const buffer: Buffer = readFileSync(file);
  const fileSize: number = statSync(file).size;
  // detect mine type
  const contentType: string = mime.lookup(file) || 'text/plain';
  const name: string = getFilename(file).replace(' ', '_');

  console.log(`Uploading Asset '${file}', Content-Type '${contentType}'.`);

  return octokit.repos.uploadAsset({
    url: uploadUrl,
    file: buffer,
    contentType: contentType,
    contentLength: fileSize,
    name: name
  } as any);
}

async function main(): Promise<void> {
  await authenticate();

  const releaseAlreadyExists: boolean = await checkForExistingRelease();
  if (releaseAlreadyExists) {
    console.log(`A release with the tag '${versionTag}' already exists.`);
    console.log('Wont override existing release.');
    process.exit(0);
  }

  const createdGithubRelease: Octokit.Response<Octokit.ReposCreateReleaseResponse> = await createRelease();
  const uploadUrlForAssets: string = createdGithubRelease.data.upload_url;

  const uploadPromises: Promise<Octokit.Response<any>>[] = filesToUpload.map(
    (file: string): Promise<Octokit.Response<any>> => {
      return uploadReleaseAsset(uploadUrlForAssets, file);
    }
  );

  await Promise.all(uploadPromises);
}

main().catch((error: Error): void => {
  console.log(error);
});
