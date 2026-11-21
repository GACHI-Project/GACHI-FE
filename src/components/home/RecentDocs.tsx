import { AntDesign, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { getRecentNewsletters } from '../../api/newsletter';
import colors from '../../constants/colors';
import { useServerQuery } from '../../query/hooks';
import styles from './recentDocs.styles';

const formatGroupDate = (dateStr: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(new Date(dateStr));

const RecentDocs = () => {
  const { t, i18n } = useTranslation();
  const query = useServerQuery('recent', [5], (signal) => getRecentNewsletters(5, signal));
  const groups = (query.data ?? [])
    .map((group) => ({ ...group, items: group.items.filter((doc) => doc.title != null) }))
    .filter((group) => group.items.length > 0);
  const loading = query.isLoading;
  const error = query.isError;

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={colors.primary[400]}
          style={styles.loadingIndicator}
        />
      );
    }
    if (error) {
      return <Text style={styles.docMeta}>{t('common.networkError')}</Text>;
    }
    if (groups.length === 0) {
      return <Text style={styles.docMeta}>{t('document.empty')}</Text>;
    }
    return (
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
                  <TouchableOpacity
                    key={doc.newsletterId}
                    style={styles.docCard}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/newsletter/${doc.newsletterId}`)}
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
                      <Text style={styles.docTitle} numberOfLines={2}>
                        {doc.title!}
                      </Text>
                      <Text style={styles.docMeta} numberOfLines={1}>
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
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{t('home.recentDocs.sectionTitle')}</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/document')} activeOpacity={0.7}>
          <Text style={styles.moreText}>{t('home.recentDocs.more')}</Text>
        </TouchableOpacity>
      </View>
      {renderContent()}
    </View>
  );
};

export default RecentDocs;
