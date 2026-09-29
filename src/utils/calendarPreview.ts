import type { CalendarPreviewItem } from '../api/calendar';

export interface CalendarPreviewDateFields {
  year: string;
  month: string;
  day: string;
  timeSuffix: string;
}

export interface CalendarPreviewDraft extends CalendarPreviewDateFields {
  originalStartAt: string | null;
  endAt: string | null;
  periodStartAt: string | null;
  allDay?: boolean | null;
}

// Preserve seconds, fractional seconds and an explicit timezone when present.
const TIME_SUFFIX =
  /^[T ](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/;

export const formatCalendarPreviewStartAt = (fields: CalendarPreviewDateFields): string | null => {
  const { year, month, day, timeSuffix } = fields;
  if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || !/^\d{1,2}$/.test(day)) return null;
  if (timeSuffix && !TIME_SUFFIX.test(timeSuffix)) return null;

  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  )
    return null;

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${timeSuffix}`;
};

export const parseCalendarPreviewDate = (
  value: string | null
): CalendarPreviewDateFields | null => {
  if (!value) return { year: '', month: '', day: '', timeSuffix: '' };
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
  if (!match) return null;
  const fields = {
    year: match[1],
    month: String(Number(match[2])),
    day: String(Number(match[3])),
    timeSuffix: match[4],
  };
  return formatCalendarPreviewStartAt(fields) ? fields : null;
};

export const createCalendarPreviewDraft = (
  item: CalendarPreviewItem
): CalendarPreviewDraft | null => {
  const originalStartAt = item.periodStartAt ?? item.startAt ?? item.extractedDate;
  const fields = parseCalendarPreviewDate(originalStartAt);
  if (!fields || (item.endAt && !parseCalendarPreviewDate(item.endAt))) return null;
  return {
    ...fields,
    originalStartAt,
    endAt: item.endAt ?? null,
    periodStartAt: item.periodStartAt ?? null,
    allDay: item.allDay,
  };
};

// Editing the start date moves the end date by the same number of calendar days.
// Keep time and timezone suffixes intact instead of converting to the device timezone.
export const getCalendarPreviewSchedule = (
  draft: CalendarPreviewDraft
): { startAt: string; endAt: string | null } | null => {
  const startAt = formatCalendarPreviewStartAt(draft);
  if (!startAt) return null;
  if (!draft.endAt || !draft.originalStartAt) return { startAt, endAt: draft.endAt };
  const original = parseCalendarPreviewDate(draft.originalStartAt);
  const end = parseCalendarPreviewDate(draft.endAt);
  if (!original || !end) return null;
  const toDay = (fields: CalendarPreviewDateFields) =>
    Date.UTC(Number(fields.year), Number(fields.month) - 1, Number(fields.day));
  const shift = toDay(draft) - toDay(original);
  if (shift === 0) return { startAt, endAt: draft.endAt };
  const endDate = new Date(toDay(end) + shift);
  const endAt = formatCalendarPreviewStartAt({
    year: String(endDate.getUTCFullYear()),
    month: String(endDate.getUTCMonth() + 1),
    day: String(endDate.getUTCDate()),
    timeSuffix: end.timeSuffix,
  });
  return endAt ? { startAt, endAt } : null;
};

export const getCalendarPreviewTitle = (item: CalendarPreviewItem, language: string): string => {
  const normalizedLanguage = language.toLowerCase().replace(/_/g, '-');
  const baseLanguage = normalizedLanguage.split('-')[0];
  const titles = Object.entries(item.titleI18n ?? {});

  const localizedTitle = [normalizedLanguage, baseLanguage]
    .map((locale) => titles.find(([key]) => key.toLowerCase().replace(/_/g, '-') === locale)?.[1])
    .find((title) => title?.trim());

  return localizedTitle ?? item.title;
};
