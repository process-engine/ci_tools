import { StdioOptions, execSync } from 'child_process';

/**
 * Internal: Used by product_name.ts
 */
export function getProductNamePython(): string {
  const stdioOptions: StdioOptions = ['pipe', 'pipe', 'inherit'];

  const nameRaw = execSync('python3 setup.py --name', { encoding: 'utf-8', stdio: stdioOptions });
  const name = nameRaw.trim();

  return name;
}
