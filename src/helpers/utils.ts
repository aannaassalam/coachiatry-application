import { showMessage } from 'react-native-flash-message';
import { Filter } from '../typescript/interface/common.interface';
import messaging from '@react-native-firebase/messaging';
import RNFS from 'react-native-fs';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

export function sanitizeFilters(values: Filter[]): Filter[] {
  return values.filter(
    f => f.selectedKey && f.selectedOperator && f.selectedValue,
  );
}

export const onError = (errors: Record<string, any>) => {
  const firstError = Object.values(errors)[0];
  const secondError = Object.values(errors)[0][0]?.title;

  if (firstError?.message) {
    showMessage({
      type: 'danger',
      message: 'Validation Error',
      description: firstError.message,
    });
  } else if (secondError?.message) {
    showMessage({
      type: 'danger',
      message: 'Validation Error',
      description: secondError.message,
    });
  } else {
    showMessage({
      type: 'danger',
      message: 'Validation Error',
      description: 'Please complete all required fields',
    });
  }
};

export const getToken = async () => {
  await messaging().registerDeviceForRemoteMessages();
  return await messaging().getToken();
};

export const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export async function getLocalProfileImage(remoteUrl: string) {
  const filename = remoteUrl.split('/').pop();
  const localPath = `${RNFS.CachesDirectoryPath}/${filename}`;

  try {
    const exists = await RNFS.exists(localPath);
    if (!exists) {
      await RNFS.downloadFile({
        fromUrl: remoteUrl,
        toFile: localPath,
      }).promise;
    }

    const resized = await ImageResizer.createResizedImage(
      localPath,
      96, // width
      96, // height
      'PNG',
      75, // quality
      0,
      RNFS.CachesDirectoryPath,
    );
    console.log(resized.uri, 'uri');

    return resized.uri.replace('file://', '');
  } catch (e) {
    console.log('Failed to download profile image:', e);
    return undefined;
  }
}
