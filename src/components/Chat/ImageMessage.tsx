import React, { useMemo, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import { UploadProgressOverlay } from './UploadOverlay';
import { Message } from '../../typescript/interface/message.interface';
import TouchableButton from '../TouchableButton';
import { fontSize, scale, spacing } from '../../utils';

const ImageLoaderWrapper = ({
  file,
  index,
  isGrid,
  filesLength,
  showProgress,
  overallProgress,
  onPress,
}: {
  file: NonNullable<Message['files']>[0];
  index: number;
  isGrid: boolean;
  filesLength: number;
  showProgress: boolean;
  overallProgress: number;
  onPress: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(true); // 👈 Local state for loading

  return (
    <TouchableOpacity
      key={file._id || index}
      style={[
        styles.imageWrapper,
        // !isGrid && { width: '100%' },
        // Dim the image slightly while loading
        isLoading && { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* 1. Loader: Show activity indicator while loading */}
      {isLoading && (
        <View style={styles.absoluteCenter}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}

      {/* 2. Image: Use onLoadEnd to hide the loader */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: file.thumbnailUrl || file.url }}
          onLoadEnd={() => setIsLoading(false)}
          style={[
            // StyleSheet.absoluteFill,
            {
              width: '100%',
              height: '100%',
              opacity: isLoading ? 0 : 1,
              borderRadius: 10,
            },
          ]}
          resizeMode="cover"
        />
      </View>

      {/* 3. More Overlay (if applicable) */}
      {index === 3 && filesLength > 4 && (
        <View style={styles.moreOverlay}>
          <Text style={styles.moreText}>+{filesLength - 4}</Text>
        </View>
      )}

      {/* 4. Upload Progress Overlay (if applicable) */}
      {showProgress && (
        <UploadProgressOverlay
          progress={
            index === 3 && filesLength > 4
              ? overallProgress
              : (file.progress ?? 0)
          }
        />
      )}
    </TouchableOpacity>
  );
};

export function ImageMessage({
  message,
  setSelected,
}: {
  message: Message;
  setSelected: (index: number) => void;
}) {
  const files = message.files || [];

  if (!files.length) return null;

  const isGrid = files.length > 1;
  const isLargeGrid = files.length > 4;
  const filesToShow = isLargeGrid ? files.slice(0, 4) : files;
  let overallProgress = 100;

  const filesToAverage = files.slice(3);

  // 2. Filter for only the files that are actively uploading and have progress
  const uploadingFiles = filesToAverage.filter(
    f => f.uploading && typeof f.progress === 'number',
  );

  if (uploadingFiles.length > 0) {
    // 3. Sum the progress of the filtered uploading files
    const totalProgress = uploadingFiles.reduce((sum, file) => {
      // We already checked for 'number' type in the filter, but using the check is harmless.
      const progress = file.progress ?? 0;
      return sum + progress;
    }, 0);

    // 4. Calculate the average progress
    overallProgress = totalProgress / uploadingFiles.length;
  }

  return (
    <View style={styles.wrapper}>
      <View style={[isGrid ? styles.grid : styles.single]}>
        {filesToShow.map((f, i) => {
          return (
            <ImageLoaderWrapper
              key={f._id || i}
              file={f}
              index={i}
              isGrid={isGrid}
              filesLength={files.length}
              showProgress={
                i === 3
                  ? typeof overallProgress === 'number' && overallProgress < 100
                  : typeof f.progress === 'number' && f.progress < 100
              }
              overallProgress={overallProgress}
              onPress={() => {
                setSelected(i);
              }}
            />
          );
        })}
      </View>

      {!!message.content && <Text style={styles.text}>{message.content}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  absoluteCenter: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5, // Make sure it's above the image, but below the UploadOverlay (zIndex 10)
  },

  single: {
    minWidth: scale(200),
    maxWidth: scale(300),
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  imageWrapper: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing(8),
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    color: 'white',
    fontSize: fontSize(18),
    fontWeight: '600',
  },
  text: {
    marginTop: spacing(6),
    fontSize: fontSize(14),
    color: '#fff',
    flexShrink: 1,
  },
});
