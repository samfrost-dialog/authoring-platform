/**
 * Resolves a theme into a CSS string for injection into preview and SCORM exports.
 * Handles Google Fonts loading, custom R2 fonts (base64 embedded), and custom CSS.
 */

type Theme = {
  primary_color?: string | null
  secondary_color?: string | null
  accent_color?: string | null
  background_color?: string | null
  text_color?: string | null
  heading_font?: string | null
  body_font?: string | null
  button_style?: { borderRadius?: string; padding?: string; shadow?: boolean } | null
  custom_css?: string | null
}

export function buildThemeCSS(theme: Theme): string {
  const primary    = theme.primary_color    || '#4F46E5'
  const secondary  = theme.secondary_color  || '#7C3AED'
  const accent     = theme.accent_color     || '#06B6D4'
  const bg         = theme.background_color || '#FFFFFF'
  const text       = theme.text_color       || '#111827'
  const headingFont = theme.heading_font    || 'Inter'
  const bodyFont   = theme.body_font        || 'Inter'
  const btnRadius  = theme.button_style?.borderRadius || '0.375rem'
  const btnPadding = theme.button_style?.padding      || 'regular'
  const btnShadow  = theme.button_style?.shadow       || false

  const btnPy = btnPadding === 'compact' ? '6px' : btnPadding === 'large' ? '14px' : '10px'
  const btnPx = btnPadding === 'compact' ? '14px' : btnPadding === 'large' ? '28px' : '20px'

  const isCustomHeading = headingFont.startsWith('fonts/')
  const isCustomBody    = bodyFont.startsWith('fonts/')

  // Google Fonts import (only for non-custom fonts)
  const googleFonts = [
    !isCustomHeading ? headingFont : null,
    !isCustomBody    ? bodyFont    : null,
  ]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
    .map((f) => `family=${(f as string).replace(/ /g, '+')}:wght@400;500;600;700`)
    .join('&')

  const fontImport = googleFonts
    ? `@import url('https://fonts.googleapis.com/css2?${googleFonts}&display=swap');`
    : ''

  return `
${fontImport}

:root {
  --theme-primary:      ${primary};
  --theme-secondary:    ${secondary};
  --theme-accent:       ${accent};
  --theme-bg:           ${bg};
  --theme-text:         ${text};
  --theme-heading-font: '${isCustomHeading ? 'CustomHeading' : headingFont}', sans-serif;
  --theme-body-font:    '${isCustomBody    ? 'CustomBody'    : bodyFont}',    sans-serif;
  --theme-btn-radius:   ${btnRadius};
  --theme-btn-py:       ${btnPy};
  --theme-btn-px:       ${btnPx};
  --theme-btn-shadow:   ${btnShadow ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'};
}

body {
  background-color: var(--theme-bg);
  color: var(--theme-text);
  font-family: var(--theme-body-font);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--theme-heading-font);
  color: var(--theme-text);
}

.theme-btn-primary {
  background-color: var(--theme-primary);
  color: #fff;
  border-radius: var(--theme-btn-radius);
  padding: var(--theme-btn-py) var(--theme-btn-px);
  box-shadow: var(--theme-btn-shadow);
  border: none;
  cursor: pointer;
  font-family: var(--theme-body-font);
  font-weight: 500;
}

.theme-btn-outline {
  background-color: transparent;
  color: var(--theme-primary);
  border: 2px solid var(--theme-primary);
  border-radius: var(--theme-btn-radius);
  padding: var(--theme-btn-py) var(--theme-btn-px);
  cursor: pointer;
  font-family: var(--theme-body-font);
  font-weight: 500;
}

.theme-progress-bar {
  background-color: var(--theme-accent);
}

.theme-callout {
  border-left: 4px solid var(--theme-primary);
  background-color: color-mix(in srgb, var(--theme-primary) 10%, transparent);
}

.theme-quote {
  border-left: 4px solid var(--theme-accent);
}

${theme.custom_css || ''}
`.trim()
}

export function getGoogleFontNames(theme: Theme): string[] {
  const fonts = [theme.heading_font, theme.body_font]
    .filter((f): f is string => !!f && !f.startsWith('fonts/'))
  return [...new Set(fonts)]
}