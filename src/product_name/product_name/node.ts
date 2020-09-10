import * as fs from 'fs';

/**
 * Internal: Used by product_name.ts
 */
export function getProductNameNode(): string {
  const content = fs.readFileSync('package.json');
  if (!content) {
    throw new Error(`Could not read file: package.json`);
  }

  const packageJson = JSON.parse(content.toString());

  const productName = packageJson.name;

  if (productName) {
    return productName;
  }

  throw new Error(`Could not read productName from package.json: package.json\n\n${JSON.stringify(packageJson, null, 2)} Please ensure name is set.`);
}
