import { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import PinchZoomView from '../../common/PinchZoomView';
import { PrimaryButton, SecondaryButton } from '../../common/Button';
import TranslationOverlay from './TranslationOverlay';
import colors from '../../../constants/colors';
import layout from '../../../constants/layout';
import { TranslationPage } from '../../../api/newsletter';
import styles from '../../../styles/scan/pageImageViewer';
import { getPageTranslationText } from '../../../utils/newsletterPage';

interface PageImageViewerModalProps {
  visible: boolean;
  page: TranslationPage | null;
  totalPages: number;
  onClose: () => void;
}

const DEFAULT_ASPECT_RATIO = 1.35;
const DEFAULT_MAX_ZOOM = 3;

const PageImageViewerModal = ({
  visible,
  page,
  totalPages,
  onClose,
}: PageImageViewerModalProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [overlayOn, setOverlayOn] = useState(true);
  const [textView, setTextView] = useState(false);
  const [imageAreaHeight, setImageAreaHeight] = useState(windowHeight * 0.5);

  useLayoutEffect(() => {
    if (visible) {
      setOverlayOn(true);
      setTextView(false);
    }
  }, [visible, page?.pageNo]);

  if (!page) return null;

  const hasImage = !!page.imageUrl;
  const hasTranslatedBlocks = !!page.blocks?.some((block) => !!block.translatedText?.trim());
  const translatedText = getPageTranslationText(page);
  const showText = textView || !hasImage;
  const aspectRatio =
    page.imageWidth && page.imageHeight ? page.imageHeight / page.imageWidth : DEFAULT_ASPECT_RATIO;
  const renderedWidth = Math.max(
    1,
    Math.min(windowWidth - layout.screenPaddingHorizontal * 2, imageAreaHeight / aspectRatio)
  );
  const renderedHeight = renderedWidth * aspectRatio;
  const imageSize = { width: renderedWidth, height: renderedHeight };
  const maxZoom = Math.max(
    DEFAULT_MAX_ZOOM,
    (DEFAULT_MAX_ZOOM * (windowWidth - layout.screenPaddingHorizontal * 2)) / renderedWidth
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* Modal은 별도 네이티브 창이라 루트의 GestureHandlerRootView가 닿지 않아 핀치 줌을 위해 다시 감쌈 */}
      <GestureHandlerRootView style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
          <View style={styles.headerSideSlot}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('scan.result.fullDoc.viewer.closeAccessibility')}
            >
              <Ionicons name="close" size={18} color={colors.gray[300]} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>
            {t('scan.result.fullDoc.viewer.pageIndicator', {
              current: page.pageNo,
              total: totalPages,
            })}
          </Text>
          <View style={styles.headerSideSlot} />
        </View>

        <View
          style={styles.imageArea}
          onLayout={(event) => setImageAreaHeight(event.nativeEvent.layout.height)}
        >
          {showText ? (
            <ScrollView style={styles.textScroll} contentContainerStyle={styles.textContent}>
              <Text selectable style={styles.translationText}>
                {translatedText}
              </Text>
            </ScrollView>
          ) : (
            <PinchZoomView active={visible && !showText} style={imageSize} maxZoom={maxZoom}>
              {page.imageUrl && (
                <Image source={{ uri: page.imageUrl }} style={imageSize} resizeMode="contain" />
              )}
              {overlayOn && hasTranslatedBlocks && (
                <TranslationOverlay
                  blocks={page.blocks!}
                  renderedWidth={renderedWidth}
                  renderedHeight={renderedHeight}
                />
              )}
            </PinchZoomView>
          )}
        </View>

        <ScrollView
          style={styles.footerScroll}
          contentContainerStyle={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
          keyboardShouldPersistTaps="handled"
        >
          {!!translatedText && hasImage && (
            <PrimaryButton
              label={t(
                textView
                  ? 'scan.result.fullDoc.viewer.viewImage'
                  : 'scan.result.fullDoc.viewer.readText'
              )}
              onPress={() => setTextView((value) => !value)}
            />
          )}
          {hasImage && hasTranslatedBlocks && !showText && (
            <SecondaryButton
              label={
                overlayOn
                  ? t('scan.result.fullDoc.viewer.showOriginal')
                  : t('scan.result.fullDoc.viewer.showTranslation')
              }
              onPress={() => setOverlayOn((v) => !v)}
            />
          )}
          {hasImage && hasTranslatedBlocks && overlayOn && !showText && !!translatedText && (
            <Text style={styles.overflowHint}>{t('scan.result.fullDoc.viewer.overflowHint')}</Text>
          )}
        </ScrollView>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default PageImageViewerModal;
