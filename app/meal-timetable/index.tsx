import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../src/components/common/Header';
import MealTimeline from '../../src/components/meal-timetable/MealTimeline';
import styles from '../../src/components/meal-timetable/styles';
import TimetableGrid from '../../src/components/meal-timetable/TimetableGrid';
import layout from '../../src/constants/layout';
import useMealTimetable from '../../src/hooks/meal/useMealTimetable';
import { useChildrenQuery } from '../../src/query/resources';

const MealTimetablePage = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: childItems = [] } = useChildrenQuery();

  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'timetable' | 'meal'>('timetable');

  useEffect(() => {
    if (!childItems.length) {
      setSelectedChildIdx(0);
      return;
    }
    setSelectedChildIdx((prev) => Math.min(prev, childItems.length - 1));
  }, [childItems]);

  const selectedChild = childItems[selectedChildIdx];
  const { timetableByDay, mealsByDay, periodCount, loading, timetableError, mealError } =
    useMealTimetable(childItems, selectedChild);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Header title={t('mealTimetable.pageTitle')} />

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
            {t('mealTimetable.tabTimetable')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'meal' && styles.tabItemActive]}
          onPress={() => setActiveTab('meal')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'meal' && styles.tabTextActive]}>
            {t('mealTimetable.tabMeal')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + layout.screenPaddingBottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {(activeTab === 'timetable' ? timetableError : mealError) && (
            <Text>{t('common.networkError')}</Text>
          )}
          {activeTab === 'timetable' ? (
            <TimetableGrid
              loading={loading}
              timetableByDay={timetableByDay}
              periodCount={periodCount}
            />
          ) : (
            <MealTimeline loading={loading} mealsByDay={mealsByDay} />
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default MealTimetablePage;
