import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import YAML from 'yaml';
import type { Sprint, Prototype, SprintStatus } from './types.js';
import { loadArchetypeLookup } from './exemplars/load.js';
import { REPO_ROOT } from './paths.js';
import type { ExemplarMeta } from './exemplars/schema.js';

interface DisplayYaml {
  title?: string;
  startDate?: string;
  endDate?: string;
  status?: SprintStatus;
  tags?: string[];
  summary?: string;
  prototypes?: Array<{
    id: string;
    title?: string;
    hero?: boolean;
    thumbnail?: string;
  }>;
}

interface ConfigYaml {
  sprint_id?: string;
  display?: DisplayYaml;
}

function humanize(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function extractTitleFromHtml(html: string): string | null {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}

function firstParagraph(md: string): string {
  const stripped = md.replace(/^#.*$/gm, '').trim();
  const para = stripped.split(/\n\s*\n/).find((p) => p.trim().length > 0) ?? '';
  return para.trim().slice(0, 280);
}

async function collectPrototypes(
  sprintDir: string,
  slug: string,
  display: DisplayYaml | undefined,
  archetypeLookup: Map<string, ExemplarMeta>,
): Promise<Prototype[]> {
  const appDir = join(sprintDir, 'prototypes', 'app');
  if (!existsSync(appDir)) return [];
  const entries = await readdir(appDir, { withFileTypes: true });
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();

  const overrides = new Map(
    (display?.prototypes ?? []).map((p) => [p.id, p]),
  );
  const anyHero = (display?.prototypes ?? []).some((p) => p.hero);

  const result: Prototype[] = [];
  for (const id of folders) {
    const protoDir = join(appDir, id);
    const entryFile = join(protoDir, 'prototype.html');
    if (!existsSync(entryFile)) continue;
    const html = await readFile(entryFile, 'utf8');
    const override = overrides.get(id);

    // entryRel is relative to the sprint's own prototypes/ folder.
    // Public URL shape: prototypes/<slug>/<entryRel>
    const sprintPrototypesDir = join(sprintDir, 'prototypes');
    const entryRel = relative(sprintPrototypesDir, entryFile);

    const screenshotsDir = join(protoDir, 'screenshots');
    let screens: string[] = [];
    let thumbnail: string | null = null;
    if (existsSync(screenshotsDir)) {
      const files = (await readdir(screenshotsDir))
        .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
        .sort();
      screens = files.map((f) => `prototypes/${slug}/${relative(sprintPrototypesDir, join(screenshotsDir, f))}`);
      const preferredFile = (override?.thumbnail ?? 'screenshots/default.png').replace(/^screenshots\//, '');
      const chosen = files.includes(preferredFile) ? preferredFile : files[0];
      if (chosen) {
        thumbnail = `prototypes/${slug}/${relative(sprintPrototypesDir, join(screenshotsDir, chosen))}`;
      }
    }

    const repoRelEntry = relative(REPO_ROOT, entryFile);
    const exemplar = archetypeLookup.get(repoRelEntry);

    result.push({
      id,
      title: override?.title ?? extractTitleFromHtml(html) ?? humanize(id),
      entry: `prototypes/${slug}/${entryRel}`,
      thumbnail,
      hero: override?.hero ?? (!anyHero && result.length === 0),
      screens,
      archetype: exemplar?.archetype,
    });
  }
  return result;
}

export async function collectSprints(sprintsDir: string): Promise<Sprint[]> {
  if (!existsSync(sprintsDir)) return [];
  const entries = await readdir(sprintsDir, { withFileTypes: true });
  const sprintFolders = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const archetypeLookup = await loadArchetypeLookup();

  const sprints: Sprint[] = [];
  for (const slug of sprintFolders) {
    const dir = join(sprintsDir, slug);
    const configPath = join(dir, 'sprint-config.yaml');
    let config: ConfigYaml = {};
    if (existsSync(configPath)) {
      config = (YAML.parse(await readFile(configPath, 'utf8')) ?? {}) as ConfigYaml;
    }
    const display = config.display;

    const prdPath = join(dir, 'PRD.md');
    let summary = display?.summary ?? '';
    if (!summary && existsSync(prdPath)) {
      summary = firstParagraph(await readFile(prdPath, 'utf8'));
    }

    const statMtime = (await stat(dir)).mtime.toISOString().slice(0, 10);

    const prototypes = await collectPrototypes(dir, slug, display, archetypeLookup);

    const reportPath = join(dir, 'REPORT.md');
    const retroDir = join(dir, 'retrospective');
    const retros: string[] = [];
    if (existsSync(retroDir)) {
      const files = await readdir(retroDir);
      for (const f of files.sort()) if (f.endsWith('.md')) retros.push(join('retrospective', f));
    }

    sprints.push({
      slug,
      title: display?.title ?? humanize(slug),
      startDate: display?.startDate ?? statMtime,
      endDate: display?.endDate ?? statMtime,
      status: display?.status ?? 'in-progress',
      summary,
      tags: display?.tags ?? [],
      prototypes,
      docs: {
        prd: existsSync(prdPath) ? 'PRD.md' : undefined,
        report: existsSync(reportPath) ? 'REPORT.md' : undefined,
        retrospective: retros.length ? retros : undefined,
      },
    });
  }

  sprints.sort((a, b) => (a.endDate < b.endDate ? 1 : a.endDate > b.endDate ? -1 : 0));
  return sprints;
}
