/* eslint-disable react/jsx-props-no-spreading */
import { View, Text, Animated, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ChildItem } from '../../api/child';
import type { MealMenu } from '../../api/meal';
import colors from '../../constants/colors';
import styles from './mealTimetableWidget.styles';
import useSwipeableCard from '../../hooks/home/useSwipeableCard';

interface Props {
  cardWidth: number;
  items: ChildItem[];
  meals: MealMenu[][];
  loading: boolean;
  fontScale: number;
}

const MealCard = ({ cardWidth, items, meals, loading, fontScale }: Props) => {
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
    if (!menus.length) {
      return <Text style={styles.emptyText}>{t('mealTimetable.meal.empty')}</Text>;
    }
    return (
      <View style={styles.menuList}>
        {menus.map((menu) => (
          <View key={menu.name} style={styles.menuItem}>
            <View style={styles.menuBullet} />
            <Text style={styles.menuName} numberOfLines={2}>
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
      style={styles.card}
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
            <Text style={styles.cardTitle} numberOfLines={1}>
              {t('mealTimetable.meal.cardTitle')}
            </Text>
          </View>
        </View>
        <View style={styles.childRow}>
          <View style={[styles.childDot, { backgroundColor: activeChild.colorCode }]} />
          <Text style={styles.childText} numberOfLines={1}>
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
