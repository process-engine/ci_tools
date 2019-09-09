import * as assert from 'assert';
import { previousStableVersion } from './previous_stable_version';

const GIT_TAG_LIST = `v1.2.0
v1.2.1-alpha.10
v1.2.1-alpha.7
v1.2.1-alpha.8
v1.2.1-alpha.9
v2.0.0-alpha.1
v2.0.0-alpha.2
v2.0.0-alpha.3
v2.0.1
v2.1.0-beta.1
v3.2.0`;

describe('previous_stable_version.ts', (): void => {
  describe('previousVersion()', (): void => {
    it('should return the previous version for the initial stable build', (): void => {
      assert.equal(previousStableVersion('0.1.0', GIT_TAG_LIST), null);
    });
    it('should return the previous version for a stable build', (): void => {
      assert.equal(previousStableVersion('2.0.0', GIT_TAG_LIST), '1.2.0');
    });
    it('should return the previous version for the first alpha build of a new version', (): void => {
      assert.equal(previousStableVersion('3.2.1', GIT_TAG_LIST), '3.2.0');
    });
    it('should return the previous version for unknown pre-version suffixes', (): void => {
      assert.equal(previousStableVersion('3.2.1-asdf5', GIT_TAG_LIST), '3.2.0');
    });
    it('should return the previous version for subsequent alpha versions', (): void => {
      assert.equal(previousStableVersion('1.2.1-alpha.7', GIT_TAG_LIST), '1.2.0');
    });

    it('should return the previous version for subsequent beta versions', (): void => {
      assert.equal(previousStableVersion('2.1.0-beta.3', GIT_TAG_LIST), '2.0.1');
    });
    it('should return the previous version for the stable build of a alpha version', (): void => {
      assert.equal(previousStableVersion('3.3.0-alpha.42', GIT_TAG_LIST), '3.2.0');
    });
    it('should return the previous version for the stable build of a beta version', (): void => {
      assert.equal(previousStableVersion('2.0.0-alpha.4', GIT_TAG_LIST), '1.2.0');
    });
  });
});
