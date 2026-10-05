import type { NewsletterStatus } from '../api/newsletter';

export interface DocumentItem {
  id: string;
  childId: string;
  childName: string;
  grade: number | null;
  calendarColor: string;
  title: string;
  date: string;
  status?: NewsletterStatus;
}
