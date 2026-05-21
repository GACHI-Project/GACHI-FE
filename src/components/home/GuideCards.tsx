import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import styles from '../../styles/home/guideCards';

const GUIDE_EMOJIS = ['📋', '👩‍🏫', '🎒', '👕'];

const GuideCards = () => {
  const { t } = useTranslation();
  const questions = t('home.guideCards.questions', { returnObjects: true }) as string[];

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{t('home.guideCards.sectionTitle')}</Text>
        {/* TODO: 가이드 전체 목록 화면으로 이동 예정 */}
        <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
          <Text style={styles.moreText}>{t('home.guideCards.more')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {questions.map((question, index) => (
          // TODO: 가이드 상세 화면으로 이동 예정
          <TouchableOpacity
            key={question}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => {}}
          >
            <Text style={styles.cardEmoji}>{GUIDE_EMOJIS[index]}</Text>
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
