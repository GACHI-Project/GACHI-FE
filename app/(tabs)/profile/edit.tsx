import { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Header from '../../../src/components/common/Header';
import colors from '../../../src/constants/colors';
import styles from '../../../src/styles/profile/profileEdit';

const mockUser = {
  loginId: 'gachi-gayo22',
  name: 'Linh Nguyễn',
  phone: '010-0000-0000',
  email: 'gachi-gayo@example.com',
};

const ProfileEditScreen = () => {
  const { t } = useTranslation();
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Header
        title={t('profile.edit')}
        onBack={() => router.push('/(tabs)/profile')}
        onHelp={() => {}}
      />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Image source={require('../../../assets/icon.png')} style={styles.avatar} />
          <Text style={styles.loginId}>{mockUser.loginId}</Text>
        </View>

        <Text style={styles.sectionLabel}>{t('profile.editProfile.accountSection')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('profile.editProfile.name')}</Text>
            <Text style={styles.rowValue}>{mockUser.name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('profile.editProfile.phone')}</Text>
            <Text style={styles.rowValue}>{mockUser.phone}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('profile.editProfile.email')}</Text>
            <Text style={styles.rowValue}>{mockUser.email}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t('profile.editProfile.securitySection')}</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/(tabs)/profile/password')}
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

      <Modal
        visible={withdrawModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setWithdrawModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
                <View style={styles.iconBox}>
                  <FontAwesome5 name="user-slash" size={26} color={colors.primary[500]} />
                </View>
                <Text style={styles.modalTitle}>{t('profile.editProfile.withdrawTitle')}</Text>
                <Text style={styles.modalDesc}>{t('profile.editProfile.withdrawDesc')}</Text>
                <View style={styles.warningBanner}>
                  <Ionicons name="warning" size={15} color={colors.text.primary} />
                  <Text style={styles.warningText}>{t('profile.editProfile.withdrawWarning')}</Text>
                </View>
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setWithdrawModalVisible(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>{t('profile.editProfile.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.withdrawModalBtn}
                    onPress={() => setWithdrawModalVisible(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.withdrawModalBtnText}>
                      {t('profile.editProfile.withdraw')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default ProfileEditScreen;
