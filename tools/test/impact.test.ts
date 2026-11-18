import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import type { TestContext } from 'node:test';
import { selectTests } from './impact.ts';

function fixture(context: TestContext, files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'language-test-impact-'));
  context.after(() => rmSync(root, { recursive: true }));
  for (const [path, text] of Object.entries({
    'tsconfig.json': '{"compilerOptions":{"module":"NodeNext","moduleResolution":"NodeNext"}}',
    ...files,
  })) {
    const destination = join(root, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, text);
  }
  return root;
}

test('les sauvegardes indépendantes sélectionnent les seules dépendances directes ou transitives', context => {
  const root = fixture(context, {
    'tools/one.test.ts': "import './intermediate.ts';",
    'tools/intermediate.ts': "import '../packages/leaf.ts';",
    'packages/leaf.ts': 'export {};',
    'tools/two.test.ts': "import './second.ts';",
    'tools/second.ts': 'export {};',
  });
  const tests = ['tools/one.test.ts', 'tools/two.test.ts'];
  assert.deepEqual([...selectTests(root, tests, ['packages/leaf.ts']).selected], [
    ['tools/one.test.ts', ['packages/leaf.ts']],
  ]);
  assert.deepEqual([...selectTests(root, tests, ['tools/second.ts']).selected.keys()], ['tools/two.test.ts']);
  assert.equal(selectTests(root, tests, ['README.md', 'app/dist/x.js']).selected.size, 0);
});

test('la sélection gère les entrées hors imports, la suppression et les imports dynamiques inconnus', context => {
  const root = fixture(context, {
    'tools/corpus.test.ts': "import '../packages/compiler/build.ts';",
    'packages/compiler/build.ts': 'export {};',
    'tools/renamed.test.ts': "import './former.ts';",
    'tools/dynamic.test.ts': 'void import(process.env.TEST_FILE!);',
  });
  const tests = ['tools/corpus.test.ts', 'tools/renamed.test.ts', 'tools/dynamic.test.ts'];
  const result = selectTests(root, tests, ['source/connaissances.json', 'tools/former.ts', 'tools/replacement.ts']);
  assert.deepEqual([...result.selected], [
    ['tools/corpus.test.ts', ['source/connaissances.json']], ['tools/renamed.test.ts', ['tools/former.ts']],
  ]);
  assert.deepEqual(result.uncertain, ['tools/dynamic.test.ts']);
});
