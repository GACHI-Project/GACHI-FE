import { SchoolResult } from '../types/school';

export const GRADES = [1, 2, 3, 4, 5, 6] as const;

export const CALENDAR_COLORS = [
  '#FF6B6B',
  '#FF9F43',
  '#FFCC2F',
  '#26DE81',
  '#2BAEE0',
  '#A55EEA',
  '#FD79A8',
] as const;

// 실제 구현 시 API 검색으로 대체
export const MOCK_SCHOOLS: SchoolResult[] = [
  { name: '서울까치초등학교', address: '서울특별시 노원구', type: '초등학교' },
  { name: '서울삼청초등학교', address: '서울특별시 종로구 북촌로 136', type: '초등학교' },
  { name: '강남초등학교', address: '서울특별시 강남구 테헤란로 212', type: '초등학교' },
  { name: '강남언북초등학교', address: '서울특별시 강남구 선릉로 100길 5', type: '초등학교' },
  { name: '한강초등학교', address: '서울특별시 마포구 와우산로 21', type: '초등학교' },
  { name: '한강중앙초등학교', address: '서울특별시 영등포구 여의대로 42', type: '초등학교' },
];
