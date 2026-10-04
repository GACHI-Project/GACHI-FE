import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import colors from '../../constants/colors';
import { CapturedPage, SCAN_FRAME_W, SCAN_FRAME_H } from '../../constants/scan';
import styles from '../../styles/scan/pageDetail';

interface ZoomableImageProps {
  uri: string;
  active: boolean;
  onZoomChange: (zoomed: boolean) => void;
}

const MAX_ZOOM = 3;

const ZoomableImage = ({ uri, active, onZoomChange }: ZoomableImageProps) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const notifyZoom = useCallback((zoomed: boolean) => onZoomChange(zoomed), [onZoomChange]);

  useEffect(() => {
    if (!active) {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }, [active, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  const pinch = Gesture.Pinch()
    .enabled(active)
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(savedScale.value * event.scale, MAX_ZOOM));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      scheduleOnRN(notifyZoom, scale.value > 1.05);
      if (scale.value <= 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .enabled(active)
    .onUpdate((event) => {
      if (savedScale.value <= 1) return;
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.pageSlide, animatedStyle]}>
        <Image source={{ uri }} style={styles.pageImage} resizeMode="cover" />
      </Animated.View>
    </GestureDetector>
  );
};

interface ScanPageDetailModalProps {
  visible: boolean;
  pages: CapturedPage[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onDelete: () => void;
  onRetake: () => void;
  onRotate: (newUri: string) => void;
}

const ScanPageDetailModal = ({
  visible,
  pages,
  currentIndex,
  onIndexChange,
  onClose,
  onDelete,
  onRetake,
  onRotate,
}: ScanPageDetailModalProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [zoomed, setZoomed] = useState(false);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    setZoomed(false);
    scrollRef.current?.scrollTo({ x: currentIndex * SCAN_FRAME_W, animated: false });
  }, [currentIndex, visible]);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCAN_FRAME_W);
    if (index !== currentIndex && index >= 0 && index < pages.length) {
      onIndexChange(index);
    }
  };

  const goTo = (index: number) => {
    const clamped = Math.min(Math.max(index, 0), pages.length - 1);
    onIndexChange(clamped);
  };

  // 회전 기능: BE 자동 보정 적용 여부 확정되면 이 핸들러와 아래 회전 버튼 블록만 삭제하면 됨
  const handleRotate = async () => {
    const target = pages[currentIndex];
    if (!target || rotating) return;
    setRotating(true);
    try {
      const result = await manipulateAsync(target.uri, [{ rotate: 90 }], {
        compress: 0.9,
        format: SaveFormat.JPEG,
      });
      onRotate(result.uri);
    } finally {
      setRotating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
          <View style={[styles.headerSideSlot, styles.headerSideSlotLeft]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Ionicons name="arrow-back" size={16} color={colors.gray[300]} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('scan.pageDetail.pageIndicator', { current: currentIndex + 1, total: pages.length })}
          </Text>
          <View style={[styles.headerSideSlot, styles.headerSideSlotRight]}>
            <TouchableOpacity
              style={styles.rotateButton}
              onPress={handleRotate}
              disabled={rotating}
              accessibilityRole="button"
              accessibilityLabel={t('scan.pageDetail.rotateAccessibility')}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.gray[300]} />
              <Text style={styles.rotateButtonText}>{t('scan.pageDetail.rotate')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.frameWrapper}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            scrollEnabled={!zoomed}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            style={{ width: SCAN_FRAME_W, height: SCAN_FRAME_H }}
          >
            {pages.map((page, index) => (
              <ZoomableImage
                key={page.id}
                uri={page.uri}
                active={index === currentIndex}
                onZoomChange={setZoomed}
              />
            ))}
          </ScrollView>

          {currentIndex > 0 && (
            <TouchableOpacity
              style={[styles.arrowButton, styles.arrowLeft]}
              onPress={() => goTo(currentIndex - 1)}
              accessibilityRole="button"
              accessibilityLabel={t('scan.pageDetail.prevAccessibility')}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text.white} />
            </TouchableOpacity>
          )}
          {currentIndex < pages.length - 1 && (
            <TouchableOpacity
              style={[styles.arrowButton, styles.arrowRight]}
              onPress={() => goTo(currentIndex + 1)}
              accessibilityRole="button"
              accessibilityLabel={t('scan.pageDetail.nextAccessibility')}
            >
              <Ionicons name="chevron-forward" size={22} color={colors.text.white} />
            </TouchableOpacity>
          )}

          <View style={styles.zoomChip}>
            <Text style={styles.zoomChipText}>{t('scan.pageDetail.zoomHint')}</Text>
          </View>
        </View>

        <Text style={styles.swipeHint}>{t('scan.pageDetail.swipeHint')}</Text>

        <ScrollView
          horizontal
          style={styles.thumbStrip}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbRow}
        >
          {pages.map((page, index) => (
            <TouchableOpacity
              key={page.id}
              onPress={() => goTo(index)}
              accessibilityRole="button"
              accessibilityLabel={t('scan.pageDetail.thumbnailAccessibility', {
                number: index + 1,
              })}
            >
              <View style={[styles.thumbWrap, index === currentIndex && styles.thumbWrapActive]}>
                <Image source={{ uri: page.uri }} style={styles.thumbImage} />
                <View style={styles.thumbBadge}>
                  <Text style={styles.thumbBadgeText} allowFontScaling={false}>
                    {index + 1}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.buttonRow, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={onDelete}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.buttonOutlineText}>{t('scan.pageDetail.delete')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonFilled]}
            onPress={onRetake}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.buttonFilledText}>{t('scan.pageDetail.retake')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ScanPageDetailModal;
