import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import styles from '../../styles/home/guideCards';

interface GuideCard {
  id: string;
  emoji: string;
  question: string;
}

const GUIDE_CARDS: GuideCard[] = [
  { id: '1', emoji: '📋', question: '동의서를 꼭 직접 내야 하나요?' },
  { id: '2', emoji: '👩‍🏫', question: '담임 선생님께 연락 드려야 할까요?' },
  { id: '3', emoji: '🎒', question: '준비물은 어떤 걸 챙겨야 하나요?' },
  { id: '4', emoji: '👕', question: '체육복은 따로 구매해야 하나요?' },
];

const GuideCards = () => (
  <View style={styles.section}>
    <View style={styles.header}>
      <Text style={styles.sectionTitle}>이런 내용, 궁금하셨나요?</Text>
      {/* TODO: 가이드 전체 목록 화면으로 이동 예정 */}
      <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
        <Text style={styles.moreText}>더보기</Text>
      </TouchableOpacity>
    </View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {GUIDE_CARDS.map((card) => (
        // TODO: 가이드 상세 화면으로 이동 예정
        <TouchableOpacity key={card.id} style={styles.card} activeOpacity={0.8} onPress={() => {}}>
          <Text style={styles.cardEmoji}>{card.emoji}</Text>
          <Text style={styles.cardQuestion}>{card.question}</Text>
          <View style={styles.guideBadge}>
            <Text style={styles.guideBadgeText}>✓ 가이드</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

export default GuideCards;
