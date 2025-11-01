import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Portal } from 'react-native-portalize';
import { createStyleSheet } from 'react-native-unistyles';
import { spacing } from '../../utils';
import AppButton from './AppButton';
import { View } from 'react-native';
import { theme } from '../../theme';

export default function BottomSheetBox({
  children,
  open,
  onClose,
  height = '50%',
}: {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  height?: string;
}) {
  const [sheetIndex, setSheetIndex] = useState(-1);

  useEffect(() => {
    setSheetIndex(open ? 0 : -1);
  }, [open]);

  // 👇 Corrected backdrop configuration
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior="close"
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        enableTouchThrough={false}
      />
    ),
    [],
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter
        {...props}
        // bottomInset={38}
        style={{ backgroundColor: theme.colors.white }}
      >
        <View style={styles.footerContainer}>
          <AppButton text="Apply" style={{ paddingVertical: spacing(16) }} />
        </View>
      </BottomSheetFooter>
    ),
    [],
  );

  return (
    <Portal>
      <BottomSheet
        index={sheetIndex}
        onClose={() => {
          setSheetIndex(-1);
          onClose();
        }}
        snapPoints={[height]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        footerComponent={renderFooter}
        handleComponent={null}
        backgroundStyle={{
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          backgroundColor: '#F9F9F9',
        }}
      >
        <BottomSheetView style={styles.contentContainer}>
          {children}
        </BottomSheetView>
      </BottomSheet>
    </Portal>
  );
}

const styles = createStyleSheet({
  contentContainer: {
    flex: 1,
    padding: spacing(20),
    paddingTop: spacing(28),
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  footerContainer: {
    paddingHorizontal: spacing(20),
    paddingBottom: spacing(38),
  },
});
