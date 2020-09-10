import * as assert from 'assert';
import { getProductName } from './product_name';

import { inDir } from '../../test/test_functions';

describe('product_name.ts', async () => {
  describe('getProductName()', async () => {
    it('should return the product name for node', async () => {
      await inDir('test/fixtures/node-simple', async () => {
        const productName = await getProductName('node');
        assert.equal(productName, '@process-engine/ci_tools');
      });
    });

    it('should return the product name for dotnet', async () => {
      await inDir('test/fixtures/dotnet-simple', async () => {
        const productName = await getProductName('dotnet');
        assert.equal(productName, 'ProcessEngine.Client');
      });
    });
  });
});
