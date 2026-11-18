import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { components } from './versions.ts';
import type { Bumps, Component, Level } from './versions.ts';

const testCase = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('contract'), introduction: z.enum(['coverage', 'extension']), expected: z.json() }),
  z.strictObject({ kind: z.literal('feature'), expected: z.json() }),
  z.strictObject({ kind: z.literal('regression'), expected: z.json() }),
]);
const suiteSchema = z.record(z.string().regex(/^[a-z][a-z0-9-]*$/), testCase);
export type TestSuite = z.infer<typeof suiteSchema>;
export type TestSuites = Record<Component, TestSuite>;

export function parseTestSuite(content: string): TestSuite {
  return suiteSchema.parse(JSON.parse(content));
}

export function testImpact(before: TestSuites, after: TestSuites): Bumps {
  const impact: Bumps = {};
  const rank: Record<Level, number> = { patch: 1, minor: 2, major: 3 };
  for (const component of components) {
    function raise(level: Level) {
      const previous = impact[component];
      if (!previous || rank[previous] < rank[level]) impact[component] = level;
    }
    for (const [id, previous] of Object.entries(before[component])) {
      const next = Object.hasOwn(after[component], id) ? after[component][id] : undefined;
      if (!next) {
        if (previous.kind === 'contract') raise('major');
        continue;
      }
      if (previous.kind !== next.kind) throw new Error(`Type de test modifié pour ${component}/${id}. Employer un nouvel identifiant.`);
      if (isDeepStrictEqual(previous.expected, next.expected)) continue;
      raise(next.kind === 'contract' ? 'major' : next.kind === 'feature' ? 'minor' : 'patch');
    }
    for (const [id, next] of Object.entries(after[component])) {
      if (Object.hasOwn(before[component], id)) continue;
      if (next.kind === 'contract' && next.introduction === 'coverage') continue;
      raise(next.kind === 'regression' ? 'patch' : 'minor');
    }
  }
  return impact;
}
