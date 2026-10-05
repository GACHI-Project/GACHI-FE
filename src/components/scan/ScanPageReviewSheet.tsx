import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  LayoutChangeEvent,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CapturedPage, MAX_PAGES } from '../../constants/scan';
import ScanPageCard from './ScanPageCard';
import { reorderArray } from './useDragReorder';
import styles from '../../styles/scan/pageReviewSheet';

interface ScanPageReviewSheetProps {
  visible: boolean;
  pages: CapturedPage[];
  onReorder: (pages: CapturedPage[]) => void;
  onDelete: (id: string) => void;
  onPageTap: (index: number) => void;
  onContinue: () => void;
  onComplete: () => void;
}

const SHEET_SLIDE_DISTANCE = 600;
const ROW_HEIGHT = 66;
const ROW_GAP = 10;
const LIST_VERTICAL_PADDING = 2; // styles.listContent의 paddingVertical과 일치
const SHEET_MAX_HEIGHT_RATIO = 0.8;
const SHEET_PADDING_TOP = 14;
const SHEET_GAP = 15;
// sheet의 직계 자식이 [topChrome, list, buttonRow] 3개라 gap은 2번 적용됨
const SHEET_GAP_COUNT = 2;

const ScanPageReviewSheet = ({
  visible,
  pages,
  onReorder,
  onDelete,
  onPageTap,
  onContinue,
  onComplete,
}: ScanPageReviewSheetProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [show, setShow] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [topChromeHeight, setTopChromeHeight] = useState(0);
  const [bottomChromeHeight, setBottomChromeHeight] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SHEET_SLIDE_DISTANCE)).current;

  const handleTopChromeLayout = (e: LayoutChangeEvent) =>
    setTopChromeHeight(e.nativeEvent.layout.height);
  const handleBottomChromeLayout = (e: LayoutChangeEvent) =>
    setBottomChromeHeight(e.nativeEvent.layout.height);

  const listContentHeight =
    pages.length * ROW_HEIGHT + Math.max(0, pages.length - 1) * ROW_GAP + LIST_VERTICAL_PADDING * 2;
  const sheetPaddingBottom = insets.bottom + 14;
  const maxSheetHeight = windowHeight * SHEET_MAX_HEIGHT_RATIO;
  const chromeHeight =
    topChromeHeight +
    bottomChromeHeight +
    SHEET_GAP * SHEET_GAP_COUNT +
    SHEET_PADDING_TOP +
    sheetPaddingBottom;
  const maxListHeight = Math.max(0, maxSheetHeight - chromeHeight);
  const listHeight = Math.min(listContentHeight, maxListHeight);

  useEffect(() => {
    if (visible) {
      if (show) return;
      opacity.setValue(0);
      translateY.setValue(SHEET_SLIDE_DISTANCE);
      setShow(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, bounciness: 0, speed: 8, useNativeDriver: true }),
      ]).start();
    } else if (show) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, {
          toValue: SHEET_SLIDE_DISTANCE,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setShow(false);
      });
    }
  }, [visible, show, opacity, translateY]);

  const handleReorder = (from: number, to: number) => {
    onReorder(reorderArray(pages, from, to));
  };

  return (
    <Modal visible={show} transparent animationType="none" onRequestClose={onContinue}>
      <View style={styles.modalRoot}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity }]}
          pointerEvents="none"
        />
        <Pressable
          style={styles.backdropTap}
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel={t('scan.reviewSheet.continueButton')}
        />
        <Animated.View style={[styles.sheetWrap, { transform: [{ translateY }] }]}>
          <View style={[styles.sheet, { paddingBottom: sheetPaddingBottom }]}>
            <View onLayout={handleTopChromeLayout}>
              <View style={styles.handleWrap}>
                <View style={styles.handle} />
              </View>

              <View style={styles.headerRow}>
                <Text style={styles.title}>{t('scan.reviewSheet.title')}</Text>
                <Text style={styles.count}>
                  {t('scan.reviewSheet.count', { count: pages.length, max: MAX_PAGES })}
                </Text>
              </View>
              <Text style={styles.instruction}>{t('scan.reviewSheet.instruction')}</Text>
            </View>

            <ScrollView
              style={{ height: listHeight }}
              contentContainerStyle={styles.listContent}
              scrollEnabled={scrollEnabled}
              showsVerticalScrollIndicator={false}
            >
              {pages.map((page, index) => (
                <ScanPageCard
                  key={page.id}
                  page={page}
                  index={index}
                  itemCount={pages.length}
                  rowHeight={ROW_HEIGHT + ROW_GAP}
                  onPress={() => onPageTap(index)}
                  onDelete={() => onDelete(page.id)}
                  onReorder={handleReorder}
                  onActiveChange={(active) => setScrollEnabled(!active)}
                />
              ))}
            </ScrollView>

            <View style={styles.buttonRow} onLayout={handleBottomChromeLayout}>
              <TouchableOpacity
                style={[styles.button, styles.buttonOutline]}
                onPress={onContinue}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.buttonOutlineText}>{t('scan.reviewSheet.continueButton')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonFilled,
                  pages.length === 0 && styles.buttonDisabled,
                ]}
                onPress={onComplete}
                disabled={pages.length === 0}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.buttonFilledText}>{t('scan.reviewSheet.completeButton')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ScanPageReviewSheet;
