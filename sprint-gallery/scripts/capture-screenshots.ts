/**
 * Capture default.png thumbnails for prototypes missing one.
 *
 * Walks `sprint-orchestrator/sprints/*\/prototypes/app/*\/prototype.html` and
 * renders each via Puppeteer at a mobile viewport, saving to
 * `<proto>/screenshots/default.png`.
 *
 * Idempotent — existing screenshots are skipped unless `--force` is passed.
 * `--sprint=<slug>` scopes the run to a single sprint.
 *
 * If Puppeteer cannot launch (e.g. Chromium not installed in the current env),
 * the script logs a warning and exits 0 so the build pipeline is not blocked
 * on environments where thumbnails are already committed.
 */
import { readdir, mkdir, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SPRINTS_DIR, REPO_ROOT } from '../src/lib/paths.js';

const VIEWPORT = { width: 430, height: 985, deviceScaleFactor: 2 };
const WAIT_AFTER_LOAD_MS = 400;

interface Target {
  sprintSlug: string;
  protoId: string;
  htmlPath: string;
  thumbPath: string;
}

function parseArgs(argv: string[]) {
  const force = argv.includes('--force');
  const sprintArg = argv.find((a) => a.startsWith('--sprint='));
  const sprint = sprintArg ? sprintArg.slice('--sprint='.length) : null;
  return { force, sprint };
}

async function findTargets(sprintFilter: string | null): Promise<Target[]> {
  const targets: Target[] = [];
  if (!existsSync(SPRINTS_DIR)) return targets;

  const sprintEntries = await readdir(SPRINTS_DIR, { withFileTypes: true });
  for (const entry of sprintEntries) {
    if (!entry.isDirectory()) continue;
    if (sprintFilter && entry.name !== sprintFilter) continue;

    const appDir = join(SPRINTS_DIR, entry.name, 'prototypes', 'app');
    if (!existsSync(appDir)) continue;

    const protoDirs = await readdir(appDir, { withFileTypes: true });
    for (const proto of protoDirs) {
      if (!proto.isDirectory()) continue;
      const htmlPath = join(appDir, proto.name, 'prototype.html');
      if (!existsSync(htmlPath)) continue;
      targets.push({
        sprintSlug: entry.name,
        protoId: proto.name,
        htmlPath,
        thumbPath: join(appDir, proto.name, 'screenshots', 'default.png'),
      });
    }
  }
  return targets;
}

async function main() {
  const { force, sprint } = parseArgs(process.argv.slice(2));
  const targets = await findTargets(sprint);

  const pending = targets.filter((t) => force || !existsSync(t.thumbPath));
  if (pending.length === 0) {
    console.log(
      `capture-screenshots: nothing to do (${targets.length} prototype(s) already have default.png)`,
    );
    return;
  }

  let puppeteer: typeof import('puppeteer');
  try {
    puppeteer = await import('puppeteer');
  } catch (err) {
    console.warn(
      `capture-screenshots: puppeteer not installed; skipping ${pending.length} missing thumbnail(s). ` +
        `Run \`pnpm install\` locally to capture them.`,
    );
    return;
  }

  let browser: import('puppeteer').Browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `capture-screenshots: Chromium unavailable (${msg}); skipping ${pending.length} missing thumbnail(s). ` +
        `Commit the screenshots from a dev machine where puppeteer can launch.`,
    );
    return;
  }

  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    for (const t of pending) {
      const rel = relative(REPO_ROOT, t.htmlPath);
      try {
        await mkdir(join(t.thumbPath, '..'), { recursive: true });
        const url = pathToFileURL(t.htmlPath).toString();
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
        await new Promise((r) => setTimeout(r, WAIT_AFTER_LOAD_MS));
        await page.screenshot({ path: t.thumbPath, type: 'png' });
        console.log(`  ✓ ${t.sprintSlug}/${t.protoId}  (${rel})`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ ${t.sprintSlug}/${t.protoId}  — ${msg}`);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
