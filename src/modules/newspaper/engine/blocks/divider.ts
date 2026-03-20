import type { DividerBlock } from '../../lib/types';

export function renderDivider(block: DividerBlock): string {
  const style = block.style ?? 'solid';
  const margin = block.margin_mm ?? 2;

  if (style === 'decorative') {
    return `<div class="block-divider style-decorative" style="margin:${margin}mm 0;"><div style="text-align:center;font-size:14px;color:#333;">— ✦ —</div></div>`;
  }

  return `<div class="block-divider style-${style}" style="margin:${margin}mm 0;"><hr style="border:none;${hrStyle(style)}"></div>`;
}

function hrStyle(style: DividerBlock['style']): string {
  switch (style) {
    case 'dashed': return 'border-top:1px dashed #666;';
    case 'double': return 'border-top:3px double #000;';
    default:       return 'border-top:1px solid #000;';
  }
}
