import { existsSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import ts from 'typescript';
import { isSharedInput, normalizeChanges, unixPath } from './paths.ts';

export { changedFiles, isTest, testFiles, watchedPath } from './paths.ts';

const inputs = new Map<string, string[]>([
  ['packages/compiler/build.ts', ['source/connaissances.json']],
  ['tools/test/application.test.ts', ['app/tests.json']],
  ['tools/test/model.test.ts', ['source/tests.json']],
  ['tools/test/metamodel.test.ts', ['packages/metamodel/tests.json']],
  ['tools/test/site.browser.test.ts', [
    'app/', 'app/vite.config.ts', 'packages/contracts/runtime.ts', 'packages/metamodel/version.json', 'source/version.json',
  ]],
]);
const code = /\.[cm]?[jt]sx?$/;
type Dependencies = { imports: string[]; uncertain: string[] };

function readCompilerOptions(root: string) {
  const config = ts.readConfigFile(resolve(root, 'tsconfig.json'), ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  return ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
}

export function createTestSelector(root: string) {
  const dependencies = new Map<string, Dependencies>();
  let options: ts.CompilerOptions | undefined;
  let previousTests: string[] = [];
  let resetBeforeNext = false;

  return (tests: string[], changedPaths: string[], structureChanged = false) => {
    const changed = normalizeChanges(root, changedPaths);
    const shared = changed.filter(isSharedInput);
    const missing = new Set(changed.filter(path => code.test(path) && !existsSync(resolve(root, path))).map(path => resolve(root, path)));
    if (structureChanged || shared.length || missing.size || resetBeforeNext
      || tests.length !== previousTests.length || tests.some((path, index) => path !== previousTests[index])) {
      dependencies.clear();
      options = undefined;
    }
    previousTests = [...tests];
    for (const path of changed) dependencies.delete(path);
    if (!changed.length || shared.length) {
      return { selected: new Map<string, string[]>(shared.length ? tests.map(test => [test, shared]) : []), uncertain: [] };
    }

    options ??= readCompilerOptions(root);
    const compilerOptions = options;
    const host = {
      fileExists: (path: string) => ts.sys.fileExists(path) || missing.has(resolve(path)),
      readFile: ts.sys.readFile,
    };
    const moduleCache = ts.createModuleResolutionCache(root, path => ts.sys.useCaseSensitiveFileNames ? path : path.toLowerCase(), compilerOptions);
    function importsOf(path: string) {
      const cached = dependencies.get(path);
      if (cached) return cached;
      const imports = [...(inputs.get(path) ?? [])];
      const uncertain: string[] = [];
      const source = host.readFile(resolve(root, path));
      if (source) {
        const parsed = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
        function visit(node: ts.Node) {
          if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword
            || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
            && (!node.arguments[0] || !ts.isStringLiteralLike(node.arguments[0]))) {
            uncertain.push(path);
          }
          ts.forEachChild(node, visit);
        }
        visit(parsed);
        for (const imported of ts.preProcessFile(source, true, true).importedFiles) {
          const dependency = ts.resolveModuleName(imported.fileName, resolve(root, path), compilerOptions, host, moduleCache).resolvedModule;
          if (!dependency) {
            if (imported.fileName.startsWith('.')) uncertain.push(`${path} → ${imported.fileName}`);
            continue;
          }
          const local = relative(root, dependency.resolvedFileName);
          if (!isAbsolute(local) && !local.startsWith('..') && !local.split(sep).includes('node_modules')) {
            imports.push(unixPath(local));
          }
        }
      }
      const edges = { imports, uncertain };
      dependencies.set(path, edges);
      return edges;
    }

    const selected = new Map<string, string[]>();
    const uncertain = new Set<string>();
    for (const test of tests) {
      const visited = new Set<string>([test]);
      const queue = [test];
      for (const path of queue) {
        if (!code.test(path)) continue;
        const edges = importsOf(path);
        for (const unresolved of edges.uncertain) uncertain.add(unresolved);
        for (const input of edges.imports) {
          if (visited.has(input)) continue;
          visited.add(input);
          queue.push(input);
        }
      }
      const directoryInputs = [...visited].filter(input => input.endsWith('/'));
      const reasons = changed.filter(path => visited.has(path) || directoryInputs.some(input => path.startsWith(input)));
      if (reasons.length) selected.set(test, reasons);
    }
    resetBeforeNext = missing.size > 0 || uncertain.size > 0;
    return { selected, uncertain: [...uncertain].sort() };
  };
}

export function selectTests(root: string, tests: string[], changedPaths: string[]) {
  return createTestSelector(root)(tests, changedPaths);
}
