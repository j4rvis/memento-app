import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { render } from '../index';
import type { NewspaperConfig } from '../../lib/types';

const LOCAL_BROWSERS = [
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

function hasBrowser(): boolean {
  if (process.env.CHROME_EXECUTABLE_PATH) return true;
  return LOCAL_BROWSERS.some((p) => existsSync(p));
}

const minimalConfig: NewspaperConfig = {
  title: 'Integration Test',
  pages: [
    {
      layout: 'single',
      blocks: [{ type: 'markdown', content: '# Test\n\nHello from the integration test.' }],
    },
  ],
};

describe('render() integration', () => {
  it.skipIf(!hasBrowser())('produces a valid PDF buffer', async () => {
    const buffer = await render(minimalConfig);
    expect(buffer.slice(0, 5).toString()).toBe('%PDF-');
  }, 30_000);
});
