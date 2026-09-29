// Date-only values must not become a fabricated midnight time tag.
export const getEventTime = (value: string | null): string | null => {
  const match = value?.match(/^\d{4}-\d{2}-\d{2}[T ]([01]\d|2[0-3]):([0-5]\d)/);
  return match ? `${match[1]}:${match[2]}` : null;
};

interface EventTimeOptions {
  allDay?: boolean | null;
  endAllDay?: boolean | null;
  allDayLabel?: string;
}

export const formatEventTime = (
  startAt: string,
  endAt: string | null,
  { allDay, endAllDay, allDayLabel }: EventTimeOptions = {}
): string | null => {
  const getLabel = (value: string, isAllDay: boolean | null | undefined) => {
    if (isAllDay === true) return allDayLabel ?? null;
    return getEventTime(value) ?? (isAllDay === false ? null : (allDayLabel ?? null));
  };
  const start = getLabel(startAt, allDay);
  if (!endAt) return start;
  const end = getLabel(endAt, endAllDay);
  // Include dates for overnight/multi-day ranges to avoid a misleading time range.
  if (startAt.slice(0, 10) !== endAt.slice(0, 10)) {
    const showYear = startAt.slice(0, 4) !== endAt.slice(0, 4);
    const startDate = startAt.slice(showYear ? 0 : 5, 10).replace(/-/g, '/');
    const endDate = endAt.slice(showYear ? 0 : 5, 10).replace(/-/g, '/');
    return `${startDate}${start ? ` ${start}` : ''} – ${endDate}${end ? ` ${end}` : ''}`;
  }
  if (!end || start === end) return start;
  return start ? `${start} – ${end}` : end;
};
