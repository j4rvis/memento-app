export type ThemeName = 'classic' | 'broadsheet' | 'vintage' | 'elegant' | 'bold';

export interface NewspaperTheme {
  name: ThemeName;
  label: string;
  description: string;
  googleFontsUrl?: string;
  cssVars: Record<string, string>;
}

/**
 * Build the :root CSS custom-properties block for a given config.
 * Inject this via md-to-pdf's `css` option (page.addStyleTag) so it lands
 * in the real <head> — not inside <body> where md-to-pdf puts our HTML content.
 */
export function buildThemeCss(theme: NewspaperTheme): string {
  const vars = Object.entries(theme.cssVars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  return `:root {\n${vars}\n}`;
}

export const THEMES: Record<ThemeName, NewspaperTheme> = {
  classic: {
    name: 'classic',
    label: 'Classic',
    description: 'Traditional black & white broadsheet',
    cssVars: {
      '--np-font-heading': "Georgia, 'Times New Roman', serif",
      '--np-font-body': "Georgia, 'Times New Roman', serif",
      '--np-text': '#000',
      '--np-heading': '#000',
      '--np-muted': '#666',
      '--np-accent': '#333',
      '--np-border': '#ccc',
      '--np-bg': '#fff',
      '--np-card-bg': '#fafafa',
      '--np-card-top-border': '#333',
      '--np-masthead-letter-spacing': '0.05em',
      '--np-masthead-transform': 'uppercase',
      '--np-border-width': '2px',
      '--np-border-style': 'solid',
    },
  },
  broadsheet: {
    name: 'broadsheet',
    label: 'Broadsheet',
    description: 'Professional editorial with elegant serif fonts',
    googleFontsUrl:
      'family=Playfair+Display:wght@700;900&family=Libre+Baskerville&display=block',
    cssVars: {
      '--np-font-heading': "'Playfair Display', Georgia, serif",
      '--np-font-body': "'Libre Baskerville', Georgia, serif",
      '--np-text': '#1a1a1a',
      '--np-heading': '#111',
      '--np-muted': '#555',
      '--np-accent': '#222',
      '--np-border': '#bbb',
      '--np-bg': '#fff',
      '--np-card-bg': '#f8f8f8',
      '--np-card-top-border': '#222',
      '--np-masthead-letter-spacing': '0.08em',
      '--np-masthead-transform': 'uppercase',
      '--np-border-width': '1px',
      '--np-border-style': 'solid',
    },
  },
  vintage: {
    name: 'vintage',
    label: 'Vintage',
    description: 'Aged newspaper with warm sepia tones',
    googleFontsUrl:
      'family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=block',
    cssVars: {
      '--np-font-heading': "'Old Standard TT', Georgia, serif",
      '--np-font-body': "'Old Standard TT', Georgia, serif",
      '--np-text': '#2c2416',
      '--np-heading': '#3d2f1a',
      '--np-muted': '#7a6b52',
      '--np-accent': '#7b6b47',
      '--np-border': '#c4b49a',
      '--np-bg': '#fdf8f0',
      '--np-card-bg': '#f5ede0',
      '--np-card-top-border': '#7b6b47',
      '--np-masthead-letter-spacing': '0.03em',
      '--np-masthead-transform': 'none',
      '--np-border-width': '1px',
      '--np-border-style': 'solid',
    },
  },
  elegant: {
    name: 'elegant',
    label: 'Elegant',
    description: 'Refined luxury style with hairline borders',
    googleFontsUrl:
      'family=Playfair+Display:wght@700&family=Lora&display=block',
    cssVars: {
      '--np-font-heading': "'Playfair Display', Georgia, serif",
      '--np-font-body': "'Lora', Georgia, serif",
      '--np-text': '#1c1814',
      '--np-heading': '#1c1814',
      '--np-muted': '#5a5048',
      '--np-accent': '#333',
      '--np-border': '#d4c4b0',
      '--np-bg': '#fff',
      '--np-card-bg': '#faf8f5',
      '--np-card-top-border': '#1c1814',
      '--np-masthead-letter-spacing': '0.12em',
      '--np-masthead-transform': 'uppercase',
      '--np-border-width': '1px',
      '--np-border-style': 'solid',
    },
  },
  bold: {
    name: 'bold',
    label: 'Bold',
    description: 'High-contrast tabloid with thick borders',
    googleFontsUrl:
      'family=Oswald:wght@700&family=Roboto&display=block',
    cssVars: {
      '--np-font-heading': "'Oswald', Impact, sans-serif",
      '--np-font-body': "'Roboto', Arial, sans-serif",
      '--np-text': '#000',
      '--np-heading': '#000',
      '--np-muted': '#444',
      '--np-accent': '#000',
      '--np-border': '#000',
      '--np-bg': '#fff',
      '--np-card-bg': '#f0f0f0',
      '--np-card-top-border': '#000',
      '--np-masthead-letter-spacing': '0.02em',
      '--np-masthead-transform': 'uppercase',
      '--np-border-width': '4px',
      '--np-border-style': 'solid',
    },
  },
};
