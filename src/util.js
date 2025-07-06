export function formatSecondsToReadableTime(totalSeconds) {
  const days = Math.floor(totalSeconds / (24 * 3600))
  totalSeconds %= 24 * 3600 // Remaining seconds after extracting days

  const hours = Math.floor(totalSeconds / 3600)
  totalSeconds %= 3600 // Remaining seconds after extracting hours

  const minutes = Math.floor(totalSeconds / 60)

  let result = []

  if (days > 0) {
    result.push(`${days}d`)
  }
  if (hours > 0) {
    result.push(`${hours}hr`)
  }
  if (minutes > 0) {
    result.push(`${minutes}min`)
  }

  // Handle the case where the duration is less than a minute
  if (result.length === 0 && totalSeconds >= 0) {
    return `${Math.floor(totalSeconds)} second${Math.floor(totalSeconds) !== 1 ? 's' : ''}`
  }

  return result.join(' ')
}
