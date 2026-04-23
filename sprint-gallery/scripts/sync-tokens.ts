/**
 * Sync DTCG tokens from wds-tokens repo into src/content/tokens/.
 * Runs as a prebuild step; no-ops (warning) if the source repo is absent.
 *
 * Usage: pnpm run sync:tokens
 * Env:   WDS_TOKENS_DIR (default: ~/dev/work/wds-tokens)
 */
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';

const SRC = process.env.WDS_TOKENS_DIR ?? join(homedir(), 'dev', 'work', 'wds-tokens');
const TARGET = 'src/content/tokens';
const LAYERS = ['primitive', 'semantic', 'component'];

async function main() {
  if (!existsSync(SRC)) {
    console.warn(
      `sync-tokens: ${SRC} not found. Skipping (existing committed tokens, if any, stay intact).`,
    );
    return;
  }

  if (existsSync(TARGET)) await rm(TARGET, { recursive: true });
  await mkdir(TARGET, { recursive: true });

  let copied = 0;
  for (const layer of LAYERS) {
    const layerDir = join(SRC, layer);
    if (!existsSync(layerDir)) continue;
    const files = (await readdir(layerDir)).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const raw = await readFile(join(layerDir, file), 'utf8');
      const out = `${layer}-${basename(file, '.json')}.json`;
      await writeFile(join(TARGET, out), raw);
      copied++;
    }
  }
  console.log(`sync-tokens: copied ${copied} JSON file(s) from ${SRC} → ${TARGET}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
