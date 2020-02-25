import * as assert from 'assert';
import { getNpmTag } from './tag';

describe('tag.ts', () => {
  describe('getNpmTag()', () => {
    it('should return the right tags for primary branches', () => {
      assert.strictEqual(getNpmTag('master'), null);
      assert.strictEqual(getNpmTag('beta'), 'beta');
      assert.strictEqual(getNpmTag('develop'), 'alpha');
    });

    it('should return the right tags for secondary branches', () => {
      assert.strictEqual(getNpmTag('feature/add-new-feature'), 'feature~add-new-feature');
      assert.strictEqual(getNpmTag('refs/pull/16/merge'), 'refs~pull~16~merge');
    });
  });
});
