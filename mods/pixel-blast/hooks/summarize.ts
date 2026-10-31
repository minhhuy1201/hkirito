import type { BlastReport } from '../types'
import { formatSize } from './format'

export function summarize(report: BlastReport): string {
  const size =
    report.totalBytes === undefined ? '' : ` (${formatSize(report.totalBytes)})`

  return `${report.total} ${report.noun}${size}`
}
