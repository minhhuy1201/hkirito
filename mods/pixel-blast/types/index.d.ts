export type BlastLevel = 'medium' | 'high' | 'critical'

export type BlastItem = { label: string; bytes?: number }

export type BlastReport = {
  command: string
  level: BlastLevel
  noun: string
  items: BlastItem[]
  total: number
  totalBytes?: number
  notes: string[]
}

export type BlastDecision = 'proceed' | 'cancel'

export type BlastHeld = {
  id: string
  report: BlastReport
  where: 'pane' | 'band'
}

declare module 'claude-code' {
  interface PluginState {
    'pixel-blast': { held: BlastHeld | null }
  }
}
