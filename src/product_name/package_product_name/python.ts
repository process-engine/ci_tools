import * as fs from 'fs';
import * as glob from 'glob';

const CSPROJ_FILE_NAME='setup.py'
const NAME_REGEX = /name='(.*)'/;

/**
 * Internal: Used by product_name.ts
 */
export async function getProductNamePython(): Promise<string> {
  const filename = getSetupFilePath();
  const setupFileContent = fs.readFileSync(filename, { encoding: 'utf8' });
  if (!setupFileContent) {
    throw new Error(`Could not read setup file: ${filename}`);
  }

  const regexResult: RegExpExecArray = NAME_REGEX.exec(setupFileContent);

  if (regexResult && regexResult.length > 0) {
    const name: string = regexResult[1];

    return name;
  }

  throw new Error(`Unable to parse name from setup file: ${setupFileContent}. Please ensure name is set.`)
}

function getSetupFilePath(): string {
  const paths = glob.sync(CSPROJ_FILE_NAME);

  if (paths.length > 1) {
    throw new Error(`More than one setup.py file found: ${paths.join('\n')}`);
  }

  return paths[0];
}
