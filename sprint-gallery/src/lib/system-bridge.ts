/**
 * system-bridge — cross-link helpers between /system docs (components, patterns,
 * foundations), curated exemplars, and sprint timeline. Patterns are the
 * bridge: their MDX frontmatter declares both `usesComponents` (component
 * keys) and `archetype` (the screen archetype the pattern composes). From
 * there cross-links derive in both directions:
 *
 *   pattern  ──archetype──▸  exemplars
 *   component ──reverse usesComponents──▸ patterns ──▸ exemplars
 *   sprint    ──prototype_path slug──▸  exemplars  ──▸ patterns/components
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { loadExemplars } from './exemplars/load.js';
import type { ExemplarMeta, ScreenArchetype } from './exemplars/schema.js';

export async function archetypeForPattern(key: string): Promise<ScreenArchetype | null> {
  const all = await getCollection('patterns');
  const p = all.find((p) => p.data.key === key);
  return p?.data.archetype ?? null;
}

export async function patternsForArchetype(
  arch: ScreenArchetype,
): Promise<CollectionEntry<'patterns'>[]> {
  const all = await getCollection('patterns');
  return all.filter((p) => p.data.archetype === arch);
}

export async function exemplarsForPattern(patternKey: string): Promise<ExemplarMeta[]> {
  const arch = await archetypeForPattern(patternKey);
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
      .map((p) => p.data.archetype)
      .filter((a): a is ScreenArchetype => a !== null && a !== undefined),
  );
  if (archs.size === 0) return [];
  const all = await loadExemplars();
  return all.filter((e) => archs.has(e.archetype));
}

/**
 * Derive the sprint folder slug from an exemplar's prototype_path. Exemplars
 * sourced from sprint-orchestrator/sprints/<slug>/ return the slug; dogfood
 * exemplars (under sprint-orchestrator/dogfood/) return null and so don't
 * surface on any sprint detail page.
 */
function exemplarSprintSlug(prototype_path: string): string | null {
  const m = prototype_path.match(/sprint-orchestrator\/sprints\/([^/]+)\/prototypes/);
  return m ? m[1] : null;
}

export async function exemplarsForSprint(sprintSlug: string): Promise<ExemplarMeta[]> {
  const all = await loadExemplars();
  return all.filter((e) => exemplarSprintSlug(e.prototype_path) === sprintSlug);
}

/**
 * Coverage: which design system pieces does this sprint touch? Derived
 * transitively from exemplars curated out of the sprint:
 *   exemplars → archetypes → patterns → components.
 */
export async function coverageForSprint(sprintSlug: string): Promise<{
  exemplars: ExemplarMeta[];
  patterns: CollectionEntry<'patterns'>[];
  componentKeys: string[];
}> {
  const exemplars = await exemplarsForSprint(sprintSlug);
  if (exemplars.length === 0) {
    return { exemplars: [], patterns: [], componentKeys: [] };
  }
  const archs = new Set(exemplars.map((e) => e.archetype));
  const allPatterns = await getCollection('patterns');
  const patterns = allPatterns.filter(
    (p) => p.data.archetype !== null && p.data.archetype !== undefined && archs.has(p.data.archetype),
  );
  const componentKeys = [...new Set(patterns.flatMap((p) => p.data.usesComponents))].sort();
  return { exemplars, patterns, componentKeys };
}
