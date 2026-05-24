import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChildInfo } from '../../src/types/child';
import { CALENDAR_COLORS } from '../(auth)/register/child';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/profile/profile';
import Header from '../../src/components/common/Header';
import ChildEditSheet from '../../src/components/profile/ChildEditSheet';

const mockUser = {
  name: 'Linh Nguyễn',
  loginId: 'gachi-gayo22',
  joinDate: '2026.01',
};
const mockChildren = [
  { id: '1', name: '김첫째', grade: 4, colorCode: '#2BAEE0' },
  { id: '2', name: '김둘째', grade: 1, colorCode: '#FFD84D' },
];
const LANGUAGE_NAMES: Record<string, string> = {
  ko: '한국어',
  en: 'English',
  vi: 'Tiếng Việt',
  zh: '中文',
};

const mockNotification = true;
const APP_VERSION = '1.0.0';

const ProfileScreen = () => {
  const { t, i18n } = useTranslation();
  const currentLanguageName = LANGUAGE_NAMES[i18n.language] ?? i18n.language;
  const [editingChild, setEditingChild] = useState<ChildInfo | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isNewChild, setIsNewChild] = useState(false);

  return (
    <View style={styles.container}>
      <Header title={t('profile.title')} onHelp={() => {}} />
      <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Image source={require('../../assets/icon.png')} style={styles.avatar} />

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{mockUser.name}</Text>
            <View style={styles.profileSubRow}>
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>{mockUser.loginId}</Text>
              </View>
              <Text style={styles.joinDate}>
                {t('profile.joinDate', { date: mockUser.joinDate })}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/profile/edit')}>
            <Text style={styles.editBtnText}>{t('profile.edit')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>{t('profile.childInfo')}</Text>
        <View style={styles.card}>
          {mockChildren.map((child, index) => {
            const isLast = index === mockChildren.length - 1;
            return (
              <TouchableOpacity
                key={child.id}
                style={isLast ? styles.childRowLast : styles.childRow}
                onPress={() => {
                  setIsNewChild(false);
                  setEditingChild({
                    id: child.id,
                    name: child.name,
                    selectedSchool: null,
                    schoolQuery: '',
                    grade: child.grade,
                    calendarColor: child.colorCode,
                  });
                  setSheetVisible(true);
                }}
              >
                <View style={[styles.childAvatar, { backgroundColor: child.colorCode }]} />
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childGrade}>
                    {t('profile.grade', { grade: child.grade })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          style={styles.addChildBtn}
          onPress={() => {
            setIsNewChild(true);
            setEditingChild({
              id: String(Date.now()),
              name: '',
              selectedSchool: null,
              schoolQuery: '',
              grade: null,
              calendarColor: CALENDAR_COLORS[0],
            });
            setSheetVisible(true);
          }}
        >
          <Text style={styles.addChildText}>{t('profile.addChild')}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>{t('profile.appSettings')}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/profile/language')}>
            <Text style={styles.rowLabel}>{t('profile.appLanguage')}</Text>
            <Text style={styles.rowValue}>{currentLanguageName}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rowLast}
            onPress={() => router.push('/profile/notification')}
          >
            <Text style={styles.rowLabel}>{t('profile.notification')}</Text>
            <Text style={styles.rowValue}>
              {mockNotification ? t('profile.notificationOn') : t('profile.notificationOff')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>{t('profile.etc')}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => {}}>
            <Text style={styles.rowLabel}>{t('profile.inquiry')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => {}}>
            <Text style={styles.rowLabel}>{t('profile.privacy')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
          <View style={styles.rowLast}>
            <Text style={styles.rowLabel}>{t('profile.appVersion')}</Text>
            <Text style={styles.rowValue}>{APP_VERSION}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => {}}>
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
      <ChildEditSheet
        visible={sheetVisible}
        child={editingChild}
        isNew={isNewChild}
        onClose={() => setSheetVisible(false)}
        onSave={() => setSheetVisible(false)}
        onDelete={() => setSheetVisible(false)}
      />
    </View>
  );
};

export default ProfileScreen;
