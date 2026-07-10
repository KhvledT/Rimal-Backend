/**
 * Formats uptime seconds into a human-readable duration string.
 * Examples:
 *   55 -> "55s"
 *   90 -> "1m 30s"
 *   5400 -> "1h 30m"
 *   183421 -> "2d 2h 57m 1s"
 */
export function formatUptime(uptimeSeconds: number): string {
  const seconds = Math.floor(uptimeSeconds % 60);
  const minutes = Math.floor((uptimeSeconds / 60) % 60);
  const hours = Math.floor((uptimeSeconds / (60 * 60)) % 24);
  const days = Math.floor(uptimeSeconds / (60 * 60 * 24));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
}
