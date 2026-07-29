export const fmt = (d: Date): string => {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export const isToday = (d: Date): boolean => {
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
};

export const getDisplayWeekDays = (): Date[] => {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  if (dow === 0) monday.setDate(today.getDate() + 1);
  else if (dow === 6) monday.setDate(today.getDate() + 2);
  else monday.setDate(today.getDate() - (dow - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

export const getNextWeekdays = (count: number): Date[] => {
  const result: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (result.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) result.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return result;
};

export const formatDate = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
