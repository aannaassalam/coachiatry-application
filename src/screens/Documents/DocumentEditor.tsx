import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Foundation from 'react-native-vector-icons/Foundation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';

import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  actions,
  RichEditor,
  RichToolbar,
} from 'react-native-pell-rich-editor';
import {
  assets,
  Calendar,
  ChevronLeft,
  Redo,
  Undo,
  WhiteCoachAi,
} from '../../assets';
import AppBadge from '../../components/ui/AppBadge';
import AppButton from '../../components/ui/AppButton';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';

export default function DocumentEditor() {
  const editor = useRef<RichEditor | null>(null);
  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const headerHeight = useHeaderHeight();
  const [text, setText] = useState('');
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { mode } = route.params || {};
  const [localMode, setLocalMode] = useState(mode);

  const handleCursorPosition = (offsetY: number) => {
    if (!scrollRef.current) return;
    scrollRef.current?.scrollToPosition(0, offsetY - 200, true);
  };

  useEffect(() => {
    setLocalMode(localMode);
  }, [localMode, mode]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft />
          </TouchableOpacity>
          {localMode !== 'view' && (
            <Text style={styles.headerTitle}>
              {localMode === 'edit' ? 'Edit' : 'Add'}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {localMode === 'view' && (
              <TouchableOpacity
                style={{ ...styles.iconButton, marginLeft: 'auto' }}
              >
                <Ionicons
                  name="arrow-redo"
                  size={fontSize(16)}
                  color={theme.colors.gray[800]}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons
                name="ellipsis-horizontal"
                size={fontSize(22)}
                color={theme.colors.gray[600]}
              />
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAwareScrollView
          ref={scrollRef}
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={20} // ⬆ increase this from 24 → 100
          extraHeight={Platform.OS === 'ios' ? 120 : 200}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: spacing(150) }}
          showsVerticalScrollIndicator={false}
        >
          {/* Author Info */}
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Image source={assets.images.Avatar} style={styles.avatarImage} />
            </View>
            <Text style={styles.authorName}>John Nick</Text>
          </View>

          {/* Title */}
          <Text style={styles.docTitle}>Medical History</Text>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <AppBadge bgColor="#FFF6E6" dotColor="#E8A23A" text="Health" />
            <Text style={styles.metaLabel}>Last Update:</Text>
            <Calendar />
            <Text style={styles.metaDate}>Dec 12, 2022</Text>
          </View>

          {/* Editor */}
          <View style={styles.editorContainer}>
            <RichEditor
              ref={editor}
              useContainer
              initialContentHTML=""
              placeholder="Start writing here..."
              onChange={setText}
              editorStyle={styles.editorInput}
              scrollEnabled={true} // ✅ Internal scroll enabled
              onCursorPosition={handleCursorPosition}
              showsVerticalScrollIndicator={false}
            />
          </View>
          {/* </KeyboardAvoidingView> */}
        </KeyboardAwareScrollView>

        {/* Bottom Toolbar */}
        {/* <ToolbarWithKeyboardPadding insetsBottom={insets.bottom}> */}
        <View style={styles.toolbarContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() =>
                  editor.current?.sendAction('action', actions.undo)
                }
              >
                <Undo />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() =>
                  editor.current?.sendAction('action', actions.redo)
                }
              >
                <Redo />
              </TouchableOpacity>
            </View>
            <RichToolbar
              editor={editor}
              actions={[
                actions.setBold,
                actions.setItalic,
                actions.setUnderline,
                actions.setStrikethrough,
                actions.insertOrderedList,
                actions.insertBulletsList,
                actions.insertLink,
              ]}
              iconMap={toolbarIconMap}
              style={styles.richToolbarContainer}
              selectedIconTint={theme.colors.primary}
              unselectedIconTint={theme.colors.gray[200]}
              unselectedButtonStyle={styles.unselectedToolbarButton}
              selectedButtonStyle={styles.unselectedToolbarButton}
            />
          </View>

          <View style={styles.bottomButtonsRow}>
            {localMode === 'view' && (
              <AppButton
                text="Edit"
                onPress={() => {
                  setLocalMode('edit');
                }}
                leftIcon={
                  <Octicons
                    name="pencil"
                    color={theme.colors.primary}
                    size={18}
                  />
                }
                variant="secondary-outline"
                style={{ marginRight: 'auto' }}
              />
            )}
            <AppButton
              text="Coach AI"
              leftIcon={<WhiteCoachAi />}
              style={{ backgroundColor: '#37405d' }}
            />
            {localMode !== 'view' ? (
              <AppButton
                text="Save Changes"
                onPress={() => {
                  setLocalMode('view');
                  Alert.alert('Saved', 'Document is saved');
                }}
              />
            ) : (
              <AppButton
                text="Download"
                leftIcon={
                  <Feather
                    name="download"
                    size={18}
                    color={theme.colors.white}
                  />
                }
                onPress={() =>
                  Alert.alert('Downloaded', 'Document is downloaded')
                }
              />
            )}
          </View>
        </View>
        {/* </ToolbarWithKeyboardPadding> */}
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------------- ICONS ---------------- */
// put this above your component or inside it (before return)
const toolbarIconMap = {
  [actions.setBold]: ({ tintColor }: any) => (
    <Feather name="bold" size={fontSize(18)} color={tintColor} />
  ),
  [actions.setItalic]: ({ tintColor }: any) => (
    <Feather name="italic" size={fontSize(18)} color={tintColor} />
  ),
  [actions.setUnderline]: ({ tintColor }: any) => (
    <Feather name="underline" size={fontSize(18)} color={tintColor} />
  ),

  [actions.setStrikethrough]: ({ tintColor }: any) => (
    <Fontisto name="strikethrough" size={fontSize(13)} color={tintColor} />
  ),

  [actions.insertBulletsList]: ({ tintColor }: any) => (
    <Foundation name="list-bullet" size={fontSize(18)} color={tintColor} />
  ),

  [actions.insertOrderedList]: ({ tintColor }: any) => (
    <Foundation name="list-number" size={fontSize(18)} color={tintColor} />
  ),

  [actions.insertLink]: ({ tintColor }: any) => (
    <Ionicons name="link-outline" size={fontSize(18)} color={tintColor} />
  ),
};

// {action:actions.<Ionicons
//   name="happy-outline"
//   size={fontSize(18)}
//   color={theme.colors.gray[900]}
// />},

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    position: 'relative',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    gap: spacing(5),
  },
  iconButton: {
    padding: spacing(4),
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[900],
  },

  // Author info
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(20),
    marginTop: spacing(10),
  },
  avatar: {
    width: fontSize(22),
    height: fontSize(22),
    borderRadius: fontSize(14),
    backgroundColor: theme.colors.gray[300],
    marginRight: spacing(8),
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  authorName: {
    fontSize: fontSize(13),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[800],
  },

  // Title
  docTitle: {
    fontSize: fontSize(20),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[950],
    marginTop: spacing(16),
    paddingHorizontal: spacing(20),
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing(16),
    paddingHorizontal: spacing(20),
    gap: spacing(6),
  },

  metaLabel: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[700],
    marginLeft: spacing(6),
  },
  metaDate: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[900],
  },

  // Editor Input
  editorContainer: {
    marginTop: spacing(10),
    paddingHorizontal: spacing(7),
    minHeight: 300,
    flexGrow: 1,
  },
  editorInput: {
    fontSize: fontSize(15),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[900],
  },
  editor: {
    marginTop: spacing(10),
    paddingHorizontal: spacing(7),
    paddingBottom: spacing(30),
  },

  // Toolbar
  toolbarContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    paddingTop: spacing(10),
    paddingBottom: spacing(12),
    paddingHorizontal: spacing(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 10,
    justifyContent: 'center',
  },
  toolbarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing(12),
    paddingVertical: spacing(8),
    borderRadius: 10,
    width: 'auto',
    marginLeft: 'auto',
    backgroundColor: theme.colors.gray[100],
  },
  toolbarButton: {
    marginRight: spacing(16),
  },
  unselectedToolbarButton: {
    width: 'auto',
    paddingHorizontal: spacing(11),
  },
  richToolbarContainer: {
    backgroundColor: theme.colors.gray[100],
    borderRadius: 10,
    gap: 5,
  },

  // Bottom Buttons
  bottomButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing(10),
    marginTop: spacing(20),
  },
  coachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23294A',
    borderRadius: fontSize(10),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(16),
  },
  coachText: {
    color: theme.colors.white,
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
    marginLeft: spacing(6),
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: fontSize(10),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(18),
  },
  saveText: {
    color: theme.colors.white,
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
  },
});
