import { View, Text, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import colors from '../../constants/colors';
import styles from '../../styles/home/featureSection';

interface FeatureCardBase {
  id: string;
  image: ImageSourcePropType;
  buttonColor: string;
  buttonTextColor: string;
  gradientColors: [string, string];
}

const FEATURE_CARD_BASES: FeatureCardBase[] = [
  {
    id: 'ai',
    image: require('../../../assets/images/home/home_ai.png'),
    buttonColor: colors.primary[500],
    buttonTextColor: colors.text.white,
    gradientColors: [colors.primary[100], colors.primary[300]],
  },
  {
    id: 'guide',
    image: require('../../../assets/images/home/home_school.png'),
    buttonColor: colors.secondary[600],
    buttonTextColor: colors.text.white,
    gradientColors: [colors.secondary[100], colors.secondary[400]],
  },
];

const FeatureSection = () => {
  const { t } = useTranslation();
  const featureCards = FEATURE_CARD_BASES.map((base) => ({
    ...base,
    title: t(`home.features.${base.id}.title`, { returnObjects: true }) as string[],
    desc: t(`home.features.${base.id}.desc`),
    buttonLabel: t(`home.features.${base.id}.button`),
  }));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('home.features.sectionTitle')}</Text>
      <View style={styles.cardsRow}>
        {featureCards.map((card) => (
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
                onPress={() => (card.id === 'guide' ? router.push('/guide') : undefined)}
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
};

export default FeatureSection;
