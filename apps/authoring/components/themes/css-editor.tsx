'use client'

import dynamic from 'next/dynamic'
import { useCallback } from 'react'

// Load CodeMirror client-side only — it's heavy and doesn't need SSR
const CodeMirror = dynamic(
  () => import('@uiw/react-codemirror').then((mod) => mod.default),
  { ssr: false, loading: () => (
    <div className="h-48 bg-[#0D0D0F] border border-[#2A2A2E] rounded-lg flex items-center justify-center">
      <span className="text-[#555] text-xs">Loading editor…</span>
    </div>
  )}
)

interface Props {
  value: string
  onChange: (css: string) => void
}

export default function CssEditor({ value, onChange }: Props) {
  const handleChange = useCallback((val: string) => {
    onChange(val)
  }, [onChange])

  return (
    <div className="space-y-2">
      <div className="rounded-lg overflow-hidden border border-[#2A2A2E] focus-within:border-indigo-500 transition-colors">
        <CssEditorInner value={value} onChange={handleChange} />
      </div>
      <p className="text-[#444] text-xs">
        Injected as a <code className="text-[#666]">&lt;style&gt;</code> tag in exported SCORM packages.
        Use <code className="text-[#666]">var(--theme-primary)</code> etc. to reference theme tokens.
      </p>
      <div className="bg-[#141416] border border-[#1E1E22] rounded-lg p-3">
        <p className="text-[#555] text-xs font-medium mb-2">Available CSS variables</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {[
            '--theme-primary',
            '--theme-secondary',
            '--theme-accent',
            '--theme-bg',
            '--theme-text',
            '--theme-heading-font',
            '--theme-body-font',
            '--theme-btn-radius',
          ].map((v) => (
            <code key={v} className="text-[#666] text-[10px]">{v}</code>
          ))}
        </div>
      </div>
    </div>
  )
}

// Inner component that imports CodeMirror extensions synchronously
// (dynamic import of the parent means these run client-side)
function CssEditorInner({ value, onChange }: Props) {
  // We import these here so they're only evaluated client-side
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { css } = require('@codemirror/lang-css')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { oneDark } = require('@codemirror/theme-one-dark')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const CodeMirrorCore = require('@uiw/react-codemirror').default

  return (
    <CodeMirrorCore
      value={value}
      onChange={onChange}
      extensions={[css()]}
      theme={oneDark}
      minHeight="200px"
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        dropCursor: false,
        allowMultipleSelections: false,
        indentOnInput: true,
        bracketMatching: true,
        autocompletion: true,
        highlightActiveLine: true,
      }}
      style={{ fontSize: '12px' }}
      placeholder={`/* Custom CSS — applied to all exported courses using this theme */

.course-title {
  font-size: 2rem;
}

.lesson-content {
  max-width: 800px;
}`}
    />
  )
}