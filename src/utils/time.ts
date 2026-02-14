/** Parse "HH:mm" string to minutes since midnight */
export function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/** Format minutes since midnight to "HH:mm" */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Get day of week (0=Sunday) from a date string "YYYY-MM-DD" */
export function getDayOfWeek(dateStr: string): number {
  const date = new Date(dateStr + 'T12:00:00')
  return date.getDay()
}

/** Format date for display: "March 15, 2024" */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Format time for display: "9:00 AM" */
export function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

/** Generate a confirmation number: QS-YYYY-MMDD-NNN */
export function generateConfirmationNumber(date: string, sequence: number): string {
  const d = date.replace(/-/g, '').slice(0, 8)
  const year = d.slice(0, 4)
  const monthDay = d.slice(4, 8)
  return `QS-${year}-${monthDay}-${String(sequence).padStart(3, '0')}`
}

/** Generate a random cancel token */
export function generateCancelToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
