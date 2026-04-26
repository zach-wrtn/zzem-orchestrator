import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ExemplarIndex, type ExemplarMeta } from './schema.js';
import { REPO_ROOT } from '../paths.js';

const INDEX_PATH = resolve(REPO_ROOT, 'sprint-gallery/exemplars/_index.json');

let cached: ExemplarMeta[] | null = null;

export async function loadExemplars(): Promise<ExemplarMeta[]> {
  if (cached) return cached;
  if (!existsSync(INDEX_PATH)) return (cached = []);
  const raw = JSON.parse(await readFile(INDEX_PATH, 'utf8'));
  const parsed = ExemplarIndex.parse(raw);
  return (cached = parsed.exemplars);
}

/**
 * Map<prototypePathRelToRepoRoot, archetype>.
 * `prototypePathRelToRepoRoot` is what `_index.json` stores in `prototype_path`,
 * e.g. "sprint-orchestrator/sprints/<slug>/prototypes/app/<task>/prototype.html".
 */
export async function loadArchetypeLookup(): Promise<Map<string, ExemplarMeta>> {
  const list = await loadExemplars();
  return new Map(list.map((e) => [e.prototype_path, e]));
}
