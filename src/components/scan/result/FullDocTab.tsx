import { RefObject, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  getNewsletterTranslation,
  NewsletterApiError,
  TranslationPage,
} from '../../../api/newsletter';
import { useServerQuery } from '../../../query/hooks';
import { fromServerLanguageCode } from '../../../types/language';
import CenteredMessage from '../../common/CenteredMessage';
import QueryNotice from '../../common/QueryNotice';
import FullDocPageSection from './FullDocPageSection';
import PageImageViewerModal from './PageImageViewerModal';
import TextSection from './TextSection';

interface Props {
  newsletterId?: number;
  scrollRef?: RefObject<ScrollView | null>;
  scrollY?: number;
}

const FullDocTab = ({ newsletterId, scrollRef, scrollY = 0 }: Props) => {
  const { t } = useTranslation();
  const query = useServerQuery(
    'translation',
    [newsletterId],
    (signal) => getNewsletterTranslation(newsletterId!, signal),
    { enabled: !!newsletterId }
  );
  const { data } = query;
  const loading = query.isLoading;
  let error: string | null = null;
  if (!newsletterId) error = t('scan.result.fullDoc.error.notFound');
  else if (query.error instanceof NewsletterApiError && query.error.code === 'NL4004')
    error = t('scan.result.fullDoc.error.notAnalyzed');
  else if (query.error instanceof NewsletterApiError && query.error.code === 'NL4041')
    error = t('scan.result.fullDoc.error.newsletterNotFound');
  else if (query.error) error = t('scan.result.fullDoc.error.loadFailed');
  const [viewerPage, setViewerPage] = useState<TranslationPage | null>(null);
  const pageOffsetsRef = useRef<Record<number, number>>({});
  const containerYRef = useRef(0);

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

  if (newsletterId && !data && !query.error && query.fetchStatus === 'paused')
    return <QueryNotice loading message={t('common.waitingConnection')} />;
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
