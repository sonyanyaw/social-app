export function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

export function timeAgo(date: Date | string): string {
  const time = typeof date === "string" ? Date.parse(date) : date.getTime()
  const s = Math.floor((Date.now() - time) / 1000)

  if (s < 0)       return "just now"
  if (s < 60)      return `${s}s`
  if (s < 3600)    return `${Math.floor(s / 60)}m`
  if (s < 86400)   return `${Math.floor(s / 3600)}h`
  if (s < 2592000) return `${Math.floor(s / 86400)}d`
  if (s < 31536000) return `${Math.floor(s / 2592000)}mo`
  return `${Math.floor(s / 31536000)}y`
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatAbsoluteTime(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  if (d.toDateString() === now.toDateString())
    return formatTime(d)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
