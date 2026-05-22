import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '../common/Button';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

const HELP_ITEM_ICONS = [
  { icon: 'person' as const, bg: colors.primary[100], iconColor: colors.primary[500] },
  { icon: 'camera' as const, bg: colors.gray[100], iconColor: colors.gray[300] },
  { icon: 'sparkles' as const, bg: colors.secondary[200], iconColor: colors.secondary[600] },
];

interface ScanHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

const SHEET_HEIGHT = 420;
const returnTrue = () => true;

const ScanHelpModal = ({ visible, onClose }: ScanHelpModalProps) => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const helpItems = HELP_ITEM_ICONS.map((base, i) => ({
    ...base,
    title: t(`scan.helpModal.step${i + 1}.title`),
    desc: t(`scan.helpModal.step${i + 1}.desc`),
  }));
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      translateY.setValue(SHEET_HEIGHT);
      setShow(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          bounciness: 0,
          speed: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (show) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setShow(false);
      });
    }
  }, [visible, show, opacity, translateY]);

  return (
    <Modal visible={show} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('common.modalClose')}
        />
      </Animated.View>

      <Animated.View style={[styles.sheetWrap, { transform: [{ translateY }] }]}>
        <View style={styles.sheet} onStartShouldSetResponder={returnTrue}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('scan.helpModal.title')}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={t('common.close')}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={20} color={colors.gray[300]} />
            </TouchableOpacity>
          </View>

          <View style={styles.list}>
            {helpItems.map((item) => (
              <View key={item.title} style={styles.item}>
                <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={18} color={item.iconColor} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <PrimaryButton label={t('scan.helpModal.confirm')} onPress={onClose} />
        </View>
      </Animated.View>
    </Modal>
  );
};

export default ScanHelpModal;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.text.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: 24,
    paddingBottom: 36,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  list: {
    gap: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  itemDesc: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
