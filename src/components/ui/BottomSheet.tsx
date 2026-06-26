import { Dimensions, View } from 'react-native';
import ActionSheet, {
  ScrollView,
  SheetManager,
  SheetProps,
} from 'react-native-actions-sheet';
import { createStyleSheet } from 'react-native-unistyles';
import { theme } from '../../theme';
import { spacing } from '../../utils';
import AppButton from './AppButton';

// The sheet sizes itself to its content (capped at the device height by RNAS).
// Bounding the scrollable area keeps the sheet at a comfortable height instead
// of filling the screen, which also leaves the backdrop tappable and makes the
// drag-to-close gesture work even when the inner list is long.
const MAX_SCROLL_HEIGHT = Dimensions.get('window').height * 0.5;

export default function BottomSheet(props: SheetProps<'general-sheet'>) {
  return (
    <ActionSheet
      useBottomSafeAreaPadding
      backgroundInteractionEnabled={false}
      closeOnTouchBackdrop
      drawUnderStatusBar={false}
      indicatorStyle={styles.indicator}
      gestureEnabled
      containerStyle={{
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        backgroundColor: '#f9f9f9',
      }}
    >
      <ScrollView
        style={{ maxHeight: MAX_SCROLL_HEIGHT }}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom: props.payload?.paddingBottom,
          },
        ]}
        nestedScrollEnabled
      >
        {props.payload?.children}
      </ScrollView>
      <View style={styles.footerContainer}>
        <AppButton
          text="Apply"
          style={{ paddingVertical: spacing(16) }}
          onPress={() => {
            SheetManager.hide('general-sheet');
          }}
        />
      </View>
    </ActionSheet>
  );
}

const styles = createStyleSheet({
  indicator: {
    width: spacing(40),
    height: spacing(5),
    borderRadius: 999,
    backgroundColor: theme.colors.gray[300],
    marginTop: spacing(10),
  },
  contentContainer: {
    padding: spacing(20),
    paddingTop: spacing(16),
  },
  footerContainer: {
    paddingHorizontal: spacing(20),
    paddingBottom: spacing(10),
    backgroundColor: '#f9f9f9',
  },
});
