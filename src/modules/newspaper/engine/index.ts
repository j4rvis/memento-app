/**
 * Newspaper PDF Engine
 *
 * render(config) → Promise<Buffer>
 *
 * Pure function: no database access, no side effects.
 * Call from a server action, API route, or cron job.
 *
 * --- Serverless / Vercel deployment note ---
 * Standard Puppeteer (bundled Chromium) does not work on Vercel serverless
 * due to file size limits (~50 MB) and sandbox restrictions.
 *
 * This engine uses @sparticuz/chromium + puppeteer-core, which provides a
 * serverless-compatible Chromium binary. On Vercel you may also need to set:
 *   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true   (in .env / Vercel env vars)
 *
 * @sparticuz/chromium lazily downloads the binary at runtime from an S3 CDN,
 * so cold starts on the first invocation will be ~2–4 seconds slower.
 * Subsequent invocations reuse the cached binary.
 *
 * If you deploy elsewhere (Docker, bare VM) you can pass a local executablePath:
 *   import puppeteer from 'puppeteer';
 *   const executablePath = puppeteer.executablePath();
 */

import type { NewspaperConfig } from '../lib/types';
import { configToHtml } from './config-to-html';
import { THEMES, buildThemeCss, type ThemeName } from './themes';

export { fetchWeather } from './fetchers/weather';
export type { WeatherData } from '../lib/types';

export async function render(config: NewspaperConfig): Promise<Buffer> {
  const html = await configToHtml(config);

  // Resolve theme CSS — injected via page.addStyleTag() into the real <head>,
  // bypassing md-to-pdf's template wrapping that would put it inside <body>.
  const themeName = (config.theme ?? 'classic') as ThemeName;
  const theme = THEMES[themeName] ?? THEMES['classic'];
  const themeCss = buildThemeCss(theme);

  // Lazily import to avoid issues in environments where these are not installed
  const { default: mdToPdf } = await import('md-to-pdf');

  // Use @sparticuz/chromium for serverless-compatible Chromium.
  // On a local dev machine or Docker with Chromium installed, this still works.
  const chromium = await import('@sparticuz/chromium');
  const executablePath = await chromium.default.executablePath();

  const pdf = await mdToPdf(
    { content: html },
    {
      css: themeCss,
      launch_options: {
        executablePath,
        args: chromium.default.args,
        headless: true,
      },
      pdf_options: {
        format: (config.paper_size ?? 'A4') as 'A4' | 'Letter' | 'A5',
        landscape: config.orientation === 'landscape',
        printBackground: true,
        margin: config.margins
          ? {
              top: `${config.margins.top}mm`,
              right: `${config.margins.right}mm`,
              bottom: `${config.margins.bottom}mm`,
              left: `${config.margins.left}mm`,
            }
          : { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      },
    },
  );

  if (!pdf.filename && !pdf.content) {
    throw new Error('PDF rendering produced no output');
  }

  return pdf.content as Buffer;
}
