import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Header from '../../src/components/common/Header';
import colors from '../../src/constants/colors';
import styles from '../../src/styles/guide/guideScreen';

const CATEGORY_EMOJIS = [
  ['📄', '📅', '🏫', '🍱'],
  ['🎒', '📚', '📝', '💬'],
  ['🏥', '📐', '🌐', '🐣'],
];

interface CategoryItem {
  name: string;
  key: string;
}

interface Section {
  label: string;
  categories: CategoryItem[];
}

const GuideScreen = () => {
  const { t } = useTranslation();

  const popularQuestions = t('guide.popularQuestions', { returnObjects: true }) as string[];
  const sections = t('guide.sections', { returnObjects: true }) as Section[];

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Header title="" />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          <Text style={styles.title}>{t('guide.title')}</Text>
          <Text style={styles.subtitle}>{t('guide.subtitle')}</Text>
          <TouchableOpacity style={styles.searchBar} activeOpacity={0.7} accessibilityRole="search">
            <Ionicons name="search-outline" size={18} color={colors.gray[300]} />
            <Text style={styles.searchPlaceholder}>{t('guide.searchPlaceholder')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('guide.popularTitle')}</Text>
          {popularQuestions.map((question) => (
            <TouchableOpacity
              key={question}
              style={styles.popularCard}
              activeOpacity={0.7}
              onPress={() => {}}
            >
              <Text style={styles.popularQ}>Q.</Text>
              <Text style={styles.popularText}>{question}</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.gray[300]} />
            </TouchableOpacity>
          ))}
        </View>

        {sections.map((section, sectionIndex) => (
          <View key={section.label} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            <View style={styles.categoryGrid}>
              {section.categories.map((cat, catIndex) => (
                <TouchableOpacity
                  key={cat.key}
                  style={styles.categoryCard}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/guide/[category]',
                      params: {
                        category: cat.name,
                        categoryKey: cat.key,
                        emoji: CATEGORY_EMOJIS[sectionIndex]?.[catIndex] ?? '📌',
                      },
                    })
                  }
                >
                  <Text style={styles.categoryEmoji}>
                    {CATEGORY_EMOJIS[sectionIndex]?.[catIndex] ?? '📌'}
                  </Text>
                  <View style={styles.categoryTexts}>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categoryCount}>
                      {t('guide.questionCount', { count: 15 })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default GuideScreen;
