import * as assert from 'assert';
import { getVersionToUpgradeTo } from './upgrade-dependencies-with-pre-versions';

const VERSION_LIST = [
  '1.2.1-alpha.7',
  '1.2.1-alpha.8',
  '1.2.1-alpha.9',
  '2.0.0-alpha.1',
  '2.0.0-alpha.2',
  '2.0.0-alpha.3',
  '2.0.0-beta.1',
  '2.0.0-beta.2',
  '2.0.0',
  '2.1.0-beta.1'
];

describe('upgrade-dependencies-with-pre-versions.ts', (): void => {
  describe('getVersionToUpgradeTo()', (): void => {
    it('should work as expected for beta requirements', (): void => {
      assert.deepStrictEqual(getVersionToUpgradeTo('1.2.1-beta.1', VERSION_LIST), null);
      assert.deepStrictEqual(getVersionToUpgradeTo('2.0.0-beta.1', VERSION_LIST), '2.0.0');
      assert.deepStrictEqual(getVersionToUpgradeTo('2.0.0-beta.2', VERSION_LIST), '2.0.0');
    });

    it('should work as expected for stable requirements', (): void => {
      assert.deepStrictEqual(getVersionToUpgradeTo('1.2.1', VERSION_LIST), null);
      assert.deepStrictEqual(getVersionToUpgradeTo('2.0.0', VERSION_LIST), null);
      assert.deepStrictEqual(getVersionToUpgradeTo('2.1.0', VERSION_LIST), null);
    });

    it('should work as expected for alpha requirements', (): void => {
      assert.deepStrictEqual(getVersionToUpgradeTo('1.2.1-alpha.9', VERSION_LIST), null);
      assert.deepStrictEqual(getVersionToUpgradeTo('1.2.1-alpha.8', VERSION_LIST), '1.2.1-alpha.9');
    });
  });
});
