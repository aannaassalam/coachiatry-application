import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Video from 'react-native-video';
import { Message } from '../../typescript/interface/message.interface';
import TouchableButton from '../TouchableButton';
import { UploadProgressOverlay } from './UploadOverlay';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { fontSize, spacing } from '../../utils';
import { theme } from '../../theme';
import { TouchableOpacity } from 'react-native';

const VideoLoaderWrapper = ({
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
        !isGrid && { width: '100%' },
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

      <Video
        source={{ uri: file.url }}
        // 👇 Control the loading state
        onLoad={() => setIsLoading(false)}
        paused
        resizeMode="cover"
        // 👇 Keep the image invisible until loaded
        style={[styles.image, { opacity: isLoading ? 0 : 1 }]}
      />

      {/* 3. More Overlay (if applicable) */}
      {index === 3 && filesLength > 4 && (
        <View style={styles.moreOverlay}>
          <Text style={styles.moreText}>+{filesLength - 4}</Text>
        </View>
      )}

      {/* 4. Upload Progress Overlay (if applicable) */}
      {showProgress ? (
        <UploadProgressOverlay
          progress={
            index === 3 && filesLength > 4
              ? overallProgress
              : (file.progress ?? 0)
          }
        />
      ) : !isLoading ? (
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
            padding: spacing(15),
            borderRadius: 100,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <FontAwesome5
            name="play"
            solid
            color={theme.colors.white}
            size={fontSize(20)}
            style={{ marginLeft: spacing(3) }}
          />
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

export function VideoMessage({
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
            <VideoLoaderWrapper
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  single: {
    minWidth: 200,
    maxWidth: 300,
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
    fontSize: 18,
    fontWeight: '600',
  },
  text: {
    marginTop: 6,
    fontSize: 14,
    color: '#fff',
    flexShrink: 1,
  },
});
