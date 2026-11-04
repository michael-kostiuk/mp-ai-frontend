// One date style across the app: "4 November 2026" / "4 листопада 2026 р.", and
// "Wednesday, 4 November" for day headings.

// Read "2026-11-04" (or an ISO timestamp) as that calendar day in local time, so it never shifts a day
export const parseDateKey = (value: string) => new Date(value.slice(0, 10) + 'T00:00:00');

export const formatDate = (value: string, locale: string) =>
  new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

export const formatDayHeading = (dateKey: string, locale: string) =>
  parseDateKey(dateKey).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

// "2–8 November" / "2–8 листопада"; the year is added only when it isn't the current one
export const formatDateRange = (start: string, end: string, locale: string) => {
  const from = parseDateKey(start);
  const to = parseDateKey(end);
  const thisYear = new Date().getFullYear();
  const showYear = from.getFullYear() !== thisYear || to.getFullYear() !== thisYear;
  const format = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    ...(showYear ? { year: 'numeric' } : {}),
  });
  // formatRange merges shared parts ("2–8 November"); older browsers fall back to two full dates
  const ranged = format as Intl.DateTimeFormat & { formatRange?: (a: Date, b: Date) => string };
  return ranged.formatRange ? ranged.formatRange(from, to) : `${format.format(from)} – ${format.format(to)}`;
};

// 45 -> "45 min", 60 -> "1 h", 90 -> "1 h 30 min"
export const formatDuration = (minutes: number, units: { minutes: string; hours: string }) => {
  if (minutes < 60) return `${minutes} ${units.minutes}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} ${units.hours} ${rest} ${units.minutes}` : `${hours} ${units.hours}`;
};
