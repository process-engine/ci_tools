import * as assert from 'assert';
import { getMajorPackageVersion, getPackageVersion, getPackageVersionTag } from './package_version';

import { inDir } from '../../test/test_functions';

describe('package_version.ts', () => {
  describe('getPackageVersion()', () => {
    it('should return the version for node', () => {
      inDir('test/fixtures/node-simple', () => {
        const packageVersion = getPackageVersion('node');
        assert.equal(packageVersion, '1.2.3');
      });
    });

    it('should return the version for dotnet', () => {
      inDir('test/fixtures/dotnet-simple', () => {
        const packageVersion = getPackageVersion('dotnet');
        assert.equal(packageVersion, '3.2.1');
      });
    });
  });

  describe('getMajorPackageVersion()', () => {
    it('should return the version for node', () => {
      inDir('test/fixtures/node-simple', () => {
        const packageVersion = getMajorPackageVersion('node');
        assert.equal(packageVersion, '1');
      });
    });

    it('should return the version for dotnet', () => {
      inDir('test/fixtures/dotnet-simple', () => {
        const packageVersion = getMajorPackageVersion('dotnet');
        assert.equal(packageVersion, '3');
      });
    });
  });

  describe('getPackageVersionTag()', () => {
    it('should return the version for node', () => {
      inDir('test/fixtures/node-simple', () => {
        const packageVersionTag = getPackageVersionTag('node');
        assert.equal(packageVersionTag, 'v1.2.3');
      });
    });

    it('should return the version for dotnet', () => {
      inDir('test/fixtures/dotnet-simple', () => {
        const packageVersionTag = getPackageVersionTag('dotnet');
        assert.equal(packageVersionTag, 'v3.2.1');
      });
    });
  });
});
