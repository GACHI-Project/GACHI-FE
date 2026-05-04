export interface DocumentItem {
  id: string;
  childId: string;
  childName: string;
  grade: number;
  calendarColor: string;
  title: string;
  date: string;
  dDay: number | null;
}

export interface MockChild {
  id: string;
  name: string;
  grade: number;
  calendarColor: string;
}

export const MOCK_CHILDREN: MockChild[] = [
  {
    id: 'child-1',
    name: '김첫째',
    grade: 4,
    calendarColor: '#2CDA00',
  },
  {
    id: 'child-2',
    name: '김둘째',
    grade: 1,
    calendarColor: '#FFCC2F',
  },
];

export const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: '1',
    childId: 'child-1',
    childName: '김첫째',
    grade: 4,
    calendarColor: '#2CDA00',
    title: '2026년 1학기 현장학습 안내',
    date: '2026. 4. 30',
    dDay: 1,
  },
  {
    id: '2',
    childId: 'child-2',
    childName: '김둘째',
    grade: 1,
    calendarColor: '#FFCC2F',
    title: '입학 초기 학교 생활 안내문',
    date: '2026. 4. 28',
    dDay: 5,
  },
  {
    id: '3',
    childId: 'child-1',
    childName: '김첫째',
    grade: 4,
    calendarColor: '#2CDA00',
    title: '학부모 공개 수업 참관 안내',
    date: '2026. 4. 25',
    dDay: null,
  },
  {
    id: '4',
    childId: 'child-2',
    childName: '김둘째',
    grade: 1,
    calendarColor: '#FFCC2F',
    title: '1학년 준비물 및 준비 사항 안내',
    date: '2026. 4. 22',
    dDay: null,
  },
  {
    id: '5',
    childId: 'child-1',
    childName: '김첫째',
    grade: 4,
    calendarColor: '#2CDA00',
    title: '5월 급식 식단표 및 영양 정보',
    date: '2026. 4. 20',
    dDay: null,
  },
  {
    id: '6',
    childId: 'child-2',
    childName: '김둘째',
    grade: 1,
    calendarColor: '#FFCC2F',
    title: '어린이날 기념 행사 안내',
    date: '2026. 4. 15',
    dDay: null,
  },
  {
    id: '7',
    childId: 'child-1',
    childName: '김첫째',
    grade: 4,
    calendarColor: '#2CDA00',
    title: '스포츠 클럽 참가 신청 안내',
    date: '2026. 4. 12',
    dDay: null,
  },
];
