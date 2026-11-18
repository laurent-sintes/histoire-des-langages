import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

export const unixPath = (path: string) => path.split(sep).join('/');
export const isTest = (path: string) => /^tools\/.*\.test\.ts$/.test(path);
const sourceTree = /^(app|packages|source|sources|tools)(\/|$)/;

export function isSharedInput(path: string) {
  if (path === 'pnpm-lock.yaml' || path === 'pnpm-workspace.yaml') return true;
  return (!path.includes('/') || sourceTree.test(path)) && /(^|\/)(package\.json|tsconfig(?:\.[^/]+)?\.json)$/.test(path);
}

export function watchedPath(path: string) {
  return (isSharedInput(path) || sourceTree.test(path))
    && !/^app\/(dist|generated)(\/|$)/.test(path)
    && !path.split('/').includes('node_modules') && !path.endsWith('.tmp')
    && !/\.md$/i.test(path);
}

export function normalizeChanges(root: string, paths: string[]) {
  return [...new Set(paths.map(path => unixPath(relative(root, resolve(root, path)))))].filter(watchedPath);
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
