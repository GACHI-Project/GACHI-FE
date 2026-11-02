import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const compressScanImage = async (uri: string): Promise<string> => {
  const result = await manipulateAsync(uri, [{ resize: { width: 2048 } }], {
    compress: 0.85,
    format: SaveFormat.JPEG,
  });
  return result.uri;
};

export type GalleryPickResult =
  | { status: 'denied' }
  | { status: 'canceled' }
  | { status: 'picked'; uris: string[]; truncated: boolean };

// limit 장까지 갤러리에서 선택해 압축한 uri를 선택 순서대로 반환
export const pickGalleryImages = async (limit: number): Promise<GalleryPickResult> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return { status: 'denied' };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    orderedSelection: true,
  });
  if (result.canceled || result.assets.length === 0) return { status: 'canceled' };

  // Android 12 이하는 selectionLimit이 적용되지 않을 수 있어 한 번 더 자름
  const assets = result.assets.slice(0, limit);
  const uris = await Promise.all(assets.map((asset) => compressScanImage(asset.uri)));
  return { status: 'picked', uris, truncated: result.assets.length > limit };
};
