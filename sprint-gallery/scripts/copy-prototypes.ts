import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC_PROTOTYPES_DIR, SPRINTS_DIR } from '../src/lib/paths.js';
import { readdir } from 'node:fs/promises';

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

  let copied = 0;
  for (const slug of sprints) {
    const src = join(SPRINTS_DIR, slug, 'prototypes');
    if (!existsSync(src)) continue;
    const dest = join(PUBLIC_PROTOTYPES_DIR, slug);
    await cp(src, dest, { recursive: true });
    copied++;
  }
  console.log(`copied prototypes from ${copied} sprint(s) into public/prototypes/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
