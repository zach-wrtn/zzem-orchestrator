import { cp, mkdir, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { PUBLIC_DIR, PUBLIC_PROTOTYPES_DIR, REPO_ROOT, SPRINTS_DIR } from '../src/lib/paths.js';
import { loadExemplars } from '../src/lib/exemplars/load.js';

const PUBLIC_EXEMPLARS_DIR = resolve(PUBLIC_DIR, 'exemplars');

async function main() {
  if (!existsSync(SPRINTS_DIR)) {
    console.error(`sprints directory not found: ${SPRINTS_DIR}`);
    process.exit(1);
  }
  if (existsSync(PUBLIC_PROTOTYPES_DIR)) {
    await rm(PUBLIC_PROTOTYPES_DIR, { recursive: true, force: true });
  }
  await mkdir(PUBLIC_PROTOTYPES_DIR, { recursive: true });

  const sprints = (await readdir(SPRINTS_DIR, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  let copiedSprints = 0;
  for (const slug of sprints) {
    const src = join(SPRINTS_DIR, slug, 'prototypes');
    if (!existsSync(src)) continue;
    const dest = join(PUBLIC_PROTOTYPES_DIR, slug);
    await cp(src, dest, { recursive: true });
    copiedSprints++;
  }
  console.log(`copied prototypes from ${copiedSprints} sprint(s) into public/prototypes/`);

  if (existsSync(PUBLIC_EXEMPLARS_DIR)) {
    await rm(PUBLIC_EXEMPLARS_DIR, { recursive: true, force: true });
  }
  await mkdir(PUBLIC_EXEMPLARS_DIR, { recursive: true });

  const exemplars = await loadExemplars();
  let copiedExemplars = 0;
  for (const ex of exemplars) {
    const srcFile = resolve(REPO_ROOT, ex.prototype_path);
    if (!existsSync(srcFile)) {
      console.warn(`[exemplar] missing source: ${ex.id} → ${ex.prototype_path}`);
      continue;
    }
    const srcDir = dirname(srcFile);
    const destDir = join(PUBLIC_EXEMPLARS_DIR, ex.id);
    await cp(srcDir, destDir, { recursive: true });
    copiedExemplars++;
  }
  console.log(`copied ${copiedExemplars}/${exemplars.length} exemplar(s) into public/exemplars/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
