import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
} from 'react-native';
import { fontSize, spacing } from '../../utils';
import { theme } from '../../theme';
import { emojiCategories } from './emojis'; // <-- Your full dataset pasted here

export interface EmojiKeyboardProps {
  visible: boolean;
  onSelect: (emoji: string) => void;
}

const categoryKeys = Object.keys(emojiCategories) as Array<
  keyof typeof emojiCategories
>;

const EmojiKeyboard: React.FC<EmojiKeyboardProps> = ({ visible, onSelect }) => {
  const [active, setActive] = useState<keyof typeof emojiCategories>(
    categoryKeys[0] as keyof typeof emojiCategories,
  );

  if (!visible) return null;

  const activeEmojis = emojiCategories[active]?.emojis ?? [];

  return (
    <View style={styles.wrapper}>
      {/* CATEGORY BAR */}
      <View style={styles.categoryRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categoryKeys.map(key => (
            <TouchableOpacity
              key={key}
              onPress={() => setActive(key)}
              style={[
                styles.categoryBtn,
                active === key && styles.categoryBtnActive,
              ]}
            >
              <Text style={styles.categoryIcon}>
                {emojiCategories[key].icon}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* EMOJI GRID */}
      <FlatList
        data={activeEmojis}
        keyExtractor={(item, index) => index.toString()}
        numColumns={8}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.emojiBtn}
            onPress={() => onSelect(item)}
          >
            <Text style={styles.emoji}>{item}</Text>
          </TouchableOpacity>
        )}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default EmojiKeyboard;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: theme.colors.gray[200],
    paddingBottom: spacing(4),
    paddingTop: spacing(4),
  },

  /** CATEGORY BAR */
  categoryRow: {
    borderBottomWidth: 1,
    borderColor: theme.colors.gray[200],
    paddingVertical: spacing(4),
  },
  categoryScroll: {
    paddingHorizontal: spacing(6),
  },
  categoryBtn: {
    padding: spacing(6),
    marginRight: spacing(6),
    borderRadius: spacing(6),
  },
  categoryBtnActive: {
    backgroundColor: theme.colors.gray[100],
  },
  categoryIcon: {
    fontSize: fontSize(20),
    fontFamily: undefined,
  },

  /** EMOJI GRID */
  list: {
    maxHeight: 260,
  },
  emojiBtn: {
    width: '12.5%',
    paddingVertical: spacing(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: fontSize(22),
    fontFamily: undefined, // CRITICAL FOR ANDROID
  },
});
