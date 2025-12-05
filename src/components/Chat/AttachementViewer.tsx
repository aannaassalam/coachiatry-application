import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Video from 'react-native-video';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { Message } from '../../typescript/interface/message.interface';
import { fontSize, spacing } from '../../utils';
import TouchableButton from '../TouchableButton';

interface Props {
  files: Required<Message['files']>;
  open: boolean;
  onClose: () => void;
  pressedIndex?: number;
}

const screenWidth = Dimensions.get('window').width;

const AttachmentViewer: React.FC<Props> = ({
  files = [],
  open,
  onClose,
  pressedIndex = 0,
}) => {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(pressedIndex);
  }, [pressedIndex]);

  // SAFETY: ensure activeIndex is always valid after deletions
  const safeIndex = Math.min(activeIndex, files.length - 1);

  // If files array updated (after delete), auto-correct the index
  if (safeIndex !== activeIndex) {
    setActiveIndex(safeIndex);
  }

  const active = files[safeIndex];
  if (!active) return null;

  return (
    <Modal visible={open} onRequestClose={onClose}>
      <View
        style={{
          ...styles.wrapper,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* CLOSE BUTTON */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={26} color="#444" />
        </TouchableOpacity>
        {/* MAIN LARGE PREVIEW */}
        <View style={styles.mainPreview}>
          {active.type === 'image' && (
            <Image
              source={{ uri: active.url }}
              style={styles.mainMedia}
              key={active.url}
            />
          )}
          {active.type === 'video' && (
            <Video
              source={{ uri: active.url }}
              style={styles.mainMedia}
              resizeMode="contain"
              controls
            />
          )}
        </View>
        {/* THUMBNAILS (TABS) */}
        <View style={{ width: '100%' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.thumbnailRow}
          >
            {files.map((file, index) => (
              <TouchableButton
                key={index}
                onPress={() => setActiveIndex(index)}
                style={[
                  styles.thumbItem,
                  activeIndex === index
                    ? styles.thumbItemActive
                    : styles.thumbItemInActive,
                ]}
              >
                {/* IMAGE/VIDEO THUMB */}
                {file.type === 'image' ? (
                  <Image
                    source={{ uri: file.url }}
                    style={styles.thumb}
                    key={file.url}
                  />
                ) : file.type === 'video' ? (
                  <Video
                    source={{ uri: file.url }}
                    paused
                    style={styles.thumb}
                    key={file.url}
                  />
                ) : (
                  <View style={styles.docThumb}>
                    <Ionicons
                      name="document-text-outline"
                      size={22}
                      color="#555"
                    />
                  </View>
                )}
              </TouchableButton>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default AttachmentViewer;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.white,
    zIndex: 5,
    flex: 1, // <-- allows movement
    // paddingBottom: spacing(10), // leaves space for keyboard
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
    width: '100%',
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
    padding: 2,
    borderRadius: 8,
    borderWidth: 2,
  },

  thumbItemActive: {
    borderColor: theme.colors.primary,
  },

  thumbItemInActive: {
    borderColor: 'transparent',
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
});
