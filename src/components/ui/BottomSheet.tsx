import { SheetSize, TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { Component, ReactNode, useEffect, useRef } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { Portal } from 'react-native-portalize';
import { createStyleSheet } from 'react-native-unistyles';
import { spacing } from '../../utils';
import AppButton from './AppButton';

export default function BottomSheetBox({
  children,
  open,
  onClose,
  sizes,
  paddingBottom,
}: {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  sizes?: SheetSize[];
  paddingBottom?: number;
}) {
  const sheet = useRef<TrueSheet>(null);
  const scrollRef = useRef<ScrollView>(null);

  const present = async () => {
    await sheet.current?.present();
  };

  const dismiss = async () => {
    await sheet.current?.dismiss();
    console.log('Bye bye 👋');
  };

  useEffect(() => {
    if (open) {
      present();
    } else {
      dismiss();
    }
  }, [open]);

  const renderFooter = (
    <View style={styles.footerContainer}>
      <AppButton text="Apply" style={{ paddingVertical: spacing(16) }} />
    </View>
  );

  return (
    <Portal>
      <TrueSheet
        ref={sheet}
        sizes={sizes ?? ['auto']}
        grabber={false}
        cornerRadius={Platform.OS === 'android' ? 24 : undefined}
        FooterComponent={renderFooter}
        edgeToEdge
        backgroundColor="#F9F9F9"
        scrollRef={scrollRef as unknown as React.RefObject<Component>}
        onDismiss={onClose}
      >
        <ScrollView
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingBottom,
            },
          ]}
          ref={scrollRef}
          nestedScrollEnabled
        >
          {children}
        </ScrollView>
      </TrueSheet>
    </Portal>
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
    paddingBottom: Platform.OS === 'ios' ? spacing(38) : spacing(80),
    backgroundColor: '#f9f9f9',
  },
});
