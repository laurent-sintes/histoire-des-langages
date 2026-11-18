import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

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
  const allowed = new Set([`https://github.com/${repository}`, `https://github.com/${repository}.git`,
    `git@github.com:${repository}.git`, `ssh://git@github.com/${repository}.git`]);
  if (remotes.length !== 1 || !allowed.has(remotes[0])) {
    throw new Error(`La destination de push doit être uniquement github.com/${repository}.`);
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

function push() {
  requireMain();
  const remote = assertOrigin();
  const commit = git('rev-parse', 'HEAD');
  const credentials = remote.startsWith('https:') ? ['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential'] : [];
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
  else if (command === 'push' && !first) push();
  else if (command === 'ci' && !rest.length) ci(first);
  else throw new Error('Usage : pnpm git:work plan | commit message chemins… | push | ci [SHA]');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
