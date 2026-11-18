import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (visible) {
      setOverlayOn(true);
      setTextView(false);
    }
  }, [visible, page?.pageNo]);

  if (!page) return null;

  const hasBlocks = !!page.blocks && page.blocks.length > 0;
  const translatedText = getPageTranslationText(page);
  const aspectRatio =
    page.imageWidth && page.imageHeight ? page.imageHeight / page.imageWidth : DEFAULT_ASPECT_RATIO;
  const renderedWidth = Math.max(
    1,
    Math.min(windowWidth - layout.screenPaddingHorizontal * 2, imageAreaHeight / aspectRatio)
  );
  const renderedHeight = renderedWidth * aspectRatio;
  const imageSize = { width: renderedWidth, height: renderedHeight };

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
          {textView ? (
            <ScrollView style={styles.textScroll} contentContainerStyle={styles.textContent}>
              <Text selectable style={styles.translationText}>
                {translatedText}
              </Text>
            </ScrollView>
          ) : (
            <PinchZoomView active={visible && !textView} style={imageSize}>
              {page.imageUrl && (
                <Image source={{ uri: page.imageUrl }} style={imageSize} resizeMode="contain" />
              )}
              {overlayOn && hasBlocks && (
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
          {!!translatedText && (
            <PrimaryButton
              label={t(
                textView
                  ? 'scan.result.fullDoc.viewer.viewImage'
                  : 'scan.result.fullDoc.viewer.readText'
              )}
              onPress={() => setTextView((value) => !value)}
            />
          )}
          {hasBlocks && !textView && (
            <SecondaryButton
              label={
                overlayOn
                  ? t('scan.result.fullDoc.viewer.showOriginal')
                  : t('scan.result.fullDoc.viewer.showTranslation')
              }
              onPress={() => setOverlayOn((v) => !v)}
            />
          )}
          {hasBlocks && overlayOn && !textView && (
            <Text style={styles.overflowHint}>{t('scan.result.fullDoc.viewer.overflowHint')}</Text>
          )}
        </ScrollView>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default PageImageViewerModal;
