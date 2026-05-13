export interface CalendarChild {
  id: string;
  name: string;
  calendarColor: string;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  childId: string;
  childName: string;
  calendarColor: string;
  documentTitle: string;
  checkList: { id: string; label: string; done: boolean }[];
}

export const MOCK_CAL_CHILDREN: CalendarChild[] = [
  { id: 'child-1', name: '김첫째', calendarColor: '#2CDA00' },
  { id: 'child-2', name: '김둘째', calendarColor: '#FFCC2F' },
];

export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    date: '2026-05-05',
    title: '학부모 상담',
    childId: 'child-1',
    childName: '김첫째',
    calendarColor: '#2CDA00',
    documentTitle: '학부모 상담 안내문',
    checkList: [
      { id: '1-1', label: '상담 신청서 제출', done: true },
      { id: '1-2', label: '상담 시간 확인', done: false },
    ],
  },
  {
    id: '2',
    date: '2026-05-05',
    title: '현장학습 준비물 제출',
    childId: 'child-2',
    childName: '김둘째',
    calendarColor: '#FFCC2F',
    documentTitle: '2026년 1학기 현장학습 안내',
    checkList: [
      { id: '2-1', label: '현장학습 신청서 작성', done: false },
      { id: '2-2', label: '준비물 챙기기', done: false },
    ],
  },
  {
    id: '3',
    date: '2026-05-06',
    title: '학급 사진 촬영',
    childId: 'child-1',
    childName: '김첫째',
    calendarColor: '#2CDA00',
    documentTitle: '학급 사진 촬영 안내',
    checkList: [
      { id: '3-1', label: '단체 복장 준비', done: false },
      { id: '3-2', label: '사진 비용 납부', done: true },
    ],
  },
  {
    id: '4',
    date: '2026-05-08',
    title: '어린이날 행사 참가 신청',
    childId: 'child-2',
    childName: '김둘째',
    calendarColor: '#FFCC2F',
    documentTitle: '어린이날 기념 행사 안내',
    checkList: [
      { id: '4-1', label: '참가 신청서 제출', done: false },
      { id: '4-2', label: '간식비 납부', done: false },
    ],
  },
  {
    id: '5',
    date: '2026-05-10',
    title: '급식 신청 마감',
    childId: 'child-1',
    childName: '김첫째',
    calendarColor: '#2CDA00',
    documentTitle: '5월 급식 식단표 및 영양 정보',
    checkList: [
      { id: '5-1', label: '급식비 납부', done: true },
      { id: '5-2', label: '알레르기 정보 제출', done: false },
    ],
  },
  {
    id: '6',
    date: '2026-05-10',
    title: '스포츠 클럽 신청 마감',
    childId: 'child-2',
    childName: '김둘째',
    calendarColor: '#FFCC2F',
    documentTitle: '스포츠 클럽 참가 신청 안내',
    checkList: [
      { id: '6-1', label: '신청서 작성', done: false },
      { id: '6-2', label: '참가비 납부', done: false },
    ],
  },
  {
    id: '7',
    date: '2026-05-04',
    title: '봄 소풍 신청',
    childId: 'child-1',
    childName: '김첫째',
    calendarColor: '#2CDA00',
    documentTitle: '봄 소풍 안내문',
    checkList: [
      { id: '7-1', label: '참가 동의서 제출', done: true },
      { id: '7-2', label: '도시락 준비', done: true },
    ],
  },
  {
    id: '8',
    date: '2026-04-30',
    title: '4월 생활기록부 확인',
    childId: 'child-2',
    childName: '김둘째',
    calendarColor: '#FFCC2F',
    documentTitle: '생활기록부 열람 안내',
    checkList: [
      { id: '8-1', label: '온라인 열람 신청', done: true },
      { id: '8-2', label: '내용 확인 후 서명', done: false },
    ],
  },
];
