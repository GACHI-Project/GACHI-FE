import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import colors from '../../../constants/colors';
import fonts from '../../../constants/fonts';

interface OcrOriginalCollapseProps {
  text: string;
  onCollapse?: () => void;
}

const OcrOriginalCollapse = ({ text, onCollapse }: OcrOriginalCollapseProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    setOpen((prev) => {
      if (prev) onCollapse?.();
      return !prev;
    });
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.row}
        onPress={handleToggle}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.iconBox}>
          <Ionicons name="document-text-outline" size={16} color={colors.gray[300]} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.title} numberOfLines={1}>
            {t('scan.result.fullDoc.ocr.title')}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {t('scan.result.fullDoc.ocr.subtitle')}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={16}
          color={colors.gray[300]}
          style={open && styles.chevronOpen}
        />
      </TouchableOpacity>
      {open && (
        <>
          <Text style={styles.originalText}>{text}</Text>
          <TouchableOpacity
            style={styles.collapseFooter}
            onPress={handleToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
          >
            <Ionicons name="chevron-up" size={14} color={colors.text.secondary} />
            <Text style={styles.collapseFooterText}>
              {t('scan.result.fullDoc.ocr.collapseLabel')}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default OcrOriginalCollapse;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    minHeight: 56,
    padding: 12,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  originalText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    lineHeight: 21,
  },
  collapseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 24,
  },
  collapseFooterText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
  },
});
