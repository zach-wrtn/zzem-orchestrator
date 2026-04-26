/**
 * system-bridge — cross-link helpers between /system docs (components, patterns,
 * foundations) and curated exemplars. Patterns are the bridge: they declare
 * usesComponents in MDX frontmatter, and we map each pattern key to the
 * archetype it composes (manual table below). From there:
 *
 *   pattern  ──archetype──▸  exemplars
 *   component ──reverse usesComponents──▸ patterns ──▸ exemplars
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { loadExemplars } from './exemplars/load.js';
import type { ExemplarMeta, ScreenArchetype } from './exemplars/schema.js';

/**
 * Manual pattern → archetype mapping. Patterns whose composition has no clean
 * single-screen archetype (composition-only fragments like profile-header) map
 * to null — they participate in component cross-links but not exemplar lookup.
 */
const PATTERN_ARCHETYPE: Record<string, ScreenArchetype | null> = {
  'detail-view': 'detail',
  'feed-grid': 'feed',
  'home-screen': 'feed',
  'other-user-profile': 'detail',
  'profile-edit': 'form',
  'profile-header': null,
  'settings-screen': 'nav_list',
};

export function archetypeForPattern(key: string): ScreenArchetype | null {
  return PATTERN_ARCHETYPE[key] ?? null;
}

export function patternsForArchetype(arch: ScreenArchetype): string[] {
  return Object.entries(PATTERN_ARCHETYPE)
    .filter(([, a]) => a === arch)
    .map(([k]) => k);
}

export async function exemplarsForPattern(patternKey: string): Promise<ExemplarMeta[]> {
  const arch = archetypeForPattern(patternKey);
  if (!arch) return [];
  const all = await loadExemplars();
  return all.filter((e) => e.archetype === arch);
}

export async function patternsUsingComponent(
  componentKey: string,
): Promise<CollectionEntry<'patterns'>[]> {
  const patterns = await getCollection('patterns');
  return patterns.filter((p) => p.data.usesComponents.includes(componentKey));
}

export async function exemplarsForComponent(componentKey: string): Promise<ExemplarMeta[]> {
  const patterns = await patternsUsingComponent(componentKey);
  const archs = new Set(
    patterns
      .map((p) => archetypeForPattern(p.data.key))
      .filter((a): a is ScreenArchetype => a !== null),
  );
  if (archs.size === 0) return [];
  const all = await loadExemplars();
  // Dedupe by exemplar id (an exemplar should only appear once even if multiple
  // patterns route to its archetype).
  return all.filter((e) => archs.has(e.archetype));
}
