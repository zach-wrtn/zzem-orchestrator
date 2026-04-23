/**
 * Build-time validator. Scans every component MDX's `tokens` frontmatter
 * against the synced token map. Unresolved refs fail the build.
 *
 * Usage: pnpm run validate:tokens  (runs as part of build)
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';
import { loadTokenMap, resolveToken } from '../src/lib/token-resolve.ts';

const COMPONENTS_DIR = 'src/content/components';
const TOKENS_DIR = 'src/content/tokens';

async function main() {
  const map = await loadTokenMap(TOKENS_DIR);
  const files = (await readdir(COMPONENTS_DIR)).filter((f) => f.endsWith('.mdx'));

  const misses: Array<{ file: string; ref: string }> = [];
  for (const f of files) {
    const raw = await readFile(join(COMPONENTS_DIR, f), 'utf8');
    const fm = matter(raw).data;
    const tokens = Array.isArray(fm.tokens) ? fm.tokens : [];
    for (const ref of tokens) {
      if (resolveToken(map, ref) === null) {
        misses.push({ file: f, ref });
      }
    }
  }

  if (misses.length > 0) {
    console.error('\nvalidate-tokens: unresolved token references:\n');
    for (const m of misses) console.error(`  ${m.file}  →  ${m.ref}`);
    console.error(`\n${misses.length} miss(es) — run 'pnpm run sync:tokens' or fix the references.`);
    process.exit(1);
  }
  console.log(`validate-tokens: all ${files.length} component(s) have resolvable token refs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
