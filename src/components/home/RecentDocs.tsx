import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getRecentNewsletters, type RecentNewsletterGroup } from '../../api/newsletter';
import colors from '../../constants/colors';
import styles from '../../styles/home/recentDocs';

const formatGroupDate = (dateStr: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(new Date(dateStr));

const RecentDocs = () => {
  const { t, i18n } = useTranslation();
  const [groups, setGroups] = useState<RecentNewsletterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRecentNewsletters(5)
      .then((data) => {
        if (!cancelled) setGroups(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{t('home.recentDocs.sectionTitle')}</Text>
        {/* TODO: 전체 문서 목록 화면으로 이동 예정 */}
        <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
          <Text style={styles.moreText}>{t('home.recentDocs.more')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.primary[400]}
          style={{ marginVertical: 16 }}
        />
      ) : error ? (
        <Text style={styles.docMeta}>{t('common.networkError')}</Text>
      ) : groups.length === 0 ? (
        <Text style={styles.docMeta}>{t('document.empty')}</Text>
      ) : (
        <View style={styles.timeline}>
          {groups.map((group) => (
            <View key={group.date} style={styles.group}>
              <View style={styles.dateRow}>
                <View style={styles.dateDot} />
                <Text style={styles.dateText}>{formatGroupDate(group.date, i18n.language)}</Text>
              </View>
              <View style={styles.timelineBody}>
                <View style={styles.lineColumn}>
                  <View style={styles.line} />
                </View>
                <View style={styles.cardsArea}>
                  {group.items.map((doc) => (
                    // TODO: 문서 상세 화면으로 이동 예정 router.push(`/(tabs)/documents/${doc.newsletterId}`)
                    <TouchableOpacity
                      key={doc.newsletterId}
                      style={styles.docCard}
                      activeOpacity={0.8}
                      onPress={() => {}}
                    >
                      <View style={styles.docIconBox}>
                        <AntDesign
                          name="file-done"
                          size={25}
                          color={colors.text.white}
                          style={styles.docIcon}
                        />
                      </View>
                      <View style={styles.docTexts}>
                        <Text style={styles.docTitle}>{doc.title}</Text>
                        <Text style={styles.docMeta}>
                          {[
                            doc.childName,
                            doc.childGrade != null
                              ? t('common.elementaryGrade', { grade: doc.childGrade })
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={24} color={colors.gray[200]} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default RecentDocs;
