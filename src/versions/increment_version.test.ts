import * as assert from 'assert';
import { findNextSuffixNumber, incrementVersion } from './increment_version';

const BRANCH_DEVELOP = 'develop';
const BRANCH_BETA = 'beta';
const BRANCH_MASTER = 'master';

const GIT_TAG_LIST = `v1.2.1-alpha.10
v1.2.1-alpha.7
v1.2.1-alpha.8
v1.2.1-alpha.9
v2.0.0-alpha.1
v2.0.0-alpha.2
v2.0.0-alpha.3
v2.1.0-beta.1`;

describe('increment_version.ts', (): void => {
  describe('incrementVersion()', (): void => {
    it('should return the incremented version for the first alpha build of a new version', (): void => {
      assert.equal(incrementVersion('3.2.1', BRANCH_DEVELOP, GIT_TAG_LIST), '3.2.1-alpha.1');
    });
    it('should return the incremented version for unknown pre-version suffixes', (): void => {
      assert.equal(incrementVersion('3.2.1-asdf5', BRANCH_DEVELOP, GIT_TAG_LIST), '3.2.1-alpha.1');
    });
    it('should return the incremented version for subsequent alpha versions', (): void => {
      assert.equal(incrementVersion('1.2.1-alpha.7', BRANCH_DEVELOP, GIT_TAG_LIST), '1.2.1-alpha.11');
    });

    it('should return the incremented version for the first beta build of a alpha version', (): void => {
      assert.equal(incrementVersion('3.2.1-alpha.3', BRANCH_BETA, GIT_TAG_LIST), '3.2.1-beta.1');
    });
    it('should return the incremented version for subsequent beta versions', (): void => {
      // v2.1.0-beta.3 not in tag list, falling back to numbering found there
      assert.equal(incrementVersion('2.1.0-beta.3', BRANCH_BETA, GIT_TAG_LIST), '2.1.0-beta.2');
    });
    it('should return the incremented version for the stable build of a alpha version', (): void => {
      assert.equal(incrementVersion('3.2.1-alpha.42', BRANCH_MASTER, GIT_TAG_LIST), '3.2.1');
    });
    it('should return the incremented version for the stable build of a beta version', (): void => {
      assert.equal(incrementVersion('3.2.1-beta.4', BRANCH_MASTER, GIT_TAG_LIST), '3.2.1');
    });
  });

  describe('findNextSuffixNumber()', (): void => {
    it('should work', (): void => {
      assert.equal(findNextSuffixNumber('1.2.1', BRANCH_DEVELOP, GIT_TAG_LIST), 11);
      assert.equal(findNextSuffixNumber('1.3.0', BRANCH_DEVELOP, GIT_TAG_LIST), 1);
      assert.equal(findNextSuffixNumber('2.0.0', BRANCH_DEVELOP, GIT_TAG_LIST), 4);
      assert.equal(findNextSuffixNumber('2.1.0', BRANCH_DEVELOP, GIT_TAG_LIST), 1);

      assert.equal(findNextSuffixNumber('1.2.1', BRANCH_BETA, GIT_TAG_LIST), 1);
      assert.equal(findNextSuffixNumber('2.0.0', BRANCH_BETA, GIT_TAG_LIST), 1);
      assert.equal(findNextSuffixNumber('2.1.0', BRANCH_BETA, GIT_TAG_LIST), 2);
      assert.equal(findNextSuffixNumber('2.2.0', BRANCH_BETA, GIT_TAG_LIST), 1);
    });
  });
});
