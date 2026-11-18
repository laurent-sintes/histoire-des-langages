export const components = ['metamodel', 'model', 'application'] as const;
const levels = ['major', 'minor', 'patch'] as const;
export type Component = typeof components[number];
export type Level = typeof levels[number];
export type Versions = Record<Component, string>;
export type Bumps = Partial<Record<Component, Level>>;
const initial: Versions = { metamodel: '1.1.1', model: '1.1.1', application: '1.1.1' };
export const versionFiles: Record<Component, string> = {
  metamodel: 'packages/metamodel/version.json',
  model: 'source/version.json',
  application: 'app/version.json',
};

function parts(version: string) {
  if (!/^[1-9]\d*\.[1-9]\d*\.[1-9]\d*$/.test(version)) {
    throw new Error(`Version invalide : ${version}. Trois entiers positifs sont attendus.`);
  }
  return version.split('.').map(value => BigInt(value));
}

export function parseComponentVersion(content: string): string {
  const input: unknown = JSON.parse(content);
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || Object.keys(input).length !== 1 || !('version' in input) || typeof input.version !== 'string') {
    throw new Error('Le fichier du module doit contenir une propriété version.');
  }
  parts(input.version);
  return input.version;
}

export function increment(version: string, level: Level) {
  const [major, minor, patch] = parts(version);
  if (level === 'major') return `${major + 1n}.1.1`;
  if (level === 'minor') return `${major}.${minor + 1n}.1`;
  return `${major}.${minor}.${patch + 1n}`;
}

export function affectedComponents(paths: string[]): Set<Component> {
  const affected = new Set<Component>();
  const releaseMetadata = new Set([...Object.values(versionFiles), ...Object.values(testFiles)]);
  for (const path of paths) {
    if (/\.md$/i.test(path) || releaseMetadata.has(path)) continue;
    if (path.startsWith('packages/metamodel/') || path === 'source/schema-connaissances.json'
      || path === 'packages/compiler/validate.ts') affected.add('metamodel');
    if (path === 'source/connaissances.json' || path.startsWith('sources/')
      || path.startsWith('packages/contracts/') || /^packages\/compiler\/(build|compile)\.ts$/.test(path)) affected.add('model');
    if (path.startsWith('app/') || path === 'package.json' || path === 'pnpm-lock.yaml') affected.add('application');
  }
  return affected;
}

export function parseBumps(args: string[]): Bumps {
  const bumps: Bumps = {};
  for (let i = 0; i < args.length; i += 2) {
    const component = components.find(name => args[i] === `--${name}`);
    const level = levels.find(name => args[i + 1] === name);
    if (!component || !level || bumps[component]) throw new Error(`Option de version invalide : ${args.slice(i, i + 2).join(' ')}`);
    bumps[component] = level;
  }
  return bumps;
}

export function planVersions(before: Versions | undefined, current: Versions, affected: Set<Component>, bumps: Bumps, minimums: Bumps = {}) {
  if (!before) {
    if (components.some(key => current[key] !== initial[key]) || Object.keys(bumps).length) {
      throw new Error('La première livraison doit initialiser les trois versions à 1.1.1.');
    }
    return current;
  }
  const planned = { ...current };
  for (const component of components) {
    const old = before[component];
    const now = current[component];
    const requested = bumps[component];
    const minimum = minimums[component];
    const selected = requested ?? minimum;
    const sufficient = (level: Level) => !minimum || levels.indexOf(level) <= levels.indexOf(minimum);
    if (requested && !sufficient(requested)) {
      throw new Error(`Les tests de ${component} exigent au moins le niveau ${minimum}.`);
    }
    if (now !== old) {
      const applied = levels.find(level => increment(old, level) === now);
      if (!applied || !sufficient(applied) || (requested && applied !== requested)) {
        throw new Error(`Transition invalide pour ${component} : ${old} → ${now}.`);
      }
    } else if (selected) {
      planned[component] = increment(old, selected);
    } else if (affected.has(component)) {
      throw new Error(`Choisir --${component} major, minor ou patch pour ce push.`);
    }
  }
  return planned;
}

export const testFiles: Record<Component, string> = {
  metamodel: 'packages/metamodel/tests.json',
  model: 'source/tests.json',
  application: 'app/tests.json',
};
