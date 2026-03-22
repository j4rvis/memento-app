/**
 * Newspaper PDF test generator
 *
 * Reads all configs from tests/newspaper/configs/*.json,
 * fetches live weather data where needed, renders each config
 * to a PDF, and writes it to tests/newspaper/output/.
 *
 * Usage:
 *   pnpm generate-newspapers
 *   # or directly:
 *   npx tsx tests/newspaper/generate.ts
 */

import { writeFileSync, mkdirSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fetchWeather, render } from '../../src/modules/newspaper/engine/index';
import type {
  NewspaperConfig,
  Block,
  Page,
  WeatherData,
} from '../../src/modules/newspaper/lib/types';

const root = process.cwd();
const configsDir = join(root, 'tests/newspaper/configs');
const outputDir = join(root, 'tests/newspaper/output');

mkdirSync(outputDir, { recursive: true });

// Cache weather lookups to avoid duplicate API calls within a single run
const weatherCache = new Map<string, WeatherData>();

async function getWeather(
  location: string,
  unit: 'celsius' | 'fahrenheit' = 'celsius',
): Promise<WeatherData> {
  const key = `${location}:${unit}`;
  if (!weatherCache.has(key)) {
    weatherCache.set(key, await fetchWeather(location, unit, 5));
  }
  return weatherCache.get(key)!;
}

async function injectWeather(blocks: Block[]): Promise<Block[]> {
  return Promise.all(
    blocks.map(async (block) => {
      if (block.type === 'weather' && !block.data) {
        try {
          const data = await getWeather(block.location, block.unit ?? 'celsius');
          return { ...block, data };
        } catch (err) {
          console.warn(`    ⚠ Weather fetch failed for "${block.location}": ${err}`);
          return block;
        }
      }
      return block;
    }),
  );
}

async function injectWeatherInConfig(config: NewspaperConfig): Promise<NewspaperConfig> {
  async function processPage(page: Page): Promise<Page> {
    if (page.layout === 'single') {
      return { ...page, blocks: await injectWeather(page.blocks ?? []) };
    }
    const columns = await Promise.all((page.columns ?? []).map((col) => injectWeather(col)));
    return { ...page, columns };
  }
  return { ...config, pages: await Promise.all(config.pages.map(processPage)) };
}

async function generateAll() {
  const files = readdirSync(configsDir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  console.log(`\nNewspaper PDF Generator`);
  console.log(`Found ${files.length} config(s) in tests/newspaper/configs/\n`);

  let passed = 0;
  let failed = 0;

  for (const file of files) {
    const name = file.replace('.json', '');
    process.stdout.write(`  ${name} ... `);

    try {
      const raw = readFileSync(join(configsDir, file), 'utf-8');
      let config: NewspaperConfig = JSON.parse(raw);
      config = await injectWeatherInConfig(config);
      const pdf = await render(config);
      const outPath = join(outputDir, `${name}.pdf`);
      writeFileSync(outPath, pdf);
      console.log(`✓  (${Math.round(pdf.length / 1024)} KB)`);
      passed++;
    } catch (err) {
      console.log(`✗`);
      console.error(`    Error: ${err}`);
      failed++;
    }
  }

  console.log(`\n${passed} generated, ${failed} failed`);
  console.log(`Output: tests/newspaper/output/\n`);
}

generateAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
