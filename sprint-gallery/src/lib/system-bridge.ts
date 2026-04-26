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
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { loadExemplars } from './exemplars/load.js';
import { REPO_ROOT } from './paths.js';
import type { ExemplarMeta, ScreenArchetype } from './exemplars/schema.js';

/**
 * Classify a CSS variable name into a foundation by keyword. Prototypes use
 * mixed token namespaces (--wds-*, --component-*, --pe-*, --kbd-*) so we
 * key off semantic substrings, not prefixes. Order matters — most specific
 * checks first so e.g. "radius" doesn't fall into "color".
 */
function classifyTokenName(name: string): string | null {
  if (/radius/i.test(name)) return 'radius';
  if (/(easing|ease|duration|dur-|spring|motion|transition)/i.test(name)) return 'motion';
  if (/(shadow|elevation)/i.test(name)) return 'elevation';
  if (/(^|-)(font|fs|lh|ls)(-|$)|line-height|letter-spacing/i.test(name)) return 'typography';
  if (/(spacing|gap|^|-)(space|size)(-|$)|padding|margin/i.test(name)) return 'spacing';
  // Color is a generous catch-all — most surface/text/fill/bg tokens are
  // color tokens in practice.
  if (/(color|fill|label|^bg|-bg|background|border|stroke|tint|text|surface|accent|brand)/i.test(name)) {
    return 'color';
  }
  return null;
}

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
 * Reads an exemplar's prototype.html (and sibling tokens.css if present)
 * and returns the set of foundation keys whose tokens it references via
 * var(--…). Cached per build to avoid re-reading files on every cross-link.
 */
const _foundationCache = new Map<string, Set<string>>();

export async function foundationsInExemplar(
  prototype_path: string,
): Promise<Set<string>> {
  const cached = _foundationCache.get(prototype_path);
  if (cached) return cached;

  const fullPath = resolve(REPO_ROOT, prototype_path);
  const dir = dirname(fullPath);
  const tokensCssPath = resolve(dir, 'tokens.css');

  let text = '';
  if (existsSync(fullPath)) text += await readFile(fullPath, 'utf8');
  if (existsSync(tokensCssPath)) text += '\n' + await readFile(tokensCssPath, 'utf8');

  const used = new Set<string>();
  // Collect every CSS-var name referenced or declared, classify each.
  const tokenNames = new Set<string>();
  const refRe = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
  const declRe = /^\s*(--[a-zA-Z0-9_-]+)\s*:/gm;
  for (const m of text.matchAll(refRe)) tokenNames.add(m[1]);
  for (const m of text.matchAll(declRe)) tokenNames.add(m[1]);
  for (const name of tokenNames) {
    const f = classifyTokenName(name);
    if (f) used.add(f);
  }
  // Heuristics for foundations that prototypes typically apply with raw
  // values rather than tokens.
  if (/box-shadow\s*:\s*[^;]*\b\d/.test(text)) used.add('elevation');
  if (/(transition|animation)\s*:\s*[^;]+/.test(text)) used.add('motion');

  _foundationCache.set(prototype_path, used);
  return used;
}

export async function exemplarsForFoundation(
  foundationKey: string,
): Promise<ExemplarMeta[]> {
  const all = await loadExemplars();
  const flagged = await Promise.all(
    all.map(async (e) => ({
      e,
      uses: (await foundationsInExemplar(e.prototype_path)).has(foundationKey),
    })),
  );
  return flagged.filter((m) => m.uses).map((m) => m.e);
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
