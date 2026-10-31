const KB = 1024

export function formatSize(bytes: number): string {
  if (bytes >= KB * KB * KB) return `${+(bytes / KB ** 3).toFixed(1)}G`
  if (bytes >= KB * KB) return `${+(bytes / KB ** 2).toFixed(1)}M`
  if (bytes >= KB) return `${Math.round(bytes / KB)}K`
  return `${bytes}B`
}

export function formatBar(bytes: number, largest: number, width: number): string {
  if (largest <= 0 || width <= 0) return ''
  const filled = Math.max(1, Math.round((bytes / largest) * width))
  return '■'.repeat(filled).padEnd(width, ' ')
}

// Paths read best from the right, so the head is what gets cut.
export function truncateHead(text: string, width: number): string {
  if (width <= 0) return ''
  if (text.length <= width) return text
  if (width === 1) return '…'
  return `…${text.slice(text.length - (width - 1))}`
}

export function truncateTail(text: string, width: number): string {
  if (width <= 0) return ''
  if (text.length <= width) return text
  if (width === 1) return '…'
  return `${text.slice(0, width - 1)}…`
}
