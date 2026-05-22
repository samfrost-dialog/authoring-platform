'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { Scene, ScenarioContent, Choice } from './scenario-types'
import { makeScene, makeChoice, DEFAULT_SCENARIO } from './scenario-types'

const TiptapEditor = dynamic(
  () => import('@/components/editor/tiptap/tiptap-editor'),
  { ssr: false, loading: () => <div className="h-16 bg-[#0F0F10] border border-[#2A2A2E] rounded-lg animate-pulse" /> }
)

interface Props {
  content: Partial<ScenarioContent>
  onChange: (c: ScenarioContent) => void
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-medium text-[#666] mb-1.5 uppercase tracking-wider">{children}</label>
}

function Input({ value, onChange, placeholder, className = '' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string
}) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-indigo-500 transition-colors ${className}`} />
  )
}

// ── Scene map (node graph overview) ──────────────────────────────────────────

function SceneMap({
  scenario,
  activeSceneId,
  onSelectScene,
  onAddScene,
}: {
  scenario: ScenarioContent
  activeSceneId: string | null
  onSelectScene: (id: string) => void
  onAddScene: () => void
}) {
  const { scenes, startSceneId } = scenario

  return (
    <div className="border border-[#1E1E22] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#111113] border-b border-[#1E1E22]">
        <span className="text-[#666] text-xs font-medium uppercase tracking-wider">Scenes</span>
        <button onClick={onAddScene}
          className="text-[#555] hover:text-indigo-400 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
        {scenes.length === 0 ? (
          <p className="text-[#444] text-xs text-center py-4">No scenes yet</p>
        ) : (
          scenes.map((scene) => {
            const isStart   = scene.id === startSceneId
            const isActive  = scene.id === activeSceneId
            const reachable = scene.id === startSceneId ||
              scenes.some((s) => s.choices.some((c) => c.nextSceneId === scene.id))

            return (
              <button key={scene.id} onClick={() => onSelectScene(scene.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive ? 'bg-indigo-500/15 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'
                }`}>
                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  scene.isOutcome
                    ? scene.outcomeType === 'pass' ? 'bg-green-500'
                    : scene.outcomeType === 'fail' ? 'bg-red-500'
                    : 'bg-gray-500'
                    : isStart ? 'bg-indigo-500'
                    : reachable ? 'bg-blue-400'
                    : 'bg-yellow-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${isActive ? 'text-white' : 'text-[#888]'}`}>
                    {scene.title || 'Untitled scene'}
                  </p>
                  <p className="text-[10px] text-[#444]">
                    {isStart ? 'Start · ' : ''}{scene.choices.length} choice{scene.choices.length !== 1 ? 's' : ''}
                    {scene.isOutcome ? ` · ${scene.outcomeType || 'outcome'}` : ''}
                    {!reachable && !isStart ? ' · unreachable' : ''}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Scene editor ──────────────────────────────────────────────────────────────

function SceneEditor({
  scene,
  scenario,
  onUpdate,
  onDelete,
  onSetStart,
}: {
  scene: Scene
  scenario: ScenarioContent
  onUpdate: (scene: Scene) => void
  onDelete: () => void
  onSetStart: () => void
}) {
  const isStart = scene.id === scenario.startSceneId
  const otherScenes = scenario.scenes.filter((s) => s.id !== scene.id)

  function updateChoice(choiceId: string, updates: Partial<Choice>) {
    onUpdate({
      ...scene,
      choices: scene.choices.map((c) => c.id === choiceId ? { ...c, ...updates } : c),
    })
  }

  function addChoice() {
    onUpdate({ ...scene, choices: [...scene.choices, makeChoice()] })
  }

  function removeChoice(id: string) {
    onUpdate({ ...scene, choices: scene.choices.filter((c) => c.id !== id) })
  }

  return (
    <div className="space-y-4">
      {/* Scene header actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {!isStart && (
          <button onClick={onSetStart}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#2A2A2E] text-[#666] hover:text-indigo-400 hover:border-indigo-500/50 transition-colors">
            Set as start
          </button>
        )}
        {isStart && (
          <span className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            Start scene
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-1.5 text-xs text-[#666]">
            <input type="checkbox" checked={scene.isOutcome}
              onChange={(e) => onUpdate({ ...scene, isOutcome: e.target.checked })}
              className="accent-indigo-500" />
            Outcome scene
          </label>
          {scene.isOutcome && (
            <select value={scene.outcomeType || 'neutral'}
              onChange={(e) => onUpdate({ ...scene, outcomeType: e.target.value as Scene['outcomeType'] })}
              className="bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-500">
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="neutral">Neutral</option>
            </select>
          )}
          <button onClick={onDelete} className="text-[#444] hover:text-red-400 transition-colors text-xs px-2 py-1">
            Delete scene
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <Label>Scene title</Label>
        <Input value={scene.title} onChange={(v) => onUpdate({ ...scene, title: v })} placeholder="Scene title" className="w-full" />
      </div>

      {/* Body */}
      <div>
        <Label>Narrative / situation</Label>
        <TiptapEditor
          content={scene.bodyHtml}
          onChange={(v) => onUpdate({ ...scene, bodyHtml: v })}
          placeholder="Describe the situation the learner faces…"
          minHeight="100px"
        />
      </div>

      {/* Choices */}
      <div>
        <Label>Choices ({scene.choices.length})</Label>
        {scene.isOutcome ? (
          <p className="text-[#555] text-xs">Outcome scenes don&apos;t have choices — the scenario ends here.</p>
        ) : (
          <div className="space-y-3">
            {scene.choices.map((choice, i) => (
              <div key={choice.id} className="bg-[#0F0F10] border border-[#2A2A2E] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#555] text-xs">Choice {i + 1}</span>
                  <button onClick={() => removeChoice(choice.id)} className="text-[#444] hover:text-red-400 text-xs transition-colors">Remove</button>
                </div>
                <Input
                  value={choice.text}
                  onChange={(v) => updateChoice(choice.id, { text: v })}
                  placeholder="What the learner can choose…"
                  className="w-full"
                />
                <div>
                  <Label>Goes to</Label>
                  <select
                    value={choice.nextSceneId || ''}
                    onChange={(e) => updateChoice(choice.id, { nextSceneId: e.target.value || null })}
                    className="w-full bg-[#141416] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">— Select next scene —</option>
                    {otherScenes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title || 'Untitled'}{s.isOutcome ? ` (${s.outcomeType || 'outcome'})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Feedback (optional)</Label>
                  <Input value={choice.feedback || ''} onChange={(v) => updateChoice(choice.id, { feedback: v })} placeholder="Brief feedback shown after selection…" className="w-full" />
                </div>
              </div>
            ))}
            <button onClick={addChoice}
              className="w-full py-2 border border-dashed border-[#2A2A2E] rounded-xl text-[#555] hover:text-indigo-400 hover:border-indigo-500/50 text-xs transition-colors">
              + Add choice
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main scenario builder ─────────────────────────────────────────────────────

export default function ScenarioBuilder({ content, onChange }: Props) {
  const scenario: ScenarioContent = {
    ...DEFAULT_SCENARIO,
    ...content,
    scenes: content.scenes ?? [],
  }

  const [activeSceneId, setActiveSceneId] = useState<string | null>(
    scenario.scenes[0]?.id ?? null
  )

  function updateScene(updated: Scene) {
    onChange({
      ...scenario,
      scenes: scenario.scenes.map((s) => s.id === updated.id ? updated : s),
    })
  }

  function addScene() {
    const scene = makeScene()
    const newScenario: ScenarioContent = {
      ...scenario,
      scenes: [...scenario.scenes, scene],
      startSceneId: scenario.startSceneId || scene.id,
    }
    onChange(newScenario)
    setActiveSceneId(scene.id)
  }

  function deleteScene(id: string) {
    const scenes = scenario.scenes.filter((s) => s.id !== id)
    // Clean up any choices pointing to deleted scene
    const cleaned = scenes.map((s) => ({
      ...s,
      choices: s.choices.map((c) => c.nextSceneId === id ? { ...c, nextSceneId: null } : c),
    }))
    onChange({
      ...scenario,
      scenes: cleaned,
      startSceneId: scenario.startSceneId === id ? (cleaned[0]?.id ?? '') : scenario.startSceneId,
    })
    setActiveSceneId(cleaned[0]?.id ?? null)
  }

  const activeScene = scenario.scenes.find((s) => s.id === activeSceneId) ?? null

  return (
    <div className="space-y-4">
      {/* Scene map */}
      <SceneMap
        scenario={scenario}
        activeSceneId={activeSceneId}
        onSelectScene={setActiveSceneId}
        onAddScene={addScene}
      />

      {/* Scene editor */}
      {activeScene ? (
        <div className="border border-[#1E1E22] rounded-xl p-4">
          <SceneEditor
            scene={activeScene}
            scenario={scenario}
            onUpdate={updateScene}
            onDelete={() => deleteScene(activeScene.id)}
            onSetStart={() => onChange({ ...scenario, startSceneId: activeScene.id })}
          />
        </div>
      ) : (
        <div className="border border-dashed border-[#2A2A2E] rounded-xl p-6 text-center">
          <p className="text-[#555] text-xs mb-2">No scenes yet</p>
          <button onClick={addScene} className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors">
            Add first scene
          </button>
        </div>
      )}

      {/* Settings */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-medium text-[#666] uppercase tracking-wider">Show path replay</span>
        <button
          onClick={() => onChange({ ...scenario, showPathReplay: !scenario.showPathReplay })}
          className={`w-8 h-4 rounded-full transition-colors relative ${scenario.showPathReplay ? 'bg-indigo-500' : 'bg-[#2A2A2E]'}`}
        >
          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${scenario.showPathReplay ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
  )
}