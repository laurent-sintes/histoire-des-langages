import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const repository = 'laurent-sintes/histoire-des-langages';
const environment = 'github-pages';
const pageSize = 30;
const activeStates = new Set(['pending', 'queued', 'in_progress', 'waiting', 'requested']);
type Deployment = { id: number; sha: string };
type Status = { state: string; environment_url?: string };

function githubApi<T>(path: string): T {
  const response = execFileSync('gh', ['api', `repos/${repository}/${path}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return JSON.parse(response) as T;
}

export function publishedPages(api: <T>(path: string) => T = githubApi) {
  const pending = new Set<string>();
  for (let page = 1; ; page++) {
    const deployments = api<Deployment[]>(`deployments?environment=${environment}&per_page=${pageSize}&page=${page}`);
    for (const { id, sha } of deployments) {
      if (!Number.isSafeInteger(id) || !/^[a-f0-9]{40}$/.test(sha)) {
        throw new Error('Réponse GitHub invalide pour un déploiement Pages.');
      }
      const statuses = api<Status[]>(`deployments/${id}/statuses?per_page=100`);
      if (statuses.some(status => status.state === 'success' && status.environment_url?.startsWith('https://'))) {
        pending.delete(sha);
        return { sha, pending };
      }
      if (!statuses.length || activeStates.has(statuses[0].state)) pending.add(sha);
    }
    if (deployments.length < pageSize) throw new Error('Aucun déploiement GitHub Pages réussi trouvé.');
  }
}

export function pagesHead(read = publishedPages) {
  const { sha, pending } = read();
  if (pending.size) {
    throw new Error(`Une livraison Pages est en cours (${[...pending].join(', ')}). Attendre son résultat avant de préparer la livraison.`);
  }
  return sha;
}

export function verifyReleaseBase(base: string, head: string, mergeBase: (base: string, head: string) => string) {
  if (!/^[a-f0-9]{40}$/.test(base) || !/^[a-f0-9]{40}$/.test(head) || mergeBase(base, head) !== base) {
    throw new Error(`La référence Pages ${base} doit être un ancêtre de ${head}.`);
  }
}

function releaseGit(...args: string[]) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

export function requiresPagesDeployment(base: string, head: string, event: string, git = releaseGit) {
  verifyReleaseBase(base, head, (before, after) => git('merge-base', before, after).trim());
  if (event !== 'push') return true;
  const changed = git('diff', '--no-renames', '--name-only', '-z', base, head, '--').split('\0').filter(Boolean);
  return !changed.length || changed.some(path => !path.startsWith('audit/'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (!args.length) console.log(publishedPages().sha);
  else if (args[0] === 'requires-deploy' && args.length === 4) {
    console.log(requiresPagesDeployment(args[1], args[2], args[3]));
  } else throw new Error('Usage : node tools/git/pages.ts [requires-deploy SHA-publié SHA-candidat événement]');
}
