import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import { filesize } from 'filesize'; // Library recommended for file size formatting
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { open as openFileViewer } from 'react-native-file-viewer-turbo';
import RNFS from 'react-native-fs';
import { useFileCache } from '../../hooks/useFileCache';
import { theme } from '../../theme';
import { Message } from '../../typescript/interface/message.interface';
import { fontSize, scale, spacing } from '../../utils';
import TouchableButton from '../TouchableButton';
import { CircularProgress, getFileIcon } from './UploadOverlay';
import { Download } from 'lucide-react-native';

const FileCardLayout = ({
  file,
  progress,
  fileExists,
  localFilePath,
  setFileExists,
}: {
  file: NonNullable<Message['files']>[0];
  progress: number;
  fileExists: boolean;
  localFilePath: string;
  setFileExists: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const icon = getFileIcon(file.type);
  const fileName =
    (file as any).name ||
    decodeURIComponent(file.url).split('/').pop() ||
    'File';
  const fileSize = file.size ? filesize(file.size) : 'Unknown size';

  // Max 1 line for filename
  const MAX_FILE_NAME_LENGTH = 30;
  const displayName =
    fileName.length > MAX_FILE_NAME_LENGTH
      ? fileName.substring(0, MAX_FILE_NAME_LENGTH - 3) + '...'
      : fileName;

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadFile = async () => {
    setIsDownloading(true);
    setDownloadProgress(0); // Reset progress

    // Progress callback function
    const progressCallback = (res: any) => {
      const percentage = Math.floor(
        (res.bytesWritten * 100) / res.contentLength,
      );
      setDownloadProgress(percentage);
    };

    try {
      const options = {
        fromUrl: file.url,
        toFile: localFilePath,
        progress: progressCallback,
        progressDivider: 1, // Update progress on every 1% change
        headers: {
          'Cache-Control': 'no-cache', // Optional: Ensure fresh download
        },
      };

      const result = await RNFS.downloadFile(options).promise;

      if (result.statusCode === 200) {
        setDownloadProgress(100);
        console.log('one');
        setFileExists(true); // Update state to show "Open File" next time
      } else {
        // Handle failed download (e.g., status code 404, 500)
        console.error('Download failed with status:', result.statusCode);
        alert(`Download failed with status code ${result.statusCode}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(`Download failed: ${(error as any).message}`);

      // Clean up failed download file
      await RNFS.unlink(localFilePath).catch(() => {});
      setFileExists(false);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0); // Clear progress bar
    }
  };

  return (
    <View style={fileCardStyles.cardContainer}>
      {/* Left Section: Icon */}
      <View style={fileCardStyles.iconWrapper}>
        {/* Use the actual FontAwesome5 component from your library */}
        <FontAwesome name={icon.name as any} size={28} color={icon.color} />
      </View>

      {/* Center Section: Name, Type, Size */}
      <View style={fileCardStyles.textWrapper}>
        <Text style={fileCardStyles.nameText} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={fileCardStyles.detailsText}>
          {file.type.split('/').pop()?.toUpperCase() || 'Unknown'} |{' '}
          {fileSize.toString()}
        </Text>
      </View>

      {/* Right Section: Progress */}
      <View style={fileCardStyles.progressWrapper}>
        {file.uploading ? (
          <CircularProgress progress={progress} />
        ) : isDownloading ? (
          <CircularProgress progress={downloadProgress} />
        ) : !fileExists ? (
          <Pressable onPress={downloadFile}>
            <Download size={fontSize(25)} color={theme.colors.gray[300]} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

// The component is renamed FileLoaderWrapper but keeps the same props
const FileLoaderWrapper = ({
  file,
  index,
}: {
  file: NonNullable<Message['files']>[0];
  index: number;
}) => {
  const { fileExists, localFilePath, setFileExists } = useFileCache(
    decodeURIComponent(file.url).split('/').pop() ?? '',
  );

  const openLocalFile = async () => {
    try {
      await openFileViewer(localFilePath);
    } catch (error) {
      Alert.alert(`Could not open file: ${(error as any)?.message}`);
      console.log('File viewer error:', error);
    }
  };

  return (
    <TouchableButton
      key={file._id || index}
      style={styles.fileCardSingle}
      onPress={fileExists ? openLocalFile : undefined}
      activeOpacity={0.9}
    >
      {/* RENDER THE NEW FILE CARD LAYOUT */}
      <FileCardLayout
        file={file}
        progress={file.uploading ? (file.progress ?? 0) : 100}
        fileExists={fileExists}
        localFilePath={localFilePath}
        setFileExists={setFileExists}
      />
    </TouchableButton>
  );
};

// ... existing imports ...

export function FileMessage({ message }: { message: Message }) {
  const files = message.files || [];

  if (!files.length) return null; // 🛑 Removed: isGrid, isLargeGrid, filesToShow logic

  return (
    <View style={styles.wrapper}>
      {/* 🔑 FIX: Using a simple View container style that encourages stacking */}
      <View style={styles.listContainer}>
        {files.map((f, i) => {
          // Map over ALL files
          return <FileLoaderWrapper key={f._id || i} file={f} index={i} />;
        })}
      </View>
      {message.content ? (
        <Text style={styles.text}>{message.content}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  absoluteCenter: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5, // Make sure it's above the image, but below the UploadOverlay (zIndex 10)
  },
  listContainer: {
    flexDirection: 'column', // Ensures vertical stacking
    gap: spacing(4), // Spacing between stacked files
    width: '100%',
  },
  fileContainer: {
    // Renaming imageWrapper conceptually for clarity
    width: '100%', // Takes up the full width of listContainer
    aspectRatio: 1, // Only apply aspect ratio for image/video files (will be handled in FileLoaderWrapper)
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: spacing(4), // Keep spacing between stacked items
  },
  fileCardSingle: {
    width: '100%',
    minWidth: scale(230),
    padding: spacing(12),
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Light background for file card
    marginBottom: spacing(4),
  },
  text: {
    marginTop: spacing(6),
    fontSize: fontSize(14),
    color: '#fff',
    flexShrink: 1,
  },
});

const fileCardStyles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  iconWrapper: {
    marginRight: spacing(15),
  },
  textWrapper: {
    flex: 1, // Takes up remaining space
    justifyContent: 'center',
  },
  nameText: {
    color: 'white',
    fontSize: fontSize(13),
    fontWeight: 'bold',
  },
  detailsText: {
    color: '#ccc',
    fontSize: fontSize(11),
    marginTop: spacing(2),
  },
  progressWrapper: {
    marginLeft: spacing(10),
  },
});
