import type { Elements } from 'claude-code'

import type { BlastReport } from '../types'
import {
  formatBar,
  formatSize,
  truncateHead,
  truncateTail,
} from './format'
import { summarize } from './summarize'

type Ui = Pick<Elements['terminal'], 'Box' | 'Text' | 'Button'>

export type ReportViewProps = {
  ui: Ui
  report: BlastReport
  columns: number
  isTerminal: boolean
  onProceed: () => unknown
  onCancel: () => unknown
}

const BAR_WIDTH = 6
const SIZE_WIDTH = 6
const MIN_BAR_COLUMNS = 32

export function drawReport(props: ReportViewProps) {
  const { ui, report, columns, isTerminal, onProceed, onCancel } = props
  const { Box, Text, Button } = ui
  const hasSizes = report.items.some(item => item.bytes !== undefined)
  const hasBars = isTerminal && hasSizes && columns >= MIN_BAR_COLUMNS
  const largest = Math.max(1, ...report.items.map(item => item.bytes ?? 0))
  const labelWidth = Math.max(
    8,
    columns - 2 - (hasBars ? BAR_WIDTH + SIZE_WIDTH + 2 : hasSizes ? SIZE_WIDTH + 1 : 0),
  )
  const hidden = report.total - report.items.length

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>{truncateTail(report.command, columns - 2)}</Text>
      <Text dimColor>{summarize(report)}</Text>
      <Text>{' '}</Text>
      {report.items.map(item => (
        <Box flexDirection="row">
          <Text>{truncateHead(item.label, labelWidth).padEnd(labelWidth, ' ')}</Text>
          {hasBars && item.bytes !== undefined && (
            <Text dimColor>{' '}{formatBar(item.bytes, largest, BAR_WIDTH)}</Text>
          )}
          {item.bytes !== undefined && (
            <Text dimColor>{' '}{formatSize(item.bytes).padStart(SIZE_WIDTH, ' ')}</Text>
          )}
        </Box>
      ))}
      {hidden > 0 && <Text dimColor>{`…${hidden} more`}</Text>}
      {report.notes.map(note => (
        <Text dimColor>{truncateTail(`! ${note}`, columns - 2)}</Text>
      ))}
      <Text>{' '}</Text>
      <Box flexDirection="row">
        <Button key="proceed" label="proceed" hotkey="1" plain onPress={onProceed} />
        <Text>{'   '}</Text>
        <Button key="cancel" label="cancel" hotkey="2" plain onPress={onCancel} />
      </Box>
    </Box>
  )
}
