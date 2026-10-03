import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');

/**
 * Wiki static client must not depend on the Online companion server package.
 * Ensures iGEM Wiki builds stay offline-capable.
 */
describe('wiki isolation from online server', () => {
  it('wiki-client package.json does not depend on @suite/server or online-client', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'apps/wiki-client/package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(deps['@suite/server']).toBeUndefined();
    expect(deps['@suite/online-client']).toBeUndefined();
  });

  it('wiki-client source never imports @suite/server', () => {
    const root = path.join(repoRoot, 'apps/wiki-client');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ent.name === 'node_modules' || ent.name === 'dist') continue;
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p);
        else if (/\.(ts|tsx|js|mjs|html)$/.test(ent.name)) {
          const text = fs.readFileSync(p, 'utf8');
          if (text.includes('@suite/server') || /from ['"][^'"]*apps\/server/.test(text)) {
            offenders.push(path.relative(root, p));
          }
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
