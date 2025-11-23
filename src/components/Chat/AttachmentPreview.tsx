import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import Video from 'react-native-video';

import { spacing, fontSize, SCREEN_HEIGHT } from '../../utils';
import { theme } from '../../theme';

export type AttachmentFile = {
  uri: string;
  type: 'image' | 'video' | 'document';
  name?: string;
};

interface Props {
  files: AttachmentFile[];
  onRemove: (index: number) => void;
  onClose: () => void;
}

const screenWidth = Dimensions.get('window').width;

const AttachmentFullPreview: React.FC<Props> = ({
  files,
  onRemove,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // SAFETY: ensure activeIndex is always valid after deletions
  const safeIndex = Math.min(activeIndex, files.length - 1);

  // If files array updated (after delete), auto-correct the index
  if (safeIndex !== activeIndex) {
    setActiveIndex(safeIndex);
  }

  const active = files[safeIndex];
  if (!active) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(180)}
      exiting={FadeOutDown.duration(180)}
      style={styles.wrapper}
    >
      {/* CLOSE BUTTON */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Ionicons name="close" size={26} color="#444" />
      </TouchableOpacity>

      {/* MAIN LARGE PREVIEW */}
      <View style={styles.mainPreview}>
        {active.type === 'image' && (
          <Image source={{ uri: active.uri }} style={styles.mainMedia} />
        )}

        {active.type === 'video' && (
          <Video
            source={{ uri: active.uri }}
            style={styles.mainMedia}
            resizeMode="contain"
            controls
          />
        )}

        {active.type === 'document' && (
          <View style={styles.docBox}>
            <Ionicons name="document-text-outline" size={50} color="#555" />
            <Text style={styles.docName}>{active.name || 'Document'}</Text>
          </View>
        )}
      </View>

      {/* THUMBNAILS (TABS) */}
      <View style={{ width: '100%' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailRow}
        >
          {files.map((file, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setActiveIndex(index)}
              style={[
                styles.thumbItem,
                activeIndex === index && styles.thumbItemActive,
              ]}
            >
              {/* IMAGE/VIDEO THUMB */}
              {file.type !== 'document' ? (
                <Image source={{ uri: file.uri }} style={styles.thumb} />
              ) : (
                <View style={styles.docThumb}>
                  <Ionicons
                    name="document-text-outline"
                    size={22}
                    color="#555"
                  />
                </View>
              )}

              {/* DELETE BUTTON */}
              <TouchableOpacity
                onPress={() => onRemove(index)}
                style={styles.removeBtn}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );
};

export default AttachmentFullPreview;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.white,
    zIndex: 5,
    flex: 1, // <-- allows movement
    paddingBottom: spacing(10), // leaves space for keyboard
  },

  closeBtn: {
    alignSelf: 'flex-end',
    padding: spacing(10),
  },

  mainPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  mainMedia: {
    width: screenWidth,
    height: '90%',
    resizeMode: 'contain',
  },

  docBox: {
    width: screenWidth * 0.8,
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
  },

  docName: {
    marginTop: 6,
    fontSize: fontSize(16),
    color: '#333',
  },
  thumbnailRow: {
    paddingVertical: spacing(8),
    paddingLeft: spacing(10),
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderColor: '#ddd',
    width: '100%',
  },

  thumbItem: {
    marginRight: spacing(10),
    position: 'relative',
    padding: 2,
    borderRadius: 8,
  },

  thumbItemActive: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },

  thumb: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },

  docThumb: {
    width: 60,
    height: 60,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#0009',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
