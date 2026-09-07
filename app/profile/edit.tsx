import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../src/components/common/Header';
import ConfirmModal from '../../src/components/common/ConfirmModal';
import FormField from '../../src/components/auth/FormField';
import {
  fetchMyInfo,
  updateProfile,
  withdrawUser,
  UserInfo,
  UserApiError,
} from '../../src/api/user';
import { clearSession } from '../../src/api/auth';
import { phoneNumberSchema } from '../../src/validation/auth';
import colors from '../../src/constants/colors';
import layout from '../../src/constants/layout';
import styles from '../../src/styles/profile/profileEdit';

const formatPhoneNumber = (digits: string): string => {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

interface ProfileEditSheetProps {
  visible: boolean;
  initialFocus: 'name' | 'phone';
  initialName: string;
  initialPhone: string;
  onClose: () => void;
  onSaved: () => void;
}

const ProfileEditSheet = ({
  visible,
  initialFocus,
  initialName,
  initialPhone,
  onClose,
  onSaved,
}: ProfileEditSheetProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setPhone(formatPhoneNumber(initialPhone.replace(/-/g, '')));
      setNameError(undefined);
      setPhoneError(undefined);
      setSaveError(undefined);
    }
  }, [visible, initialName, initialPhone]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 300, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, overlayOpacity, translateY]);

  const phoneDigits = phone.replace(/-/g, '');
  const isPhoneValid = phoneNumberSchema.safeParse(phoneDigits).success;
  const isNameValid = name.trim().length > 0;
  const canSave = isNameValid && isPhoneValid;

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 11);
    setPhone(formatPhoneNumber(digits));
    if (digits.length > 0 && !phoneNumberSchema.safeParse(digits).success) {
      setPhoneError(t('profile.editProfile.phoneInvalid'));
    } else {
      setPhoneError(undefined);
    }
  };

  const handleSave = async () => {
    if (!canSave || saving) return;

    setSaving(true);
    setSaveError(undefined);
    try {
      await updateProfile({ name: name.trim(), phoneNumber: phoneDigits });
      onSaved();
      onClose();
    } catch (e) {
      if (e instanceof UserApiError && e.code === 'AUTH4093') {
        setPhoneError(t('auth.register.basic.error.phoneTaken'));
      } else {
        setSaveError(
          e instanceof Error && e.message ? e.message : t('profile.editProfile.saveFailed')
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior="padding">
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.sheetOverlay, { opacity: overlayOpacity }]}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View
                style={[
                  styles.sheet,
                  {
                    transform: [{ translateY }],
                    paddingBottom: insets.bottom + layout.screenPaddingBottom,
                  },
                ]}
              >
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>{t('profile.editProfile.sheetTitle')}</Text>
                <View style={styles.sheetFields}>
                  <FormField
                    label={t('profile.editProfile.name')}
                    value={name}
                    onChangeText={(v) => {
                      setName(v);
                      setNameError(
                        v.trim().length === 0 ? t('profile.editProfile.nameRequired') : undefined
                      );
                    }}
                    placeholder={t('profile.editProfile.namePlaceholder')}
                    autoFocus={initialFocus === 'name'}
                    validationMessage={nameError}
                    validationState={nameError ? 'error' : undefined}
                  />
                  <FormField
                    label={t('profile.editProfile.phone')}
                    value={phone}
                    onChangeText={handlePhoneChange}
                    placeholder="010-0000-0000"
                    keyboardType="phone-pad"
                    autoFocus={initialFocus === 'phone'}
                    validationMessage={phoneError ?? saveError}
                    validationState={phoneError || saveError ? 'error' : undefined}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.sheetSaveBtn, !canSave && styles.sheetSaveBtnDisabled]}
                  onPress={handleSave}
                  disabled={!canSave || saving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sheetSaveBtnText}>
                    {saving ? t('common.saving') : t('common.change')}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const ProfileEditScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<'confirm' | 'password'>('confirm');
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [showWithdrawPassword, setShowWithdrawPassword] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | undefined>();
  const [withdrawing, setWithdrawing] = useState(false);
  const [editSheetVisible, setEditSheetVisible] = useState(false);
  const [editSheetFocus, setEditSheetFocus] = useState<'name' | 'phone'>('name');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const loadUserInfo = useCallback(() => {
    fetchMyInfo()
      .then(setUserInfo)
      .catch(() => {
        Alert.alert(t('common.error'), t('common.networkError'));
      });
    // t is used only in the error callback — re-fetching on language change is undesirable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(loadUserInfo);

  const openWithdrawModal = () => {
    setWithdrawStep('confirm');
    setWithdrawPassword('');
    setShowWithdrawPassword(false);
    setWithdrawError(undefined);
    setWithdrawModalVisible(true);
  };

  const closeWithdrawModal = () => {
    if (withdrawing) return;
    setWithdrawModalVisible(false);
    setWithdrawStep('confirm');
    setWithdrawPassword('');
    setShowWithdrawPassword(false);
    setWithdrawError(undefined);
  };

  const handleWithdraw = async () => {
    if (withdrawing || withdrawPassword.length === 0) return;

    setWithdrawing(true);
    setWithdrawError(undefined);
    try {
      await withdrawUser(withdrawPassword);
      setWithdrawModalVisible(false);
      setWithdrawPassword('');
      setShowWithdrawPassword(false);
      await clearSession();
    } catch (e) {
      if (e instanceof UserApiError && e.code === 'AUTH4011') {
        setWithdrawError(t('profile.editProfile.withdrawWrongPassword'));
      } else if (e instanceof UserApiError && e.code === 'UNAUTHORIZED') {
        await clearSession();
      } else {
        setWithdrawError(t('profile.editProfile.withdrawFailed'));
      }
    } finally {
      setWithdrawing(false);
    }
  };

  const isWithdrawPasswordStep = withdrawStep === 'password';

  const openSheet = (focus: 'name' | 'phone') => {
    setEditSheetFocus(focus);
    setEditSheetVisible(true);
  };

  return (
    <View style={styles.container}>
      <Header title={t('profile.edit')} onBack={() => router.back()} onHelp={() => {}} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + layout.screenPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <Image source={require('../../assets/icon.png')} style={styles.avatar} />
          <Text style={styles.loginId}>{userInfo?.loginId ?? ''}</Text>
        </View>

        <Text style={styles.sectionLabel}>{t('profile.editProfile.accountSection')}</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => openSheet('name')}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>{t('profile.editProfile.name')}</Text>
            <Text style={styles.rowValue}>{userInfo?.name ?? ''}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => openSheet('phone')}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>{t('profile.editProfile.phone')}</Text>
            <Text style={styles.rowValue}>
              {userInfo?.phoneNumber
                ? formatPhoneNumber(userInfo.phoneNumber.replace(/-/g, ''))
                : ''}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/profile/email')}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>{t('profile.editProfile.email')}</Text>
            <Text style={styles.rowValue}>{userInfo?.email ?? ''}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>{t('profile.editProfile.securitySection')}</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/profile/password')}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>{t('profile.editProfile.changePassword.title')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.withdrawBtn}
          onPress={openWithdrawModal}
          activeOpacity={0.8}
        >
          <Text style={styles.withdrawText}>{t('profile.editProfile.withdraw')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <ProfileEditSheet
        visible={editSheetVisible}
        initialFocus={editSheetFocus}
        initialName={userInfo?.name ?? ''}
        initialPhone={userInfo?.phoneNumber ?? ''}
        onClose={() => setEditSheetVisible(false)}
        onSaved={loadUserInfo}
      />

      {isWithdrawPasswordStep ? (
        <ConfirmModal
          visible={withdrawModalVisible}
          onClose={closeWithdrawModal}
          icon={<Ionicons name="lock-closed" size={26} color={colors.primary[500]} />}
          title={t('profile.editProfile.withdrawVerifyTitle')}
          description={t('profile.editProfile.withdrawVerifyDesc')}
          extraContent={
            <FormField
              label={t('profile.editProfile.changePassword.currentPassword')}
              value={withdrawPassword}
              onChangeText={(v) => {
                setWithdrawPassword(v);
                setWithdrawError(undefined);
              }}
              placeholder={t('profile.editProfile.withdrawPasswordPlaceholder')}
              secureTextEntry={!showWithdrawPassword}
              rightIcon={showWithdrawPassword ? 'eye-outline' : 'eye-off-outline'}
              onRightIconPress={() => setShowWithdrawPassword((prev) => !prev)}
              editable={!withdrawing}
              autoFocus
              validationState={withdrawError ? 'error' : undefined}
              validationMessage={withdrawError}
            />
          }
          cancelText={t('profile.editProfile.cancel')}
          onCancel={closeWithdrawModal}
          confirmText={t('profile.editProfile.withdraw')}
          onConfirm={handleWithdraw}
          confirmDisabled={withdrawPassword.length === 0 || withdrawing}
        />
      ) : (
        <ConfirmModal
          visible={withdrawModalVisible}
          onClose={closeWithdrawModal}
          icon={<FontAwesome5 name="user-slash" size={26} color={colors.primary[500]} />}
          title={t('profile.editProfile.withdrawTitle')}
          description={t('profile.editProfile.withdrawDesc')}
          warning={t('profile.editProfile.withdrawWarning')}
          cancelText={t('profile.editProfile.withdrawKeep')}
          onCancel={closeWithdrawModal}
          confirmText={t('profile.editProfile.withdrawContinue')}
          onConfirm={() => setWithdrawStep('password')}
        />
      )}
    </View>
  );
};

export default ProfileEditScreen;
