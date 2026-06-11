/** Timezone-aware formatting utilities for WC 2026 */

export interface FormattedTime {
  date: string;      // e.g. "Thu, Jun 11"
  time: string;      // e.g. "3:00 PM"
  dateShort: string; // e.g. "Jun 11"
  dayOfWeek: string; // e.g. "Thursday"
  iso: string;       // e.g. "2026-06-11"
}

export function formatMatchTime(utcString: string, timezone: string): FormattedTime {
  const d = new Date(utcString);

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  });

  const dateShortFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
  });

  const isoFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return {
    date: dateFormatter.format(d),
    time: timeFormatter.format(d),
    dateShort: dateShortFormatter.format(d),
    dayOfWeek: dayFormatter.format(d),
    iso: isoFormatter.format(d),
  };
}

/** Get the local date string (YYYY-MM-DD) for a UTC time in a given timezone */
export function getLocalDateString(utcString: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(utcString));
}

/** Get today's date string (YYYY-MM-DD) in a given timezone */
export function getTodayString(timezone: string): string {
  return getLocalDateString(new Date().toISOString(), timezone);
}

/** Group an array of matches by local date string */
export function groupByDate<T extends { utc: string }>(
  items: T[],
  timezone: string
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = getLocalDateString(item.utc, timezone);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

/** Common IANA timezones grouped by region for the settings selector */
export const TIMEZONE_GROUPS: Array<{ label: string; zones: Array<{ value: string; label: string }> }> = [
  {
    label: 'North America',
    zones: [
      { value: 'America/New_York',     label: 'Eastern Time (New York)' },
      { value: 'America/Chicago',      label: 'Central Time (Chicago)' },
      { value: 'America/Denver',       label: 'Mountain Time (Denver)' },
      { value: 'America/Phoenix',      label: 'Arizona (no DST)' },
      { value: 'America/Los_Angeles',  label: 'Pacific Time (Los Angeles)' },
      { value: 'America/Anchorage',    label: 'Alaska (Anchorage)' },
      { value: 'Pacific/Honolulu',     label: 'Hawaii (Honolulu)' },
      { value: 'America/Toronto',      label: 'Eastern Time (Toronto)' },
      { value: 'America/Vancouver',    label: 'Pacific Time (Vancouver)' },
      { value: 'America/Mexico_City',  label: 'Central Time (Mexico City)' },
      { value: 'America/Monterrey',    label: 'Central Time (Monterrey)' },
    ],
  },
  {
    label: 'South America',
    zones: [
      { value: 'America/Sao_Paulo',    label: 'Brasília (São Paulo)' },
      { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' },
      { value: 'America/Bogota',       label: 'Bogotá' },
      { value: 'America/Lima',         label: 'Lima' },
      { value: 'America/Santiago',     label: 'Santiago' },
      { value: 'America/Montevideo',   label: 'Montevideo' },
    ],
  },
  {
    label: 'Europe',
    zones: [
      { value: 'Europe/London',        label: 'London (GMT/BST)' },
      { value: 'Europe/Lisbon',        label: 'Lisbon' },
      { value: 'Europe/Paris',         label: 'Paris / Madrid / Berlin' },
      { value: 'Europe/Amsterdam',     label: 'Amsterdam / Brussels' },
      { value: 'Europe/Rome',          label: 'Rome / Vienna / Prague' },
      { value: 'Europe/Stockholm',     label: 'Stockholm / Oslo / Copenhagen' },
      { value: 'Europe/Warsaw',        label: 'Warsaw / Zagreb' },
      { value: 'Europe/Athens',        label: 'Athens / Bucharest' },
      { value: 'Europe/Moscow',        label: 'Moscow' },
    ],
  },
  {
    label: 'Africa & Middle East',
    zones: [
      { value: 'Africa/Cairo',         label: 'Cairo' },
      { value: 'Africa/Casablanca',    label: 'Casablanca' },
      { value: 'Africa/Nairobi',       label: 'Nairobi' },
      { value: 'Africa/Johannesburg',  label: 'Johannesburg' },
      { value: 'Africa/Lagos',         label: 'Lagos / Dakar' },
      { value: 'Asia/Riyadh',          label: 'Riyadh (Saudi Arabia)' },
      { value: 'Asia/Baghdad',         label: 'Baghdad' },
      { value: 'Asia/Amman',           label: 'Amman (Jordan)' },
      { value: 'Asia/Dubai',           label: 'Dubai' },
    ],
  },
  {
    label: 'Asia & Oceania',
    zones: [
      { value: 'Asia/Tehran',          label: 'Tehran' },
      { value: 'Asia/Karachi',         label: 'Karachi' },
      { value: 'Asia/Kolkata',         label: 'India (IST)' },
      { value: 'Asia/Dhaka',           label: 'Dhaka' },
      { value: 'Asia/Bangkok',         label: 'Bangkok / Jakarta' },
      { value: 'Asia/Singapore',       label: 'Singapore / Kuala Lumpur' },
      { value: 'Asia/Seoul',           label: 'Seoul' },
      { value: 'Asia/Tokyo',           label: 'Tokyo' },
      { value: 'Asia/Tashkent',        label: 'Tashkent (Uzbekistan)' },
      { value: 'Australia/Sydney',     label: 'Sydney (AEST/AEDT)' },
      { value: 'Australia/Adelaide',   label: 'Adelaide' },
      { value: 'Pacific/Auckland',     label: 'Auckland (New Zealand)' },
    ],
  },
];
