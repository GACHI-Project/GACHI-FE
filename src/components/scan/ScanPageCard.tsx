import { View, Text, Image, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import { CapturedPage } from '../../constants/scan';
import { useDragRow } from './useDragReorder';

interface ScanPageCardProps {
  page: CapturedPage;
  index: number;
  itemCount: number;
  rowHeight: number;
  onPress: () => void;
  onDelete: () => void;
  onReorder: (from: number, to: number) => void;
  onActiveChange?: (active: boolean) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}

const ScanPageCard = ({
  page,
  index,
  itemCount,
  rowHeight,
  onPress,
  onDelete,
  onReorder,
  onActiveChange,
  onLayout,
}: ScanPageCardProps) => {
  const { t } = useTranslation();
  const pageNumber = index + 1;
  const { pan, animatedStyle } = useDragRow({
    index,
    itemCount,
    rowHeight,
    onReorder,
    onActiveChange,
  });

  return (
    <Animated.View style={[styles.wrap, animatedStyle]} onLayout={onLayout}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.left} onPress={onPress} activeOpacity={0.7}>
          <View style={styles.thumbWrap}>
            <Image source={{ uri: page.uri }} style={styles.thumb} />
            <View style={styles.badge}>
              <Text style={styles.badgeText} allowFontScaling={false}>
                {pageNumber}
              </Text>
            </View>
          </View>
          <View style={styles.texts}>
            <Text style={styles.pageLabel} numberOfLines={1}>
              {t('scan.reviewSheet.pageLabel', { number: pageNumber })}
            </Text>
            <Text style={styles.tapHint} numberOfLines={1}>
              {t('scan.reviewSheet.tapHint')}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.right}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('scan.reviewSheet.deleteAccessibility', { number: pageNumber })}
          >
            <Ionicons name="close" size={18} color={colors.gray[300]} />
          </TouchableOpacity>
          <GestureDetector gesture={pan}>
            <View
              style={styles.dragHandle}
              accessibilityLabel={t('scan.reviewSheet.dragAccessibility', { number: pageNumber })}
            >
              <Ionicons name="menu" size={18} color={colors.gray[300]} />
            </View>
          </GestureDetector>
        </View>
      </View>
    </Animated.View>
  );
};

export default ScanPageCard;

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.text.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
    gap: 14,
  },
  thumbWrap: {
    width: 38,
    height: 52,
    flexShrink: 0,
  },
  thumb: {
    width: 38,
    height: 52,
    borderRadius: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: colors.text.white,
  },
  texts: {
    flexShrink: 1,
    minWidth: 0,
    gap: 4,
  },
  pageLabel: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  tapHint: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
    flexShrink: 0,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
