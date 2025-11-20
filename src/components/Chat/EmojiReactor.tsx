import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { fontSize, spacing } from '../../utils';
import { theme } from '../../theme';
import { GestureResponderEvent } from 'react-native';
// import { Check, Fire, Smile, Clapping, Eyes, Thinking } from '../../assets'; // your icons

interface EmojiReactorProps {
  onSelect: (emoji: string) => void;
  onDismiss: () => void;
  position: { top: number; left: number };
}

// const EMOJIS = [
//   { id: '1', icon: <Check /> },
//   { id: '2', icon: <Eyes /> },
//   { id: '3', icon: <Clapping /> },
//   { id: '4', icon: <Fire /> },
//   { id: '5', icon: <Smile /> },
//   { id: '6', icon: <Thinking /> },
// ];

const EmojiReactor: React.FC<EmojiReactorProps> = ({
  onSelect,
  onDismiss,
  position,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={1}
      style={[styles.overlay]}
      onPress={onDismiss}
    >
      <View
        style={[
          styles.container,
          {
            top: position.top - spacing(50),
            left: position.left - spacing(20),
          },
        ]}
      >
        {/* {EMOJIS.map(e => (
          <TouchableOpacity
            key={e.id}
            onPress={() => onSelect(e.id)}
            style={styles.emojiButton}
          >
            {e.icon}
          </TouchableOpacity>
        ))} */}
      </View>
    </TouchableOpacity>
  );
};

export default EmojiReactor;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(24),
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(6),
    shadowColor: theme.colors.gray[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emojiButton: {
    paddingHorizontal: spacing(6),
  },
});
