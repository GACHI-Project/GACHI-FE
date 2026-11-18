import { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import colors from '../../constants/colors';
import styles from './featureSection.styles';

type FeatureId = 'ai' | 'guide';
type FeatureTextPart = 'title' | 'button';

interface FeatureCardBase {
  id: FeatureId;
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
  const { t, i18n } = useTranslation();
  const [textHeights, setTextHeights] = useState<
    Partial<Record<FeatureId, Partial<Record<FeatureTextPart, number>>>>
  >({});
  const recordTextHeight = (id: FeatureId, part: FeatureTextPart) => (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setTextHeights((previous) => {
      if (previous[id]?.[part] === height) return previous;
      return { ...previous, [id]: { ...previous[id], [part]: height } };
    });
  };
  const titleHeight = Math.max(
    0,
    ...FEATURE_CARD_BASES.map(({ id }) => textHeights[id]?.title ?? 0)
  );
  const buttonHeight = Math.max(
    styles.cardButton.minHeight,
    ...FEATURE_CARD_BASES.map(
      ({ id }) => (textHeights[id]?.button ?? 0) + styles.cardButton.paddingVertical * 2
    )
  );
  const featureCards = FEATURE_CARD_BASES.map((base) => ({
    ...base,
    title: (t(`home.features.${base.id}.title`, { returnObjects: true }) as string[]).join(
      base.id === 'guide' && i18n.language.startsWith('ko') ? '\n' : ' '
    ),
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
                <View style={[styles.titleBlock, { minHeight: titleHeight }]}>
                  <Text style={styles.cardTitle} onLayout={recordTextHeight(card.id, 'title')}>
                    {card.title}
                  </Text>
                </View>
                <Text style={styles.cardDesc}>{card.desc}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.cardButton,
                  { backgroundColor: card.buttonColor, minHeight: buttonHeight },
                ]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={card.buttonLabel}
                hitSlop={{ top: 9, bottom: 9, left: 4, right: 4 }}
                onPress={() => {
                  if (card.id === 'ai') router.push('/chat');
                  else if (card.id === 'guide') router.push('/guide');
                }}
              >
                <Ionicons
                  name={card.id === 'ai' ? 'chatbubble-outline' : 'albums-outline'}
                  size={12}
                  color={card.buttonTextColor}
                />
                <Text
                  style={[styles.cardButtonText, { color: card.buttonTextColor }]}
                  onLayout={recordTextHeight(card.id, 'button')}
                >
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
