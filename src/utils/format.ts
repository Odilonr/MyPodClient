export function formatClock (totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = String(seconds % 60).padStart(2, '0')
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`
}

export function formatSpokenTime (totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0))
  const minutes = Math.floor(seconds / 60)
  const parts = []
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`)
  parts.push(`${seconds % 60} ${seconds % 60 === 1 ? 'second' : 'seconds'}`)
  return parts.join(' ')
}

export function formatDuration (totalSeconds: number | null) {
  if (!totalSeconds) return ''
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
}

export function formatDate (value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export const isSample = (showName: string) => showName.startsWith('Sample: ')
export const withoutSampleLabel = (showName: string) => showName.replace(/^Sample: /, '')
