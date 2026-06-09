import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ConfirmModal from '../common/ConfirmModal';
import { ChildInfo } from '../../types/child';
import { ChildCard, isChildComplete } from '../../../app/(auth)/register/child';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

interface ChildEditSheetProps {
  visible: boolean;
  child: ChildInfo | null;
  isNew?: boolean;
  onClose: () => void;
  onSave: (updated: ChildInfo) => void;
  onDelete: (id: string) => void;
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
  const [editingChild, setEditingChild] = useState<ChildInfo | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (child) setEditingChild({ ...child });
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
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(sheetTranslateY, { toValue: 300, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, overlayOpacity, sheetTranslateY]);

  const updateField = (updates: Partial<ChildInfo>) => {
    setEditingChild((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const handleDelete = () => {
    if (!editingChild) return;
    setDeleteModalVisible(true);
  };

  if (!editingChild) return null;

  const canSave = isChildComplete(editingChild);

  return (
    <>
      <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={onClose}>
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
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <ChildCard
                    child={editingChild}
                    order={editingChild.name}
                    isDeletable={false}
                    variant="edit"
                    onUpdate={updateField}
                    onDelete={() => {}}
                  />
                </ScrollView>
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                    onPress={() => onSave(editingChild)}
                    disabled={!canSave}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.saveBtnText}>{t('profile.childEdit.save')}</Text>
                  </TouchableOpacity>
                  {!isNew && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={handleDelete}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteBtnText}>{t('profile.childEdit.delete')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
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
        onConfirm={() => {
          setDeleteModalVisible(false);
          if (editingChild) onDelete(editingChild.id);
        }}
      />
    </>
  );
};

export default ChildEditSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.text.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
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
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: colors.primary[200],
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text.white,
  },
  deleteBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text.red,
  },
});
