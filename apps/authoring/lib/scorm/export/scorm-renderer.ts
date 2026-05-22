/**
 * Renders a course lesson as a self-contained HTML file for SCORM export.
 * All assets are either embedded (base64 < 2MB) or referenced as relative paths.
 * The output includes the SCORM API shim and navigation shell.
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

interface RenderOptions {
  lesson: Lesson
  blocks: Block[]
  allLessons: Lesson[]
  theme: Theme | null
  courseTitle: string
  passingScore: number
  themeCSS: string
}

export function renderLesson(opts: RenderOptions): string {
  const { lesson, blocks, allLessons, theme, courseTitle, passingScore, themeCSS } = opts

  const scos = allLessons.filter((l) => !('is_section_header' in l && (l as { is_section_header?: boolean }).is_section_header))
  const currentIndex = scos.findIndex((l) => l.id === lesson.id)
  const prevLesson = currentIndex > 0 ? scos[currentIndex - 1] : null
  const nextLesson = currentIndex < scos.length - 1 ? scos[currentIndex + 1] : null
  const isLast = !nextLesson

  const primary = theme?.primary_color || '#4F46E5'
  const bg      = theme?.background_color || '#FFFFFF'
  const text    = theme?.text_color || '#111827'
  const headingFont = theme?.heading_font || 'Inter'
  const bodyFont    = theme?.body_font || 'Inter'

  const googleFonts = [...new Set([headingFont, bodyFont])]
    .filter((f) => !f.startsWith('fonts/'))
    .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`)
    .join('&')

  const blocksHtml = blocks.map((block) => renderBlock(block)).join('\n')

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
    ${themeCSS}
    body { background: ${bg}; color: ${text}; font-family: '${bodyFont}', sans-serif; margin: 0; }
    h1,h2,h3,h4,h5,h6 { font-family: '${headingFont}', sans-serif; }
  </style>
</head>
<body>
  <div class="course-shell">
    <!-- Course header -->
    <header class="course-header" style="background: linear-gradient(135deg, ${primary} 0%, ${theme?.secondary_color || '#7C3AED'} 100%);">
      <div class="header-inner">
        <div class="course-meta">
          <p class="lesson-label">Lesson ${currentIndex + 1} of ${scos.length}</p>
          <h1 class="lesson-title">${escHtml(lesson.title)}</h1>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar" style="width: ${Math.round(((currentIndex + 1) / scos.length) * 100)}%"></div>
        </div>
      </div>
    </header>

    <!-- Lesson content -->
    <main class="lesson-content">
      ${blocksHtml || '<p style="color:#999">This lesson has no content.</p>'}
    </main>

    <!-- Navigation -->
    <nav class="lesson-nav">
      <div class="nav-inner">
        <div>
          ${prevLesson ? `<a href="../${prevLesson.id}/index.html" class="btn-nav btn-prev" onclick="ScormAPI && ScormAPI.setLocation('${prevLesson.id}')">← Previous</a>` : ''}
        </div>
        <div>
          ${isLast
            ? `<button class="btn-primary" onclick="completeCourse()">Complete course ✓</button>`
            : `<a href="../${nextLesson!.id}/index.html" class="btn-primary" onclick="ScormAPI && ScormAPI.setLocation('${nextLesson!.id}')">Next lesson →</a>`
          }
        </div>
      </div>
    </nav>
  </div>

  <script>
    // Mark lesson as completed when loaded
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
      // Show completion message
      document.querySelector('.lesson-nav').innerHTML =
        '<div class="nav-inner" style="justify-content:center"><p style="color:#16a34a;font-weight:600">✓ Course complete! You may close this window.</p></div>';
    }
  </script>
</body>
</html>`
}

// ── Block renderers ───────────────────────────────────────────────────────────

function renderBlock(block: Block): string {
  const c = block.content || {}
  const spacing = block.settings?.spacing || 'normal'
  const cls = `block block-${block.type} spacing-${spacing}`

  switch (block.type) {
    case 'text':
      return `<div class="${cls}">${c.html || ''}</div>`

    case 'image':
      if (!c.publicUrl) return ''
      return `<figure class="${cls} align-${c.alignment || 'center'} size-${c.size || 'large'}">
        <img src="${escAttr(c.publicUrl)}" alt="${escAttr(c.alt || '')}" loading="lazy">
        ${c.caption ? `<figcaption>${escHtml(c.caption)}</figcaption>` : ''}
      </figure>`

    case 'video':
      if (!c.publicUrl && !c.src) return ''
      if (c.type === 'youtube' || c.type === 'vimeo') {
        const src = c.type === 'youtube'
          ? c.src.replace('watch?v=', 'embed/')
          : c.src.replace('vimeo.com/', 'player.vimeo.com/video/')
        return `<div class="${cls} video-embed"><iframe src="${escAttr(src)}" allowfullscreen loading="lazy"></iframe></div>`
      }
      return `<div class="${cls}"><video src="${escAttr(c.publicUrl)}" ${c.controls !== false ? 'controls' : ''} ${c.autoPlay ? 'autoplay muted' : ''}></video></div>`

    case 'audio':
      if (!c.publicUrl) return ''
      return `<div class="${cls}">
        <audio src="${escAttr(c.publicUrl)}" controls ${c.autoPlay ? 'autoplay' : ''}></audio>
        ${c.showTranscript !== false && c.transcript ? `<details class="transcript"><summary>Transcript</summary>${c.transcript}</details>` : ''}
      </div>`

    case 'file_download':
      if (!c.publicUrl) return ''
      return `<div class="${cls}"><a href="${escAttr(c.publicUrl)}" download="${escAttr(c.filename || '')}" class="file-download-btn">
        <span class="dl-icon">↓</span>
        <span>${escHtml(c.label || 'Download')}</span>
        ${c.filename ? `<span class="dl-filename">${escHtml(c.filename)}</span>` : ''}
      </a></div>`

    case 'quote':
      return `<blockquote class="${cls} style-${c.style || 'standard'}">
        ${c.text || ''}
        ${c.author ? `<footer>— ${escHtml(c.author)}${c.attribution ? `, ${escHtml(c.attribution)}` : ''}</footer>` : ''}
      </blockquote>`

    case 'callout':
      return `<div class="${cls} callout" style="background:${c.bgColor || 'var(--theme-primary, #4F46E5)'}15;border-left:4px solid ${c.borderColor || 'var(--theme-primary, #4F46E5)'}">
        <span class="callout-icon">${escHtml(c.icon || '💡')}</span>
        <div class="callout-body">${c.html || ''}</div>
      </div>`

    case 'code_block':
      return `<div class="${cls}">
        ${c.language ? `<div class="code-lang">${escHtml(c.language)}</div>` : ''}
        <pre><code class="language-${escAttr(c.language || 'text')}">${escHtml(c.code || '')}</code></pre>
      </div>`

    case 'divider':
      return `<hr class="${cls}" style="border-style:${c.style || 'solid'};border-color:${c.color || '#E5E7EB'};border-top-width:${c.thickness || 1}px">`

    case 'spacer':
      return `<div class="${cls}" style="height:${c.height || 40}px"></div>`

    case 'embed':
      if (!c.url) return ''
      return `<div class="${cls}" style="height:${c.height || 400}px"><iframe src="${escAttr(c.url)}" class="embed-frame" sandbox="allow-scripts allow-same-origin"></iframe></div>`

    case 'accordion': {
      const items = (c.items || []) as Array<{ id: string; title: string; bodyHtml: string }>
      const accordionItems = items.map((item, i) => `
        <details ${i === 0 ? 'open' : ''}>
          <summary>${escHtml(item.title)}</summary>
          <div class="accordion-body">${item.bodyHtml || ''}</div>
        </details>`).join('')
      return `<div class="${cls} accordion">${accordionItems}</div>`
    }

    case 'tabs': {
      const items = (c.items || []) as Array<{ id: string; label: string; bodyHtml: string }>
      const tabButtons = items.map((item, i) =>
        `<button class="tab-btn${i === 0 ? ' active' : ''}" onclick="showTab('${block.id}',${i})">${escHtml(item.label)}</button>`
      ).join('')
      const tabPanels = items.map((item, i) =>
        `<div class="tab-panel${i === 0 ? ' active' : ''}" id="tab_${block.id}_${i}">${item.bodyHtml || ''}</div>`
      ).join('')
      return `<div class="${cls} tabs" id="${block.id}">
        <div class="tab-buttons">${tabButtons}</div>
        <div class="tab-panels">${tabPanels}</div>
      </div>
      <script>
        function showTab(blockId, index) {
          var el = document.getElementById(blockId);
          el.querySelectorAll('.tab-btn').forEach(function(b,i){ b.classList.toggle('active', i===index); });
          el.querySelectorAll('.tab-panel').forEach(function(p,i){ p.classList.toggle('active', i===index); });
        }
      </script>`
    }

    case 'button':
      if (!c.label) return ''
      return `<div class="${cls} btn-wrap align-${c.alignment || 'left'}">
        <a href="${escAttr(c.url || '#')}" ${c.openInNewTab ? 'target="_blank" rel="noopener"' : ''} class="btn-block style-${c.style || 'primary'}">${escHtml(c.label)}</a>
      </div>`

    case 'checkbox_list': {
      const items = (c.items || []) as Array<{ id: string; text: string; checkedByDefault: boolean }>
      const checkItems = items.map((item) =>
        `<li><label><input type="checkbox" ${item.checkedByDefault ? 'checked' : ''}> ${escHtml(item.text)}</label></li>`
      ).join('')
      return `<ul class="${cls} checklist">${checkItems}</ul>`
    }

    case 'statement':
      return `<div class="${cls} statement style-${c.style || 'standard'}">${c.text || ''}</div>`

    case 'quiz':
    case 'knowledge_check':
      return `<div class="${cls} quiz-placeholder">
        <div class="quiz-embed" data-quiz='${JSON.stringify(c).replace(/'/g, "&#39;")}' data-type="${block.type}">
          <p class="quiz-loading">Loading quiz…</p>
        </div>
      </div>`

    case 'scenario':
      return `<div class="${cls} scenario-placeholder">
        <div class="scenario-embed" data-scenario='${JSON.stringify(c).replace(/'/g, "&#39;")}'>
          <p class="scenario-loading">Loading scenario…</p>
        </div>
      </div>`

    case 'raw_html':
      return `<div class="${cls}">${c.html || ''}</div>`

    default:
      return `<div class="${cls} unsupported-block">
        <p style="color:#999;font-size:0.875rem">${escHtml(block.type.replace(/_/g, ' '))} block</p>
      </div>`
  }
}

function escHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escAttr(str: string): string {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}