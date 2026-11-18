import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { affectedComponents, components, parseBumps, parseComponentVersion, planVersions, testFiles, versionFiles } from './versions.ts';
import type { Versions } from './versions.ts';
import { parseTestSuite, testImpact } from './test-impact.ts';
import type { TestSuites } from './test-impact.ts';

const repository = 'laurent-sintes/histoire-des-langages';
const branch = 'main';

function run(program: string, args: string[], capture = false) {
  const result = spawnSync(program, args, { encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Échec de ${program} ${args[0]} (${result.status ?? result.signal}).`);
  return result.stdout?.trim() ?? '';
}
const git = (...args: string[]) => run('git', args, true);
const lines = (value: string) => value.split('\n').filter(Boolean);
const staged = (...filters: string[]) => lines(git('diff', '--cached', '--name-only', ...filters));
const activeBranch = () => git('branch', '--show-current');

function requireMain() {
  if (activeBranch() !== branch) throw new Error(`Cette opération attend la branche ${branch}.`);
}

function assertOrigin() {
  const remotes = lines(git('remote', 'get-url', '--push', '--all', 'origin'));
  const fetchUrls = lines(git('remote', 'get-url', '--all', 'origin'));
  const allowed = new Set([`https://github.com/${repository}`, `https://github.com/${repository}.git`,
    `git@github.com:${repository}.git`, `ssh://git@github.com/${repository}.git`]);
  if (remotes.length !== 1 || fetchUrls.length !== 1 || ![remotes[0], fetchUrls[0]].every(url => allowed.has(url))) {
    throw new Error(`Le dépôt origin doit être uniquement github.com/${repository}.`);
  }
  return remotes[0];
}

function plan() {
  console.log(git('status', '--short', '--branch'));
  const summary = git('diff', '--cached', '--stat');
  if (summary) console.log(summary);
}

function commit(messageFile: string | undefined, paths: string[]) {
  requireMain();
  if (!messageFile || !paths.length || paths.some(path => !path || path.startsWith('-') || path.startsWith(':'))) {
    throw new Error('Usage : pnpm git:work commit fichier-message chemin [chemin…]');
  }
  if (!readFileSync(messageFile, 'utf8').trim()) throw new Error('Message de commit vide.');
  const selected = new Set(staged('--', ...paths));
  const outside = staged().filter(path => !selected.has(path));
  if (outside.length) throw new Error(`Fichiers déjà indexés hors du périmètre : ${outside.join(', ')}`);
  run('git', ['add', '--', ...paths]);
  run('git', ['diff', '--cached', '--check']);
  if (!staged().length) throw new Error('Aucun changement à committer dans ce périmètre.');
  run('git', ['commit', '--file', messageFile]);
  console.log(git('log', '-1', '--format=%H %s'));
}

function fileAt(ref: string, path: string) {
  if (!git('ls-tree', '--full-tree', ref, '--', path)) return undefined;
  return git('show', `${ref}:${path}`);
}

function versionsAt(ref: string) {
  const values = components.map(key => fileAt(ref, versionFiles[key]));
  if (values.every(value => value === undefined)) return undefined;
  return Object.fromEntries(components.map((key, index) => {
    const value = values[index];
    if (value === undefined) throw new Error(`Version manquante dans ${versionFiles[key]}.`);
    return [key, parseComponentVersion(value)];
  })) as Versions;
}

function suitesAt(ref: string) {
  return Object.fromEntries(components.map(key => {
    const contents = fileAt(ref, testFiles[key]);
    if (!contents) throw new Error(`Catalogue de tests manquant : ${testFiles[key]}.`);
    return [key, parseTestSuite(contents)];
  })) as TestSuites;
}

function versionRange(before: string, head: string) {
  const bootstrap = /^0{40}$/.test(before);
  const current = versionsAt(head);
  if (!current) throw new Error(`Fichiers de version absents du commit ${head}.`);
  const previous = bootstrap ? undefined : versionsAt(before);
  const changed = bootstrap ? [] : lines(git('diff', '--name-only', '--no-renames', before, head, '--'));
  const suites = suitesAt(head);
  const minimums = previous ? testImpact(suitesAt(before), suites) : {};
  return { previous, current, affected: affectedComponents(changed), minimums };
}

function versionPlan() {
  requireMain();
  const { previous, current, affected, minimums } = versionRange('origin/main', 'HEAD');
  if (!previous) console.log('Première livraison des versions à 1.1.1.');
  for (const key of components) {
    const prior = previous?.[key] ?? '—';
    const level = minimums[key];
    console.log(`${key} : ${prior} → ${current[key]}${affected.has(key) ? ' · fichiers concernés' : ''}${level ? ` · tests : ${level} minimum` : ''}`);
  }
}

function checkVersions(before: string | undefined, head: string | undefined) {
  if (!before || !head || ![before, head].every(sha => /^[a-f0-9]{40}$/.test(sha))) {
    throw new Error('Usage : pnpm git:work version-check SHA-avant SHA-poussé');
  }
  const { previous, current, affected, minimums } = versionRange(before, head);
  const required = planVersions(previous, current, affected, {}, minimums);
  const missing = components.filter(key => current[key] !== required[key]);
  if (missing.length) throw new Error(`Versions exigées par les tests : ${missing.map(key => `${key} ${required[key]}`).join(' · ')}.`);
  console.log(components.map(key => `${key} ${current[key]}`).join(' · '));
}

function push(args: string[]) {
  requireMain();
  const remote = assertOrigin();
  const bumps = parseBumps(args);
  if (git('status', '--porcelain')) throw new Error('Commiter ou mettre de côté les changements locaux avant le push.');
  const credentials = remote.startsWith('https:') ? ['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential'] : [];
  run('git', [...credentials, 'fetch', '--no-tags', 'origin', `refs/heads/${branch}:refs/remotes/origin/${branch}`]);
  const before = git('rev-parse', 'origin/main');
  const head = git('rev-parse', 'HEAD');
  if (before === head) {
    if (args.length) throw new Error('Aucun commit à livrer. Créer le commit de changement avant de demander une version.');
    console.log('Le commit est déjà sur GitHub.');
    return;
  }
  if (git('merge-base', before, head) !== before) throw new Error('main a divergé de GitHub. Réconcilier les deux historiques avant le push.');
  const { previous, current, affected, minimums } = versionRange(before, head);
  const planned = planVersions(previous, current, affected, bumps, minimums);
  const changed = components.filter(key => current[key] !== planned[key]);
  if (changed.length) {
    const paths = changed.map(key => versionFiles[key]);
    for (const key of changed) writeFileSync(versionFiles[key], JSON.stringify({ version: planned[key] }, null, 2) + '\n', 'utf8');
    run('git', ['add', '--', ...paths]);
    const changes = changed.map(key => `${key} ${planned[key]}`);
    run('git', ['commit', '-m', `Livrer ${changes.join(' · ')}`, '--', ...paths]);
  }
  const commit = git('rev-parse', 'HEAD');
  run('git', [...credentials, 'push', '--set-upstream', 'origin', `HEAD:refs/heads/${branch}`]);
  console.log(`Commit poussé : ${commit}\nCI : https://github.com/${repository}/commit/${commit}/checks`);
}

function ci(commit = git('rev-parse', 'HEAD')) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Indiquer un SHA complet.');
  const runs = JSON.parse(run('gh', ['run', 'list', '--repo', repository, '--workflow', 'ci.yml',
    '--commit', commit, '--limit', '5', '--json', 'status,conclusion,url'], true));
  if (!runs.length) console.log('Aucune exécution visible pour ce commit.');
  for (const run of runs) console.log(`${run.status} ${run.conclusion ?? ''} ${run.url}`.trim());
}

try {
  const [command, first, ...rest] = process.argv.slice(2);
  if (command === 'plan' && !first) plan();
  else if (command === 'commit') commit(first, rest);
  else if (command === 'push') push(process.argv.slice(3));
  else if (command === 'version-plan' && !first) versionPlan();
  else if (command === 'version-check' && rest.length === 1) checkVersions(first, rest[0]);
  else if (command === 'ci' && !rest.length) ci(first);
  else throw new Error('Usage : pnpm git:work plan | commit message chemins… | version-plan | push [--composant niveau] | version-check AVANT SHA | ci [SHA]');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
