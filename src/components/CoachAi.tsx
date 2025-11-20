import React, { useRef } from 'react';
import TouchableButton from './TouchableButton';
import {
  CoachAi,
  Fireballa,
  SheetBlueCoachAi,
  SheetCoachAi,
  Thunderbolt,
} from '../assets';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { fontSize, spacing } from '../utils';
import { assets } from '../assets'; // your logo asset etc.
function CoachAiSheet() {
  const sheetRef = useRef<ActionSheetRef>(null);

  const present = async () => {
    sheetRef.current?.show();
  };

  return (
    <View>
      <TouchableButton activeOpacity={0.8} onPress={present}>
        <CoachAi />
      </TouchableButton>
      <ActionSheet
        useBottomSafeAreaPadding
        backgroundInteractionEnabled={false}
        closeOnTouchBackdrop
        indicatorStyle={{ display: 'none' }}
        gestureEnabled
        ref={sheetRef}
        containerStyle={{
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          backgroundColor: '#f9f9f9',
        }}
      >
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {/* Top Header Section */}
          <ImageBackground
            source={assets.images.CoachAiBackground} // <-- replace this with your blue image
            resizeMode="cover"
            style={styles.header}
            imageStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          >
            <View style={styles.headerContent}>
              <SheetCoachAi />
              <TouchableOpacity style={styles.closeBtn}>
                <Ionicons
                  name="close"
                  size={fontSize(24)}
                  color={theme.colors.white}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>Hello</Text>
            <Text style={styles.headerSubtitle}>How can I help you</Text>
          </ImageBackground>

          {/* Body */}
          <View style={styles.body}>
            <View style={styles.welcomeRow}>
              <SheetBlueCoachAi />
              <Text style={styles.welcomeText}>
                Welcome back! Feel free to ask me anything. How can I help?
              </Text>
            </View>

            {/* Suggested Section */}
            <Text style={styles.suggestedTitle}>Suggested</Text>
            <View style={styles.suggestedList}>
              <TouchableOpacity style={styles.suggestedCard}>
                <Ionicons
                  name="document-text-outline"
                  size={fontSize(16)}
                  color={theme.colors.gray[700]}
                />
                <Text style={styles.suggestedText}>Create a Task</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestedCard}>
                <Thunderbolt />
                <Text style={styles.suggestedText}>Create a doc</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.suggestedCard}>
                <Fireballa />
                <Text style={styles.suggestedText}>
                  Find task assigned to me
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Footer Input */}
        <View style={styles.footer}>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Ask anything..."
              placeholderTextColor={theme.colors.gray[400]}
              style={styles.textInput}
            />
            {/* <View style={styles.inputIcons}>
              <Ionicons
                name="globe-outline"
                size={fontSize(18)}
                color={theme.colors.gray[500]}
              />
              <Ionicons
                name="attach-outline"
                size={fontSize(18)}
                color={theme.colors.gray[500]}
              />
              <Ionicons
                name="mic-outline"
                size={fontSize(18)}
                color={theme.colors.gray[500]}
              />
            </View> */}
          </View>

          <TouchableOpacity style={styles.sendBtn}>
            <Ionicons
              name="arrow-up"
              size={fontSize(18)}
              color={theme.colors.white}
            />
          </TouchableOpacity>
        </View>
      </ActionSheet>
    </View>
  );
}

export default CoachAiSheet;
const styles = StyleSheet.create({
  contentContainer: {
    // padding: spacing(20),
    // paddingTop: spacing(28),
    // paddingBottom: spacing(20),
  },
  header: {
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(20),
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: spacing(200),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    padding: spacing(6),
  },
  headerTitle: {
    fontSize: fontSize(24),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.white,
    marginTop: 'auto',
    lineHeight: spacing(32),
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: fontSize(24),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.white,
    lineHeight: spacing(32),
    letterSpacing: -1,
  },
  body: {
    paddingHorizontal: spacing(16),
    paddingTop: spacing(30),
    backgroundColor: theme.colors.white,
    minHeight: spacing(400),
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(16),
  },
  welcomeText: {
    flex: 1,
    fontSize: fontSize(16),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[800],
    maxWidth: '85%',
  },
  suggestedTitle: {
    fontSize: fontSize(13),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[700],
    marginTop: spacing(24),
    marginBottom: spacing(10),
  },
  suggestedList: {
    gap: spacing(10),
    marginTop: spacing(10),
  },
  suggestedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(10),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(14),
  },
  suggestedText: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[800],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(8),
    paddingBottom: spacing(50),
    backgroundColor: theme.colors.white,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.gray[50],
    borderRadius: fontSize(8),
    alignItems: 'center',
    paddingHorizontal: spacing(12),
  },
  textInput: {
    flex: 1,
    fontSize: fontSize(14),
    color: theme.colors.gray[900],
    fontFamily: theme.fonts.lato.regular,
    paddingVertical: spacing(12),
  },
  inputIcons: {
    flexDirection: 'row',
    gap: spacing(8),
  },
  sendBtn: {
    marginLeft: spacing(8),
    backgroundColor: theme.colors.gray[950],
    padding: spacing(10),
    borderRadius: fontSize(8),
  },
});
