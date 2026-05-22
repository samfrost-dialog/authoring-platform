'use client'

import { useState } from 'react'
import type { ScenarioContent, Scene } from './scenario-types'

interface Props {
  content: ScenarioContent
}

export default function ScenarioRuntime({ content }: Props) {
  const { scenes, startSceneId, showPathReplay } = content
  const [currentSceneId, setCurrentSceneId] = useState(startSceneId)
  const [path, setPath] = useState<{ sceneId: string; choiceText: string }[]>([])
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [showingReplay, setShowingReplay] = useState(false)

  const currentScene = scenes.find((s) => s.id === currentSceneId) ?? null

  if (!currentScene) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
        Scenario not configured — add scenes in the editor.
      </div>
    )
  }

  function handleChoiceSelect(choiceId: string) {
    setSelectedChoiceId(choiceId)
    const choice = currentScene!.choices.find((c) => c.id === choiceId)
    if (choice?.feedback) {
      setShowFeedback(true)
    } else {
      advanceToChoice(choiceId)
    }
  }

  function advanceToChoice(choiceId: string) {
    const choice = currentScene!.choices.find((c) => c.id === choiceId)
    if (!choice) return

    setPath((prev) => [...prev, { sceneId: currentSceneId, choiceText: choice.text }])
    setSelectedChoiceId(null)
    setShowFeedback(false)

    if (!choice.nextSceneId) {
      setCompleted(true)
      return
    }

    const next = scenes.find((s) => s.id === choice.nextSceneId)
    if (!next) { setCompleted(true); return }

    setCurrentSceneId(choice.nextSceneId)
    if (next.isOutcome) {
      setCompleted(true)
    }
  }

  function restart() {
    setCurrentSceneId(startSceneId)
    setPath([])
    setSelectedChoiceId(null)
    setShowFeedback(false)
    setCompleted(false)
    setShowingReplay(false)
  }

  // ── Path replay ───────────────────────────────────────────────────────────

  if (showingReplay) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Your path</h3>
          <button onClick={() => setShowingReplay(false)} className="text-gray-400 hover:text-gray-600 text-sm">Close</button>
        </div>
        <div className="p-6 space-y-3">
          {path.map((step, i) => {
            const scene = scenes.find((s) => s.id === step.sceneId)
            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium flex-shrink-0">{i + 1}</div>
                  {i < path.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="pb-3">
                  <p className="text-gray-900 text-sm font-medium">{scene?.title || 'Scene'}</p>
                  <p className="text-gray-500 text-xs mt-0.5">You chose: &ldquo;{step.choiceText}&rdquo;</p>
                </div>
              </div>
            )
          })}
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-gray-500 text-sm">{currentScene.title}</p>
          </div>
        </div>
        <div className="px-6 pb-6">
          <button onClick={restart} className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Try again
          </button>
        </div>
      </div>
    )
  }

  // ── Completed outcome ─────────────────────────────────────────────────────

  if (completed && currentScene.isOutcome) {
    const outcomeColors = {
      pass:    { bg: 'bg-green-50', border: 'border-green-200', icon: '#16a34a', text: 'text-green-800' },
      fail:    { bg: 'bg-red-50',   border: 'border-red-200',   icon: '#dc2626', text: 'text-red-800' },
      neutral: { bg: 'bg-gray-50',  border: 'border-gray-200',  icon: '#6b7280', text: 'text-gray-800' },
    }
    const colors = outcomeColors[currentScene.outcomeType || 'neutral']

    return (
      <div className={`rounded-2xl border p-8 ${colors.bg} ${colors.border}`}>
        <div className="text-center mb-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-white border ${colors.border}`}>
            {currentScene.outcomeType === 'pass'
              ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke={colors.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : currentScene.outcomeType === 'fail'
              ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke={colors.icon} strokeWidth="2" strokeLinecap="round"/></svg>
              : <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke={colors.icon} strokeWidth="2"/></svg>
            }
          </div>
          <h3 className={`font-semibold text-lg ${colors.text}`}>{currentScene.title}</h3>
        </div>
        {currentScene.bodyHtml && (
          <div className={`prose prose-sm max-w-none mb-6 ${colors.text}`}
            dangerouslySetInnerHTML={{ __html: currentScene.bodyHtml }} />
        )}
        <div className="flex gap-3">
          <button onClick={restart}
            className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
            Try again
          </button>
          {showPathReplay && path.length > 0 && (
            <button onClick={() => setShowingReplay(true)}
              className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              Review path
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Active scene ──────────────────────────────────────────────────────────

  const selectedChoice = currentScene.choices.find((c) => c.id === selectedChoiceId)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Progress indicator */}
      {path.length > 0 && (
        <div className="px-6 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1">
          {path.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-indigo-400" />
          ))}
          <div className="w-2 h-2 rounded-full bg-indigo-600" />
        </div>
      )}

      <div className="p-6">
        {/* Scene title */}
        <p className="text-indigo-600 text-xs font-medium uppercase tracking-wider mb-2">{currentScene.title}</p>

        {/* Scene body */}
        {currentScene.bodyHtml && (
          <div className="prose prose-gray prose-sm max-w-none mb-6"
            dangerouslySetInnerHTML={{ __html: currentScene.bodyHtml }} />
        )}

        {/* Feedback */}
        {showFeedback && selectedChoice?.feedback && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
            <p className="text-indigo-800 text-sm">{selectedChoice.feedback}</p>
            <button
              onClick={() => advanceToChoice(selectedChoiceId!)}
              className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Choices */}
        {!showFeedback && (
          <div className="space-y-2">
            {currentScene.choices.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No choices configured for this scene.</p>
            ) : (
              currentScene.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoiceSelect(choice.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-left text-sm text-gray-700 transition-all group"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-indigo-500 flex-shrink-0 transition-colors" />
                  {choice.text || 'Choice'}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}