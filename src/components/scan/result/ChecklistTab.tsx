import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import useNewsletterChecklist from '../../../hooks/scan/useNewsletterChecklist';
import CenteredMessage from '../../common/CenteredMessage';
import ChecklistItemRow from './ChecklistItemRow';

interface Props {
  newsletterId?: number;
}

const ChecklistTab = ({ newsletterId }: Props) => {
  const { t } = useTranslation();
  const { items, loading, errorKey, toggle, remove } = useNewsletterChecklist(newsletterId);

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
