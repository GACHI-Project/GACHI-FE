/* eslint-disable react/jsx-props-no-spreading */
import { View, Text, Animated, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ChildItem } from '../../api/child';
import type { TimetablePeriod } from '../../api/meal';
import colors from '../../constants/colors';
import styles from './mealTimetableWidget.styles';
import useSwipeableCard from '../../hooks/home/useSwipeableCard';

interface Props {
  cardWidth: number;
  items: ChildItem[];
  timetables: TimetablePeriod[][];
  loading: boolean;
  fontScale: number;
}

const TimetableCard = ({ cardWidth, items, timetables, loading, fontScale }: Props) => {
  const { t } = useTranslation();
  const { activeIdx, isPausedRef, translateX, panResponder } = useSwipeableCard(
    items.length,
    cardWidth
  );
  const activeChild = items[activeIdx];

  const renderTimetableContent = (periods: TimetablePeriod[]) => {
    if (loading) {
      return <ActivityIndicator color={colors.secondary[500]} style={styles.loadingIndicator} />;
    }
    if (!periods.length) {
      return <Text style={styles.emptyText}>{t('mealTimetable.timetable.empty')}</Text>;
    }
    return (
      <View style={styles.periodList}>
        {periods.map((p) => (
          <View key={p.period} style={styles.periodItem}>
            <View style={styles.periodBadge}>
              <Text style={styles.periodBadgeText}>
                {t('mealTimetable.timetable.period', { period: p.period })}
              </Text>
            </View>
            <Text style={styles.periodSubject} numberOfLines={1}>
              {p.subject}
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
          <View style={[styles.iconBox, { backgroundColor: colors.secondary[100] }]}>
            <Ionicons name="alarm-outline" size={22} color={colors.secondary[600]} />
          </View>
          <View style={styles.headerTexts}>
            {fontScale < 1.3 && (
              <Text style={[styles.cardLabel, { color: colors.secondary[600] }]}>
                {t('mealTimetable.timetable.cardLabel')}
              </Text>
            )}
            <Text style={styles.cardTitle} numberOfLines={1}>
              {t('mealTimetable.timetable.cardTitle')}
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
                {renderTimetableContent(timetables[index] ?? [])}
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
                { backgroundColor: idx === activeIdx ? colors.secondary[500] : colors.gray[200] },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default TimetableCard;
