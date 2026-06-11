import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import StepHeader from '../../../src/components/common/StepHeader';
import { PrimaryButton } from '../../../src/components/common/Button';
import colors from '../../../src/constants/colors';
import { GRADES, CALENDAR_COLORS } from '../../../src/constants/child';
import { searchSchools, fetchClasses, ClassItem } from '../../../src/api/school';
import { SchoolResult } from '../../../src/types/school';
import { ChildInfo } from '../../../src/types/child';
import cardStyles from '../../../src/styles/register/childCard';
import styles from '../../../src/styles/register/child';
import { useRegisterStore } from '../../../src/store/registerStore';
import { ChildPayload } from '../../../src/api/child';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

export const isChildComplete = (child: ChildInfo): boolean =>
  child.name.trim().length > 0 &&
  (child.selectedSchool !== null || child.schoolQuery.trim().length > 0) &&
  child.grade !== null &&
  child.calendarColor !== null &&
  (child.className?.trim().length ?? 0) > 0;

export const createChild = (id: string): ChildInfo => ({
  id,
  name: '',
  selectedSchool: null,
  schoolQuery: '',
  grade: null,
  calendarColor: CALENDAR_COLORS[0],
  className: null,
});

const formatSchoolMeta = (school: SchoolResult): string =>
  school.roadAddress || school.locationName || '';

// ─── SchoolPicker ─────────────────────────────────────────────────────────────

interface SchoolPickerProps {
  selectedSchool: SchoolResult | null;
  schoolQuery: string;
  onUpdate: (updates: Partial<ChildInfo>) => void;
}

export const SchoolPicker = ({ selectedSchool, schoolQuery, onUpdate }: SchoolPickerProps) => {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SchoolResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!schoolQuery.trim()) {
      setResults([]);
      return () => {};
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const schools = await searchSchools(schoolQuery.trim());
        if (!cancelled) setResults(schools);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [schoolQuery]);

  return (
    <View style={cardStyles.section}>
      <Text style={cardStyles.sectionLabel}>{t('auth.register.child.school')}</Text>

      {selectedSchool ? (
        <View style={cardStyles.schoolSelectedCard}>
          <View style={cardStyles.schoolLeft}>
            <View style={cardStyles.schoolIconBox}>
              <Ionicons name="school" size={15} color={colors.text.white} />
            </View>
            <View style={cardStyles.schoolInfo}>
              <Text style={cardStyles.schoolName}>{selectedSchool.schoolName}</Text>
              {formatSchoolMeta(selectedSchool) ? (
                <Text style={cardStyles.schoolAddress}>{formatSchoolMeta(selectedSchool)}</Text>
              ) : null}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => onUpdate({ selectedSchool: null, schoolQuery: '', className: null })}
            activeOpacity={0.7}
          >
            <Text style={cardStyles.changeButtonText}>{t('common.change')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View style={[cardStyles.searchInputWrap, focused && cardStyles.searchInputWrapFocused]}>
            <Ionicons
              name="search"
              size={16}
              color={focused ? colors.primary[400] : colors.gray[300]}
              style={cardStyles.searchIcon}
            />
            <TextInput
              style={cardStyles.searchInput}
              placeholder={t('auth.register.child.schoolPlaceholder')}
              placeholderTextColor={colors.gray[200]}
              value={schoolQuery}
              onChangeText={(text) => onUpdate({ schoolQuery: text })}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="search"
            />
          </View>

          {isSearching && (
            <ActivityIndicator
              size="small"
              color={colors.primary[400]}
              style={cardStyles.searchLoader}
            />
          )}

          {!isSearching && results.length > 0 && (
            <View style={cardStyles.searchResults}>
              {results.map((school, idx) => (
                <TouchableOpacity
                  key={school.schoolCode}
                  style={[
                    cardStyles.searchResultItem,
                    idx < results.length - 1 && cardStyles.searchResultDivider,
                  ]}
                  onPress={() =>
                    onUpdate({ selectedSchool: school, schoolQuery: '', className: null })
                  }
                  activeOpacity={0.7}
                >
                  <View style={cardStyles.searchResultInner}>
                    <View style={cardStyles.schoolIconBoxLight}>
                      <Ionicons name="school" size={15} color={colors.primary[400]} />
                    </View>
                    <View style={cardStyles.schoolInfo}>
                      <Text style={cardStyles.searchResultName}>{school.schoolName}</Text>
                      <Text style={cardStyles.searchResultAddress}>{formatSchoolMeta(school)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.gray[200]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// ─── GradePicker ──────────────────────────────────────────────────────────────

interface GradePickerProps {
  grade: number | null;
  onUpdate: (updates: Partial<ChildInfo>) => void;
}

export const GradePicker = ({ grade, onUpdate }: GradePickerProps) => {
  const { t } = useTranslation();
  return (
    <View style={cardStyles.section}>
      <Text style={cardStyles.sectionLabel}>{t('auth.register.child.grade')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={cardStyles.gradeList}
      >
        {GRADES.map((g) => {
          const selected = grade === g;
          return (
            <TouchableOpacity
              key={g}
              style={[cardStyles.gradeButton, selected && cardStyles.gradeButtonSelected]}
              onPress={() => onUpdate({ grade: selected ? null : g, className: null })}
              activeOpacity={0.75}
            >
              <Text style={[cardStyles.gradeText, selected && cardStyles.gradeTextSelected]}>
                {t('common.grade', { grade: g })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─── ClassPicker ─────────────────────────────────────────────────────────────

interface ClassPickerProps {
  selectedSchool: SchoolResult | null;
  grade: number | null;
  className: string | null;
  onUpdate: (updates: Partial<ChildInfo>) => void;
}

export const ClassPicker = ({ selectedSchool, grade, className, onUpdate }: ClassPickerProps) => {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!selectedSchool || grade === null) {
      setClasses([]);
      setFallback(false);
      setIsLoading(false);
      return () => {};
    }

    setIsLoading(true);
    setFallback(false);
    setClasses([]);
    let cancelled = false;
    fetchClasses(selectedSchool.officeCode, selectedSchool.schoolCode, grade)
      .then((result) => {
        if (cancelled) return;
        if (result.length === 0) {
          setFallback(true);
        } else {
          setClasses(result);
          if (className && !result.some((c) => c.className === className)) {
            onUpdate({ className: null });
          }
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFallback(true);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSchool?.schoolCode, selectedSchool?.officeCode, grade]); // eslint-disable-line react-hooks/exhaustive-deps

  const showButtons = !isLoading && !fallback && classes.length > 0;
  const showInput =
    !isLoading && !!selectedSchool && grade !== null && (fallback || classes.length === 0);

  return (
    <View style={cardStyles.section}>
      <Text style={cardStyles.sectionLabel}>{t('auth.register.child.className')}</Text>
      {!isLoading && (!selectedSchool || grade === null) && (
        <View style={cardStyles.classPickerPlaceholder} />
      )}
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={colors.primary[400]}
          style={cardStyles.searchLoader}
        />
      )}
      {showButtons && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={cardStyles.gradeList}
        >
          {classes.map((item) => {
            const selected = className === item.className;
            return (
              <TouchableOpacity
                key={`${item.academicYear}-${item.className}`}
                style={[
                  cardStyles.gradeButton,
                  cardStyles.classButton,
                  selected && cardStyles.gradeButtonSelected,
                ]}
                onPress={() => onUpdate({ className: item.className })}
                activeOpacity={0.75}
              >
                <Text style={[cardStyles.gradeText, selected && cardStyles.gradeTextSelected]}>
                  {item.className}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      {showInput && (
        <View>
          <TextInput
            style={cardStyles.nameInput}
            placeholder={t('auth.register.child.classNamePlaceholder')}
            placeholderTextColor={colors.gray[200]}
            value={className ?? ''}
            onChangeText={(text) => onUpdate({ className: text })}
            returnKeyType="done"
          />
          <View style={cardStyles.nameDivider} />
        </View>
      )}
    </View>
  );
};

// ─── ColorPicker ──────────────────────────────────────────────────────────────

interface ColorPickerProps {
  calendarColor: string | null;
  onUpdate: (updates: Partial<ChildInfo>) => void;
}

export const ColorPicker = ({ calendarColor, onUpdate }: ColorPickerProps) => {
  const { t } = useTranslation();
  return (
    <View style={cardStyles.section}>
      <Text style={cardStyles.sectionLabel}>{t('auth.register.child.calendarColor')}</Text>
      <View style={cardStyles.colorRow}>
        {CALENDAR_COLORS.map((color) => {
          const selected = calendarColor === color;
          return (
            <TouchableOpacity
              key={color}
              style={[cardStyles.colorCircle, { backgroundColor: color }]}
              onPress={() => onUpdate({ calendarColor: color })}
              activeOpacity={0.8}
            >
              {selected && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── ChildCard ────────────────────────────────────────────────────────────────

interface ChildCardProps {
  child: ChildInfo;
  order: string;
  isDeletable: boolean;
  variant?: 'register' | 'edit';
  onUpdate: (updates: Partial<ChildInfo>) => void;
  onDelete: () => void;
}

export const ChildCard = ({
  child,
  order,
  isDeletable,
  variant = 'register',
  onUpdate,
  onDelete,
}: ChildCardProps) => {
  const { t } = useTranslation();
  return (
    <View style={[cardStyles.card, variant === 'edit' && cardStyles.cardEdit]}>
      <View style={cardStyles.profileRow}>
        <View
          style={[
            cardStyles.profileCircle,
            { backgroundColor: child.calendarColor ?? colors.gray[200] },
          ]}
        />
        <Text style={cardStyles.orderLabel}>{variant === 'edit' ? child.name : order}</Text>
        {isDeletable && (
          <TouchableOpacity
            style={cardStyles.deleteButton}
            onPress={onDelete}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={13} color={colors.gray[200]} />
          </TouchableOpacity>
        )}
      </View>

      <View style={cardStyles.section}>
        <Text style={cardStyles.sectionLabel}>{t('auth.register.child.childName')}</Text>
        <TextInput
          style={cardStyles.nameInput}
          placeholder={t('auth.register.child.childNamePlaceholder')}
          placeholderTextColor={colors.gray[200]}
          value={child.name}
          onChangeText={(text) => onUpdate({ name: text })}
          returnKeyType="done"
        />
        <View style={cardStyles.nameDivider} />
      </View>

      <SchoolPicker
        selectedSchool={child.selectedSchool}
        schoolQuery={child.schoolQuery}
        onUpdate={onUpdate}
      />

      <GradePicker grade={child.grade} onUpdate={onUpdate} />

      <ClassPicker
        selectedSchool={child.selectedSchool}
        grade={child.grade}
        className={child.className}
        onUpdate={onUpdate}
      />

      <ColorPicker calendarColor={child.calendarColor} onUpdate={onUpdate} />
    </View>
  );
};

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

const RegisterChildScreen = () => {
  const { t } = useTranslation();
  const [children, setChildren] = useState<ChildInfo[]>([createChild('1')]);
  const setStoreChildren = useRegisterStore((s) => s.setChildren);
  const orderLabels = t('auth.register.child.order', { returnObjects: true }) as string[];

  const updateChild = (id: string, updates: Partial<ChildInfo>) => {
    setChildren((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const addChild = () => {
    if (children.length >= 7) return;
    setChildren((prev) => [...prev, createChild(String(Date.now()))]);
  };

  const removeChild = (id: string) => {
    setChildren((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <View style={styles.container}>
      <StepHeader currentStep={3} totalStep={4} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('auth.register.child.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.register.child.subtitle')}</Text>
        </View>

        {children.map((child, index) => (
          <ChildCard
            key={child.id}
            child={child}
            order={orderLabels[index]}
            isDeletable={index > 0}
            onUpdate={(updates) => updateChild(child.id, updates)}
            onDelete={() => removeChild(child.id)}
          />
        ))}

        <View style={styles.banner}>
          <Ionicons
            name="information-circle"
            size={18}
            color={colors.text.primary}
            style={styles.bannerIcon}
          />
          <Text style={styles.bannerText}>{t('auth.register.child.colorHint')}</Text>
        </View>

        {children.length < 7 && (
          <TouchableOpacity style={styles.addButton} onPress={addChild} activeOpacity={0.7}>
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={12} color={colors.primary[100]} />
            </View>
            <Text style={styles.addButtonText}>{t('auth.register.child.addChild')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.scrollBottom} />
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={t('common.next')}
          disabled={children.length === 0 || !children.every(isChildComplete)}
          onPress={() => {
            const payloads: ChildPayload[] = children.map((child) => ({
              name: child.name,
              schoolName: child.selectedSchool?.schoolName ?? child.schoolQuery,
              schoolCode: child.selectedSchool?.schoolCode ?? '',
              officeCode: child.selectedSchool?.officeCode ?? '',
              grade: child.grade ?? 1,
              colorCode: child.calendarColor ?? '#2BAEE0',
              className: child.className ?? '',
            }));
            setStoreChildren(payloads);
            router.push('/(auth)/register/notification');
          }}
        />
      </View>
    </View>
  );
};

export default RegisterChildScreen;
