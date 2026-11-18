import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const [incoming, commit] = process.argv.slice(2);
if (!incoming || !commit || !/^[a-f0-9]{40}$/.test(commit)) {
  throw new Error('Usage : node tools/performance/archive.ts mesures commit');
}
const source = resolve(incoming, commit);
if (!(await stat(source)).isDirectory()) throw new Error('Dossier de mesures du commit absent.');

function git(args: string[], cwd = process.cwd()) {
  const result = spawnSync('git', args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  return result.status ?? 1;
}
function requireGit(args: string[], cwd?: string) {
  if (git(args, cwd) !== 0) throw new Error(`Échec Git : ${args.join(' ')}`);
}

const branch = 'performance-history';
const ref = `refs/heads/${branch}`;
await mkdir('tmp', { recursive: true });
const worktree = await mkdtemp(resolve('tmp/performance-history-'));
try {
  requireGit(['worktree', 'add', '--detach', worktree, 'HEAD']);
  let orphan = false;
  for (let attempt = 0; attempt < 4; attempt++) {
    const exists = git(['ls-remote', '--exit-code', '--heads', 'origin', ref]);
    if (exists === 0) {
      requireGit(['fetch', '--no-tags', 'origin', ref]);
      requireGit(['switch', '--detach', 'FETCH_HEAD'], worktree);
    } else if (exists !== 2) {
      throw new Error('Impossible de lire la branche statistique distante.');
    } else if (!orphan) {
      requireGit(['switch', '--orphan', branch], worktree);
      orphan = true;
    }
    const destination = resolve(worktree, 'samples', commit);
    await cp(source, destination, { recursive: true, force: false });
    requireGit(['add', '--', 'samples'], worktree);
    const differences = git(['diff', '--cached', '--quiet'], worktree);
    if (differences > 1) throw new Error('Comparaison Git impossible.');
    if (differences === 1) {
      requireGit(['-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
        'commit', '-m', `Mesures pour ${commit.slice(0, 12)}`], worktree);
    }
    if (git(['push', 'origin', `HEAD:${ref}`], worktree) === 0) {
      const report = spawnSync(process.execPath, ['tools/performance/report.ts',
        resolve(worktree, 'samples'), resolve(incoming), commit], { stdio: 'inherit' });
      if (report.error || report.status !== 0) throw new Error('Échec du rapport de performance.');
      break;
    }
    if (attempt === 3) throw new Error('Archivage impossible après quatre tentatives.');
    await new Promise(ok => setTimeout(ok, 500 * (attempt + 1)));
  }
} finally {
  if (git(['worktree', 'remove', worktree]) !== 0) {
    // The checkout may be absent if its creation failed.
    await rm(worktree, { recursive: true, force: true });
    git(['worktree', 'prune']);
  }
}
