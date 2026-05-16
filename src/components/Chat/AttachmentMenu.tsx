import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { spacing, fontSize } from '../../utils';
import { theme } from '../../theme';
import { ChatAttachment } from '../../assets';

interface AttachmentMenuProps {
  onSelect: (type: 'camera' | 'image' | 'video' | 'file') => void;
  onOpen?: () => void;
}

const AttachmentMenu: React.FC<AttachmentMenuProps> = ({
  onSelect,
  onOpen,
}) => {
  const [visible, setVisible] = useState(false);

  const toggle = () => {
    if (!visible) onOpen?.();
    setVisible(prev => !prev);
  };

  const handleSelect = (type: 'camera' | 'image' | 'video' | 'file') => {
    setVisible(false);
    onSelect(type);
  };

  return (
    <View>
      {/* Menu floats above the trigger via absolute positioning */}
      {visible && (
        <>
          {/* Backdrop to close on outside tap */}
          <Pressable
            style={styles.backdrop}
            onPress={() => setVisible(false)}
          />
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            style={styles.menuContainer}
          >
            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSelect('camera')}
              activeOpacity={0.6}
            >
              <Ionicons name="camera-outline" size={20} color="#6B7280" />
              <Text style={styles.label}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSelect('image')}
              activeOpacity={0.6}
            >
              <Ionicons name="image-outline" size={20} color="#6B7280" />
              <Text style={styles.label}>Images</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSelect('video')}
              activeOpacity={0.6}
            >
              <Ionicons name="videocam-outline" size={20} color="#6B7280" />
              <Text style={styles.label}>Videos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSelect('file')}
              activeOpacity={0.6}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#6B7280"
              />
              <Text style={styles.label}>Documents</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      {/* Trigger button */}
      <TouchableOpacity onPress={toggle} style={{ padding: spacing(5) }}>
        <ChatAttachment />
      </TouchableOpacity>
    </View>
  );
};

export default AttachmentMenu;

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: -1000,
    bottom: -1000,
    left: -1000,
    right: -1000,
    zIndex: 1,
  },
  menuContainer: {
    position: 'absolute',
    bottom: '100%',
    right: spacing(-20),
    marginBottom: spacing(10),
    width: spacing(150),
    borderRadius: spacing(10),
    paddingVertical: spacing(2),
    backgroundColor: theme.colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 5,
    zIndex: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(10),
  },
  label: {
    fontSize: fontSize(14),
    marginLeft: spacing(10),
    color: theme.colors.gray[800],
    fontFamily: theme.fonts.lato.regular,
  },
});
