import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { BlastDecision, BlastHeld } from '../types'
import { classify } from './classify'
import { measure, type Run } from './measure'
import { drawReport, type ReportViewProps } from './ReportView'
import { summarize } from './summarize'

const PANE = 'pixel-blast'
const POLL = '0.25'
const DRY_RUN_TIMEOUT_MS = 8000

const held = atom({ plugin: 'pixel-blast', key: 'held' } as const, null)

export const register: Register = on => {
  // The answer to the hold in flight lives with the hook that waits for it. A
  // reload starts these over and the old wait is cut off, which refuses the
  // command rather than leaving it half-decided.
  let currentId: string | null = null
  const answers = new Map<string, BlastDecision>()

  const decide = (id: string, decision: BlastDecision) => {
    if (currentId === id && !answers.has(id)) answers.set(id, decision)
  }

  on('session.start', async ($, e, next) => {
    await update($, held, () => null)
    await $.ui.close({ id: PANE })

    return next(e)
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const command = String(e.command ?? '')
    const risk = classify(command)
    if (risk === null) return next(e)

    const run: Run = (argv, env) =>
      $.process
        .run(argv, { timeoutMs: DRY_RUN_TIMEOUT_MS, ...(env === undefined || Object.keys(env).length === 0 ? {} : { env }) })
        .catch(() => null)
    const report = await measure(run, risk, command)

    // Time spent inside a `$` call does not count against the hook's budget.
    // An interrupt aborts the sleep itself, which is a normal way out.
    const pause = async () => {
      try {
        await $.process.run(['sleep', POLL])
      } catch (error) {
        if (!next.signal.aborted) throw error
      }
    }

    while (currentId !== null && !next.signal.aborted) await pause()
    if (next.signal.aborted) {
      return { deny: 'pixel-blast: the turn was interrupted before the command ran.' }
    }

    const id = e.tool_use_id
    currentId = id
    let decision: BlastDecision | undefined
    try {
      await update($, held, () => ({ id, report, where: 'pane' }))
      const opened = await $.ui.open({ id: PANE, title: 'Blast Radius', focus: true, closeOnEscape: true })
      if (!opened.isPlaced) {
        await update($, held, (current: BlastHeld | null) =>
          current === null ? current : { ...current, where: 'band' },
        )
      }
      while (!answers.has(id) && !next.signal.aborted) await pause()
      decision = answers.get(id)
    } finally {
      answers.delete(id)
      currentId = null
      await update($, held, () => null)
      await $.ui.close({ id: PANE })
    }

    if (decision === 'proceed') return next(e)
    const why = decision === 'cancel' ? 'the user pressed Cancel' : 'the turn was interrupted'

    return { deny: `pixel-blast held this command: ${why}. It would have touched ${summarize(report)}.` }
  }).catch(($, e, next) =>
    next.called ? next(e) : { deny: 'pixel-blast: the guard failed, so the command was blocked.' },
  )

  on('ui.close', (_, e, next) => {
    if (e.id === PANE && e.origin.kind === 'person' && currentId !== null) decide(currentId, 'cancel')

    return next(e)
  }).catch((_, e, next) => next(e))

  const draw = (ui: ReportViewProps['ui'], entry: BlastHeld, columns: number, surface: string) =>
    drawReport({
      ui,
      report: entry.report,
      columns,
      isTerminal: surface === 'terminal',
      onProceed: () => decide(entry.id, 'proceed'),
      onCancel: () => decide(entry.id, 'cancel'),
    })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const current = await read($, held)
    if (current === null) return <ui.Text dimColor>No command held.</ui.Text>

    return draw(ui as ReportViewProps['ui'], current, e.props.bodyColumns, e.surface)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const current = await read($, held)
    if (e.props.hasSurvey || current === null || current.where !== 'band') return next(e)

    return draw($.ui.resolve(e) as ReportViewProps['ui'], current, e.props.bodyColumns, e.surface)
  })
}
