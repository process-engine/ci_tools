import { getProductNameDotnet } from './product_name/dotnet';
import { getProductNameNode } from './product_name/node';
import { PACKAGE_MODE_DOTNET, PACKAGE_MODE_NODE, PACKAGE_MODE_PYTHON } from '../contracts/modes';
import { getProductNamePython } from './product_name/python';

export async function getProductName(mode: string): Promise<string> {
  switch (mode) {
    case PACKAGE_MODE_DOTNET:
      return getProductNameDotnet();
    case PACKAGE_MODE_NODE:
      return getProductNameNode();
    case PACKAGE_MODE_PYTHON:
      return getProductNamePython();
    default:
      throw new Error(`Unknown value for \`mode\`: ${mode}`);
  }
}
