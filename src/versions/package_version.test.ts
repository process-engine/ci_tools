import * as assert from 'assert';
import { getMajorPackageVersion, getPackageVersion, getPackageVersionTag } from './package_version';

describe('package_version.ts', (): void => {
  describe('getPackageVersion()', (): void => {
    it('should return something', (): void => {
      const packageVersion = getPackageVersion();
      const versionRegex = /\d+\.\d+\.\d+/;
      assert.ok(packageVersion.match(versionRegex));
    });
  });

  describe('getMajorPackageVersion()', (): void => {
    it('should return something', (): void => {
      const packageVersion = getMajorPackageVersion();
      const versionRegex = /^\d+$/;
      assert.ok(packageVersion.match(versionRegex));
    });
  });

  describe('getPackageVersionTag()', (): void => {
    it('should return something', (): void => {
      const packageVersionTag = getPackageVersionTag();
      const versionTagRegex = /v\d+\.\d+\.\d+/;
      assert.ok(packageVersionTag.match(versionTagRegex));
    });
  });
});
