import puppeteer from 'puppeteer';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const HTML = resolve(process.argv[2]);
const OUT = resolve(process.argv[3]);

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 985, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(HTML).href, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: OUT });
  await browser.close();
  console.log('saved', OUT);
})();
