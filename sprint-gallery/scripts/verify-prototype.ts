/**
 * Click-test smoke verifier for sprint prototype.html files.
 *
 * Loads each prototype.html under file:// via puppeteer, listens for console
 * errors + unhandled rejections, then clicks every [onclick] and
 * .state-toggle element. Any JS error during load or click fails the gate.
 *
 * CLI:  pnpm verify:prototypes [--sprint=<slug>] [--fail-fast]
 * Exit: 0 on all-pass, 1 on any failure.
 *
 * If Puppeteer cannot launch (Chromium missing), logs warning and exits 0
 * so CI environments without Chromium don't block the pipeline — matches
 * capture-screenshots.ts policy.
 */
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SPRINTS_DIR, REPO_ROOT } from '../src/lib/paths.js';

export interface VerifyResult {
  file: string;
  status: 'pass' | 'fail' | 'skipped';
  consoleErrors: string[];
  unhandledRejections: string[];
  clickedElements: number;
  clickErrors: string[];
  durationMs: number;
}

const CLICK_SELECTORS = [
  '[onclick]',
  '.state-toggle',
  '[data-state-toggle]',
  '[data-tab]',
  '[data-action]',
  '[data-nav]',
  '[data-close-sheet]',
  '[role="menuitem"]',
  // role="tab" 은 거의 항상 [data-tab] 과 중복 — 추가 안 함 (false positive 우려)
];
const LOAD_TIMEOUT_MS = 15_000;
const WAIT_AFTER_LOAD_MS = 300;
const PER_CLICK_TIMEOUT_MS = 2_000;

export async function verifyPrototype(htmlPath: string): Promise<VerifyResult> {
  const start = Date.now();
  const result: VerifyResult = {
    file: htmlPath,
    status: 'pass',
    consoleErrors: [],
    unhandledRejections: [],
    clickedElements: 0,
    clickErrors: [],
    durationMs: 0,
  };

  let puppeteer: typeof import('puppeteer');
  try {
    puppeteer = await import('puppeteer');
  } catch {
    result.status = 'skipped';
    result.durationMs = Date.now() - start;
    return result;
  }

  let browser: import('puppeteer').Browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch {
    result.status = 'skipped';
    result.durationMs = Date.now() - start;
    return result;
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 430, height: 985 });

    // Auto-dismiss alert/confirm/prompt — they block click protocol otherwise.
    page.on('dialog', (dialog) => {
      dialog.dismiss().catch(() => {});
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') result.consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      result.consoleErrors.push(err.message);
    });
    page.on('requestfailed', (req) => {
      if (req.url().startsWith('file://')) {
        result.consoleErrors.push(`requestfailed: ${req.url()}`);
      }
    });

    await page.goto(pathToFileURL(htmlPath).href, {
      waitUntil: 'load',
      timeout: LOAD_TIMEOUT_MS,
    });
    await new Promise((r) => setTimeout(r, WAIT_AFTER_LOAD_MS));

    const handles = await page.evaluateHandle((selectors: string[]) => {
      const set = new Set<Element>();
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach((el) => set.add(el));
      }
      return Array.from(set);
    }, CLICK_SELECTORS);

    const count = await page.evaluate((h) => (h as unknown as Element[]).length, handles);
    result.clickedElements = count;

    for (let i = 0; i < count; i++) {
      const clickPromise = page.evaluate((h, idx) => {
        const el = (h as unknown as Element[])[idx] as HTMLElement;
        el.click();
      }, handles, i);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`click timeout (>${PER_CLICK_TIMEOUT_MS}ms)`)), PER_CLICK_TIMEOUT_MS),
      );
      try {
        await Promise.race([clickPromise, timeoutPromise]);
        await new Promise((r) => setTimeout(r, 50));
      } catch (err: unknown) {
        result.clickErrors.push(`#${i}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (result.consoleErrors.length > 0) {
      for (const e of result.consoleErrors) result.clickErrors.push(e);
    }
  } finally {
    await browser.close();
  }

  if (result.clickErrors.length > 0 || result.unhandledRejections.length > 0) {
    result.status = 'fail';
  }
  result.durationMs = Date.now() - start;
  return result;
}

interface Target {
  sprintSlug: string;
  protoId: string;
  htmlPath: string;
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
      targets.push({ sprintSlug: entry.name, protoId: proto.name, htmlPath });
    }
  }
  return targets;
}

function parseArgs(argv: string[]) {
  const sprintArg = argv.find((a) => a.startsWith('--sprint='));
  const sprint = sprintArg ? sprintArg.slice('--sprint='.length) : null;
  const failFast = argv.includes('--fail-fast');
  return { sprint, failFast };
}

async function main() {
  const { sprint, failFast } = parseArgs(process.argv.slice(2));
  const targets = await findTargets(sprint);
  if (targets.length === 0) {
    console.log('verify-prototype: no prototypes found');
    return;
  }

  const results: Array<VerifyResult & { sprintSlug: string; protoId: string }> = [];
  let skipped = false;
  for (const t of targets) {
    const r = await verifyPrototype(t.htmlPath);
    if (r.status === 'skipped') {
      skipped = true;
      console.warn(`verify-prototype: puppeteer unavailable — skipping all targets`);
      break;
    }
    results.push({ ...r, sprintSlug: t.sprintSlug, protoId: t.protoId });
    const rel = relative(REPO_ROOT, t.htmlPath);
    const label = r.status === 'pass' ? '✓' : '✗';
    console.log(`${label} [${r.durationMs}ms] ${rel} — clicked ${r.clickedElements}, errors ${r.clickErrors.length}`);
    if (r.status === 'fail') {
      for (const e of r.clickErrors) console.log(`    ${e}`);
      if (failFast) break;
    }
  }

  if (skipped) {
    process.exit(0);
  }
  const failed = results.filter((r) => r.status === 'fail');
  if (failed.length > 0) {
    console.error(`verify-prototype: ${failed.length}/${results.length} FAILED`);
    process.exit(1);
  }
  console.log(`verify-prototype: ${results.length}/${results.length} passed`);
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('verify-prototype.ts');
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
