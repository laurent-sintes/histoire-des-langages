import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { components, parseComponentVersion, versionFiles } from '../git/versions.ts';

test('le site fabriqué permet de rechercher une technologie et de consulter sa preuve et ses versions', { timeout: 45_000 }, async context => {
  if (process.env.KNOWLEDGE_USE_PREBUILT_SITE !== 'true') {
    execFileSync(process.execPath, [
      'tools/performance/run.ts', 'build-site', 'node_modules/vite/bin/vite.js', 'build', 'app', '--config', 'app/vite.config.ts',
    ], { stdio: 'inherit' });
  }
  const server = await preview({
    root: resolve('app'), configFile: false, base: '/histoire-des-langages/',
    preview: { host: '127.0.0.1', port: 0, strictPort: true },
  });
  context.after(() => server.close());
  const address = server.httpServer.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/histoire-des-langages/`;
  const ready = await fetch(new URL('versions.json', url), { signal: AbortSignal.timeout(5000) });
  assert.equal(ready.status, 200);
  const versions = Object.fromEntries(components.map(component => [
    component, parseComponentVersion(readFileSync(versionFiles[component], 'utf8')),
  ]));
  assert.deepEqual(await ready.json(), versions);

  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const channel = process.platform === 'win32' && !existsSync(chromium.executablePath())
    ? 'chrome' : undefined;
  const browser = await chromium.launch(executablePath ? { executablePath } : { channel });
  try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    assert.equal(response?.status(), 200);
    await page.getByRole('searchbox').fill('TypeScript');
    await page.getByRole('button', { name: /^TypeScript\b/ }).click();
    await page.getByRole('heading', { name: 'TypeScript', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Filiations', exact: true }).click();
    await page.locator('summary').filter({ hasText: /Voir (la preuve|les \d+ preuves)/ }).first().click();
    await page.locator('details[open] a').first().waitFor();
    const manifest = await page.request.get(new URL('versions.json', url).href);
    assert.ok(manifest.ok());
    assert.deepEqual(await manifest.json(), versions);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
