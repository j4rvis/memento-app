/**
 * Newspaper PDF Engine
 *
 * render(config) → Promise<Buffer>
 *
 * Pure function: no database access, no side effects.
 * Call from a server action, API route, or cron job.
 *
 * Uses puppeteer-core directly to avoid md-to-pdf file-loading issues
 * with Turbopack (which rewrites __dirname paths).
 *
 * --- Serverless / Vercel deployment note ---
 * Standard Puppeteer (bundled Chromium) does not work on Vercel serverless
 * due to file size limits (~50 MB) and sandbox restrictions.
 *
 * This engine uses @sparticuz/chromium + puppeteer-core in production.
 * Locally it uses the system browser (Brave/Chrome).
 * Set CHROME_EXECUTABLE_PATH in .env.local to override.
 */

import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import type { NewspaperConfig } from '../lib/types';
import { configToHtml } from './config-to-html';

export { fetchWeather } from './fetchers/weather';
export type { WeatherData } from '../lib/types';

const LOCAL_BROWSERS = [
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

async function resolveBrowser(): Promise<{ executablePath: string; args: string[] }> {
  // 1. Explicit override always wins
  if (process.env.CHROME_EXECUTABLE_PATH) {
    return {
      executablePath: process.env.CHROME_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };
  }

  // 2. Try @sparticuz/chromium — on Linux (serverless) trust the path directly;
  //    on macOS verify it's executable since @sparticuz/chromium ships a Linux ELF binary
  try {
    const chromium = await import('@sparticuz/chromium');
    const path = await chromium.default.executablePath();
    if (process.platform !== 'linux') {
      execFileSync(path, ['--version'], { timeout: 3000 });
    }
    return { executablePath: path, args: chromium.default.args };
  } catch {
    // Not executable on this platform (e.g. Linux ELF binary on macOS) — fall through
  }

  // 3. Fall back to locally installed Chromium-based browsers
  for (const path of LOCAL_BROWSERS) {
    if (existsSync(path)) {
      return { executablePath: path, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
    }
  }

  throw new Error(
    'No executable browser found. Set CHROME_EXECUTABLE_PATH or install Google Chrome, Brave, or Chromium.',
  );
}

export async function render(config: NewspaperConfig): Promise<Buffer> {
  // configToHtml returns a complete <!DOCTYPE html> document with all styles embedded.
  const html = await configToHtml(config);

  const { executablePath, args: browserArgs } = await resolveBrowser();

  const puppeteer = await import('puppeteer-core');
  const browser = await puppeteer.default.launch({
    executablePath,
    args: browserArgs,
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const margin = config.margins
      ? {
          top: `${config.margins.top}mm`,
          right: `${config.margins.right}mm`,
          bottom: `${config.margins.bottom}mm`,
          left: `${config.margins.left}mm`,
        }
      : { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' };

    const pdfBuffer = await page.pdf({
      format: (config.paper_size ?? 'A4') as 'A4' | 'Letter' | 'A5',
      landscape: config.orientation === 'landscape',
      printBackground: true,
      margin,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
