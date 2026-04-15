import { View, Text, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import styles from '../../styles/home/featureSection';

interface FeatureCard {
  id: string;
  image: ImageSourcePropType;
  title: string[];
  desc: string;
  buttonLabel: string;
  buttonColor: string;
  buttonTextColor: string;
  gradientColors: [string, string];
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    id: 'ai',
    image: require('../../../assets/images/home/home_ai.png'),
    title: ['AI에게', '물어보기'],
    desc: '이해 안 되는 내용을 바로 질문하세요. AI가 맥락까지 설명해드려요.',
    buttonLabel: '대화 시작',
    buttonColor: colors.primary[500],
    buttonTextColor: colors.text.white,
    gradientColors: [colors.primary[100], colors.primary[300]],
  },
  {
    id: 'guide',
    image: require('../../../assets/images/home/home_school.png'),
    title: ['학교 문화', '해설 가이드'],
    desc: '한국 학교 문화를 쉽게 이해하세요. 필요한 행동까지 안내해드려요.',
    buttonLabel: '가이드 시작',
    buttonColor: colors.secondary[600],
    buttonTextColor: colors.text.white,
    gradientColors: [colors.secondary[100], colors.secondary[400]],
  },
];

const FeatureSection = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>주요 기능</Text>
    <View style={styles.cardsRow}>
      {FEATURE_CARDS.map((card) => (
        <View key={card.id} style={styles.card}>
          <LinearGradient colors={card.gradientColors} style={styles.cardTop}>
            <Image source={card.image} style={styles.cardImage} resizeMode="contain" />
          </LinearGradient>
          <View style={styles.cardBottom}>
            <View style={styles.cardTexts}>
              {card.title.map((line) => (
                <Text key={line} style={styles.cardTitle}>
                  {line}
                </Text>
              ))}
              <Text style={styles.cardDesc}>{card.desc}</Text>
            </View>
            <TouchableOpacity
              style={[styles.cardButton, { backgroundColor: card.buttonColor }]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={card.id === 'ai' ? 'chatbubble-outline' : 'albums-outline'}
                size={12}
                color={card.buttonTextColor}
              />
              <Text style={[styles.cardButtonText, { color: card.buttonTextColor }]}>
                {card.buttonLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  </View>
);

export default FeatureSection;
