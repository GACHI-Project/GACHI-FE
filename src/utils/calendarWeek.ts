export const getKstDate = (now = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((value) => value.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};

export const getWeeklyQueryDate = (weekDates: string[], now = new Date()): string => {
  const today = getKstDate(now);
  return weekDates.includes(today) ? today : weekDates[0];
};

export const orderWeekDates = (weekDates: string[], referenceDate: string): string[] => [
  ...weekDates.filter((date) => date >= referenceDate),
  ...weekDates.filter((date) => date < referenceDate),
];
