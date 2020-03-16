import { inDirSync, run, setupGitWorkingCopyForTest, shell } from '../test_functions';
import { assertNewTagCreated, assertNoNewTagsCreated, assertNodePackageVersion } from '../assert_functions';

function setNodePackageVersion(version: string): void {
  shell(`npm version ${version} --no-git-tag-version`);
  assertNodePackageVersion(version);
}

describe('ci_tools', () => {
  it('should work with mode: node', async () => {
    const gitTempWorkingCopy = setupGitWorkingCopyForTest();
    inDirSync(gitTempWorkingCopy, () => {
      // alpha

      shell('git checkout develop');
      setNodePackageVersion('1.2.1-dev');

      assertNoNewTagsCreated(() => {
        run('prepare-version --force');
        assertNodePackageVersion('1.2.1-alpha.11');
      });

      assertNewTagCreated('v1.2.1-alpha.11', () => {
        run('commit-and-tag-version --force');
      });

      // beta

      shell('git checkout beta');
      setNodePackageVersion('1.2.1-dev');

      assertNoNewTagsCreated(() => {
        run('prepare-version --force');
        assertNodePackageVersion('1.2.1-beta.1');
      });

      assertNewTagCreated('v1.2.1-beta.1', () => {
        run('commit-and-tag-version --force');
      });

      // stable

      shell('git checkout master');
      setNodePackageVersion('1.2.1-dev');

      assertNoNewTagsCreated(() => {
        run('prepare-version --force');
        assertNodePackageVersion('1.2.1');
      });

      assertNewTagCreated('v1.2.1', () => {
        run('commit-and-tag-version --force');
      });
    });
  });
});
