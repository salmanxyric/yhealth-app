/**
 * User wall-clock in an IANA timezone via Intl.
 * Avoids the common bug of shifting UTC by offset then reading getUTCHours(),
 * which does not equal the user's local hour.
 */

export function resolveTimeZone(timezone: string | null | undefined): string {
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

export function getUserLocalDateISO(
  timezone: string | null | undefined,
  at: Date = new Date()
): string {
  const tz = resolveTimeZone(timezone);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  if (!year || !month || !day) {
    return at.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

export function addDaysToISODate(dateISO: string, days: number): string {
  const [year, month, day] = dateISO.split('-').map((part) => parseInt(part, 10));
  if (!year || !month || !day) return dateISO;

  const utcDate = new Date(Date.UTC(year, month - 1, day + days));
  return utcDate.toISOString().slice(0, 10);
}

export function formatUserLocalDateTime(
  timezone: string | null | undefined,
  at: Date = new Date()
): string {
  const tz = resolveTimeZone(timezone);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(at);
}
