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

/**
 * Convert a wall-clock time in a specific IANA timezone to a UTC Date.
 * e.g. localTimeToUtc('11:50', '2026-05-08', 'Asia/Karachi') → Date(2026-05-08T06:50:00Z)
 */
export function localTimeToUtc(
  timeStr: string,
  dateStr: string,
  timezone: string | null | undefined,
): Date {
  const tz = resolveTimeZone(timezone);
  const paddedTime = timeStr.padEnd(8, ':00');

  const naiveUtc = new Date(`${dateStr}T${paddedTime}Z`);
  if (tz === 'UTC') return naiveUtc;

  const offsetMs = getTimezoneOffsetMs(naiveUtc, tz);
  const corrected = new Date(naiveUtc.getTime() - offsetMs);

  // DST edge-case: offset may differ at the corrected instant
  const verifyMs = getTimezoneOffsetMs(corrected, tz);
  if (verifyMs !== offsetMs) {
    return new Date(naiveUtc.getTime() - verifyMs);
  }
  return corrected;
}

/**
 * Format a UTC Date as "HH:mm" in the given IANA timezone.
 */
export function formatHHmm(
  date: Date,
  timezone: string | null | undefined,
): string {
  const tz = resolveTimeZone(timezone);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const h = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${h === '24' ? '00' : h}:${m}`;
}

/**
 * Format a UTC Date as "h:mm AM/PM" in the given IANA timezone.
 */
export function formatTime12h(
  date: Date,
  timezone: string | null | undefined,
): string {
  const tz = resolveTimeZone(timezone);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

// ── internal helper ──

function getTimezoneOffsetMs(date: Date, timezone: string): number {
  const fmt = (tz: string): number => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const g = (type: string) => {
      const v = parts.find((p) => p.type === type)?.value ?? '0';
      return parseInt(v === '24' ? '0' : v, 10);
    };

    return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
  };

  return fmt(timezone) - fmt('UTC');
}

export function getTimeOfDayLabel(hour: number): { label: string; greeting: string } {
  if (hour >= 5 && hour < 12) return { label: 'morning', greeting: 'Good morning' };
  if (hour >= 12 && hour < 17) return { label: 'afternoon', greeting: 'Good afternoon' };
  if (hour >= 17 && hour < 21) return { label: 'evening', greeting: 'Good evening' };
  return { label: 'night', greeting: 'Hey' };
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
