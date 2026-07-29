import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import styles from './guideCards.styles';

const GUIDE_EMOJIS = ['📋', '👩‍🏫', '🎒', '👕'];

const GuideCards = () => {
  const { t } = useTranslation();
  const raw = t('home.guideCards.questions', { returnObjects: true });
  const questions: string[] = Array.isArray(raw) ? (raw as string[]) : [];

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{t('home.guideCards.sectionTitle')}</Text>
        <TouchableOpacity onPress={() => router.push('/guide')} activeOpacity={0.7}>
          <Text style={styles.moreText}>{t('home.guideCards.more')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {questions.map((question, index) => (
          <TouchableOpacity
            key={question}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/guide')}
          >
            <Text style={styles.cardEmoji}>{GUIDE_EMOJIS[index] ?? '📌'}</Text>
            <Text style={styles.cardQuestion}>{question}</Text>
            <View style={styles.guideBadge}>
              <Text style={styles.guideBadgeText}>{t('home.guideCards.badge')}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default GuideCards;
