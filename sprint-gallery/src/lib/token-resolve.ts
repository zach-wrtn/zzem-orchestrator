/**
 * Flatten DTCG token JSON files into a dotted-path map and look values up.
 * DTCG shape: any object with "$value" is a leaf; path is built from parent keys.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';

export interface ResolvedToken {
  value: string;
  source: string;
}

export type TokenMap = Record<string, ResolvedToken>;

function walk(node: unknown, path: string[], source: string, out: TokenMap): void {
  if (node === null || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  if ('$value' in obj) {
    out[path.join('.')] = { value: String(obj.$value), source };
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue;
    walk(v, [...path, k], source, out);
  }
}

export async function loadTokenMap(dir: string): Promise<TokenMap> {
  const map: TokenMap = {};
  try {
    const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const raw = await readFile(join(dir, f), 'utf8');
      const json = JSON.parse(raw);
      walk(json, [], basename(f), map);
    }
  } catch {
    // dir missing — return empty map
  }
  return map;
}

export function resolveToken(map: TokenMap, ref: string): ResolvedToken | null {
  return map[ref] ?? null;
}
