import * as assert from 'assert';
import { getMajorPackageVersion, getPackageVersion, getPackageVersionTag } from './package_version';

import { inDir } from '../../test/test_functions';

describe('package_version.ts', async () => {
  describe('getPackageVersion()', async () => {
    it('should return the version for node', async () => {
      await inDir('test/fixtures/node-simple', async () => {
        const packageVersion = await getPackageVersion('node');
        assert.equal(packageVersion, '1.2.3');
      });
    });

    it('should return the version for dotnet', async () => {
      await inDir('test/fixtures/dotnet-simple', async () => {
        const packageVersion = await getPackageVersion('dotnet');
        assert.equal(packageVersion, '3.2.1');
      });
    });
  });

  describe('getMajorPackageVersion()', async () => {
    it('should return the version for node', async () => {
      await inDir('test/fixtures/node-simple', async () => {
        const packageVersion = await getMajorPackageVersion('node');
        assert.equal(packageVersion, '1');
      });
    });

    it('should return the version for dotnet', async () => {
      await inDir('test/fixtures/dotnet-simple', async () => {
        const packageVersion = await getMajorPackageVersion('dotnet');
        assert.equal(packageVersion, '3');
      });
    });
  });

  describe('getPackageVersionTag()', async () => {
    it('should return the version for node', async () => {
      await inDir('test/fixtures/node-simple', async () => {
        const packageVersionTag = await getPackageVersionTag('node');
        assert.equal(packageVersionTag, 'v1.2.3');
      });
    });

    it('should return the version for dotnet', async () => {
      await inDir('test/fixtures/dotnet-simple', async () => {
        const packageVersionTag = await getPackageVersionTag('dotnet');
        assert.equal(packageVersionTag, 'v3.2.1');
      });
    });
  });
});
