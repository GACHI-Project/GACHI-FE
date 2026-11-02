import { useCallback, useRef, useState } from 'react';
import { CapturedPage } from '../../constants/scan';

// 카메라 · 갤러리 스캔 화면이 공유하는 페이지 목록과 상세 보기 인덱스 관리
const useScanPages = (initialUris: string[] = []) => {
  const pageIdRef = useRef(0);
  const createPage = useCallback((uri: string): CapturedPage => {
    pageIdRef.current += 1;
    return { id: `page-${pageIdRef.current}`, uri };
  }, []);

  const [pages, setPages] = useState<CapturedPage[]>(() => initialUris.map(createPage));
  const [detailIndex, setDetailIndex] = useState(0);

  const addPages = useCallback(
    (uris: string[]) => setPages((prev) => [...prev, ...uris.map(createPage)]),
    [createPage]
  );

  const replacePage = useCallback((id: string, uri: string) => {
    setPages((prev) => prev.map((page) => (page.id === id ? { ...page, uri } : page)));
  }, []);

  const removePage = useCallback((id: string) => {
    setPages((prev) => prev.filter((page) => page.id !== id));
  }, []);

  // 상세 보기 중인 페이지를 지우고 인덱스를 남은 범위로 맞춘다
  const removeDetailPage = () => {
    const removedId = pages[detailIndex]?.id;
    const next = pages.filter((page) => page.id !== removedId);
    setPages(next);
    setDetailIndex(next.length === 0 ? 0 : Math.min(detailIndex, next.length - 1));
    return { removedId, remaining: next.length };
  };

  return {
    pages,
    setPages,
    detailIndex,
    setDetailIndex,
    addPages,
    replacePage,
    removePage,
    removeDetailPage,
  };
};

export default useScanPages;
