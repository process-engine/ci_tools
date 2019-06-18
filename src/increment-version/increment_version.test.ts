import * as assert from 'assert';
import { findNextSuffixNumber, incrementVersion } from './increment_version';

const BRANCH_DEVELOP = 'develop';
const BRANCH_BETA = 'beta';
const BRANCH_MASTER = 'master';

const GIT_TAG_LIST = `v1.2.1-alpha10
v1.2.1-alpha7
v1.2.1-alpha8
v1.2.1-alpha9
v2.0.0-alpha1
v2.0.0-alpha2
v2.0.0-alpha3
v2.1.0-beta1`;

describe('incrementVersion()', () => {
  it('should return the incremented version for the first alpha build of a new version', () => {
    assert.equal(incrementVersion('3.2.1', BRANCH_DEVELOP, GIT_TAG_LIST), '3.2.1-alpha1');
  });
  it('should return the incremented version for unknown pre-version suffixes', () => {
    assert.equal(incrementVersion('3.2.1-asdf5', BRANCH_DEVELOP, GIT_TAG_LIST), '3.2.1-alpha1');
  });
  it('should return the incremented version for subsequent alpha versions', () => {
    assert.equal(incrementVersion('1.2.1-alpha7', BRANCH_DEVELOP, GIT_TAG_LIST), '1.2.1-alpha11');
  });

  it('should return the incremented version for the first beta build of a alpha version', () => {
    assert.equal(incrementVersion('3.2.1-alpha3', BRANCH_BETA, GIT_TAG_LIST), '3.2.1-beta1');
  });
  it('should return the incremented version for subsequent beta versions', () => {
    // v3.2.1-beta3 not in tag list, falling back to numbering found there
    assert.equal(incrementVersion('2.1.0-beta3', BRANCH_BETA, GIT_TAG_LIST), '2.1.0-beta2');
  });
  it('should return the incremented version for the stable build of a alpha version', () => {
    assert.equal(incrementVersion('3.2.1-alpha42', BRANCH_MASTER, GIT_TAG_LIST), '3.2.1');
  });
  it('should return the incremented version for the stable build of a beta version', () => {
    assert.equal(incrementVersion('3.2.1-beta4', BRANCH_MASTER, GIT_TAG_LIST), '3.2.1');
  });
});

describe('findNextSuffixNumber()', () => {
  it('should work', () => {
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
