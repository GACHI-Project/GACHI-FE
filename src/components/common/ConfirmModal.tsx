import { ReactNode } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import useResponsiveLayout from '../../hooks/useResponsiveLayout';

interface Props {
  visible: boolean;
  onClose: () => void;
  icon: ReactNode;
  iconBg?: string;
  title: string;
  description?: string;
  warning?: string;
  extraContent?: ReactNode;
  cancelText?: string;
  onCancel?: () => void;
  confirmText: string;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}

const ConfirmModal = ({
  visible,
  onClose,
  icon,
  iconBg = colors.primary[100],
  title,
  description,
  warning,
  extraContent,
  cancelText,
  onCancel,
  confirmText,
  onConfirm,
  confirmDisabled = false,
}: Props) => {
  const { isCompact } = useResponsiveLayout();
  const cardContent = (
    <View style={styles.card}>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {warning ? (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={15} color={colors.text.primary} />
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        ) : null}
        {extraContent ? <View style={styles.extraContent}>{extraContent}</View> : null}
        <View style={[styles.btnRow, isCompact && styles.stackedRow]}>
          {cancelText && onCancel && (
            <TouchableOpacity
              style={[styles.cancelBtn, isCompact && styles.stackedButton]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>{cancelText}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              cancelText && onCancel ? styles.confirmBtn : styles.cancelBtn,
              isCompact && styles.stackedButton,
              confirmDisabled && styles.confirmBtnDisabled,
            ]}
            onPress={onConfirm}
            disabled={confirmDisabled}
            activeOpacity={confirmDisabled ? 1 : 0.8}
          >
            <Text style={cancelText && onCancel ? styles.confirmBtnText : styles.cancelBtnText}>
              {confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>{cardContent}</TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ConfirmModal;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  card: {
    maxHeight: '100%',
    backgroundColor: colors.text.white,
    borderRadius: 20,
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    gap: 15,
    alignItems: 'center',
  },
  body: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContent: {
    alignItems: 'center',
    gap: 15,
  },
  iconBox: {
    borderRadius: 10,
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  warningBanner: {
    backgroundColor: colors.secondary[500],
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
    width: '100%',
  },
  extraContent: {
    width: '100%',
  },
  warningText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    lineHeight: 16,
    flex: 1,
  },
  btnRow: {
    flexShrink: 0,
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  stackedRow: {
    flexDirection: 'column',
  },
  stackedButton: {
    flex: 0,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    minHeight: 55,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
  confirmBtn: {
    flex: 1,
    minHeight: 55,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: colors.text.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.gray[200],
  },
});
