/**
 * Changes the current working directory (cwd) to the given `directory` and executes the given `callback`.
 * Resets the cwd afterwards.
 *
 * Example:
 *
 *    inDir('test/fixtures/node-simple', () => {
 *      const packageVersion = getPackageVersion('dotnet');
 *      assert.equal(packageVersion, '1.2.3');
 *    });
 */
export function inDir(directory: string, callback: Function): void {
  const oldDir = process.cwd();
  try {
    process.chdir(directory);
    callback.apply(null);
  } catch (err) {
    console.error(`chdir: ${err}`);
  } finally {
    process.chdir(oldDir);
  }
}
