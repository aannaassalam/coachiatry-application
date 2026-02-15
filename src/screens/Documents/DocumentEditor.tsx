import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Foundation from 'react-native-vector-icons/Foundation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';

import { yupResolver } from '@hookform/resolvers/yup';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import moment from 'moment';
import { Controller, useForm } from 'react-hook-form';
import { SheetManager } from 'react-native-actions-sheet';
import { showMessage } from 'react-native-flash-message';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  actions,
  RichEditor,
  RichToolbar,
} from 'react-native-pell-rich-editor';
import * as yup from 'yup';
import {
  getAllCategories,
  getAllCategoriesByCoach,
} from '../../api/functions/category.api';
import {
  createDocument,
  createDocumentByCoach,
  deleteDocument,
  editDocument,
  getDocument,
} from '../../api/functions/document.api';
import { Calendar, ChevronLeft, Redo, Undo, WhiteCoachAi } from '../../assets';
import TouchableButton from '../../components/TouchableButton';
import AppBadge from '../../components/ui/AppBadge';
import AppButton from '../../components/ui/AppButton';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import { hapticOptions, onError } from '../../helpers/utils';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';
import { fontSize, scale, spacing } from '../../utils';
import { queryClient } from '../../../App';
import CoachAiSheet from '../../components/CoachAi';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu';
import Share from 'react-native-share';
import { Pencil, Strikethrough } from 'lucide-react-native';
import { generatePDF } from 'react-native-html-to-pdf';

import RNFS from 'react-native-fs';

const schema = yup.object().shape({
  title: yup.string().required(),
  tag: yup.string().required(),
});

const DocumentCategorySheetBody = ({
  category,
  fieldChange,
  forClient,
  userId,
}: {
  category: string;
  fieldChange: (id: string) => void;
  forClient?: boolean;
  userId?: string;
}) => {
  const [{ data = [] }, { data: userCategories }] = useQueries({
    queries: [
      {
        queryKey: ['categories'],
        queryFn: getAllCategories,
        enabled: !forClient,
      },
      {
        queryKey: ['categories', userId],
        queryFn: () => getAllCategoriesByCoach(userId as string),
        enabled: forClient,
      },
    ],
  });

  return (
    <View>
      <Text style={styles.heading}>Select Tag</Text>
      <FlatList
        data={forClient ? userCategories : data}
        // contentContainerStyle={styles.statuses}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyExtractor={item => item._id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Pressable
            style={styles.category}
            onPress={() => {
              fieldChange(item._id);
              SheetManager.hide('general-sheet');
            }}
          >
            <AppBadge
              bgColor={item?.color.bg}
              dotColor={item?.color.text}
              text={item?.title}
            />
            {category === item._id && (
              <Feather name="check" size={fontSize(16)} />
            )}
          </Pressable>
        )}
      />
    </View>
  );
};

export default function DocumentEditor() {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {
    mode,
    documentId,
    userId,
    title = '',
    tag = '',
    content = '',
  } = route.params || {};
  const editor = useRef<RichEditor | null>(null);
  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const headerHeight = useHeaderHeight();
  const [editorValue, setEditorValue] = useState(content);
  const [localMode, setLocalMode] = useState(mode);
  const [downloading, setDownloading] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: createDocument,
    onSuccess: navigation.goBack,
    meta: {
      invalidateQueries: ['documents'],
    },
  });

  const { mutate: coachMutate, isPending: isCoachPending } = useMutation({
    mutationFn: createDocumentByCoach,
    onSuccess: navigation.goBack,
    meta: {
      invalidateQueries: ['documents'],
    },
  });

  const { mutate: edit, isPending: isEditing } = useMutation({
    mutationFn: editDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setLocalMode('view');
    },
    meta: {
      invalidateQueries: ['documents', documentId],
    },
  });

  const { mutate: deleteDoc } = useMutation({
    mutationFn: deleteDocument,
    onMutate: () => {
      showMessage({
        type: 'info',
        message: 'Deleting...',
        description: 'Deleting document, Please wait...',
      });
    },
    onSuccess: navigation.goBack,
    meta: {
      invalidateQueries: ['documents'],
    },
  });

  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title,
      tag,
    },
    disabled: isPending || isEditing,
  });

  const [
    { data, isLoading },
    { data: categories, isLoading: isCategoriesLoading },
    { data: userCategories, isLoading: isUserCategoriesLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: ['documents', documentId],
        queryFn: () => getDocument(documentId),
        enabled: !!documentId,
      },
      {
        queryKey: ['categories'],
        queryFn: getAllCategories,
      },
      {
        queryKey: ['categories', userId],
        queryFn: () => getAllCategoriesByCoach(userId as string),
        enabled: !!userId,
      },
    ],
  });

  useEffect(() => {
    if (data) {
      form.reset({
        title: data.title,
        tag: data.tag?._id,
      });
      setEditorValue(data.content ?? '');
    }
  }, [data, form]);

  const handleCursorPosition = (offsetY: number) => {
    if (!scrollRef.current) return;
    scrollRef.current?.scrollToPosition(0, offsetY - 200, true);
  };

  useEffect(() => {
    setLocalMode(localMode);
  }, [localMode, mode]);

  const onSubmit = (_data: yup.InferType<typeof schema>) => {
    if (!editorValue)
      return showMessage({
        message: 'Failed',
        description: 'Please enter document content!',
        type: 'danger',
      });
    if (localMode === 'edit') {
      edit({ ..._data, content: editorValue, documentId });
    } else if (profile?.role === 'coach' && userId) {
      coachMutate({ ..._data, content: editorValue, user: userId });
    } else {
      mutate({ ..._data, content: editorValue });
    }
  };

  const shareDocument = () => {
    Share.open({
      saveToFiles: false,
      failOnCancel: false,
      title: 'Share Document',
      message:
        "Hi,I am sharing my document titled '" +
        data?.title +
        "' with you on Coachiatry. Click the link to access he document.\n",
      url: `https://coachiatry.vercel.app/share/${data?.shareId}`,
    }).catch(err => console.log(err));
  };

  const downloadAsPDF = async () => {
    try {
      setDownloading(true);
      const htmlContent = `
<html>
  <head>
    <meta charset="utf-8"/>

    <style>

      body {
        margin: 0;
        padding: 0;
        font-family: Helvetica, Arial, sans-serif;
        font-size: 14px;
        color: #111;
      }

      /* PAGE WRAPPER (this simulates padding on every page) */
      .page {
        padding: 10mm;
        box-sizing: border-box;
      }

      h1 {
        margin-bottom: 12px;
      }

      p {
        line-height: 1.6;
      }

      /* Force proper page breaks */
      .page-break {
        page-break-after: always;
      }

    </style>
  </head>

  <body>
    <div class="page">
      <h1>${data?.title}</h1>
      ${editorValue}
    </div>
  </body>
</html>
`;

      const fileName = `${data?.title || 'document'}-${Date.now()}.pdf`;

      // 1️⃣ Generate PDF (app internal folder)
      const pdf = await generatePDF({
        html: htmlContent,
        fileName: fileName.replace('.pdf', ''),
        directory: 'Documents',
      });

      if (!pdf.filePath) throw new Error('PDF not created');

      const sourcePath = pdf.filePath;

      // 2️⃣ Move to public Downloads (ANDROID)
      const destPath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : sourcePath;

      if (Platform.OS === 'android') {
        await RNFS.copyFile(sourcePath, destPath);
      }

      // 3️⃣ iOS share like before
      if (Platform.OS === 'ios') {
        await Share.open({
          url: 'file://' + destPath,
          failOnCancel: false,
        });
      }

      Alert.alert('Download Complete', `Saved to Downloads:\n${fileName}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'PDF download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {downloading && (
          <View
            style={{
              ...StyleSheet.absoluteFill,
              backgroundColor: 'rgba(0,0,0,0.6)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <ActivityIndicator size="large" />
          </View>
        )}
        {/* Header */}
        <View style={styles.header}>
          <TouchableButton
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft />
          </TouchableButton>
          {localMode !== 'view' && (
            <Text style={styles.headerTitle}>
              {localMode === 'edit' ? 'Edit' : 'Add'}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {localMode === 'view' && (
              <TouchableButton
                style={{ ...styles.iconButton, marginLeft: 'auto' }}
                onPress={shareDocument}
              >
                <Ionicons
                  name="arrow-redo"
                  size={fontSize(16)}
                  color={theme.colors.gray[800]}
                />
              </TouchableButton>
            )}
            {data?.user._id === profile?._id ||
            ['coach', 'manager', 'admin'].includes(profile?.role ?? '') ? (
              <Menu
                renderer={renderers.Popover}
                onOpen={() =>
                  ReactNativeHapticFeedback.trigger(
                    'impactMedium',
                    hapticOptions,
                  )
                }
                rendererProps={{
                  placement: 'bottom',
                  // anchorStyle: {
                  //   marginLeft: width * 0.85,
                  //   marginTop: -30,
                  // },
                }}
              >
                <MenuTrigger
                  customStyles={{
                    TriggerTouchableComponent: TouchableButton,
                    triggerTouchable: {
                      activeOpacity: 0.5,
                    },
                  }}
                  style={styles.iconButton}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={fontSize(22)}
                    color={theme.colors.gray[600]}
                  />
                </MenuTrigger>
                <MenuOptions
                  customStyles={{
                    optionsContainer: {
                      width: scale(100),
                      borderRadius: 10,
                      paddingVertical: scale(5),
                    },
                  }}
                >
                  <MenuOption
                    style={styles.option}
                    onSelect={() => setLocalMode('edit')}
                  >
                    <Pencil
                      color={theme.colors.gray[900]}
                      size={fontSize(16)}
                    />
                    <Text style={styles.optionText}>Edit</Text>
                  </MenuOption>
                  <MenuOption
                    value={1}
                    style={styles.option}
                    onSelect={() =>
                      Alert.alert(
                        'Delete Document',
                        'Are you sure you want to delete this document?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => deleteDoc(data?._id as string),
                          },
                        ],
                      )
                    }
                  >
                    <Octicons
                      name="trash"
                      color="#ef4444"
                      size={fontSize(16)}
                    />
                    <Text style={[styles.optionText, { color: '#ef4444' }]}>
                      Delete
                    </Text>
                  </MenuOption>
                </MenuOptions>
              </Menu>
            ) : null}
          </View>
        </View>

        {isLoading || isCategoriesLoading || isUserCategoriesLoading ? (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <>
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
                <SmartAvatar
                  src={data?.user.photo || profile?.photo}
                  name={data?.user.fullName || profile?.fullName}
                  size={scale(22)}
                  fontSize={fontSize(14)}
                  style={styles.avatar}
                />
                <Text style={styles.authorName}>
                  {data?.user.fullName || profile?.fullName}
                </Text>
              </View>

              {/* Title */}
              {localMode !== 'view' ? (
                <Controller
                  name="title"
                  control={form.control}
                  render={({ field }) => (
                    <TextInput
                      style={styles.transparentInput}
                      placeholder="Enter Title..."
                      placeholderTextColor={theme.colors.gray[500]}
                      {...field}
                      onChangeText={field.onChange}
                    />
                  )}
                />
              ) : (
                <Text style={styles.docTitle}>{data?.title}</Text>
              )}

              {/* Meta Info */}
              <View style={styles.metaRow}>
                {localMode === 'view' ? (
                  <AppBadge
                    bgColor={data?.tag?.color.bg}
                    dotColor={data?.tag?.color.text}
                    text={data?.tag?.title}
                  />
                ) : (
                  <Controller
                    name="tag"
                    control={form.control}
                    render={({ field }) => {
                      // console.log(
                      //   profile?.role === 'coach' && !!userId
                      //     ? userCategories
                      //     : categories?.find(_cat => _cat._id === field.value),
                      // );
                      const selectedTag =
                        profile?.role === 'coach' && !!userId
                          ? userCategories?.find(
                              _cat => _cat._id === field.value,
                            )
                          : categories?.find(_cat => _cat._id === field.value);
                      // console.log(selectedTag);
                      return (
                        <TouchableButton
                          style={styles.tagDropdown}
                          onPress={() =>
                            SheetManager.show('general-sheet', {
                              payload: {
                                paddingBottom: spacing(10),
                                children: (
                                  <DocumentCategorySheetBody
                                    category={field.value}
                                    fieldChange={field.onChange}
                                    forClient={
                                      profile?.role === 'coach' && !!userId
                                    }
                                    userId={userId}
                                  />
                                ),
                              },
                            })
                          }
                          disabled={isPending || isEditing}
                        >
                          {selectedTag ? (
                            <AppBadge
                              bgColor={selectedTag?.color.bg}
                              dotColor={selectedTag?.color.text}
                              text={selectedTag?.title}
                            />
                          ) : (
                            <Text
                              style={{
                                paddingHorizontal: spacing(5),
                                color: theme.colors.gray[500],
                              }}
                            >
                              Select tag
                            </Text>
                          )}
                          <Feather
                            name="chevron-down"
                            size={fontSize(16)}
                            color={theme.colors.gray[500]}
                          />
                        </TouchableButton>
                      );
                    }}
                  />
                )}
                {localMode === 'view' && (
                  <>
                    <Text style={styles.metaLabel}>Last Update:</Text>
                    <Calendar />
                    <Text style={styles.metaDate}>
                      {moment(data?.updatedAt).format('MMM DD, YYYY')}
                    </Text>
                  </>
                )}
              </View>

              {/* Editor */}
              <View style={styles.editorContainer}>
                <RichEditor
                  ref={editor}
                  useContainer
                  initialContentHTML={editorValue}
                  placeholder="Start writing here..."
                  onChange={setEditorValue}
                  editorStyle={styles.editorInput}
                  scrollEnabled={true} // ✅ Internal scroll enabled
                  onCursorPosition={handleCursorPosition}
                  showsVerticalScrollIndicator={false}
                  disabled={localMode === 'view' || isPending || isEditing}
                />
              </View>
              {/* </KeyboardAvoidingView> */}
            </KeyboardAwareScrollView>

            {/* Bottom Toolbar */}
            {/* <ToolbarWithKeyboardPadding insetsBottom={insets.bottom}> */}
            <View style={styles.toolbarContainer}>
              {localMode !== 'view' && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: spacing(5),
                  }}
                >
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableButton
                      style={styles.toolbarButton}
                      onPress={() =>
                        editor.current?.sendAction('action', actions.undo)
                      }
                    >
                      <Undo />
                    </TouchableButton>
                    <TouchableButton
                      style={styles.toolbarButton}
                      onPress={() =>
                        editor.current?.sendAction('action', actions.redo)
                      }
                    >
                      <Redo />
                    </TouchableButton>
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
              )}

              <View style={styles.bottomButtonsRow}>
                {localMode === 'view' && (
                  <AppButton
                    text="Edit"
                    onPress={() => {
                      setLocalMode('edit');
                    }}
                    leftIcon={<Pencil color={theme.colors.primary} size={14} />}
                    variant="secondary-outline"
                    style={{ marginRight: 'auto' }}
                  />
                )}
                {localMode === 'edit' && (
                  <AppButton
                    text="Cancel"
                    onPress={() => {
                      setLocalMode('view');
                    }}
                    variant="secondary-outline"
                    style={{ marginRight: 'auto' }}
                    disabled={isEditing}
                  />
                )}
                {localMode !== 'add' && (
                  <CoachAiSheet page="document" id={documentId}>
                    <View pointerEvents="none">
                      <AppButton
                        text="Coach AI"
                        leftIcon={<WhiteCoachAi />}
                        style={{ backgroundColor: '#37405d' }}
                        // disabled
                      />
                    </View>
                  </CoachAiSheet>
                )}
                {localMode !== 'view' ? (
                  <AppButton
                    text="Save Changes"
                    leftIcon={
                      <Feather
                        name="save"
                        color={theme.colors.white}
                        size={16}
                      />
                    }
                    onPress={form.handleSubmit(onSubmit, onError)}
                    isLoading={isEditing || isPending || isCoachPending}
                  />
                ) : (
                  <AppButton
                    text="Download"
                    leftIcon={
                      <Feather
                        name="download"
                        size={16}
                        color={theme.colors.white}
                      />
                    }
                    onPress={downloadAsPDF}
                  />
                )}
              </View>
            </View>
          </>
        )}
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
    <Strikethrough size={fontSize(18)} color={tintColor} />
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
    paddingHorizontal: spacing(10),
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
    marginRight: spacing(8),
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

  transparentInput: {
    fontSize: fontSize(20),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[950],
    marginTop: spacing(16),
    paddingVertical: spacing(5),
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

  tagDropdown: {
    padding: spacing(5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    borderWidth: 1,
    borderColor: theme.colors.gray[400],
    borderRadius: spacing(20),
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
    paddingTop: spacing(5),
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
    marginTop: spacing(10),
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
  heading: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(18),
    color: theme.colors.black,
    marginBottom: spacing(20),
  },
  category: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
  },
  optionText: {
    fontSize: fontSize(16),
  },
});
