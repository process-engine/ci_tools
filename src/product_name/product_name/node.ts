import * as fs from 'fs';

/**
 * Internal: Used by product_name.ts
 */
export function getProductNameNode(): string {
  const content = fs.readFileSync('package.json').toString();
  const packageJson = JSON.parse(content);

  return packageJson.name;
}
