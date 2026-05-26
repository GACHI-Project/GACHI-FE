export interface DocumentItem {
  id: string;
  childId: string;
  childName: string;
  grade: number;
  calendarColor: string;
  title: string;
  date: string;
}

export interface MockChild {
  id: string;
  name: string;
  grade: number;
  calendarColor: string;
}

// export const MOCK_CHILDREN: MockChild[] = [...];
// export const MOCK_DOCUMENTS: DocumentItem[] = [...];
