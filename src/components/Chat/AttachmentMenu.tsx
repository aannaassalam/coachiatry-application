import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { spacing, fontSize, isAndroid } from '../../utils';
import { theme } from '../../theme';

interface AttachmentMenuProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: 'image' | 'video' | 'file') => void;
}

const AttachmentMenu: React.FC<AttachmentMenuProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(visible ? 1 : 0, { duration: 120 }),
      transform: [
        {
          scale: withTiming(visible ? 1 : 0.85, { duration: 120 }),
        },
      ],
    };
  });

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <MenuItem
            label="Images"
            icon={<Ionicons name="image-outline" size={20} color="#6B7280" />}
            onPress={() => onSelect('image')}
          />

          <MenuItem
            label="Videos"
            icon={
              <Ionicons name="videocam-outline" size={20} color="#6B7280" />
            }
            onPress={() => onSelect('video')}
          />

          <MenuItem
            label="Documents"
            icon={
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#6B7280"
              />
            }
            onPress={() => onSelect('file')}
          />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const MenuItem = ({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    {icon}
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

export default AttachmentMenu;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: spacing(60),
    right: spacing(10),
    left: 0,
    top: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },

  container: {
    backgroundColor: theme.colors.white,
    paddingVertical: spacing(2),
    width: spacing(150),
    borderRadius: spacing(10),

    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,

    marginRight: isAndroid ? spacing(30) : spacing(20),
    marginBottom: isAndroid ? spacing(15) : spacing(5),
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
