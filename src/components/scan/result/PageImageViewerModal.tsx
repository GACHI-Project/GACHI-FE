import { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import PinchZoomView from '../../common/PinchZoomView';
import { PrimaryButton } from '../../common/Button';
import TranslationOverlay from './TranslationOverlay';
import colors from '../../../constants/colors';
import layout from '../../../constants/layout';
import { TranslationPage } from '../../../api/newsletter';
import styles from '../../../styles/scan/pageImageViewer';

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
  const { width: windowWidth } = useWindowDimensions();
  const [overlayOn, setOverlayOn] = useState(true);

  useEffect(() => {
    if (visible) setOverlayOn(true);
  }, [visible, page?.pageNo]);

  if (!page) return null;

  const hasBlocks = !!page.blocks && page.blocks.length > 0;
  const renderedWidth = windowWidth - layout.screenPaddingHorizontal * 2;
  const aspectRatio =
    page.imageWidth && page.imageHeight ? page.imageHeight / page.imageWidth : DEFAULT_ASPECT_RATIO;
  const renderedHeight = renderedWidth * aspectRatio;
  const imageSize = { width: renderedWidth, height: renderedHeight };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('scan.result.fullDoc.viewer.pageIndicator', {
              current: page.pageNo,
              total: totalPages,
            })}
          </Text>
          <View style={styles.headerSideSlot} />
        </View>

        <View style={styles.imageArea}>
          <PinchZoomView active={visible} style={imageSize}>
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
        </View>

        {hasBlocks && (
          <PrimaryButton
            label={
              overlayOn
                ? t('scan.result.fullDoc.viewer.showOriginal')
                : t('scan.result.fullDoc.viewer.showTranslation')
            }
            onPress={() => setOverlayOn((v) => !v)}
            style={{ ...styles.toggleButton, marginBottom: insets.bottom + 16 }}
          />
        )}
      </View>
    </Modal>
  );
};

export default PageImageViewerModal;
