export interface Theme {
  id: string
  org_id: string | null
  name: string
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  background_color: string | null
  text_color: string | null
  heading_font: string | null
  body_font: string | null
  button_style: {
    borderRadius: string
    padding: 'compact' | 'regular' | 'large'
    shadow: boolean
  } | null
  logo_url: string | null
  cover_style: 'gradient' | 'image' | 'solid' | 'video' | null
  custom_css: string | null
  created_at: string
}

export const DEFAULT_THEME: Omit<Theme, 'id' | 'org_id' | 'created_at'> = {
  name: 'New Theme',
  primary_color: '#4F46E5',
  secondary_color: '#7C3AED',
  accent_color: '#06B6D4',
  background_color: '#FFFFFF',
  text_color: '#111827',
  heading_font: 'Inter',
  body_font: 'Inter',
  button_style: { borderRadius: '0.375rem', padding: 'regular', shadow: false },
  logo_url: null,
  cover_style: 'gradient',
  custom_css: null,
}

export function themeToCSS(theme: Partial<Theme>): string {
  return `
    --theme-primary: ${theme.primary_color || '#4F46E5'};
    --theme-secondary: ${theme.secondary_color || '#7C3AED'};
    --theme-accent: ${theme.accent_color || '#06B6D4'};
    --theme-bg: ${theme.background_color || '#FFFFFF'};
    --theme-text: ${theme.text_color || '#111827'};
    --theme-heading-font: '${theme.heading_font || 'Inter'}', sans-serif;
    --theme-body-font: '${theme.body_font || 'Inter'}', sans-serif;
    --theme-btn-radius: ${theme.button_style?.borderRadius || '0.375rem'};
  `.trim()
}