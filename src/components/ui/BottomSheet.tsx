import { View } from 'react-native';
import ActionSheet, {
  ScrollView,
  SheetManager,
  SheetProps,
} from 'react-native-actions-sheet';
import { createStyleSheet } from 'react-native-unistyles';
import { spacing } from '../../utils';
import AppButton from './AppButton';

export default function BottomSheet(props: SheetProps<'general-sheet'>) {
  return (
    <ActionSheet
      useBottomSafeAreaPadding
      backgroundInteractionEnabled={false}
      closeOnTouchBackdrop
      indicatorStyle={{ display: 'none' }}
      gestureEnabled
      drawUnderStatusBar
      containerStyle={{
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        backgroundColor: '#f9f9f9',
      }}
    >
      <ScrollView
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
  contentContainer: {
    padding: spacing(20),
    paddingTop: spacing(28),
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  footerContainer: {
    paddingHorizontal: spacing(20),
    paddingBottom: spacing(10),
    backgroundColor: '#f9f9f9',
  },
});
