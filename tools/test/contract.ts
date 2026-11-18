import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after } from 'node:test';
import { parseTestSuite } from '../git/test-impact.ts';
import { testFiles } from '../git/versions.ts';
import type { Component } from '../git/versions.ts';

export function expectedContracts(component: Component) {
  const entries = parseTestSuite(readFileSync(new URL(`../../${testFiles[component]}`, import.meta.url), 'utf8'));
  const executed = new Set<string>();
  after(() => assert.deepEqual([...executed].sort(), Object.keys(entries).sort(),
    `Chaque attente déclarée doit être exécutée : ${component}`));
  return (id: string) => {
    const descriptor = entries[id];
    assert.ok(descriptor, `Test absent du catalogue : ${component}/${id}`);
    executed.add(id);
    return descriptor.expected;
  };
}
