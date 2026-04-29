import { useRef, useState } from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Header from '../../src/components/common/Header';
import ScanStepIndicator from '../../src/components/scan/ScanStepIndicator';
import ScanHelpModal from '../../src/components/scan/ScanHelpModal';
import ScanChildPill from '../../src/components/scan/ScanChildPill';
import ScanCornerBrackets from '../../src/components/scan/ScanCornerBrackets';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import { SCAN_FRAME_W, SCAN_FRAME_H, SCAN_DEFAULT_CHILD_COLOR } from '../../src/constants/scan';

export default function ScanCameraScreen() {
  const { childName, childColor } = useLocalSearchParams<{
    childName: string;
    childColor: string;
  }>();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [helpVisible, setHelpVisible] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (photo) {
        router.push({
          pathname: '/scan/preview',
          params: {
            photoUri: photo.uri,
            childName: childName ?? '',
            childColor: childColor ?? '',
            source: 'camera',
          },
        });
        return;
      }
      setCapturing(false);
    } catch {
      Alert.alert('촬영 실패', '다시 시도해주세요.');
      setCapturing(false);
    }
  };

  const handleGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요해요.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (!result.canceled) {
        router.push({
          pathname: '/scan/preview',
          params: {
            photoUri: result.assets[0].uri,
            childName: childName ?? '',
            childColor: childColor ?? '',
            source: 'gallery',
          },
        });
      }
    } catch {
      Alert.alert('오류', '갤러리를 불러올 수 없어요.');
    }
  };

  if (!permission) return <View style={styles.screen} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Ionicons name="camera-outline" size={40} color={colors.primary[400]} />
        <Text style={styles.permissionText}>카메라 접근 권한이 필요해요</Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
          accessibilityLabel="카메라 권한 허용"
          accessibilityRole="button"
        >
          <Text style={styles.permissionBtnText}>권한 허용하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasChild = !!childName;

  return (
    <View style={styles.screen}>
      <Header title="문서 스캔" onHelp={() => setHelpVisible(true)} />
      <ScanStepIndicator currentStep={2} />

      {hasChild && (
        <ScanChildPill
          name={childName}
          color={childColor || SCAN_DEFAULT_CHILD_COLOR}
          onChangePress={() => router.back()}
        />
      )}

      <View style={styles.cameraWrapper}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
        <ScanCornerBrackets />
      </View>

      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.sideButton}
          onPress={handleGallery}
          activeOpacity={0.8}
          accessibilityLabel="갤러리에서 선택"
          accessibilityRole="button"
        >
          <Ionicons name="image-outline" size={24} color={colors.text.white} />
        </TouchableOpacity>

        <View style={styles.captureRingShadow}>
          <TouchableOpacity
            style={styles.captureRing}
            onPress={handleCapture}
            disabled={capturing}
            activeOpacity={0.85}
            accessibilityLabel="사진 촬영"
            accessibilityRole="button"
          >
            <View style={styles.captureButton} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.sideButton}
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          activeOpacity={0.8}
          accessibilityLabel="카메라 전환"
          accessibilityRole="button"
        >
          <Ionicons name="camera-reverse-outline" size={24} color={colors.text.white} />
        </TouchableOpacity>
      </View>

      <ScanHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.text.white,
    paddingTop: 60,
  },
  cameraWrapper: {
    width: SCAN_FRAME_W,
    height: SCAN_FRAME_H,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  camera: {
    width: SCAN_FRAME_W,
    height: SCAN_FRAME_H,
  },
  bottomControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    paddingTop: 12,
  },
  sideButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureRingShadow: {
    shadowColor: colors.primary[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 6,
    borderRadius: 38,
  },
  captureRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.primary[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary[400],
  },
  permissionScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text.white,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  permissionBtn: {
    backgroundColor: colors.primary[400],
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  permissionBtnText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text.white,
  },
});
