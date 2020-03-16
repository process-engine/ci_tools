import * as assert from 'assert';

import * as JSON5 from 'json5';

import { shell } from './test_functions';

function getGitTags(): string[] {
  return shell('git tag --sort=-creatordate')
    .trim()
    .split('\n');
}

export function assertTagCount(count: number) {
  const tags = getGitTags();

  assert.strictEqual(tags.length, count);
}

export function assertTagExists(tag: string) {
  const tags = getGitTags();

  assert.ok(tags.includes(tag), `Expected tag '${tag}' to exist, got: ${JSON.stringify(tags)}`);
}

export function rejectTagExists(tag: string) {
  const tags = getGitTags();

  assert.ok(!tags.includes(tag), `Expected tag '${tag}' to NOT exist, got: ${JSON.stringify(tags)}`);
}

export function assertNoNewTagsCreated(callback: () => void): void {
  const tagCountBefore = getGitTags().length;
  callback.apply(null);
  assertTagCount(tagCountBefore);
}

export function assertNewTagCreated(tag: string, callback: () => void): void {
  const tagCountBefore = getGitTags().length;
  rejectTagExists(tag);

  callback.apply(null);

  assertTagExists(tag);
  assertTagCount(tagCountBefore + 1);
}

function getNodePackageVersion(): string {
  const output = shell('npm version');
  return JSON5.parse(output)['@process-engine/ci_tools'];
}

export function assertNodePackageVersion(version: string): void {
  assert.strictEqual(getNodePackageVersion(), version);
}
