import { inDirSync, run, setupGitWorkingCopyForTest, shell } from '../test_functions';
import { assertNewTagCreated, assertNoNewTagsCreated, assertNodePackageVersion } from '../assert_functions';

function setNodePackageVersionAndCommit(version: string): void {
  shell(`npm version ${version} --no-git-tag-version`);
  assertNodePackageVersion(version);
  shell('git add package.json');
  shell(`git commit --message "Bump version to ${version}"`);
}

describe('prepare-version / commit-and-tag-version', () => {
  it('should work with mode: node', async () => {
    const gitTempWorkingCopy = setupGitWorkingCopyForTest();
    inDirSync(gitTempWorkingCopy, () => {
      shell('git config user.email "process-engine-ci@5minds.de"');
      shell('git config user.name "Integration Testbot"');

      // alpha

      shell('git checkout develop');
      setNodePackageVersionAndCommit('1.2.1-dev');

      assertNoNewTagsCreated(() => {
        run('prepare-version');
        assertNodePackageVersion('1.2.1-alpha.11');
      });

      assertNewTagCreated('v1.2.1-alpha.11', () => {
        run('commit-and-tag-version');
      });

      // beta

      shell('git checkout beta');
      setNodePackageVersionAndCommit('1.2.1-dev');

      assertNoNewTagsCreated(() => {
        run('prepare-version');
        assertNodePackageVersion('1.2.1-beta.1');
      });

      assertNewTagCreated('v1.2.1-beta.1', () => {
        run('commit-and-tag-version');
      });

      // stable

      shell('git checkout master');
      setNodePackageVersionAndCommit('1.2.1-dev');

      assertNoNewTagsCreated(() => {
        run('prepare-version');
        assertNodePackageVersion('1.2.1');
      });

      assertNewTagCreated('v1.2.1', () => {
        run('commit-and-tag-version');
      });
    });
  });
});
