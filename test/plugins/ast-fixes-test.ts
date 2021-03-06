import test from 'ava';
import { runInNewContext } from 'vm';
import { stripIndent } from 'common-tags';
import { HostMock, parseAndProcess } from '../helper';

import { reset } from '../../src/modules';
import { astFixes } from '../../src/plugins/ast-fixes';

function fixComments(input: string, files: any = {}): string {
  const host = new HostMock(files);

  return parseAndProcess(input, ast => {
    return astFixes(ast, 'name', { config: {} as any, host });
  });
}

function executeFixComments(input: string, files: any = {}, settings: any = {}): any {
  const processed = fixComments(input, files);
  const result = {};
  runInNewContext(processed, result);
  return result;
}

test.beforeEach(reset);

test('test', t => {
  const input = stripIndent`
    function a() {
      return /** **/ function b() {
        return 'a';
      }
    }
  `;

  const expected = 'a';

  const scope = executeFixComments(input);
  t.is(typeof scope.a, 'function');
  t.is(typeof scope.a(), 'function');
  t.is(scope.a()(), expected);
});
