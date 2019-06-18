#!/usr/bin/env node

import * as fetch from 'node-fetch';

interface IApiIndex {
  resources: Array<IApiResource>;
}

interface IApiResource {
  '@id': string;
  '@type': string;
}

if (process.argv.length < 4) {
  console.error('Please supply arguments: <NuGet V3 feed URL> <package> <version>');
  process.exit(1);
}

let requestParameters: fetch.RequestInit = {};

if (
  process.env['NUGET_ACCESS_TOKEN'] !== null &&
  process.env['NUGET_ACCESS_TOKEN'] !== undefined &&
  process.env['NUGET_ACCESS_TOKEN'] !== ''
) {
  requestParameters = {
    headers: {
      'X-NuGet-ApiKey': process.env['NUGET_ACCESS_TOKEN']
    }
  };
}

const nugetFeedURL: string = process.argv[2];
const packageName: string = process.argv[3];
const packageVersion: string = process.argv[4];

async function getApiIndex(): Promise<IApiIndex> {
  const response: fetch.Response = await fetch.default(nugetFeedURL, requestParameters);

  const apiIndex: IApiIndex = await response.json();

  return apiIndex;
}

async function getPackageMetadataResource(apiIndex: IApiIndex): Promise<IApiResource> {
  const apiResource: IApiResource = apiIndex.resources.find((resource: IApiResource): boolean => {
    return resource['@type'] === 'PackageVersionDisplayMetadataUriTemplate';
  });

  return apiResource;
}

async function doesPackageExist(metadataResource: IApiResource): Promise<boolean> {
  const packageNameLower: string = packageName.toLowerCase();
  const packageVersionLower: string = packageVersion.toLowerCase();

  const packageMetadataURI: string = metadataResource['@id']
    .replace('{id-lower}', packageNameLower)
    .replace('{version-lower}', packageVersionLower);

  const response: fetch.Response = await fetch.default(packageMetadataURI, requestParameters);

  const isNot404: boolean = response.status !== 404;

  return isNot404;
}

async function main(): Promise<void> {
  const apiIndex: IApiIndex = await getApiIndex();
  const apiResource: IApiResource = await getPackageMetadataResource(apiIndex);

  const packageIsPublished: boolean = await doesPackageExist(apiResource);

  console.log(packageIsPublished);
}

main().catch((error: Error): void => {
  console.error(error);
  process.exit(1);
});
