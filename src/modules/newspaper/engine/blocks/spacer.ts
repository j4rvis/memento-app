import type { SpacerBlock } from '../../lib/types';

export function renderSpacer(block: SpacerBlock): string {
  const height = block.height_mm ?? 10;
  return `<div class="block-spacer" style="height:${height}mm;"></div>`;
}
