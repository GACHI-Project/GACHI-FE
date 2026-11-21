import {
  patchCalendarPreviewDates,
  postCalendarEvents,
  type CalendarDatePatchEvent,
  type CalendarPostEvent,
  type CalendarPreviewItem,
} from '../api/calendar';
import { assertCurrentSession, getSessionVersion, isCurrentSession } from '../utils/authSession';
import { invalidateResources, queryClient } from './client';

const domains = [
  'calendar',
  'markers',
  'preview',
  'newsletters',
  'newsletter',
  'recent',
  'today',
  'newsletterChecklist',
];

export const registerNewsletterCalendar = async (
  id: number,
  events: CalendarPostEvent[],
  corrections: CalendarDatePatchEvent[],
  onDatesPatched?: (confirmed: CalendarDatePatchEvent[]) => void
) => {
  const version = getSessionVersion();
  try {
    if (corrections.length) {
      await patchCalendarPreviewDates(id, corrections);
      assertCurrentSession(version);
      onDatesPatched?.(corrections);
      const filters = {
        predicate: (query: { queryKey: readonly unknown[] }) =>
          query.queryKey[1] === version &&
          query.queryKey[3] === 'preview' &&
          query.queryKey[4] === id,
      };
      await queryClient.cancelQueries(filters);
      assertCurrentSession(version);
      const corrected = new Map(corrections.map((item) => [item.tempEventId, item.correctedDate]));
      queryClient.setQueriesData<CalendarPreviewItem[]>(filters, (data) =>
        data?.map((item) => {
          const event = events.find((entry) => entry.tempEventId === item.tempEventId);
          if (!event || !corrected.has(item.tempEventId)) return item;
          return {
            ...item,
            extractedDate: corrected.get(item.tempEventId)!,
            startAt: event.startAt,
            endAt: event.endAt,
            periodStartAt: item.periodStartAt ? event.startAt : item.periodStartAt,
          };
        })
      );
    }
    assertCurrentSession(version);
    return await postCalendarEvents(id, events);
  } finally {
    if (isCurrentSession(version)) void invalidateResources(domains, version);
  }
};
