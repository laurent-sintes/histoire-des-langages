import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import ts from 'typescript';

const sharedInputs = new Set(['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.json']);
const inputs = new Map<string, string[]>([
  ['packages/compiler/build.ts', ['source/connaissances.json']],
  ['tools/test/application.test.ts', ['app/tests.json']],
  ['tools/test/model.test.ts', ['source/tests.json']],
  ['tools/test/metamodel.test.ts', ['packages/metamodel/tests.json']],
  ['tools/test/site.browser.test.ts', [
    'app/', 'app/vite.config.ts', 'packages/contracts/runtime.ts', 'packages/metamodel/version.json', 'source/version.json',
  ]],
]);

const unixPath = (path: string) => path.split(sep).join('/');
const code = /\.[cm]?[jt]sx?$/;
export const isTest = (path: string) => /^tools\/.*\.test\.ts$/.test(path);
export function watchedPath(path: string) {
  return (sharedInputs.has(path) || /^(app|packages|source|sources|tools)\//.test(path))
    && !/^app\/(dist|generated)\//.test(path)
    && !path.split('/').includes('node_modules') && !path.endsWith('.tmp')
    && !/\.md$/i.test(path);
}

function git(root: string, ...args: string[]) {
  return execFileSync('git', ['-c', 'core.safecrlf=false', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}

const nul = (value: string) => value.split('\0').filter(Boolean);

export function testFiles(root: string) {
  return [...new Set(nul(git(root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', 'tools')))]
    .filter(path => isTest(path) && existsSync(resolve(root, path))).sort();
}

export function changedFiles(root: string, since: string) {
  const base = git(root, 'rev-parse', '--verify', '--end-of-options', `${since}^{commit}`).trim();
  const options = ['--no-renames', '--name-only', '-z'];
  return [...new Set([
    ...nul(git(root, 'diff', ...options, base, 'HEAD', '--')),
    ...nul(git(root, 'diff', ...options, '--cached', 'HEAD', '--')),
    ...nul(git(root, 'diff', ...options, '--')),
    ...nul(git(root, 'ls-files', '-z', '--others', '--exclude-standard')),
  ])].sort();
}

export function selectTests(root: string, tests: string[], changedPaths: string[]) {
  const changed = [...new Set(changedPaths.map(path => unixPath(relative(root, resolve(root, path)))))].filter(watchedPath);
  const shared = changed.filter(path => sharedInputs.has(path));
  if (!changed.length || shared.length) {
    return { selected: new Map(shared.length ? tests.map(test => [test, shared]) : []), uncertain: [] };
  }
  const configFile = ts.readConfigFile(resolve(root, 'tsconfig.json'), ts.sys.readFile);
  if (configFile.error) throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
  const { options } = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
  const missing = new Set(changed.filter(path => code.test(path) && !existsSync(resolve(root, path))).map(path => resolve(root, path)));
  const host = {
    fileExists: (path: string) => ts.sys.fileExists(path) || missing.has(resolve(path)),
    readFile: ts.sys.readFile,
  };
  const moduleCache = ts.createModuleResolutionCache(root, path => ts.sys.useCaseSensitiveFileNames ? path : path.toLowerCase(), options);
  const dependencies = new Map<string, string[]>();
  const uncertain = new Set<string>();
  function importsOf(path: string) {
    const cached = dependencies.get(path);
    if (cached) return cached;
    const imports = [...(inputs.get(path) ?? [])];
    const source = host.readFile(resolve(root, path));
    if (source) {
      const parsed = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
      function visit(node: ts.Node) {
        if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword
          || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
          && (!node.arguments[0] || !ts.isStringLiteralLike(node.arguments[0]))) {
          uncertain.add(path);
        }
        ts.forEachChild(node, visit);
      }
      visit(parsed);
      for (const imported of ts.preProcessFile(source, true, true).importedFiles) {
        const resolved = ts.resolveModuleName(imported.fileName, resolve(root, path), options, host, moduleCache).resolvedModule;
        if (!resolved) {
          if (imported.fileName.startsWith('.')) uncertain.add(`${path} → ${imported.fileName}`);
          continue;
        }
        const local = relative(root, resolved.resolvedFileName);
        if (!isAbsolute(local) && !local.startsWith('..') && !local.split(sep).includes('node_modules')) {
          imports.push(unixPath(local));
        }
      }
    }
    dependencies.set(path, imports);
    return imports;
  }
  const selected = new Map<string, string[]>();
  for (const test of tests) {
    const visited = new Set<string>([test]);
    const queue = [test];
    for (const path of queue) {
      if (!code.test(path)) continue;
      for (const input of importsOf(path)) {
        if (visited.has(input)) continue;
        visited.add(input);
        queue.push(input);
      }
    }
    const directoryInputs = [...visited].filter(input => input.endsWith('/'));
    const reasons = changed.filter(path => visited.has(path) || directoryInputs.some(input => path.startsWith(input)));
    if (reasons.length) selected.set(test, reasons);
  }
  return { selected, uncertain: [...uncertain].sort() };
}
