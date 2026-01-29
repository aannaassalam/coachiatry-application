import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  ScrollView,
  Keyboard,
  Dimensions,
} from 'react-native';
import Animated, {
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { spacing, fontSize, scale } from '../../utils';
import { theme } from '../../theme';
import { emojiCategories } from './emojis'; // <- your emoji dataset file (use exactly this file)
import { Plus } from 'lucide-react-native';

export type EmojiReactorProps = {
  visible: boolean;
  anchorX?: number; // optional: for absolute positioning if needed
  anchorY?: number; // optional: for absolute positioning if needed

  onSelect: (emoji: string) => void;
  onDismiss: () => void;
  // optional initial "quick" emojis (if you want to customise)
  quick?: string[];
};

const DEFAULT_QUICK = ['✅', '👀', '🙌', '🔥', '😮', '👍']; // last one is the "open full" button

export default function EmojiReactor({
  visible,
  onSelect,
  onDismiss,
  anchorX,
  anchorY,
  quick = DEFAULT_QUICK,
}: EmojiReactorProps) {
  const width = Dimensions.get('screen').width;
  const [pickerOpen, setPickerOpen] = useState(false);

  // top-level pop animation
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(visible ? 1 : 0.85, { duration: 110 }) }],
    opacity: withTiming(visible ? 1 : 0, { duration: 110 }),
  }));

  // flatten all emojis for the full picker (ordered by categories as in your file)
  const fullEmojiList = useMemo(() => {
    // categories in desired order: smileys first then others
    const keys = Object.keys(emojiCategories) as Array<
      keyof typeof emojiCategories
    >;
    const list: string[] = [];
    for (const k of keys) list.push(...emojiCategories[k].emojis);
    return list;
  }, []);

  if (!visible && !pickerOpen) return null;

  return (
    <>
      {/* Overlay for reactor; clicking outside will close */}
      {visible && (
        <TouchableWithoutFeedback onPress={onDismiss}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>
      )}

      {visible && (
        <Animated.View
          style={[
            styles.reactorWrapper,
            {
              left: anchorX ?? 0, // center over bubble
              top: (anchorY ?? 0) - 100, // slightly above bubble
            },
            animStyle,
          ]}
        >
          {quick.map((e, i) => {
            return (
              <TouchableOpacity
                key={String(i)}
                activeOpacity={0.8}
                onPress={() => {
                  onSelect(e);
                  onDismiss();
                }}
                style={styles.reactorBtn}
              >
                <Text style={styles.reactorEmoji}>{e}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Keyboard.dismiss();
              setPickerOpen(true);
            }}
            style={styles.reactorBtn}
          >
            <Plus size={fontSize(18)} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* FULL EMOJI PICKER (modal style, not bottom sheet) */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPickerOpen(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          {/* Category icons row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryBar}
          >
            {Object.keys(emojiCategories).map(key => (
              <View key={key} style={styles.catIconWrap}>
                <Text style={styles.catIcon}>
                  {emojiCategories[key as keyof typeof emojiCategories].icon}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* emoji grid (simple FlatList) */}
          <FlatList
            data={fullEmojiList}
            keyExtractor={(item, idx) => item + idx}
            numColumns={8}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gridBtn}
                onPress={() => {
                  onSelect(item);
                  setPickerOpen(false);
                  onDismiss(); // close reactor too
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.gridEmoji}>{item}</Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            style={styles.grid}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlayTouchable: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  reactorWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    gap: spacing(4),
    backgroundColor: theme.colors.white,
    borderRadius: 28,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(6),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 1000,
  },
  reactorBtn: {
    // marginHorizontal: spacing(6),
    // width: scale(25),
    // height: scale(25),
    padding: spacing(6),
    // backgroundColor: 'red',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactorEmoji: {
    fontSize: fontSize(18),
  },

  // FULL PICKER
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  modalContainer: {
    maxHeight: '55%',
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingTop: spacing(8),
    paddingBottom: spacing(12),
  },
  categoryBar: {
    paddingHorizontal: spacing(10),
    paddingBottom: spacing(8),
  },
  catIconWrap: {
    paddingHorizontal: spacing(8),
    paddingVertical: spacing(6),
    marginRight: spacing(6),
    borderRadius: 8,
    backgroundColor: theme.colors.gray[50],
  },
  catIcon: {
    fontSize: fontSize(20),
    lineHeight: fontSize(34),
  },
  grid: {
    paddingHorizontal: spacing(10),
  },
  gridBtn: {
    width: '12.5%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(8),
  },
  gridEmoji: {
    fontSize: fontSize(22),
    lineHeight: fontSize(36),
  },
});
