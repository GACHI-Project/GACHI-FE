import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChildInfo } from '../../src/types/child';
import { fetchChildren, registerChild, updateChild, deleteChild } from '../../src/api/child';
import { useChildrenStore } from '../../src/store/childrenStore';
import { fetchMyInfo, UserInfo } from '../../src/api/user';
import { CALENDAR_COLORS } from '../../src/constants/child';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/profile/profile';
import Header from '../../src/components/common/Header';
import ChildEditSheet from '../../src/components/profile/ChildEditSheet';

const formatJoinDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const LANGUAGE_NAMES: Record<string, string> = {
  ko: '한국어',
  en: 'English',
  vi: 'Tiếng Việt',
  zh: '中文',
};

const APP_VERSION = '1.0.0';

const ProfileScreen = () => {
  const { t, i18n } = useTranslation();
  const currentLanguageName = LANGUAGE_NAMES[i18n.language] ?? i18n.language;
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const { children, setChildren } = useChildrenStore();
  const [isLoading, setIsLoading] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildInfo | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isNewChild, setIsNewChild] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await fetchChildren();
        setChildren(result);
      } catch {
        // 조회 실패 시 빈 목록 유지
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [setChildren]);

  useFocusEffect(
    useCallback(() => {
      fetchMyInfo()
        .then(setUserInfo)
        .catch(() => {});
    }, [])
  );

  return (
    <View style={styles.container}>
      <Header title={t('profile.title')} onHelp={() => {}} />
      <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Image source={require('../../assets/icon.png')} style={styles.avatar} />

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userInfo?.name ?? ''}</Text>
            <View style={styles.profileSubRow}>
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>{userInfo?.loginId ?? ''}</Text>
              </View>
              <Text style={styles.joinDate}>
                {t('profile.joinDate', {
                  date: userInfo ? formatJoinDate(userInfo.createdAt) : '',
                })}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/profile/edit')}>
            <Text style={styles.editBtnText}>{t('profile.edit')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>{t('profile.childInfo')}</Text>
        <View style={styles.card}>
          {isLoading ? (
            <ActivityIndicator style={styles.childRow} color={colors.primary[400]} />
          ) : (
            children.map((child, index) => {
              const isLast = index === children.length - 1;
              return (
                <TouchableOpacity
                  key={child.id}
                  style={isLast ? styles.childRowLast : styles.childRow}
                  onPress={() => {
                    setIsNewChild(false);
                    setEditingChild({
                      id: String(child.id),
                      name: child.name,
                      selectedSchool: {
                        schoolCode: child.schoolCode,
                        schoolName: child.schoolName,
                        englishSchoolName: '',
                        schoolKind: '',
                        officeCode: child.officeCode,
                        officeName: '',
                        locationName: '',
                        roadAddress: '',
                      },
                      schoolQuery: child.schoolName,
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
            })
          )}
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
              {userInfo?.notificationPreference === 'OFF'
                ? t('profile.notificationOff')
                : t('profile.notificationOn')}
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
        onSave={async (updated) => {
          if (isNewChild) {
            try {
              await registerChild({
                name: updated.name,
                schoolName: updated.selectedSchool?.schoolName ?? updated.schoolQuery,
                schoolCode: updated.selectedSchool?.schoolCode ?? '',
                officeCode: updated.selectedSchool?.officeCode ?? '',
                grade: updated.grade ?? 1,
                colorCode: updated.calendarColor ?? '#2BAEE0',
              });
              const result = await fetchChildren();
              setChildren(result);
            } catch (e) {
              Alert.alert(
                t('common.error'),
                e instanceof Error ? e.message : t('profile.childEdit.addFailed')
              );
              return;
            }
          } else {
            try {
              await updateChild(Number(updated.id), {
                name: updated.name,
                schoolName: updated.selectedSchool?.schoolName ?? updated.schoolQuery,
                schoolCode: updated.selectedSchool?.schoolCode ?? '',
                officeCode: updated.selectedSchool?.officeCode ?? '',
                grade: updated.grade ?? 1,
                colorCode: updated.calendarColor ?? '#2BAEE0',
              });
              const result = await fetchChildren();
              setChildren(result);
            } catch {
              Alert.alert(t('common.error'), t('profile.childEdit.updateFailed'));
              return;
            }
          }
          setSheetVisible(false);
        }}
        onDelete={async (id) => {
          try {
            await deleteChild(Number(id));
            const result = await fetchChildren();
            setChildren(result);
          } catch {
            Alert.alert(t('common.error'), t('profile.childEdit.deleteFailed'));
          }
          setSheetVisible(false);
        }}
      />
    </View>
  );
};

export default ProfileScreen;
