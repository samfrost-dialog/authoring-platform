export interface Choice {
  id: string
  text: string
  nextSceneId: string | null
  feedback?: string
}

export interface Scene {
  id: string
  title: string
  bodyHtml: string
  imageUrl?: string | null
  characterUrl?: string | null
  choices: Choice[]
  isOutcome: boolean
  outcomeType?: 'pass' | 'fail' | 'neutral'
}

export interface ScenarioContent {
  scenes: Scene[]
  startSceneId: string
  showPathReplay: boolean
}

export function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: crypto.randomUUID(),
    title: 'New scene',
    bodyHtml: '',
    choices: [],
    isOutcome: false,
    outcomeType: undefined,
    ...overrides,
  }
}

export function makeChoice(overrides: Partial<Choice> = {}): Choice {
  return {
    id: crypto.randomUUID(),
    text: '',
    nextSceneId: null,
    ...overrides,
  }
}

export const DEFAULT_SCENARIO: ScenarioContent = {
  scenes: [],
  startSceneId: '',
  showPathReplay: true,
}