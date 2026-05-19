import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import Header from '../../src/components/common/Header';
import ScanStepIndicator from '../../src/components/scan/ScanStepIndicator';
import ScanChildPill from '../../src/components/scan/ScanChildPill';
import ScanCornerBrackets from '../../src/components/scan/ScanCornerBrackets';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';
import { SCAN_FRAME_W, SCAN_FRAME_H, SCAN_DEFAULT_CHILD_COLOR } from '../../src/constants/scan';

const ScanPreviewScreen = () => {
  const { photoUri, childId, childName, childColor, childGrade, source, fileType } =
    useLocalSearchParams<{
      photoUri: string;
      childId: string;
      childName: string;
      childColor: string;
      childGrade: string;
      source: 'camera' | 'gallery' | 'pdf';
      fileType?: string;
    }>();
  const insets = useSafeAreaInsets();

  const hasChild = !!childName;
  const isPdf =
    source === 'pdf' || fileType === 'application/pdf' || photoUri?.toLowerCase().endsWith('.pdf');
  const pdfFilename = photoUri?.split('/').pop() ?? 'document.pdf';
  const retakeLabel = source === 'gallery' || isPdf ? '다시 선택하기' : '다시 찍기';

  return (
    <View style={styles.screen}>
      <Header title="문서 스캔" />
      <ScanStepIndicator currentStep={2} />

      {hasChild && (
        <ScanChildPill name={childName} color={childColor || SCAN_DEFAULT_CHILD_COLOR} />
      )}

      <View style={styles.frameWrapper}>
        {isPdf ? (
          <View style={styles.pdfPlaceholder}>
            <Ionicons name="document-text-outline" size={48} color={colors.primary[400]} />
            <Text style={styles.pdfFilename} numberOfLines={2}>
              {pdfFilename}
            </Text>
            <Text style={styles.pdfLabel}>PDF 파일</Text>
          </View>
        ) : (
          <Image
            source={{ uri: photoUri }}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel="스캔할 문서 미리보기"
          />
        )}
        <ScanCornerBrackets />
      </View>

      <View style={[styles.buttons, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.retakeBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessibilityLabel={retakeLabel}
          accessibilityRole="button"
        >
          <Text style={styles.retakeBtnText}>{retakeLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() =>
            router.push({
              pathname: '/scan/loading',
              params: { photoUri, childId, childName, childColor, childGrade },
            })
          }
          activeOpacity={0.8}
          accessibilityLabel="사용하기"
          accessibilityRole="button"
        >
          <Text style={styles.confirmBtnText}>사용하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ScanPreviewScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  frameWrapper: {
    width: SCAN_FRAME_W,
    height: SCAN_FRAME_H,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: SCAN_FRAME_W,
    height: SCAN_FRAME_H,
  },
  pdfPlaceholder: {
    width: SCAN_FRAME_W,
    height: SCAN_FRAME_H,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary[0],
  },
  pdfFilename: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  pdfLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  buttons: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: 12,
    paddingTop: 16,
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },
  retakeBtnText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.text.white,
  },
});
