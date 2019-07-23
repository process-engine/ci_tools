import * as assert from 'assert';
import { getNpmTag } from './tag';

describe('tag.ts', (): void => {
  describe('getNpmTag()', (): void => {
    it('should return the right tags for primary branches', (): void => {
      assert.strictEqual(getNpmTag('master'), null);
      assert.strictEqual(getNpmTag('beta'), 'beta');
      assert.strictEqual(getNpmTag('develop'), 'alpha');
    });

    it('should return the right tags for secondary branches', (): void => {
      assert.strictEqual(getNpmTag('feature/add-new-feature'), 'feature~add-new-feature');
      assert.strictEqual(getNpmTag('refs/pull/16/merge'), 'refs~pull~16~merge');
    });
  });
});
