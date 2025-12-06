import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

export const useFileCache = (fileName: string) => {
  const localFilePath = `${Platform.OS === 'ios' ? RNFS.DocumentDirectoryPath : RNFS.ExternalDirectoryPath}/${fileName}`;
  const [fileExists, setFileExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkFile = async () => {
    setIsLoading(true);
    try {
      const exists = await RNFS.exists(localFilePath);
      setFileExists(exists);
    } catch (e) {
      console.error('Error checking file existence:', e);
      setFileExists(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkFile();
  }, [fileName]); // Re-check if fileName changes

  return { localFilePath, fileExists, isLoading, setFileExists, checkFile };
};
