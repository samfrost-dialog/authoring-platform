/**
 * SCORM 1.2 HTML lesson renderer.
 * Produces self-contained HTML that matches the preview renderer output.
 * For Rise-imported courses, uses the same inline styles as the preview.
 */

interface Block {
  id: string
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any
}

interface Lesson {
  id: string
  title: string
  position: number
}

interface Theme {
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

interface RiseMetadata {
  accentColor: string
  bodyTypeface: string
  headingTypeface: string
  uiTypeface: string
  blockCorners: string
}

interface RenderOptions {
  lesson: Lesson
  blocks: Block[]
  allLessons: Lesson[]
  theme: Theme | null
  courseTitle: string
  passingScore: number
  themeCSS: string
  riseMetadata?: RiseMetadata | null
}

export function renderLesson(opts: RenderOptions): string {
  const { lesson, blocks, allLessons, theme, courseTitle, passingScore, themeCSS, riseMetadata } = opts

  const scos = allLessons.filter((l) => !('is_section_header' in l && (l as { is_section_header?: boolean }).is_section_header))
  const currentIndex = scos.findIndex((l) => l.id === lesson.id)
  const prevLesson   = currentIndex > 0 ? scos[currentIndex - 1] : null
  const nextLesson   = currentIndex < scos.length - 1 ? scos[currentIndex + 1] : null
  const isLast       = !nextLesson

  const primary      = riseMetadata?.accentColor || theme?.primary_color || '#0076ce'
  const bg           = theme?.background_color || '#FFFFFF'
  const text         = theme?.text_color || '#111827'
  const headingFont  = riseMetadata?.headingTypeface || theme?.heading_font || 'Roboto'
  const bodyFont     = riseMetadata?.bodyTypeface    || theme?.body_font    || 'Roboto'

  const googleFonts = [...new Set([headingFont, bodyFont, riseMetadata?.uiTypeface].filter(Boolean))]
    .filter((f) => f && !f!.startsWith('fonts/'))
    .map((f) => `family=${f!.replace(/ /g, '+')}:wght@400;500;600;700`)
    .join('&')

  // Build Rise CSS variables if this is a Rise course
  const riseCssVars = riseMetadata ? buildRiseCssVars(riseMetadata) : ''

  const blocksHtml = blocks.map((block) =>
    renderBlock(block, primary, text, headingFont, bodyFont, !!riseMetadata)
  ).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(lesson.title)} — ${escHtml(courseTitle)}</title>
  ${googleFonts ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${googleFonts}&display=swap">` : ''}
  <link rel="stylesheet" href="../../shared/styles.css">
  <script src="../../shared/scorm_api.js"></script>
  <style>
    ${riseCssVars}
    ${themeCSS}
    *, *::before, *::after { box-sizing: border-box; }
    html { font-size: ${riseMetadata ? '10px' : '16px'}; }
    body {
      margin: 0; padding: 0;
      background: ${bg};
      color: ${text};
      font-family: '${bodyFont}', sans-serif;
      font-size: ${riseMetadata ? '1.7rem' : '1rem'};
      line-height: ${riseMetadata ? '1.94' : '1.6'};
    }
    .lesson-nav {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: ${bg}; border-top: 1px solid ${text}20;
      padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center;
      z-index: 100;
    }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: ${primary}; color: #fff; text-decoration: none;
      padding: 0.625rem 1.5rem; border-radius: 0.5rem;
      font-weight: 600; font-size: ${riseMetadata ? '1.4rem' : '0.875rem'};
      border: none; cursor: pointer;
    }
    .btn-nav {
      display: inline-flex; align-items: center; gap: 0.5rem;
      color: ${text}99; text-decoration: none;
      font-size: ${riseMetadata ? '1.4rem' : '0.875rem'};
    }
    .lesson-header {
      padding: 3rem;
      border-bottom: 1px solid ${text}15;
    }
    .lesson-label {
      font-size: ${riseMetadata ? '1.1rem' : '0.75rem'};
      font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.08em; color: ${primary};
      margin: 0 0 0.5rem;
    }
    .lesson-title {
      font-size: ${riseMetadata ? '3.2rem' : '1.75rem'};
      font-weight: 700; margin: 0;
      font-family: '${headingFont}', sans-serif;
      color: ${text};
    }
    .content-wrap { padding-bottom: 80px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: ${primary}; color: #fff; padding: 17px 15px; font-weight: 700; text-align: left; border: 1px solid rgba(255,255,255,0.2); }
    td { padding: 17px 15px; border: 1px solid #ddd; vertical-align: middle; }
    tr:nth-child(even) td { background: #f5f5f5; }
    .rise-table-wrap { overflow-x: auto; }
    a { color: ${primary}; }
  </style>
</head>
<body>
  <div class="content-wrap">
    <div class="lesson-header">
      <p class="lesson-label">Lesson ${currentIndex + 1} of ${scos.length}</p>
      <h1 class="lesson-title">${escHtml(lesson.title)}</h1>
    </div>

    ${blocksHtml || '<p style="color:#999;padding:2rem">This lesson has no content.</p>'}
  </div>

  <nav class="lesson-nav">
    <div>
      ${prevLesson ? `<a href="../${prevLesson.id}/index.html" class="btn-nav" onclick="ScormAPI && ScormAPI.setLocation('${prevLesson.id}')">← Previous</a>` : '<span></span>'}
    </div>
    <div>
      ${isLast
        ? `<button class="btn-primary" onclick="completeCourse()">Complete ✓</button>`
        : `<a href="../${nextLesson!.id}/index.html" class="btn-primary" onclick="ScormAPI && ScormAPI.setLocation('${nextLesson!.id}')">Next →</a>`
      }
    </div>
  </nav>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      if (window.ScormAPI) {
        ScormAPI.setLocation('${lesson.id}');
        ${isLast ? '' : "ScormAPI.setLessonStatus('incomplete');"}
      }
    });
    function completeCourse() {
      if (window.ScormAPI) {
        ScormAPI.setLessonStatus('completed');
        ScormAPI.commit();
        ScormAPI.finish();
      }
      document.querySelector('.lesson-nav').innerHTML =
        '<div style="width:100%;text-align:center;color:#16a34a;font-weight:600">✓ Course complete — you may close this window.</div>';
    }
  </script>
</body>
</html>`
}

// ── Rise CSS variable generator ───────────────────────────────────────────────

function buildRiseCssVars(meta: RiseMetadata): string {
  const accent = meta.accentColor || '#0076ce'
  const h = accent.replace('#', '')
  const r = parseInt(h.slice(0,2), 16)
  const g = parseInt(h.slice(2,4), 16)
  const b = parseInt(h.slice(4,6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const contrast = lum < 0.5 ? '#ffffff' : '#000000'
  const contrastRgb = lum < 0.5 ? '255, 255, 255' : '0, 0, 0'
  const tr = Math.round(r + (255-r)*0.85)
  const tg = Math.round(g + (255-g)*0.85)
  const tb = Math.round(b + (255-b)*0.85)
  const tint = `#${tr.toString(16).padStart(2,'0')}${tg.toString(16).padStart(2,'0')}${tb.toString(16).padStart(2,'0')}`

  return `
    :root {
      --color-theme: ${accent};
      --color-theme-rgb: ${r}, ${g}, ${b};
      --color-theme-contrast: ${contrast};
      --color-theme-contrast-rgb: ${contrastRgb};
      --color-theme-tint: ${tint};
      --color-theme-transparent: rgba(${r}, ${g}, ${b}, 0);
      --font-family-body: '${meta.bodyTypeface}', sans-serif;
      --font-family-head: '${meta.headingTypeface}', sans-serif;
      --font-family-ui: '${meta.uiTypeface}', sans-serif;
    }`
}

// ── Block renderer ────────────────────────────────────────────────────────────

function renderBlock(
  block: Block,
  primary: string,
  textColor: string,
  headingFont: string,
  bodyFont: string,
  isRiseCourse: boolean
): string {
  const c = block.content || {}

  // Section background
  const bgClass  = c.bgClass as string || ''
  const bgColor  = c.bgColor as string | undefined
  const ptPx     = ((c.paddingTop    as number) ?? 3) * 5
  const pbPx     = ((c.paddingBottom as number) ?? 3) * 5

  const sectionBg =
    bgClass === 'bg--type-black'  ? '#000000' :
    bgClass === 'bg--type-dark'   ? '#1a1a1a' :
    bgClass === 'bg--type-accent' ? primary :
    bgClass === 'bg--type-color' && bgColor ? bgColor :
    'transparent'

  const sectionFg = sectionBg === 'transparent' || sectionBg === '#ffffff' ? textColor : '#ffffff'

  const sectionCss = sectionBg !== 'transparent'
    ? `background-color:${sectionBg};color:${sectionFg};`
    : ''

  const wrapStyle = `padding-top:${ptPx}px;padding-bottom:${pbPx}px;${sectionCss}`
  const innerStyle = 'max-width:1020px;margin:0 auto;padding-left:30px;padding-right:30px;'

  switch (block.type) {

    case 'text': {
      const html     = c.html as string || ''
      const variant  = c.riseVariant as string || ''
      const tw       = (c.textWidth as number) ?? 92
      const isHead   = variant.includes('heading') || variant.includes('subheading')
      const clean    = stripEditorDivs(html)
      const fontStyle = isHead
        ? `font-family:'${headingFont}',sans-serif;font-size:2.8rem;font-weight:700;line-height:1.25;color:${sectionFg};`
        : `font-family:'${bodyFont}',sans-serif;font-size:1.7rem;line-height:1.94;color:${sectionFg};`
      return `<div style="${wrapStyle}">
        <div style="${innerStyle}">
          <div style="max-width:${tw}%;margin:0 auto;${fontStyle}">${clean}</div>
        </div>
      </div>`
    }

    case 'video': {
      const vidUrl    = c.publicUrl || c.src
      const posterUrl = c.posterPublicUrl || c.poster
      if (!vidUrl) return ''
      return `<div style="padding-top:${ptPx}px;padding-bottom:${pbPx}px;${sectionCss}">
        <div style="max-width:1100px;margin:0 auto;">
          <video src="${escAttr(String(vidUrl))}"
            ${posterUrl ? `poster="${escAttr(String(posterUrl))}"` : ''}
            controls style="width:100%;display:block;max-height:620px;object-fit:contain;background:#000;">
          </video>
        </div>
      </div>`
    }

    case 'image': {
      const imgUrl    = c.publicUrl || c.src
      const caption   = c.caption   as string || ''
      const paragraph = c.paragraph as string || ''
      const variant   = c.riseVariant as string || ''
      const overlayOpacity = parseFloat(String(c.overlayOpacity ?? 0.1))
      const overlayColor   = c.overlayColor as string || '#000'
      const zoomable  = !!c.zoomOnClick

      if (!imgUrl) return ''

      const imgTag = `<img src="${escAttr(String(imgUrl))}" alt="" style="width:100%;display:block;${zoomable ? 'cursor:zoom-in;' : ''}"${zoomable ? ' onclick="this.requestFullscreen&&this.requestFullscreen()"' : ''}>`
      const cleanCaption   = stripEditorDivs(caption)
      const cleanParagraph = stripEditorDivs(paragraph)
      const captionText    = cleanCaption.replace(/<[^>]*>/g, '').trim()

      if (variant === 'text overlay') {
        return `<div style="position:relative;overflow:hidden;${sectionCss}padding-top:0;padding-bottom:0;">
          ${imgTag}
          ${overlayOpacity > 0 ? `<div style="position:absolute;inset:0;background:${overlayColor};opacity:${overlayOpacity};pointer-events:none;"></div>` : ''}
          ${cleanCaption ? `<div style="position:absolute;inset:0;display:flex;align-items:center;padding:3rem;max-width:50%;color:#fff;">${cleanCaption}</div>` : ''}
        </div>`
      }

      if (variant === 'hero') {
        return `<div style="${wrapStyle}">
          ${imgTag}
          ${cleanCaption ? `<div style="${innerStyle}padding-top:1.5rem;padding-bottom:0.5rem;font-size:1.2rem;color:${sectionFg};">${cleanCaption}</div>` : ''}
        </div>`
      }

      if (variant === 'text aside') {
        return `<div style="${wrapStyle}">
          <div style="${innerStyle}display:flex;gap:3rem;align-items:flex-start;">
            <div style="flex:0 0 calc(50% - 1.5rem);">
              ${imgTag}
              ${captionText && captionText !== 'Click on image to zoom in.' ? `<p style="font-size:1.2rem;color:#6b7280;margin-top:0.75rem;">${escHtml(captionText)}</p>` : ''}
            </div>
            <div style="flex:1;color:${sectionFg};">${cleanParagraph}</div>
          </div>
        </div>`
      }

      return `<div style="${wrapStyle}">
        <div style="${innerStyle}">
          ${imgTag}
          ${cleanCaption ? `<div style="font-size:1.2rem;color:#6b7280;margin-top:0.75rem;text-align:center;">${cleanCaption}</div>` : ''}
        </div>
      </div>`
    }

    case 'accordion': {
      const items = (c.items as Array<{ id: string; title: string; bodyHtml: string }>) || []
      const itemsHtml = items.map((item) => `
        <details style="border-bottom:1px solid ${sectionFg === '#ffffff' ? 'rgba(255,255,255,0.2)' : '#e5e7eb'};">
          <summary style="cursor:pointer;padding:1.5rem 0;font-size:1.7rem;font-weight:600;list-style:none;display:flex;justify-content:space-between;align-items:center;">
            ${stripEditorDivs(item.title)} <span>▾</span>
          </summary>
          <div style="padding:0 0 1.5rem;font-size:1.7rem;line-height:1.7;">${stripEditorDivs(item.bodyHtml)}</div>
        </details>`).join('')
      return `<div style="${wrapStyle}"><div style="${innerStyle}">${itemsHtml}</div></div>`
    }

    case 'tabs': {
      const items = (c.items as Array<{ id: string; label: string; bodyHtml: string }>) || []
      const tabButtons = items.map((item, i) =>
        `<button onclick="showTab('${block.id}',${i})" id="tab-btn-${block.id}-${i}"
          style="padding:0.75rem 1.25rem;border:none;background:none;cursor:pointer;font-size:1.4rem;font-weight:500;${i === 0 ? `color:${primary};border-bottom:2px solid ${primary};` : 'color:#6b7280;border-bottom:2px solid transparent;'}"
          >${escHtml(item.label)}</button>`).join('')
      const tabPanels = items.map((item, i) =>
        `<div id="tab-${block.id}-${i}" style="padding:1.25rem 0;${i !== 0 ? 'display:none;' : ''}">${item.bodyHtml}</div>`).join('')
      return `<div style="${wrapStyle}"><div style="${innerStyle}">
        <div style="border:1px solid #e5e7eb;border-radius:0.75rem;overflow:hidden;">
          <div style="display:flex;border-bottom:2px solid #e5e7eb;background:#f9fafb;">${tabButtons}</div>
          <div style="padding:1.25rem;">${tabPanels}</div>
        </div>
      </div></div>
      <script>function showTab(id,idx){document.querySelectorAll('[id^="tab-"+id+"-"]').forEach(function(el,i){el.style.display=i===idx?'':'none';});document.querySelectorAll('[id^="tab-btn-"+id+"-"]').forEach(function(btn,i){btn.style.color=i===idx?'${primary}':'#6b7280';btn.style.borderBottomColor=i===idx?'${primary}':'transparent';});}</script>`
    }

    case 'button': {
      if (!c.label) return ''
      const align = c.alignment as string || 'left'
      const justifyMap: Record<string, string> = { center: 'center', right: 'flex-end', left: 'flex-start' }
      return `<div style="${wrapStyle}"><div style="${innerStyle}display:flex;justify-content:${justifyMap[align] || 'flex-start'};">
        <a href="${escAttr(String(c.url || '#'))}" ${c.openInNewTab ? 'target="_blank" rel="noopener"' : ''}
          style="display:inline-flex;align-items:center;padding:0.625rem 1.5rem;background:${primary};color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:600;font-size:1.4rem;">
          ${escHtml(String(c.label))}
        </a>
      </div></div>`
    }

    case 'divider':
      return `<div style="${wrapStyle}"><hr style="border-style:${c.style || 'solid'};border-color:${c.color || '#E5E7EB'};border-top-width:${c.thickness || 1}px;margin:0;"></div>`

    case 'spacer':
      return `<div style="height:${c.height || 40}px;"></div>`

    case 'statement':
      return `<div style="${wrapStyle}"><div style="${innerStyle}">
        <div style="text-align:center;padding:2rem;background:${primary}10;border-radius:0.75rem;">${c.text || ''}</div>
      </div></div>`

    case 'raw_html':
      return `<div style="${wrapStyle}"><div style="${innerStyle}">${c.html || ''}</div></div>`

    case 'quiz':
    case 'knowledge_check':
      return `<div style="${wrapStyle}"><div style="${innerStyle}">
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:0.75rem;padding:2rem;text-align:center;color:#0369a1;">
          Quiz — complete in the online version
        </div>
      </div></div>`

    default:
      return ''
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripEditorDivs(html: string): string {
  if (!html) return ''
  return html
    .replace(/<div[^>]*data-editor-id="[^"]*"[^>]*>/gi, '')
    .replace(/<div[^>]*class="rise-table-wrap"[^>]*>/gi, '<div class="rise-table-wrap" style="overflow-x:auto">')
    .trim()
}

function escHtml(str: string): string {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escAttr(str: string): string {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}