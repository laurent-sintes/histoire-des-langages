import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { changedFiles, selectTests, testFiles, watchedPath } from './impact.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const [mode, ...args] = process.argv.slice(2);

function run(tests: string[]) {
  return new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, [
      'tools/performance/run.ts', mode === 'all' ? 'tests' : 'tests-affected',
      '--test', '--test-isolation=none', ...tests,
    ], { cwd: root, stdio: 'inherit' });
    child.once('error', reject).once('exit', code => resolve(code ?? 1));
  });
}

async function affected(paths: string[], planOnly = false) {
  const { selected, uncertain } = selectTests(root, testFiles(root), paths);
  for (const [test, reasons] of selected) console.log(`${test} ← ${reasons.join(', ')}`);
  if (!selected.size) console.log('Aucun test local sélectionné.');
  if (uncertain.length) console.error('Sélection indéterminée pour : ' + uncertain.join(', '));
  const exit = planOnly || !selected.size ? 0 : await run([...selected.keys()]);
  return exit || (uncertain.length ? 2 : 0);
}

function watchTests() {
  let pending = new Set<string>();
  let timer: NodeJS.Timeout | undefined;
  let running = false;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (running || !pending.size) return;
      running = true;
      const batch = [...pending];
      pending = new Set();
      try {
        const exit = await affected(batch);
        if (exit) console.error(`Vérification de la sauvegarde terminée avec le code ${exit}.`);
      } catch (error) {
        console.error(error);
      } finally {
        running = false;
        if (pending.size) schedule();
      }
    }, 200);
  }
  const watcher = watch(root, { recursive: true }, (_, name) => {
    if (!name) return;
    const path = name.replaceAll('\\', '/');
    if (!watchedPath(path)) return;
    pending.add(path);
    schedule();
  });
  watcher.on('error', error => {
    console.error(error);
    watcher.close();
    process.exitCode = 1;
  });
  console.log('En veille. Les tests concernés sont relancés après chaque sauvegarde.');
}

if (mode === 'all' && !args.length) {
  const tests = testFiles(root);
  if (!tests.length) throw new Error('Aucun test dans le dépôt.');
  process.exitCode = await run(tests);
} else if (mode === 'watch' && !args.length) {
  watchTests();
} else if (mode === 'affected') {
  const options = args.filter(arg => arg !== '--plan');
  const [option, ...values] = options;
  if (!option) process.exitCode = await affected(changedFiles(root, 'origin/main'), args.includes('--plan'));
  else if (option === '--since' && values.length === 1) {
    process.exitCode = await affected(changedFiles(root, values[0]), args.includes('--plan'));
  } else if (option === '--files' && values.length && values.every(path => !path.startsWith('--'))) {
    process.exitCode = await affected(values, args.includes('--plan'));
  } else throw new Error('Usage : pnpm test:affected [--since SHA | --files chemin…] [--plan]');
} else throw new Error('Usage : node tools/test/run.ts all | affected | watch');
