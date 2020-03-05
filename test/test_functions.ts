/**
 * Changes the current working directory (cwd) to the given `directory` and executes the given `callback`.
 * Resets the cwd afterwards.
 *
 * Example:
 *
 *    await inDir('test/fixtures/node-simple', async () => {
 *      const packageVersion = await getPackageVersion('dotnet');
 *      assert.equal(packageVersion, '1.2.3');
 *    });
 */
export async function inDir(directory: string, callback: () => Promise<void>): Promise<void> {
  const oldDir = process.cwd();
  try {
    process.chdir(directory);
    await callback.apply(null);
  } catch (err) {
    console.error(`chdir: ${err}`);
  } finally {
    process.chdir(oldDir);
  }
}
