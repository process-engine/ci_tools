import { inDirSync, run, setupGitWorkingCopyForTest, shell } from '../test_functions';
import { assertDotnetPackageVersion, assertNewTagCreated, assertNoNewTagsCreated } from '../assert_functions';
import { readFileSync, writeFileSync } from 'fs';

const CSPROJ_FILENAME = 'ProcessEngine.Client.csproj';

function setDotnetPackageVersionAndCommit(filename: string, version: string): void {
  const contents = readFileSync(filename, { encoding: 'utf-8' });
  const newContents = contents.replace(/(<Version>)([^<]+)(<\/Version>)/i, `$1${version}$3`);
  writeFileSync(filename, newContents);

  assertDotnetPackageVersion(filename, version);
  shell(`git add ${filename}`);
  shell(`git commit --message "Bump version to ${version}"`);
}

describe('prepare-version / commit-and-tag-version', () => {
  it('should work with mode: dotnet', async () => {
    const gitTempWorkingCopy = setupGitWorkingCopyForTest();
    inDirSync(gitTempWorkingCopy, () => {
      shell('git config user.email "process-engine-ci@5minds.de"');
      shell('git config user.name "Integration Testbot"');

      // alpha

      shell('git checkout develop');
      setDotnetPackageVersionAndCommit(CSPROJ_FILENAME, '1.2.1-dev');

      assertNoNewTagsCreated(() => {
        run('prepare-version --mode dotnet');
        assertDotnetPackageVersion(CSPROJ_FILENAME, '1.2.1-alpha.11');
      });

      assertNewTagCreated('v1.2.1-alpha.11', () => {
        run('commit-and-tag-version --mode dotnet');
      });

      // beta

      shell('git checkout beta');
      setDotnetPackageVersionAndCommit(CSPROJ_FILENAME, '1.2.1-dev');

      assertNoNewTagsCreated(() => {
        run('prepare-version --mode dotnet');
        assertDotnetPackageVersion(CSPROJ_FILENAME, '1.2.1-beta.1');
      });

      assertNewTagCreated('v1.2.1-beta.1', () => {
        run('commit-and-tag-version --mode dotnet');
      });

      // stable

      shell('git checkout master');
      setDotnetPackageVersionAndCommit(CSPROJ_FILENAME, '1.2.1-dev');

      assertNoNewTagsCreated(() => {
        run('prepare-version --mode dotnet');
        assertDotnetPackageVersion(CSPROJ_FILENAME, '1.2.1');
      });

      assertNewTagCreated('v1.2.1', () => {
        run('commit-and-tag-version --mode dotnet');
      });
    });
  });

  it('should change nothing during --dry with mode: dotnet', async () => {
    const gitTempWorkingCopy = setupGitWorkingCopyForTest();
    inDirSync(gitTempWorkingCopy, () => {
      shell('git config user.email "process-engine-ci@5minds.de"');
      shell('git config user.name "Integration Testbot"');

      // alpha

      shell('git checkout develop');
      setDotnetPackageVersionAndCommit(CSPROJ_FILENAME, '1.2.1-dev');

      assertNoNewTagsCreated(() => {
        run('prepare-version --mode dotnet --dry');
        assertDotnetPackageVersion(CSPROJ_FILENAME, '1.2.1-dev');
        run('commit-and-tag-version --mode dotnet --dry');
        assertDotnetPackageVersion(CSPROJ_FILENAME, '1.2.1-dev');
      });
    });
  });
});
