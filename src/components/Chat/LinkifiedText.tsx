import { Linking, StyleProp, Text, TextStyle } from 'react-native';

// Splits on URLs (http/https or bare www.) keeping them as their own segments.
const URL_SPLIT = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const URL_TEST = /^(https?:\/\/|www\.)/i;

type Props = {
  text?: string | null;
  style?: StyleProp<TextStyle>;
  // Colour for the tappable links (defaults to a readable blue).
  linkColor?: string;
  numberOfLines?: number;
};

/**
 * Renders message text with any URLs turned into tappable links (opens in the
 * device browser). Falls back to plain text when there are no links.
 */
export default function LinkifiedText({
  text,
  style,
  linkColor = '#2563EB',
  numberOfLines,
}: Props) {
  const value = text ?? '';

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {value.split(URL_SPLIT).map((part, index) => {
        if (part && URL_TEST.test(part)) {
          // Don't let trailing punctuation ("...link.") break the opened URL.
          const clean = part.replace(/[.,!?;:]+$/, '');
          const url = clean.startsWith('http') ? clean : `https://${clean}`;
          return (
            <Text
              key={index}
              style={{ color: linkColor, textDecorationLine: 'underline' }}
              onPress={() => Linking.openURL(url).catch(() => {})}
            >
              {part}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}
