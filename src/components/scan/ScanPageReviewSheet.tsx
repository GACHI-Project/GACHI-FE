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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useModalClosed from '../../hooks/scan/useModalClosed';
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
  onClosed: () => void;
  // 배경 탭 · 뒤로가기 시 동작. 생략하면 onContinue
  onDismiss?: () => void;
  source?: 'camera' | 'gallery';
}

const SHEET_SLIDE_DISTANCE = 600;
// 카드 높이 측정 전 기본값. 실제 높이는 글자 크기에 따라 달라져 onLayout으로 측정
const DEFAULT_ROW_HEIGHT = 86;
const SHEET_MAX_HEIGHT_RATIO = 0.85;

const ScanPageReviewSheet = ({
  visible,
  pages,
  onReorder,
  onDelete,
  onPageTap,
  onContinue,
  onComplete,
  onClosed,
  onDismiss = onContinue,
  source = 'camera',
}: ScanPageReviewSheetProps) => {
  const { t } = useTranslation();
  const labelPrefix = source === 'gallery' ? 'scan.reviewSheet.gallery' : 'scan.reviewSheet';
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth, fontScale } = useWindowDimensions();
  const [show, setShow] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [topChromeHeight, setTopChromeHeight] = useState(0);
  const [bottomChromeHeight, setBottomChromeHeight] = useState(0);
  const [rowHeight, setRowHeight] = useState(DEFAULT_ROW_HEIGHT);
  const [measuredContent, setMeasuredContent] = useState<{
    height: number;
    count: number;
    width: number;
    fontScale: number;
  } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SHEET_SLIDE_DISTANCE)).current;
  useModalClosed(show, onClosed);

  const handleTopChromeLayout = (e: LayoutChangeEvent) =>
    setTopChromeHeight(e.nativeEvent.layout.height);
  const handleBottomChromeLayout = (e: LayoutChangeEvent) =>
    setBottomChromeHeight(e.nativeEvent.layout.height);
  const handleRowLayout = (e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    if (height > 0) setRowHeight(height);
  };

  const estimatedContentHeight =
    pages.length * rowHeight +
    Math.max(0, pages.length - 1) * styles.listContent.gap +
    styles.listContent.paddingVertical * 2;
  const contentMeasurementMatches =
    measuredContent?.count === pages.length &&
    measuredContent.width === windowWidth &&
    measuredContent.fontScale === fontScale;
  const listContentHeight = contentMeasurementMatches
    ? measuredContent.height
    : estimatedContentHeight;
  const sheetPaddingBottom = Math.max(insets.bottom, 16) + 12;
  const maxSheetHeight = Math.min(
    windowHeight * SHEET_MAX_HEIGHT_RATIO,
    windowHeight - insets.top - 12
  );
  const chromeHeight =
    topChromeHeight +
    bottomChromeHeight +
    styles.sheet.gap * 2 +
    styles.sheet.paddingTop +
    sheetPaddingBottom;
  const maxListHeight = Math.max(0, maxSheetHeight - chromeHeight);
  const listHeight = Math.min(listContentHeight, maxListHeight);
  const hasOverflow = listContentHeight > maxListHeight;

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
    <Modal
      visible={show}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      onDismiss={onClosed}
    >
      <GestureHandlerRootView style={styles.modalRoot} pointerEvents={visible ? 'auto' : 'none'}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity }]}
          pointerEvents="none"
        />
        <Pressable
          style={styles.backdropTap}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={
            source === 'gallery' ? t('common.close') : t('scan.reviewSheet.continueButton')
          }
        />
        <Animated.View style={[styles.sheetWrap, { transform: [{ translateY }] }]}>
          <View style={[styles.sheet, { paddingBottom: sheetPaddingBottom }]}>
            <View style={styles.topChrome} onLayout={handleTopChromeLayout}>
              <View style={styles.handleWrap}>
                <View style={styles.handle} />
              </View>

              <View style={styles.headerRow}>
                <Text style={styles.title}>{t(`${labelPrefix}.title`)}</Text>
                <Text style={styles.count}>
                  {t('scan.reviewSheet.count', { count: pages.length, max: MAX_PAGES })}
                </Text>
              </View>
              <Text style={styles.instruction}>{t('scan.reviewSheet.instruction')}</Text>
            </View>

            <ScrollView
              style={[styles.list, { height: listHeight }]}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={(_width, height) => {
                setMeasuredContent({ height, count: pages.length, width: windowWidth, fontScale });
              }}
              scrollEnabled={scrollEnabled && hasOverflow}
              showsVerticalScrollIndicator={hasOverflow}
              bounces={false}
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
            >
              {pages.map((page, index) => (
                <ScanPageCard
                  key={page.id}
                  page={page}
                  index={index}
                  itemCount={pages.length}
                  rowHeight={rowHeight + styles.listContent.gap}
                  onPress={() => onPageTap(index)}
                  onDelete={() => onDelete(page.id)}
                  onReorder={handleReorder}
                  onActiveChange={(active) => setScrollEnabled(!active)}
                  onLayout={index === 0 ? handleRowLayout : undefined}
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
                <Text style={styles.buttonOutlineText}>{t(`${labelPrefix}.continueButton`)}</Text>
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
                <Text style={styles.buttonFilledText}>{t(`${labelPrefix}.completeButton`)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default ScanPageReviewSheet;
