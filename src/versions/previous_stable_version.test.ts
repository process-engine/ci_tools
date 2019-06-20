import * as assert from 'assert';
import { previousStableVersion } from './previous_stable_version';

const GIT_TAG_LIST = `v1.2.0
v1.2.1-alpha10
v1.2.1-alpha7
v1.2.1-alpha8
v1.2.1-alpha9
v2.0.0-alpha1
v2.0.0-alpha2
v2.0.0-alpha3
v2.0.1
v2.1.0-beta1
v3.2.0`;

describe('previous_stable_version.ts', (): void => {
  describe('previousVersion()', (): void => {
    it('should return the previous version for the first alpha build of a new version', (): void => {
      assert.equal(previousStableVersion('3.2.1', GIT_TAG_LIST), '3.2.0');
    });
    it('should return the previous version for unknown pre-version suffixes', (): void => {
      assert.equal(previousStableVersion('3.2.1-asdf5', GIT_TAG_LIST), '3.2.0');
    });
    it('should return the previous version for subsequent alpha versions', (): void => {
      assert.equal(previousStableVersion('1.2.1-alpha7', GIT_TAG_LIST), '1.2.0');
    });

    it('should return the previous version for subsequent beta versions', (): void => {
      assert.equal(previousStableVersion('2.1.0-beta3', GIT_TAG_LIST), '2.0.1');
    });
    it('should return the previous version for the stable build of a alpha version', (): void => {
      assert.equal(previousStableVersion('3.3.0-alpha42', GIT_TAG_LIST), '3.2.0');
    });
    it('should return the previous version for the stable build of a beta version', (): void => {
      assert.equal(previousStableVersion('2.0.0-alpha4', GIT_TAG_LIST), '1.2.0');
    });
  });
});
