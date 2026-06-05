import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Header from '../../src/components/common/Header';
import ConfirmModal from '../../src/components/common/ConfirmModal';
import { fetchMyInfo, UserInfo } from '../../src/api/user';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/profile/profileEdit';

const ProfileEditScreen = () => {
  const { t } = useTranslation();
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetchMyInfo()
      .then(setUserInfo)
      .catch(() => {
        Alert.alert(t('common.error'), t('common.networkError'));
      });
    // t is used only in the error callback — re-fetching on language change is undesirable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <Header title={t('profile.edit')} onBack={() => router.back()} onHelp={() => {}} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Image source={require('../../assets/icon.png')} style={styles.avatar} />
          <Text style={styles.loginId}>{userInfo?.loginId ?? ''}</Text>
        </View>

        <Text style={styles.sectionLabel}>{t('profile.editProfile.accountSection')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('profile.editProfile.name')}</Text>
            <Text style={styles.rowValue}>{userInfo?.name ?? ''}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('profile.editProfile.phone')}</Text>
            <Text style={styles.rowValue}>{userInfo?.phoneNumber ?? ''}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('profile.editProfile.email')}</Text>
            <Text style={styles.rowValue}>{userInfo?.email ?? ''}</Text>
          </View>
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
          onPress={() => setWithdrawModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.withdrawText}>{t('profile.editProfile.withdraw')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal
        visible={withdrawModalVisible}
        onClose={() => setWithdrawModalVisible(false)}
        icon={<FontAwesome5 name="user-slash" size={26} color={colors.primary[500]} />}
        title={t('profile.editProfile.withdrawTitle')}
        description={t('profile.editProfile.withdrawDesc')}
        warning={t('profile.editProfile.withdrawWarning')}
        cancelText={t('profile.editProfile.cancel')}
        onCancel={() => setWithdrawModalVisible(false)}
        confirmText={t('profile.editProfile.withdraw')}
        onConfirm={() => {}}
        confirmDisabled
      />
    </View>
  );
};

export default ProfileEditScreen;
