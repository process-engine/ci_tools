import * as assert from 'assert';
import { parseVersion } from './parse_version';

describe('parse_version.ts', (): void => {
  describe('parseVersion()', (): void => {
    it('should return null for dist-tags', (): void => {
      assert.deepStrictEqual(parseVersion('alpha'), null);
    });

    it('should work as expected for stable versions', (): void => {
      const input = '2.2.0';
      const expected = {
        baseString: '2.2.0',
        releaseChannelName: 'stable'
      };
      assert.deepStrictEqual(parseVersion(input), expected);
    });

    it('should work as expected for alpha versions', (): void => {
      const input = '2.2.0-alpha.5';
      const expected = {
        baseString: '2.2.0',
        releaseChannelName: 'alpha',
        releaseChannelNumber: 5
      };
      assert.deepStrictEqual(parseVersion(input), expected);
    });

    it('should work as expected for beta versions', (): void => {
      const input = '0.2.0-beta.8';
      const expected = {
        baseString: '0.2.0',
        releaseChannelName: 'beta',
        releaseChannelNumber: 8
      };
      assert.deepStrictEqual(parseVersion(input), expected);
    });

    it('should return null as releaseChannel for unknown pre-version suffixes', (): void => {
      const input = '3.2.1-asdf5';
      const expected = null;
      assert.deepStrictEqual(parseVersion(input), expected);
    });
  });
});
