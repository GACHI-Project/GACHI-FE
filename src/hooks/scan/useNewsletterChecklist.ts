import { useEffect, useRef, useState } from 'react';
import { getNewsletterChecklist, NewsletterApiError } from '../../api/newsletter';
import type { ChecklistItem } from '../../api/newsletter';
import { toggleChecklistItem, deleteChecklistItem } from '../../api/checklist';

const useNewsletterChecklist = (newsletterId: number | undefined) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const scopeRef = useRef<object | null>(null);
  const pendingIdsRef = useRef(new Set<number>());
  const orderRef = useRef(new Map<number, number>());

  useEffect(() => {
    const scope = {};
    scopeRef.current = scope;
    setLoading(true);
    setErrorKey(null);
    setItems([]);
    orderRef.current = new Map();

    if (!newsletterId) {
      setErrorKey('scan.result.checklist.error.notFound');
      setLoading(false);
    } else {
      getNewsletterChecklist(newsletterId, 'CHECKLIST')
        .then((result) => {
          if (scopeRef.current !== scope) return;
          orderRef.current = new Map(result.map((item, index) => [item.checklistId, index]));
          setItems(result);
        })
        .catch((e) => {
          if (scopeRef.current !== scope) return;
          setErrorKey(
            e instanceof NewsletterApiError && e.code === 'NL4041'
              ? 'scan.result.checklist.error.newsletterNotFound'
              : 'scan.result.checklist.error.loadFailed'
          );
        })
        .finally(() => {
          if (scopeRef.current === scope) setLoading(false);
        });
    }

    return () => {
      scopeRef.current = null;
    };
  }, [newsletterId]);

  const toggle = async (id: number) => {
    const scope = scopeRef.current;
    const target = items.find((item) => item.checklistId === id);
    if (!scope || !target || pendingIdsRef.current.has(id)) return;
    pendingIdsRef.current.add(id);
    const nextCompleted = !target.isCompleted;
    const applyValue = (value: boolean) =>
      setItems((prev) =>
        prev.map((item) => (item.checklistId === id ? { ...item, isCompleted: value } : item))
      );
    applyValue(nextCompleted);
    try {
      await toggleChecklistItem(id, nextCompleted);
    } catch {
      if (scopeRef.current === scope) applyValue(target.isCompleted);
    } finally {
      pendingIdsRef.current.delete(id);
    }
  };

  const remove = async (id: number) => {
    const scope = scopeRef.current;
    const target = items.find((item) => item.checklistId === id);
    const order = orderRef.current;
    const targetIndex = order.get(id);
    if (!scope || !target || targetIndex === undefined || pendingIdsRef.current.has(id)) return;
    pendingIdsRef.current.add(id);
    setItems((prev) => prev.filter((item) => item.checklistId !== id));
    try {
      await deleteChecklistItem(id);
    } catch {
      if (scopeRef.current !== scope) return;
      // Restore only this row in its original order, preserving other mutations.
      setItems((prev) => {
        if (prev.some((item) => item.checklistId === id)) return prev;
        const nextIndex = prev.findIndex((item) => {
          const index = order.get(item.checklistId);
          return index !== undefined && index > targetIndex;
        });
        if (nextIndex < 0) return [...prev, target];
        return [...prev.slice(0, nextIndex), target, ...prev.slice(nextIndex)];
      });
    } finally {
      pendingIdsRef.current.delete(id);
    }
  };

  return { items, loading, errorKey, toggle, remove };
};

export default useNewsletterChecklist;
