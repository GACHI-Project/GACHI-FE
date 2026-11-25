/* eslint-disable react/jsx-props-no-spreading */
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, ScrollView, Text, View } from 'react-native';
import type { ChildItem } from '../../api/child';
import type { MealMenu } from '../../api/meal';
import colors from '../../constants/colors';
import useSwipeableCard from '../../hooks/home/useSwipeableCard';
import styles from './mealTimetableWidget.styles';

interface Props {
  cardWidth: number;
  items: ChildItem[];
  meals: MealMenu[][];
  loading: boolean;
  error?: boolean;
  fontScale: number;
}

const MealCard = ({ cardWidth, items, meals, loading, error = false, fontScale }: Props) => {
  const { t } = useTranslation();
  const { activeIdx, isPausedRef, translateX, panResponder } = useSwipeableCard(
    items.length,
    cardWidth
  );
  const activeChild = items[activeIdx];

  const renderMenuContent = (menus: MealMenu[]) => {
    if (loading) {
      return <ActivityIndicator color={colors.primary[400]} style={styles.loadingIndicator} />;
    }
    if (error) return <Text style={styles.emptyText}>{t('common.networkError')}</Text>;
    if (!menus.length) {
      return <Text style={styles.emptyText}>{t('mealTimetable.meal.empty')}</Text>;
    }
    return (
      <View style={styles.menuList}>
        {menus.map((menu) => (
          <View key={menu.name} style={styles.menuItem}>
            <View style={styles.menuBullet} />
            <Text style={styles.menuName}>
              {menu.name}
              {menu.allergyNums.length > 0 && (
                <Text style={styles.allergyText}> ({menu.allergyNums.join('.')})</Text>
              )}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View
      style={[styles.card, { width: cardWidth }]}
      onTouchStart={() => {
        isPausedRef.current = true;
      }}
      onTouchEnd={() => {
        isPausedRef.current = false;
      }}
      onTouchCancel={() => {
        isPausedRef.current = false;
      }}
    >
      <View style={styles.cardFixedSection}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: colors.primary[100] }]}>
            <Ionicons name="restaurant-outline" size={22} color={colors.primary[500]} />
          </View>
          <View style={styles.headerTexts}>
            {fontScale < 1.3 && (
              <Text style={[styles.cardLabel, { color: colors.primary[500] }]}>
                {t('mealTimetable.meal.cardLabel')}
              </Text>
            )}
            <Text style={styles.cardTitle}>{t('mealTimetable.meal.cardTitle')}</Text>
          </View>
        </View>
        <View style={styles.childRow}>
          <View style={[styles.childDot, { backgroundColor: activeChild.colorCode }]} />
          <Text style={styles.childText}>
            {activeChild.name} · {activeChild.schoolName}
          </Text>
        </View>
        <View style={styles.divider} />
      </View>

      <View
        style={styles.menuAreaContainer}
        {...(items.length > 1 ? panResponder.panHandlers : {})}
      >
        <Animated.View
          style={[
            styles.slideRow,
            { width: cardWidth * items.length, transform: [{ translateX }] },
          ]}
        >
          {items.map((item, index) => (
            <View key={String(item.id)} style={[{ width: cardWidth }, styles.menuPageContent]}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                style={styles.scrollArea}
              >
                {renderMenuContent(meals[index] ?? [])}
              </ScrollView>
            </View>
          ))}
        </Animated.View>
      </View>

      {items.length > 1 && (
        <View style={styles.dotsRow}>
          {items.map((item, idx) => (
            <View
              key={item.id}
              style={[
                styles.dot,
                { backgroundColor: idx === activeIdx ? colors.primary[500] : colors.gray[200] },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default MealCard;
