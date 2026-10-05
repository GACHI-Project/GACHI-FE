import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import OcrOriginalCollapse from './OcrOriginalCollapse';
import PageThumbnail from './PageThumbnail';
import colors from '../../../constants/colors';
import { TranslationPage, SourceType } from '../../../api/newsletter';
import { getPageView } from '../../../utils/newsletterPage';
import styles from '../../../styles/scan/fullDocPageSection';

interface FullDocPageSectionProps {
  page: TranslationPage;
  totalPages: number;
  sourceType: SourceType;
  isKoreanUser: boolean;
  languageName: string;
  onOpenViewer: () => void;
  onOcrCollapse?: () => void;
}

const FullDocPageSection = ({
  page,
  totalPages,
  sourceType,
  isKoreanUser,
  languageName,
  onOpenViewer,
  onOcrCollapse,
}: FullDocPageSectionProps) => {
  const { t } = useTranslation();
  const isImage = sourceType === 'IMAGE';
  const view = getPageView(page, isKoreanUser);

  const header = (
    <>
      <View style={styles.thumbWrap}>
        <PageThumbnail sourceType={sourceType} imageUrl={page.imageUrl} />
      </View>
      <View style={styles.headerTexts}>
        <Text style={styles.pageLabel} numberOfLines={1}>
          {t('scan.result.fullDoc.pageLabel', { pageNo: page.pageNo })}
        </Text>
        <Text style={styles.pageOf} numberOfLines={1}>
          {t('scan.result.fullDoc.pageOf', { pageNo: page.pageNo, total: totalPages })}
        </Text>
      </View>
      {isImage && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.gray[300]}
          style={styles.chevron}
        />
      )}
    </>
  );

  return (
    <View style={styles.section}>
      {isImage ? (
        <TouchableOpacity style={styles.headerRow} onPress={onOpenViewer} activeOpacity={0.7}>
          {header}
        </TouchableOpacity>
      ) : (
        <View style={styles.headerRow}>{header}</View>
      )}

      <View style={styles.divider} />

      {view === 'translated' && (
        <View style={styles.body}>
          <Text style={styles.translatedLabel}>
            {t('scan.result.fullDoc.translatedLabel', { language: languageName })}
          </Text>
          <Text style={styles.bodyText}>{page.translatedText}</Text>
          {!!page.originalText && (
            <OcrOriginalCollapse text={page.originalText} onCollapse={onOcrCollapse} />
          )}
        </View>
      )}

      {view === 'originalOnly' && (
        <View style={styles.body}>
          <Text style={styles.bodyText}>{page.originalText}</Text>
        </View>
      )}

      {view === 'translationFailed' && (
        <View style={styles.body}>
          <Text style={styles.noticeText}>{t('scan.result.fullDoc.translationFailedNotice')}</Text>
          <Text style={styles.bodyText}>{page.originalText}</Text>
        </View>
      )}

      {view === 'recognitionFailed' && (
        <View style={styles.body}>
          <View style={styles.noticeBox}>
            <Text style={styles.noticeBoxText}>
              {t('scan.result.fullDoc.recognitionFailedNotice')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default FullDocPageSection;
