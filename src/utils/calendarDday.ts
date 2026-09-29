// Compare calendar dates, not elapsed hours, so time of day and DST do not affect D-day.
export const getCalendarDday = (startAt: string, today: string): number | null => {
  const toDay = (value: string): number | null => {
    const datePart = value.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
    const [year, month, day] = datePart.split('-').map(Number);
    const timestamp = Date.UTC(year, month - 1, day);
    const date = new Date(timestamp);
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    )
      return null;
    return timestamp / 86400000;
  };

  const startDay = toDay(startAt);
  const todayDay = toDay(today);
  return startDay === null || todayDay === null ? null : startDay - todayDay;
};
