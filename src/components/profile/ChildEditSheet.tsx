import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfirmModal from '../common/ConfirmModal';
import { ChildInfo } from '../../types/child';
import { ChildCard, isChildComplete } from '../../../app/(auth)/register/child';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';
import useSchoolAddress from '../../hooks/profile/useSchoolAddress';
import { getSessionVersion, isCurrentSession } from '../../utils/authSession';

interface ChildEditSheetProps {
  visible: boolean;
  child: ChildInfo | null;
  isNew?: boolean;
  onClose: () => void;
  onSave: (updated: ChildInfo) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

const ChildEditSheet = ({
  visible,
  child,
  isNew = false,
  onClose,
  onSave,
  onDelete,
}: ChildEditSheetProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [editingChild, setEditingChild] = useState<ChildInfo | null>(null);
  const selectedSchool = useSchoolAddress(editingChild?.selectedSchool ?? null, visible);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [action, setAction] = useState<'save' | 'delete' | null>(null);
  const requestRef = useRef<object | null>(null);
  const editorRef = useRef<ChildInfo | null>(null);
  const isPending = action !== null;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(300)).current;
  useLayoutEffect(() => {
    editorRef.current = visible ? child : null;
    requestRef.current = null;
    setAction(null);
    setDeleteModalVisible(false);
    if (visible && child) setEditingChild({ ...child });
    return () => {
      editorRef.current = null;
      requestRef.current = null;
    };
  }, [child, visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(sheetTranslateY, { toValue: 300, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, overlayOpacity, sheetTranslateY]);

  const updateField = (updates: Partial<ChildInfo>) => {
    if (requestRef.current || editorRef.current !== child) return;
    setEditingChild((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const handleDelete = () => {
    if (!editingChild || requestRef.current || editorRef.current !== child) return;
    setDeleteModalVisible(true);
  };

  const handleCloseSheet = () => {
    if (requestRef.current) return;
    Keyboard.dismiss();
    setDeleteModalVisible(false);
    onClose();
  };

  const runAction = async (nextAction: 'save' | 'delete') => {
    if (
      !visible ||
      !child ||
      !editingChild ||
      editorRef.current !== child ||
      requestRef.current ||
      (nextAction === 'save' && !isChildComplete(editingChild))
    )
      return;
    const request = {};
    const version = getSessionVersion();
    requestRef.current = request;
    setAction(nextAction);
    setDeleteModalVisible(false);
    Keyboard.dismiss();
    const isCurrent = () => requestRef.current === request && isCurrentSession(version);
    try {
      if (nextAction === 'save') await onSave(editingChild);
      else await onDelete(editingChild.id);
      if (isCurrent()) onClose();
    } catch (error) {
      if (!isCurrent()) return;
      let message = t('profile.childEdit.deleteFailed');
      if (nextAction === 'save') {
        message = t('profile.childEdit.updateFailed');
        if (isNew)
          message = error instanceof Error ? error.message : t('profile.childEdit.addFailed');
      }
      Alert.alert(t('common.error'), message);
    } finally {
      if (requestRef.current === request) {
        requestRef.current = null;
        setAction(null);
      }
    }
  };

  if (!editingChild) return null;

  const canSave = !isPending && isChildComplete(editingChild);

  return (
    <>
      <Modal
        transparent
        visible={visible}
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleCloseSheet}
      >
        <View style={styles.container}>
          <TouchableWithoutFeedback onPress={handleCloseSheet}>
            <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <Animated.View
                  style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}
                >
                  <View style={styles.handleWrap}>
                    <View style={styles.handle} />
                  </View>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View
                      pointerEvents={isPending ? 'none' : 'auto'}
                      accessibilityState={{ disabled: isPending }}
                    >
                      <ChildCard
                        child={{ ...editingChild, selectedSchool }}
                        order={editingChild.name}
                        isDeletable={false}
                        variant="edit"
                        onUpdate={updateField}
                        onDelete={() => {}}
                      />
                    </View>
                    <View style={styles.footer}>
                      <TouchableOpacity
                        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                        onPress={() => runAction('save')}
                        disabled={!canSave}
                        accessibilityLabel={t('profile.childEdit.save')}
                        accessibilityState={{ disabled: !canSave, busy: action === 'save' }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.saveBtnText}>
                          {t(action === 'save' ? 'common.saving' : 'profile.childEdit.save')}
                        </Text>
                      </TouchableOpacity>
                      {!isNew && (
                        <TouchableOpacity
                          style={[styles.deleteBtn, isPending && styles.actionDisabled]}
                          onPress={handleDelete}
                          disabled={isPending}
                          accessibilityLabel={t('profile.childEdit.delete')}
                          accessibilityState={{ disabled: isPending, busy: action === 'delete' }}
                          activeOpacity={0.7}
                        >
                          {action === 'delete' ? (
                            <ActivityIndicator size="small" color={colors.text.red} />
                          ) : null}
                          <Text style={styles.deleteBtnText}>{t('profile.childEdit.delete')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </ScrollView>
                </Animated.View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
      <ConfirmModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        icon={<FontAwesome5 name="user-slash" size={26} color={colors.primary[500]} />}
        title={t('profile.childEdit.deleteTitle')}
        description={t('profile.childEdit.deleteDesc')}
        warning={t('profile.childEdit.deleteWarning')}
        cancelText={t('common.close')}
        onCancel={() => setDeleteModalVisible(false)}
        confirmText={t('profile.childEdit.delete')}
        confirmDisabled={isPending}
        onConfirm={() => runAction('delete')}
      />
    </>
  );
};

export default ChildEditSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.text.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  handleWrap: {
    alignItems: 'center',
    marginVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: layout.screenPaddingBottom,
    paddingTop: 8,
    gap: 4,
  },
  saveBtn: {
    backgroundColor: colors.primary[400],
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: colors.primary[200],
  },
  saveBtnText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text.white,
  },
  deleteBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  deleteBtnText: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.red,
  },
});
