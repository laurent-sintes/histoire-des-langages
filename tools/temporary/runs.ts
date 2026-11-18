import { randomUUID } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const day = 24 * 60 * 60 * 1000;
const retention = { success: 14 * day, failure: 30 * day };
const sizeLimit = 500 * 1024 * 1024;
const runId = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const markerName = 'finished.json';
type Result = keyof typeof retention;
type Marker = { result: Result; finishedAt: number };

function stat(path: string) {
  return lstatSync(path, { throwIfNoEntry: false });
}

function directory(path: string, create = false) {
  const entry = stat(path);
  if (!entry && create) {
    mkdirSync(path, { recursive: true });
    return directory(path);
  }
  if (entry && (!entry.isDirectory() || entry.isSymbolicLink())) {
    throw new Error(`Répertoire temporaire invalide : ${path}`);
  }
  return entry !== undefined;
}

function runsRoot(project: string, create = false) {
  const temporary = join(project, 'tmp');
  if (!directory(temporary, create)) return undefined;
  const runs = join(temporary, 'runs');
  return directory(runs, create) ? runs : undefined;
}

export function startRun(project: string) {
  const path = join(runsRoot(project, true)!, randomUUID());
  mkdirSync(path);
  return path;
}

export function finishRun(run: string, result: Result, finishedAt = Date.now()) {
  const temporary = join(run, 'finished.tmp');
  writeFileSync(temporary, JSON.stringify({ result, finishedAt } satisfies Marker), { flag: 'wx' });
  renameSync(temporary, join(run, markerName));
}

function readMarker(path: string): Marker | undefined {
  const entry = stat(path);
  if (!entry?.isFile() || entry.isSymbolicLink() || entry.size > 1024) return undefined;
  try {
    const marker: Marker | null = JSON.parse(readFileSync(path, 'utf8'));
    if (marker && (marker.result === 'success' || marker.result === 'failure') && Number.isSafeInteger(marker.finishedAt)
      && marker.finishedAt > 0) return marker;
  } catch (error) {
    if (!(error instanceof SyntaxError) && (error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  return undefined;
}

function directoryBytes(root: string): number | undefined {
  let total = 0;
  const pending = [root];
  for (const path of pending) {
    for (const name of readdirSync(path)) {
      const child = join(path, name);
      const entry = stat(child);
      if (!entry || entry.isSymbolicLink()) return undefined;
      if (entry.isDirectory()) pending.push(child);
      else if (entry.isFile()) total += entry.size;
      else return undefined;
    }
  }
  return total;
}

export function rotateRuns(project: string, { apply = false, now = Date.now(), limit = sizeLimit } = {}) {
  const root = runsRoot(project);
  if (!root) return [];
  const eligible = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink() || !runId.test(entry.name)) continue;
    const path = join(root, entry.name);
    const marker = readMarker(join(path, markerName));
    if (!marker || marker.finishedAt > now) continue;
    try {
      const size = directoryBytes(path);
      if (size !== undefined) eligible.push({ path, size, ...marker });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  eligible.sort((first, second) => first.finishedAt - second.finishedAt || first.path.localeCompare(second.path));
  const expired = eligible.filter(entry => now - entry.finishedAt >= retention[entry.result]);
  const retained = eligible.filter(entry => now - entry.finishedAt < retention[entry.result]);
  let keptBytes = retained.reduce((total, entry) => total + entry.size, 0);
  const selected = expired.map(entry => ({ ...entry, reason: 'age' }));
  for (const entry of retained) {
    if (keptBytes <= limit) break;
    keptBytes -= entry.size;
    selected.push({ ...entry, reason: 'size' });
  }
  if (apply) for (const entry of selected) {
    const current = stat(entry.path);
    if (current?.isDirectory() && !current.isSymbolicLink()) rmSync(entry.path, { recursive: true, force: true });
  }
  return selected;
}
