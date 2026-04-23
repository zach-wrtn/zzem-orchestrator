/**
 * Capture visual baseline PNGs of 4 key routes from the CURRENT built site.
 * Run once on main before starting the redesign. Every PR diffs against these.
 *
 * Usage: pnpm exec tsx scripts/visual-baseline.ts
 * Prereq: `pnpm run build && pnpm run preview` running in another shell
 *         (defaults to http://localhost:4321/zzem-orchestrator)
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer';

const BASE = process.env.BASELINE_URL ?? 'http://localhost:4321/zzem-orchestrator';
const OUT = 'tests/visual/baseline';

const ROUTES: Array<{ name: string; path: string; viewport: { width: number; height: number } }> = [
  { name: 'home-desktop', path: '/', viewport: { width: 1280, height: 800 } },
  { name: 'home-mobile', path: '/', viewport: { width: 390, height: 844 } },
  { name: 'detail-desktop', path: '/sprints/ugc-platform-002/', viewport: { width: 1280, height: 800 } },
  { name: 'detail-mobile', path: '/sprints/ugc-platform-002/', viewport: { width: 390, height: 844 } },
];

async function main() {
  if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  for (const r of ROUTES) {
    await page.setViewport({ ...r.viewport, deviceScaleFactor: 2 });
    await page.goto(BASE + r.path, { waitUntil: 'networkidle0' });
    await new Promise((res) => setTimeout(res, 400));
    const out = join(OUT, `${r.name}.png`);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`  ✓ ${r.name} → ${out}`);
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
