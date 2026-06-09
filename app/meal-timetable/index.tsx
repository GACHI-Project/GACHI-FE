import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChildrenStore } from '../../src/store/childrenStore';
import {
  fetchSchoolMeals,
  getMealsForChild,
  fetchSchoolTimetables,
  getPeriodsForChild,
  SchoolMealGroup,
  SchoolTimetableGroup,
} from '../../src/api/meal';
import Header from '../../src/components/common/Header';
import colors from '../../src/constants/colors';
import layout from '../../src/constants/layout';
import styles from '../../src/styles/meal-timetable';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const PERIOD_COL_W = 40;

const fmt = (d: Date): string => {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const isToday = (d: Date): boolean => {
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
};

const getDisplayWeekDays = (): Date[] => {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  if (dow === 0) monday.setDate(today.getDate() + 1);
  else if (dow === 6) monday.setDate(today.getDate() + 2);
  else monday.setDate(today.getDate() - (dow - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const getNextWeekdays = (count: number): Date[] => {
  const result: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (result.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) result.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return result;
};

const MealTimetablePage = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const childItems = useChildrenStore((s) => s.children);

  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'timetable' | 'meal'>('timetable');
  const [schoolTimetables, setSchoolTimetables] = useState<SchoolTimetableGroup[]>([]);
  const [schoolMeals, setSchoolMeals] = useState<SchoolMealGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!childItems.length) {
      setSelectedChildIdx(0);
      return;
    }
    setSelectedChildIdx((prev) => Math.min(prev, childItems.length - 1));
  }, [childItems]);

  const weekDays = useMemo(() => getDisplayWeekDays(), []);
  const mealDays = useMemo(() => getNextWeekdays(5), []);
  const dayColW = (screenWidth - layout.screenPaddingHorizontal * 2 - PERIOD_COL_W) / 5;

  const selectedChild = childItems[selectedChildIdx];

  useEffect(() => {
    if (!childItems.length) return;
    setLoading(true);
    const ttFrom = fmt(weekDays[0]);
    const ttTo = fmt(weekDays[4]);
    const mealFrom = fmt(mealDays[0]);
    const mealTo = fmt(mealDays[mealDays.length - 1]);
    Promise.all([
      fetchSchoolTimetables(ttFrom, ttTo).catch(() => [] as SchoolTimetableGroup[]),
      fetchSchoolMeals(mealFrom, mealTo).catch(() => [] as SchoolMealGroup[]),
    ])
      .then(([tt, meals]) => {
        setSchoolTimetables(tt);
        setSchoolMeals(meals);
      })
      .finally(() => setLoading(false));
  }, [childItems, weekDays, mealDays]);

  const timetableByDay = useMemo(() => {
    if (!selectedChild) return [];
    return weekDays.map((d) => ({
      date: d,
      periods: getPeriodsForChild(
        schoolTimetables,
        selectedChild.officeCode,
        selectedChild.schoolCode,
        selectedChild.grade,
        selectedChild.className ?? null,
        fmt(d)
      ),
    }));
  }, [schoolTimetables, selectedChild, weekDays]);

  const mealsByDay = useMemo(() => {
    if (!selectedChild) return [];
    return mealDays.map((d) => ({
      date: d,
      menus: getMealsForChild(
        schoolMeals,
        selectedChild.officeCode,
        selectedChild.schoolCode,
        fmt(d)
      ),
    }));
  }, [schoolMeals, selectedChild, mealDays]);

  const periodCount = useMemo(() => {
    const allPeriods = timetableByDay.flatMap((d) => d.periods.map((p) => p.period));
    return Math.max(0, ...allPeriods, 6);
  }, [timetableByDay]);

  const renderTimetable = () => {
    if (loading) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary[400]} />
        </View>
      );
    }
    return (
      <View style={styles.tableWrap}>
        <View style={styles.tableHeaderRow}>
          <View style={[styles.tablePeriodCell, { width: PERIOD_COL_W }]} />
          {timetableByDay.map((day) => (
            <View
              key={fmt(day.date)}
              style={[
                styles.tableDayHeader,
                { width: dayColW },
                isToday(day.date) && styles.todayHeaderCol,
              ]}
            >
              <Text style={[styles.tableDayDate, isToday(day.date) && styles.todayText]}>
                {day.date.getMonth() + 1}/{day.date.getDate()}
              </Text>
              <Text style={[styles.tableDayName, isToday(day.date) && styles.todayText]}>
                {DAY_LABELS[day.date.getDay()]}
              </Text>
            </View>
          ))}
        </View>

        {Array.from({ length: periodCount }, (_, i) => i + 1).map((period) => (
          <View key={period} style={[styles.tableRow, period % 2 === 0 && styles.tableRowEven]}>
            <View style={[styles.tablePeriodCell, { width: PERIOD_COL_W }]}>
              <Text style={styles.tablePeriodText}>{period}</Text>
            </View>
            {timetableByDay.map((day) => {
              const p = day.periods.find((pp) => pp.period === period);
              return (
                <View
                  key={fmt(day.date)}
                  style={[
                    styles.tableCell,
                    { width: dayColW },
                    isToday(day.date) && styles.todayCell,
                  ]}
                >
                  <Text style={styles.tableCellText} numberOfLines={2}>
                    {p?.subject ?? ''}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderMeals = () => {
    if (loading) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary[400]} />
        </View>
      );
    }
    return (
      <View style={styles.timeline}>
        {mealsByDay.map((day, i) => (
          <View key={fmt(day.date)} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={[styles.timelineDot, isToday(day.date) && styles.timelineDotActive]} />
              {i < mealsByDay.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineRight}>
              <View style={styles.timelineDateRow}>
                <Text
                  style={[
                    styles.timelineDateText,
                    isToday(day.date) && styles.timelineDateTextToday,
                  ]}
                >
                  {day.date.getMonth() + 1}.{day.date.getDate()}.{DAY_LABELS[day.date.getDay()]},
                  중식
                </Text>
                {isToday(day.date) && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>오늘</Text>
                  </View>
                )}
              </View>
              <View style={styles.mealCard}>
                {day.menus.length > 0 ? (
                  day.menus.map((menu) => (
                    <View key={`${fmt(day.date)}-${menu.name}`} style={styles.mealItem}>
                      <View style={styles.mealBullet} />
                      <Text style={styles.mealName}>
                        {menu.name}
                        {menu.allergyNums.length > 0 && (
                          <Text style={styles.mealAllergyText}>
                            {' '}
                            ({menu.allergyNums.join('.')})
                          </Text>
                        )}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noMealText}>급식 정보가 없어요</Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Header title="급식·시간표" />

      {childItems.length > 1 && (
        <View style={styles.childTabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.childTabs}
          >
            {childItems.map((child, i) => (
              <TouchableOpacity
                key={child.id}
                style={[styles.childTab, i === selectedChildIdx && styles.childTabActive]}
                onPress={() => setSelectedChildIdx(i)}
                activeOpacity={0.8}
              >
                <View style={[styles.childTabDot, { backgroundColor: child.colorCode }]} />
                <Text
                  style={[styles.childTabText, i === selectedChildIdx && styles.childTabTextActive]}
                >
                  {child.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'timetable' && styles.tabItemActive]}
          onPress={() => setActiveTab('timetable')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'timetable' && styles.tabTextActive]}>
            시간표
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'meal' && styles.tabItemActive]}
          onPress={() => setActiveTab('meal')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'meal' && styles.tabTextActive]}>급식</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'timetable' ? renderTimetable() : renderMeals()}
        </ScrollView>
      </View>
    </View>
  );
};

export default MealTimetablePage;
