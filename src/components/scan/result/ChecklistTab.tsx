import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getNewsletterChecklist, NewsletterApiError } from '../../../api/newsletter';
import type { ChecklistItem } from '../../../api/newsletter';
import { toggleChecklistItem, deleteChecklistItem } from '../../../api/checklist';
import CenteredMessage from '../../common/CenteredMessage';
import ChecklistItemRow from './ChecklistItemRow';

interface Props {
  newsletterId?: number;
}

const ChecklistTab = ({ newsletterId }: Props) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErrorKey(null);
    setItems([]);

    if (!newsletterId) {
      setErrorKey('scan.result.checklist.error.notFound');
      setLoading(false);
      return () => {};
    }

    let cancelled = false;

    getNewsletterChecklist(newsletterId, 'CHECKLIST')
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof NewsletterApiError && e.code === 'NL4041') {
          setErrorKey('scan.result.checklist.error.newsletterNotFound');
        } else {
          setErrorKey('scan.result.checklist.error.loadFailed');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [newsletterId]);

  const toggle = (id: number) => {
    const prev = items;
    const next = items.map((item) =>
      item.checklistId === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setItems(next);
    const target = next.find((item) => item.checklistId === id);
    if (target) {
      toggleChecklistItem(id, target.isCompleted).catch(() => setItems(prev));
    }
  };

  const remove = (id: number) => {
    const prev = items;
    setItems((list) => list.filter((item) => item.checklistId !== id));
    deleteChecklistItem(id).catch(() => setItems(prev));
  };

  if (loading) return <CenteredMessage loading />;
  if (errorKey) return <CenteredMessage message={t(errorKey)} />;
  if (items.length === 0) return <CenteredMessage message={t('scan.result.checklist.empty')} />;

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <ChecklistItemRow key={item.checklistId} item={item} onToggle={toggle} onRemove={remove} />
      ))}
    </View>
  );
};

export default ChecklistTab;

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
});
