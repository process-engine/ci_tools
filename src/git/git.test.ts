import * as assert from 'assert';
import { getBranchFromRefTag, mapReleaseChannelNameToBranch } from './git';

describe('git.ts', () => {
  describe('getBranchFromRefTag()', () => {
    it('should return the right branch name for tag references', () => {
      assert.strictEqual(getBranchFromRefTag('refs/tags/v1.0.0-alpha.18'), 'develop');
      assert.strictEqual(getBranchFromRefTag('refs/tags/v1.0.0-beta.18'), 'beta');
      assert.strictEqual(getBranchFromRefTag('refs/tags/v1.0.0'), 'master');
    });

    it('should return null if tag reference is not valid semver', () => {
      assert.strictEqual(getBranchFromRefTag('refs/tags/v1dd.0.0-alpha.18'), null);
      assert.strictEqual(getBranchFromRefTag('v1.0ddds.0-beta.18'), null);
      assert.strictEqual(getBranchFromRefTag('refs/tags/myIndividualTagWithoutAVersion'), null);
    });
  });

  describe('mapReleaseChannelNameToBranch()', () => {
    it('should map the release channels to branch names', () => {
      assert.strictEqual(mapReleaseChannelNameToBranch('alpha'), 'develop');
      assert.strictEqual(mapReleaseChannelNameToBranch('beta'), 'beta');
      assert.strictEqual(mapReleaseChannelNameToBranch('stable'), 'master');
    });

    it('should return undefined if the release channel is not known', () => {
      assert.strictEqual(mapReleaseChannelNameToBranch('channel'), undefined);
    });
  });
});
