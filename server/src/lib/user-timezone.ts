/**
 * User wall-clock in an IANA timezone via Intl.
 * Avoids the common bug of shifting UTC by offset then reading getUTCHours(),
 * which does not equal the user's local hour.
 */

function resolveTimeZone(timezone: string | null | undefined): string {
  const raw = typeof timezone === 'string' ? timezone.trim() : '';
  if (!raw) return 'UTC';
  try {
    Intl.DateTimeFormat('en-US', { timeZone: raw }).format(new Date());
    return raw;
  } catch {
    return 'UTC';
  }
}

/**
 * Local hour (0–23) and whether it is Sunday in the user's timezone.
 */
export function getUserLocalHourAndSunday(
  timezone: string | null | undefined,
  at: Date = new Date()
): { hour: number; isSunday: boolean } {
  const tz = resolveTimeZone(timezone);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    hour12: false,
    weekday: 'short',
  }).formatToParts(at);

  let hour = 0;
  const hourPart = parts.find((p) => p.type === 'hour');
  if (hourPart?.value != null) {
    const parsed = parseInt(hourPart.value, 10);
    if (!Number.isNaN(parsed)) {
      hour = parsed === 24 ? 0 : parsed;
    }
  }

  const wd = (parts.find((p) => p.type === 'weekday')?.value ?? '').toLowerCase();
  const isSunday = wd.startsWith('sun');

  return { hour, isSunday };
}

export function getUserLocalHour(
  timezone: string | null | undefined,
  at: Date = new Date()
): number {
  return getUserLocalHourAndSunday(timezone, at).hour;
}
