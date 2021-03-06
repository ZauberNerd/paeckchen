import test from 'ava';
import { stripIndent } from 'common-tags';
import { HostMock, virtualModule, virtualModuleResult, parseAndProcess } from '../helper';

import { reset } from '../../src/modules';
import { rewriteExportNamedDeclaration } from '../../src/plugins/es6-export';

function rewriteExports(input: string, files: any = {}): string {
  const host = new HostMock(files);

  return parseAndProcess(input, ast => {
    return rewriteExportNamedDeclaration(ast, 'name', {
      config: {
        aliases: {}
      } as any,
      host
    });
  });
}

function executeExports(input: string, files: any = {}, settings: any = {},
    requireResults: any[] = []): virtualModuleResult {
  const processed = rewriteExports(input, files);
  return virtualModule(processed, settings, requireResults);
}

test.beforeEach(reset);

test('es6-export plugin should rewrite variable assignment exports correctly', t => {
  const input = stripIndent`
    export const foo = 'bar';
    export const bar = 'foo';
  `;

  const expected = {
    foo: 'bar',
    bar: 'foo'
  };

  const actual = executeExports(input);
  t.deepEqual(actual, expected);
});

test('es6-export plugin should rewrite default exports correctly', t => {
  const input = stripIndent`
    const bar = 'bar';
    export default bar;
  `;

  const expected = {
    default: 'bar'
  };

  const actual = executeExports(input);
  t.deepEqual(actual, expected);
});

test('es6-export plugin should rewrite anonymous function default export correctly', t => {
  const input = stripIndent`
    export default function () {}
  `;

  const actual = executeExports(input);
  t.truthy(typeof actual['default'] === 'function');
});

test('es6-export plugin should rewrite class default export correctly', t => {
  const input = `
    'use strict';
    export default class Foo {}
  `;

  const actual = executeExports(input);
  t.truthy(typeof actual['default'] === 'function');
});

test('es6-export plugin should rewrite named function default export correctly', t => {
  const input = stripIndent`
    export default function foo () {}
  `;

  const actual = executeExports(input);
  t.truthy(typeof actual['default'] === 'function');
});

test('es6-export plugin should rewrite named exports correctly', t => {
  const input = stripIndent`
    const foo = 'foo';
    export {foo as bar};
  `;

  const expected = {
    bar: 'foo'
  };

  const actual = executeExports(input);
  t.deepEqual(actual, expected);
});

test('es6-export plugin should rewrite named reexports correctly', t => {
  const input = stripIndent`
    export {foo as bar} from './dependency';
  `;

  const exported = {
    exports: {
      foo: 'bar',
    }
  };

  const expected = {
    bar: 'bar'
  };

  const actual = executeExports(input, {
    'dependency.js': ''
  }, {}, [exported]);
  t.deepEqual(actual, expected);
});

test('es6-export plugin should rewrite export-all declarations correctly', t => {
  const input = stripIndent`
    export * from './dependency';
  `;

  const expected = {
    exports: {
      foo: 'bar',
      bar: 'foo'
    }
  };

  const actual = executeExports(input,
    {'dependency.js': ''},
    {},
    [expected]
  );

  t.deepEqual(actual, expected.exports);
});

test('es6-export plugin should rewrite exported function declarations correctly', t => {
  const input = stripIndent`
    export function exported() {};
  `;

  const actual = executeExports(input);
  t.truthy(typeof actual['exported'] === 'function');
});
