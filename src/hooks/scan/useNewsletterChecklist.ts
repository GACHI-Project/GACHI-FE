import { getNewsletterChecklist, NewsletterApiError } from '../../api/newsletter';
import { changeChecklist } from '../../query/checklists';
import { useApiMutation, useServerQuery } from '../../query/hooks';

const useNewsletterChecklist = (newsletterId: number | undefined) => {
  const query = useServerQuery(
    'newsletterChecklist',
    [newsletterId],
    (signal) => getNewsletterChecklist(newsletterId!, 'CHECKLIST', signal),
    { enabled: !!newsletterId }
  );
  const mutate = useApiMutation(changeChecklist);
  const items = query.data ?? [];
  const toggle = async (id: number) => {
    const target = items.find((item) => item.checklistId === id);
    if (!target) return;
    try {
      await mutate(id, target.isCompleted, !target.isCompleted);
    } catch {
      /* Item-scoped rollback. */
    }
  };
  const remove = async (id: number) => {
    const target = items.find((item) => item.checklistId === id);
    if (!target) return;
    try {
      await mutate(id, target.isCompleted);
    } catch {
      /* Preserve other mutations. */
    }
  };
  let errorKey: string | null = null;
  if (!newsletterId) errorKey = 'scan.result.checklist.error.notFound';
  else if (query.error)
    errorKey =
      query.error instanceof NewsletterApiError && query.error.code === 'NL4041'
        ? 'scan.result.checklist.error.newsletterNotFound'
        : 'scan.result.checklist.error.loadFailed';
  return { items, loading: query.isLoading, errorKey, toggle, remove };
};
export default useNewsletterChecklist;
