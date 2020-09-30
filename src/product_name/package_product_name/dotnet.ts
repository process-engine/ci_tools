import * as fs from 'fs';
import * as glob from 'glob';
import { parseStringPromise } from 'xml2js';

const CSPROJ_FILE_GLOB = '*.csproj';

/**
 * Internal: Used by product_name.ts
 */
export async function getProductNameDotnet(): Promise<string> {
  const filename = getCsprojPath();
  const json = await getCsprojAsObject(filename);
  if (json == null) {
    throw new Error(`Could not convert csproj to JSON: ${filename}`);
  }
  const propertyGroup = json?.Project?.PropertyGroup;
  const productName = Array.isArray(propertyGroup) ? propertyGroup[0]?.Product[0] : null;
  if (productName != null) {
    return productName;
  }

  const assemblyName = Array.isArray(propertyGroup) ? propertyGroup[0]?.AssemblyName[0] : null;
  if (assemblyName != null) {
    return assemblyName;
  }

  throw new Error(`Could not read productName from converted JSON: ${filename}\n\n${JSON.stringify(json, null, 2)} Please ensure either Product or AssemblyName is set.`);
}

function getCsprojAsObject(filePath: string): Promise<any> {
  const contents = fs.readFileSync(filePath, { encoding: 'utf8' });

  return parseStringPromise(contents.toString());
}

function getCsprojPath(): string {
  const paths = glob.sync(CSPROJ_FILE_GLOB);

  if (paths.length > 1) {
    throw new Error(`More than one .csproj file found: ${paths.join('\n')}`);
  }

  return paths[0];
}
