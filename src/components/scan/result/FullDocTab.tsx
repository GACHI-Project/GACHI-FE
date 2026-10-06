import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  getNewsletterTranslation,
  NewsletterTranslationResult,
  NewsletterApiError,
  TranslationPage,
} from '../../../api/newsletter';
import { fromServerLanguageCode } from '../../../types/language';
import CenteredMessage from '../../common/CenteredMessage';
import TextSection from './TextSection';
import FullDocPageSection from './FullDocPageSection';
import PageImageViewerModal from './PageImageViewerModal';

interface Props {
  newsletterId?: number;
  scrollRef?: RefObject<ScrollView | null>;
  scrollY?: number;
}

const FullDocTab = ({ newsletterId, scrollRef, scrollY = 0 }: Props) => {
  const { t } = useTranslation();
  const [data, setData] = useState<NewsletterTranslationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerPage, setViewerPage] = useState<TranslationPage | null>(null);
  const pageOffsetsRef = useRef<Record<number, number>>({});
  const containerYRef = useRef(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

    if (!newsletterId) {
      setError(t('scan.result.fullDoc.error.notFound'));
      setLoading(false);
      return () => {};
    }

    let cancelled = false;

    getNewsletterTranslation(newsletterId)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof NewsletterApiError && e.code === 'NL4004') {
          setError(t('scan.result.fullDoc.error.notAnalyzed'));
        } else if (e instanceof NewsletterApiError && e.code === 'NL4041') {
          setError(t('scan.result.fullDoc.error.newsletterNotFound'));
        } else {
          setError(t('scan.result.fullDoc.error.loadFailed'));
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [newsletterId]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = data?.totalPages ?? data?.pages?.length ?? 0;

  const scrollToPage = useCallback(
    (pageNo: number) => {
      const offset = containerYRef.current + (pageOffsetsRef.current[pageNo] ?? 0);
      scrollRef?.current?.scrollTo({ y: offset, animated: true });
    },
    [scrollRef]
  );

  const handleOcrCollapse = useCallback(
    (pageNo: number) => {
      const offset = containerYRef.current + (pageOffsetsRef.current[pageNo] ?? 0);
      if (offset < scrollY) scrollToPage(pageNo);
    },
    [scrollY, scrollToPage]
  );

  if (loading) return <CenteredMessage loading />;
  if (error || !data)
    return <CenteredMessage message={error ?? t('scan.result.fullDoc.error.loadFailed')} />;

  if (data.pages && data.pages.length > 0) {
    const sourceType = data.sourceType ?? 'IMAGE';
    const isKoreanUser = data.language === 'KO';
    const languageName = t(
      `scan.result.fullDoc.languageNames.${fromServerLanguageCode(data.language)}`
    );

    return (
      <View
        style={styles.pagesContainer}
        onLayout={(e) => {
          containerYRef.current = e.nativeEvent.layout.y;
        }}
      >
        {data.pages.map((page) => (
          <View
            key={page.pageNo}
            onLayout={(e) => {
              pageOffsetsRef.current[page.pageNo] = e.nativeEvent.layout.y;
            }}
          >
            <FullDocPageSection
              page={page}
              totalPages={totalPages}
              sourceType={sourceType}
              isKoreanUser={isKoreanUser}
              languageName={languageName}
              onOpenViewer={() => setViewerPage(page)}
              onOcrCollapse={() => handleOcrCollapse(page.pageNo)}
            />
          </View>
        ))}
        <PageImageViewerModal
          visible={!!viewerPage}
          page={viewerPage}
          totalPages={totalPages}
          onClose={() => setViewerPage(null)}
        />
      </View>
    );
  }

  const showTranslation = !!data.translatedText;

  return (
    <View style={styles.container}>
      {showTranslation && (
        <TextSection label={t('scan.result.fullDoc.translated')} text={data.translatedText!} />
      )}
      <TextSection
        label={
          showTranslation ? t('scan.result.fullDoc.ocrOriginal') : t('scan.result.fullDoc.original')
        }
        text={data.originalText}
      />
    </View>
  );
};

export default FullDocTab;

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  pagesContainer: {
    gap: 16,
  },
});
