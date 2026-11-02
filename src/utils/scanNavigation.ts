import { router } from 'expo-router';
import { ScanChildParams } from '../constants/scan';

// 업로드할 페이지 uri들을 페이지 순서대로 로딩 화면에 넘긴다
export const pushScanLoading = (uris: string[], child: Partial<ScanChildParams>) => {
  router.push({
    pathname: '/scan/loading',
    params: {
      pages: JSON.stringify(uris),
      childId: child.childId ?? '',
      childName: child.childName ?? '',
      childColor: child.childColor ?? '',
      childGrade: child.childGrade ?? '',
    },
  });
};

export const parsePagesParam = (pages?: string): string[] => {
  if (!pages) return [];
  try {
    const parsed: unknown = JSON.parse(pages);
    return Array.isArray(parsed) ? parsed.filter((uri) => typeof uri === 'string') : [];
  } catch {
    return [];
  }
};
