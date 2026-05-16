import { View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { theme } from '../../theme';
import { scale, spacing } from '../../utils';
import { Skeleton } from '../ui/Skeleton';

const ROWS: { isMe: boolean; bubbleWidth: number; lines: number }[] = [
  { isMe: false, bubbleWidth: 220, lines: 2 },
  { isMe: true, bubbleWidth: 160, lines: 1 },
  { isMe: false, bubbleWidth: 180, lines: 1 },
  { isMe: true, bubbleWidth: 240, lines: 2 },
  { isMe: false, bubbleWidth: 200, lines: 1 },
  { isMe: true, bubbleWidth: 140, lines: 1 },
  { isMe: false, bubbleWidth: 260, lines: 3 },
];

export default function ChatRoomSkeleton() {
  return (
    <View style={styles.container}>
      {ROWS.map((row, i) => (
        <View
          key={i}
          style={[
            styles.row,
            { justifyContent: row.isMe ? 'flex-end' : 'flex-start' },
          ]}
        >
          {!row.isMe && (
            <Skeleton
              width={scale(28)}
              height={scale(28)}
              borderRadius={scale(14)}
              style={styles.avatar}
            />
          )}
          <View
            style={[
              styles.bubble,
              row.isMe ? styles.myBubble : styles.otherBubble,
              { width: row.bubbleWidth },
            ]}
          >
            {Array.from({ length: row.lines }).map((_, j) => (
              <Skeleton
                key={j}
                width={j === row.lines - 1 ? '60%' : '100%'}
                height={12}
                borderRadius={4}
                style={{ backgroundColor: 'rgba(255,255,255,0.45)' }}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = createStyleSheet({
  container: {
    flex: 1,
    padding: spacing(16),
    gap: spacing(10),
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatar: {
    marginRight: spacing(8),
  },
  bubble: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(12),
    borderRadius: 12,
    gap: spacing(6),
  },
  otherBubble: {
    backgroundColor: theme.colors.gray[100],
    borderBottomLeftRadius: 4,
  },
  myBubble: {
    backgroundColor: theme.colors.gray[300],
    borderBottomRightRadius: 4,
  },
});
