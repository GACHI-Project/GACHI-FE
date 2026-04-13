import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import StepHeader from '../../../src/components/common/StepHeader';
import { PrimaryButton } from '../../../src/components/common/Button';
import colors from '../../../src/constants/colors';
import { SchoolResult } from '../../../src/types/school';
import { ChildInfo } from '../../../src/types/child';
import cardStyles from '../../../src/styles/register/childCard';
import styles from '../../../src/styles/register/child';

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

// ─── SchoolPicker ─────────────────────────────────────────────────────────────

interface SchoolPickerProps {
  selectedSchool: SchoolResult | null;
  schoolQuery: string;
  onUpdate: (updates: Partial<ChildInfo>) => void;
}

const SchoolPicker = ({ selectedSchool, schoolQuery, onUpdate }: SchoolPickerProps) => {
  const [focused, setFocused] = useState(false);
  const results = searchSchools(schoolQuery);

  return (
    <View style={cardStyles.section}>
      <Text style={cardStyles.sectionLabel}>학교</Text>

      {selectedSchool ? (
        <View style={cardStyles.schoolSelectedCard}>
          <View style={cardStyles.schoolLeft}>
            <View style={cardStyles.schoolIconBox}>
              <Ionicons name="school" size={15} color={colors.text.white} />
            </View>
            <View style={cardStyles.schoolInfo}>
              <Text style={cardStyles.schoolName}>{selectedSchool.name}</Text>
              <Text style={cardStyles.schoolAddress}>{formatSchoolMeta(selectedSchool)}</Text>
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
              placeholder="학교명을 검색해 주세요"
              placeholderTextColor={colors.gray[200]}
              value={schoolQuery}
              onChangeText={(text) => onUpdate({ schoolQuery: text })}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
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

const GradePicker = ({ grade, onUpdate }: GradePickerProps) => (
  <View style={cardStyles.section}>
    <Text style={cardStyles.sectionLabel}>초등학교 학년</Text>
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
            onPress={() => onUpdate({ grade: selected ? null : g })}
            activeOpacity={0.75}
          >
            <Text style={[cardStyles.gradeText, selected && cardStyles.gradeTextSelected]}>
              {g}학년
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

// ─── ColorPicker ──────────────────────────────────────────────────────────────

interface ColorPickerProps {
  calendarColor: string | null;
  onUpdate: (updates: Partial<ChildInfo>) => void;
}

const ColorPicker = ({ calendarColor, onUpdate }: ColorPickerProps) => (
  <View style={cardStyles.section}>
    <Text style={cardStyles.sectionLabel}>캘린더 색상</Text>
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

// ─── ChildCard ────────────────────────────────────────────────────────────────

interface ChildCardProps {
  child: ChildInfo;
  order: string;
  isDeletable: boolean;
  onUpdate: (updates: Partial<ChildInfo>) => void;
  onDelete: () => void;
}

const ChildCard = ({ child, order, isDeletable, onUpdate, onDelete }: ChildCardProps) => (
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

    {/* 아이 이름 */}
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

    <SchoolPicker
      selectedSchool={child.selectedSchool}
      schoolQuery={child.schoolQuery}
      onUpdate={onUpdate}
    />

    <GradePicker grade={child.grade} onUpdate={onUpdate} />

    <ColorPicker calendarColor={child.calendarColor} onUpdate={onUpdate} />
  </View>
);

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
        showsVerticalScrollIndicator
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
