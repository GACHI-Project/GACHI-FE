import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import StepHeader from '../../../src/components/common/StepHeader';
import { PrimaryButton } from '../../../src/components/common/Button';
import colors from '../../../src/constants/colors';
import fonts from '../../../src/constants/fonts';
import layout from '../../../src/constants/layout';

// ─── 상수 ────────────────────────────────────────────────────────────────────

const ORDER_LABELS = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째'] as const;
const GRADES = [1, 2, 3, 4, 5, 6] as const;
const CALENDAR_COLORS = [
  '#FF6B6B',
  '#FF9F43',
  '#FFCC2F',
  '#26DE81',
  '#2BAEE0',
  '#A55EEA',
  '#FD79A8',
] as const;

// 실제 구현 시 API 검색으로 대체
const MOCK_SCHOOLS: SchoolResult[] = [
  { name: '서울까치초등학교', address: '서울특별시 노원구', type: '초등학교' },
  { name: '서울삼청초등학교', address: '서울특별시 종로구 북촌로 136', type: '초등학교' },
  { name: '강남초등학교', address: '서울특별시 강남구 테헤란로 212', type: '초등학교' },
  { name: '강남언북초등학교', address: '서울특별시 강남구 선릉로 100길 5', type: '초등학교' },
  { name: '한강초등학교', address: '서울특별시 마포구 와우산로 21', type: '초등학교' },
  { name: '한강중앙초등학교', address: '서울특별시 영등포구 여의대로 42', type: '초등학교' },
];

// ─── 타입 ────────────────────────────────────────────────────────────────────

interface SchoolResult {
  name: string;
  address: string;
  type: string;
}

interface ChildInfo {
  id: string;
  name: string;
  selectedSchool: SchoolResult | null;
  schoolQuery: string;
  grade: number | null;
  calendarColor: string | null;
}

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

const createChild = (id: string): ChildInfo => ({
  id,
  name: '',
  selectedSchool: null,
  schoolQuery: '',
  grade: null,
  calendarColor: null,
});

const shortenAddress = (address: string): string => {
  const tokens = address.split(' ');
  const idx = tokens.findIndex((t) => t.endsWith('구') || t.endsWith('군'));
  return idx >= 0 ? tokens.slice(0, idx + 1).join(' ') : address;
};

const formatSchoolMeta = (school: SchoolResult): string =>
  `${school.type} • ${shortenAddress(school.address)}`;

const searchSchools = (query: string): SchoolResult[] => {
  if (!query.trim()) return [];
  return MOCK_SCHOOLS.filter(
    (s) => s.name.includes(query.trim()) || s.address.includes(query.trim())
  );
};

// ─── ChildCard ────────────────────────────────────────────────────────────────

interface ChildCardProps {
  child: ChildInfo;
  order: string;
  isDeletable: boolean;
  onUpdate: (updates: Partial<ChildInfo>) => void;
  onDelete: () => void;
}

const ChildCard = ({ child, order, isDeletable, onUpdate, onDelete }: ChildCardProps) => {
  const [schoolInputFocused, setSchoolInputFocused] = useState(false);
  const results = searchSchools(child.schoolQuery);

  return (
    <View style={cardStyles.card}>
      {/* 프로필 + 순서 + 삭제 버튼 */}
      <View style={cardStyles.profileRow}>
        <View
          style={[
            cardStyles.profileCircle,
            { backgroundColor: child.calendarColor ?? colors.gray[200] },
          ]}
        />
        <Text style={cardStyles.orderLabel}>{order}</Text>
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

      {/* 이름 */}
      <View style={cardStyles.section}>
        <Text style={cardStyles.sectionLabel}>아이 이름</Text>
        <TextInput
          style={cardStyles.nameInput}
          placeholder="이름을 입력해 주세요"
          placeholderTextColor={colors.gray[200]}
          value={child.name}
          onChangeText={(text) => onUpdate({ name: text })}
          returnKeyType="done"
        />
        <View style={cardStyles.nameDivider} />
      </View>

      {/* 학교 선택 */}
      <View style={cardStyles.section}>
        <Text style={cardStyles.sectionLabel}>학교</Text>

        {child.selectedSchool ? (
          // 선택 완료 상태
          <View style={cardStyles.schoolSelectedCard}>
            <View style={cardStyles.schoolLeft}>
              <View style={cardStyles.schoolIconBox}>
                <Ionicons name="school" size={15} color={colors.text.white} />
              </View>
              <View style={cardStyles.schoolInfo}>
                <Text style={cardStyles.schoolName}>{child.selectedSchool.name}</Text>
                <Text style={cardStyles.schoolAddress}>
                  {formatSchoolMeta(child.selectedSchool)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => onUpdate({ selectedSchool: null, schoolQuery: '' })}
              activeOpacity={0.7}
            >
              <Text style={cardStyles.changeButtonText}>변경</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // 검색 상태
          <View>
            <View
              style={[
                cardStyles.searchInputWrap,
                schoolInputFocused && cardStyles.searchInputWrapFocused,
              ]}
            >
              <Ionicons
                name="search"
                size={16}
                color={schoolInputFocused ? colors.primary[400] : colors.gray[300]}
                style={cardStyles.searchIcon}
              />
              <TextInput
                style={cardStyles.searchInput}
                placeholder="학교명을 검색해 주세요"
                placeholderTextColor={colors.gray[200]}
                value={child.schoolQuery}
                onChangeText={(text) => onUpdate({ schoolQuery: text })}
                onFocus={() => setSchoolInputFocused(true)}
                onBlur={() => setSchoolInputFocused(false)}
                returnKeyType="search"
              />
            </View>

            {results.length > 0 && (
              <View style={cardStyles.searchResults}>
                {results.map((school, idx) => (
                  <TouchableOpacity
                    key={school.name}
                    style={[
                      cardStyles.searchResultItem,
                      idx < results.length - 1 && cardStyles.searchResultDivider,
                    ]}
                    onPress={() => onUpdate({ selectedSchool: school, schoolQuery: '' })}
                    activeOpacity={0.7}
                  >
                    <View style={cardStyles.searchResultInner}>
                      <View style={cardStyles.schoolIconBoxLight}>
                        <Ionicons name="school" size={15} color={colors.primary[400]} />
                      </View>
                      <View style={cardStyles.schoolInfo}>
                        <Text style={cardStyles.searchResultName}>{school.name}</Text>
                        <Text style={cardStyles.searchResultAddress}>
                          {formatSchoolMeta(school)}
                        </Text>
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

      {/* 학년 선택 */}
      <View style={cardStyles.section}>
        <Text style={cardStyles.sectionLabel}>초등학교 학년</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={cardStyles.gradeList}
        >
          {GRADES.map((grade) => {
            const selected = child.grade === grade;
            return (
              <TouchableOpacity
                key={grade}
                style={[cardStyles.gradeButton, selected && cardStyles.gradeButtonSelected]}
                onPress={() => onUpdate({ grade: selected ? null : grade })}
                activeOpacity={0.75}
              >
                <Text style={[cardStyles.gradeText, selected && cardStyles.gradeTextSelected]}>
                  {grade}학년
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 캘린더 색상 */}
      <View style={cardStyles.section}>
        <Text style={cardStyles.sectionLabel}>캘린더 색상</Text>
        <View style={cardStyles.colorRow}>
          {CALENDAR_COLORS.map((color) => {
            const selected = child.calendarColor === color;
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
    </View>
  );
};

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

const RegisterChildScreen = () => {
  const [children, setChildren] = useState<ChildInfo[]>([createChild('1')]);

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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 타이틀 */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>우리 아이 정보를 알려주세요</Text>
          <Text style={styles.subtitle}>
            아이의 학년에 맞춰 가정통신문을 이해하기 쉽게 설명해드려요
          </Text>
        </View>

        {/* 자녀 카드 */}
        {children.map((child, index) => (
          <ChildCard
            key={child.id}
            child={child}
            order={ORDER_LABELS[index]}
            isDeletable={index > 0}
            onUpdate={(updates) => updateChild(child.id, updates)}
            onDelete={() => removeChild(child.id)}
          />
        ))}

        {/* 안내 배너 */}
        <View style={styles.banner}>
          <Ionicons
            name="information-circle"
            size={18}
            color={colors.text.primary}
            style={styles.bannerIcon}
          />
          <Text style={styles.bannerText}>
            각 자녀의 색상은 캘린더에서 누구의 일정인지 바로 구분하는 데 사용돼요.
          </Text>
        </View>

        {/* 자녀 추가 버튼 */}
        {children.length < 7 && (
          <TouchableOpacity style={styles.addButton} onPress={addChild} activeOpacity={0.7}>
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={12} color={colors.primary[100]} />
            </View>
            <Text style={styles.addButtonText}>자녀 추가하기</Text>
          </TouchableOpacity>
        )}

        <View style={styles.scrollBottom} />
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View style={styles.footer}>
        <PrimaryButton
          label="다음으로 →"
          onPress={() => router.push('/(auth)/register/language' as never)}
        />
      </View>
    </View>
  );
};

export default RegisterChildScreen;

// ─── 스타일: ChildCard ────────────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.text.white,
    borderRadius: 20,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[100],
    gap: 20,
    shadowColor: '#1F2A37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  deleteButton: {
    marginLeft: 'auto',
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  orderLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  section: {
    gap: 10,
  },
  nameInput: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  nameDivider: {
    height: 1,
    backgroundColor: colors.gray[200],
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
  },
  // 학교 — 아이콘 박스
  schoolIconBox: {
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolIconBoxLight: {
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 학교 — 선택 완료
  schoolSelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[300],
    padding: 8,
    paddingHorizontal: 14,
    gap: 10,
  },
  schoolInfo: {
    flex: 1,
    gap: 3,
  },
  schoolName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  schoolAddress: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  schoolLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  changeButtonText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primary[400],
  },
  // 학교 — 검색
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.text.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInputWrapFocused: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[0],
  },
  searchIcon: {
    marginTop: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text.primary,
    padding: 0,
  },
  searchResults: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  searchResultItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchResultInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchResultDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchResultName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
  },
  searchResultAddress: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  // 학년
  gradeList: {
    gap: 8,
    paddingVertical: 2,
  },
  gradeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.text.white,
  },
  gradeButtonSelected: {
    backgroundColor: colors.primary[400],
    borderColor: colors.primary[400],
  },
  gradeText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.gray[300],
  },
  gradeTextSelected: {
    color: colors.text.white,
    fontFamily: fonts.semiBold,
  },
  // 캘린더 색상
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── 스타일: 메인 화면 ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: layout.screenPaddingTop,
  },
  titleSection: {
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  // 안내 배너
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[500],
    borderRadius: 15,
    padding: 15,
    marginBottom: 14,
    gap: 8,
  },
  bannerIcon: {},
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    lineHeight: 20,
  },
  // 자녀 추가 버튼
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary[300],
    borderRadius: 15,
    paddingVertical: 15,
    gap: 6,
    marginBottom: 8,
  },
  addIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.primary[400],
  },
  scrollBottom: {
    height: 24,
  },
  // 하단 고정 버튼
  footer: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingBottom: layout.screenPaddingBottom,
    paddingTop: 12,
    backgroundColor: colors.text.white,
  },
});
