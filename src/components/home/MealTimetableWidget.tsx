/* eslint-disable react/jsx-props-no-spreading */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  PanResponder,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useChildrenStore } from '../../store/childrenStore';
import {
  fetchSchoolMeals,
  getMealsForChild,
  fetchSchoolTimetables,
  getPeriodsForChild,
  MealMenu,
  TimetablePeriod,
} from '../../api/meal';
import { ChildItem } from '../../api/child';
import colors from '../../constants/colors';
import styles from '../../styles/home/mealTimetableWidget';

const CARD_GAP = 16;
const HORIZONTAL_PADDING = 40;
const SLIDE_DURATION = 550;
const AUTO_INTERVAL = 5000;

const getTodayStr = (): string => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

interface MealCardProps {
  cardWidth: number;
  items: ChildItem[];
  meals: MealMenu[][];
  loading: boolean;
}

const MealCard = ({ cardWidth, items, meals, loading }: MealCardProps) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeIdxRef = useRef(0);
  const isPausedRef = useRef(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const activeChild = items[activeIdx];

  const slideTo = useCallback(
    (idx: number) => {
      activeIdxRef.current = idx;
      setActiveIdx(idx);
      Animated.timing(translateX, {
        toValue: -idx * cardWidth,
        duration: SLIDE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [cardWidth, translateX]
  );

  const slideToRef = useRef(slideTo);
  slideToRef.current = slideTo;
  const itemsLengthRef = useRef(items.length);
  itemsLengthRef.current = items.length;

  useEffect(() => {
    if (!items.length) return;
    const clamped = Math.min(activeIdxRef.current, items.length - 1);
    if (clamped !== activeIdxRef.current) {
      activeIdxRef.current = clamped;
      setActiveIdx(clamped);
    }
    translateX.setValue(-clamped * cardWidth);
  }, [items.length, cardWidth, translateX]);

  useEffect(() => {
    if (items.length <= 1) return undefined;
    const interval = setInterval(() => {
      if (!isPausedRef.current) {
        const next = (activeIdxRef.current + 1) % items.length;
        slideTo(next);
      }
    }, AUTO_INTERVAL);
    return () => clearInterval(interval);
  }, [items.length, slideTo]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        const len = itemsLengthRef.current;
        if (g.dx < -40) {
          slideToRef.current((activeIdxRef.current + 1) % len);
        } else if (g.dx > 40) {
          slideToRef.current((activeIdxRef.current - 1 + len) % len);
        }
      },
    })
  ).current;

  const renderMenuContent = (menus: MealMenu[]) => {
    if (loading) {
      return <ActivityIndicator color={colors.primary[400]} style={styles.loadingIndicator} />;
    }
    if (!menus.length) {
      return <Text style={styles.emptyText}>급식 정보가 없어요</Text>;
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
            <Text style={[styles.cardLabel, { color: colors.primary[500] }]}>오늘의 급식</Text>
            <Text style={styles.cardTitle}>점심 메뉴</Text>
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

interface TimetableCardProps {
  cardWidth: number;
  items: ChildItem[];
  timetables: TimetablePeriod[][];
  loading: boolean;
}

const TimetableCard = ({ cardWidth, items, timetables, loading }: TimetableCardProps) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeIdxRef = useRef(0);
  const isPausedRef = useRef(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const activeChild = items[activeIdx];

  const slideTo = useCallback(
    (idx: number) => {
      activeIdxRef.current = idx;
      setActiveIdx(idx);
      Animated.timing(translateX, {
        toValue: -idx * cardWidth,
        duration: SLIDE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [cardWidth, translateX]
  );

  const slideToRef = useRef(slideTo);
  slideToRef.current = slideTo;
  const itemsLengthRef = useRef(items.length);
  itemsLengthRef.current = items.length;

  useEffect(() => {
    if (!items.length) return;
    const clamped = Math.min(activeIdxRef.current, items.length - 1);
    if (clamped !== activeIdxRef.current) {
      activeIdxRef.current = clamped;
      setActiveIdx(clamped);
    }
    translateX.setValue(-clamped * cardWidth);
  }, [items.length, cardWidth, translateX]);

  useEffect(() => {
    if (items.length <= 1) return undefined;
    const interval = setInterval(() => {
      if (!isPausedRef.current) {
        const next = (activeIdxRef.current + 1) % items.length;
        slideTo(next);
      }
    }, AUTO_INTERVAL);
    return () => clearInterval(interval);
  }, [items.length, slideTo]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        const len = itemsLengthRef.current;
        if (g.dx < -40) {
          slideToRef.current((activeIdxRef.current + 1) % len);
        } else if (g.dx > 40) {
          slideToRef.current((activeIdxRef.current - 1 + len) % len);
        }
      },
    })
  ).current;

  const renderTimetableContent = (periods: TimetablePeriod[]) => {
    if (loading) {
      return <ActivityIndicator color={colors.secondary[500]} style={styles.loadingIndicator} />;
    }
    if (!periods.length) {
      return <Text style={styles.emptyText}>시간표 정보가 없어요</Text>;
    }
    return (
      <View style={styles.periodList}>
        {periods.map((p) => (
          <View key={p.period} style={styles.periodItem}>
            <View style={styles.periodBadge}>
              <Text style={styles.periodBadgeText}>{p.period}교시</Text>
            </View>
            <Text style={styles.periodSubject}>{p.subject}</Text>
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
            <Text style={[styles.cardLabel, { color: colors.secondary[600] }]}>오늘의 시간표</Text>
            <Text style={styles.cardTitle}>수업 일정</Text>
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

const MealTimetableWidget = () => {
  const childItems = useChildrenStore((s) => s.children);
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - HORIZONTAL_PADDING - CARD_GAP) / 2;
  const [today, setToday] = useState(getTodayStr);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const timeout = setTimeout(
      () => setToday(getTodayStr()),
      nextMidnight.getTime() - now.getTime()
    );
    return () => clearTimeout(timeout);
  }, [today]);

  const [meals, setMeals] = useState<MealMenu[][]>([]);
  const [timetables, setTimetables] = useState<TimetablePeriod[][]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!childItems.length) return;
    setLoading(true);
    Promise.all([
      fetchSchoolMeals(today, today)
        .then((schoolMeals) =>
          childItems.map((c) => getMealsForChild(schoolMeals, c.officeCode, c.schoolCode, today))
        )
        .catch(() => childItems.map(() => [])),
      fetchSchoolTimetables(today, today)
        .then((schoolTimetables) =>
          childItems.map((c) =>
            getPeriodsForChild(
              schoolTimetables,
              c.officeCode,
              c.schoolCode,
              c.grade,
              c.className ?? null,
              today
            )
          )
        )
        .catch(() => childItems.map(() => [])),
    ])
      .then(([m, t]) => {
        setMeals(m);
        setTimetables(t);
      })
      .finally(() => setLoading(false));
  }, [childItems, today]);

  if (!childItems.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>급식·시간표</Text>
        <TouchableOpacity onPress={() => router.push('/meal-timetable')} activeOpacity={0.7}>
          <View style={styles.viewAllRow}>
            <Text style={styles.viewAllText}>전체보기</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.text.secondary} />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.cardsRow}>
        <MealCard cardWidth={cardWidth} items={childItems} meals={meals} loading={loading} />
        <TimetableCard
          cardWidth={cardWidth}
          items={childItems}
          timetables={timetables}
          loading={loading}
        />
      </View>
    </View>
  );
};

export default MealTimetableWidget;
