import * as assert from 'assert';

import {
  Dependency,
  convertToDependencyArray,
  getDependencyAsString,
} from './dependency';

describe('dependency.ts', () => {
  describe('convertToDependencyArray()', () => {
    it('should return the passed dependency object as an array', () => {
      const dependencyObject = {
        foo: '1.2.3-beta.1',
        bar: 'alpha',
      };
      const expectedDependencyArray: Dependency[] = [
        { name: 'foo', version: '1.2.3-beta.1' },
        { name: 'bar', version: 'alpha' },
      ];

      const actualDependencyArray = convertToDependencyArray(dependencyObject);

      assert.deepStrictEqual(actualDependencyArray, expectedDependencyArray);
    });
  });

  describe('getDependencyAsString()', () => {
    it('should return the dependency in a string representation', () => {
      const dependency: Dependency = { name: 'foo', version: '1.2.3' };
      const expectedDependencyString = 'foo@1.2.3';

      const actualDependencyString = getDependencyAsString(dependency);

      assert.strictEqual(actualDependencyString, expectedDependencyString);
    });
  });
});
