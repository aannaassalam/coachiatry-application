import React, { useRef, useState } from 'react';
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
  FlatList,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { fontSize, spacing } from '../utils';
import { assets } from '../assets'; // your logo asset etc.
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import moment from 'moment';
import { useMutation } from '@tanstack/react-query';
import { chatWithAi } from '../api/functions/ai.api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types/navigation';
import { AiRenderer } from './AiRenderer';

type DocumentInfo = {
  isDocumentRendered: boolean;
  isDocumentAdded: boolean;
  document_id: string;
};

type TaskInfo = {
  isTaskRendered: boolean;
  isTaskAdded: boolean;
  selectedTasks: ChatTask[];
};

type ChatTask = {
  tempId: string;
  title: string;
  description: string;
  category: { title: string; id: string };
  priority: string;
  dueDate: string;
  recurrence: string;
};

type Chat =
  | {
      role: 'user';
      data: string;
      type: 'text';
    }
  | {
      role: 'system';
      data: any;
      type: 'json';
    }
  | {
      role: 'system';
      data: {
        title: string;
        content: string;
        tag: {
          title: string;
          id: string;
        };
      };
      type: 'document';
    }
  | {
      role: 'system';
      data: {
        tasks: ChatTask[];
      };
      type: 'tasks';
    };

type ChatScreenNavigationProp = NativeStackNavigationProp<AppStackParamList>;

const getFullMessages = (msg: string) => {
  switch (msg) {
    case 'create_tasks':
      return 'Generate a task';
    case 'create_document':
      return 'Create a doc';
    case 'summarize':
      return 'Summarize';
  }
};

function CoachAiSheet({
  id,
  page,
}: {
  id?: string;
  page: 'general' | 'document' | 'chat';
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const sheetRef = useRef<ActionSheetRef>(null);

  const [session] = useState(moment.now().toString());

  const [value, setValue] = useState('');

  const [chats, setChats] = useState<Chat[]>([]);
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo>({
    isDocumentRendered: false,
    isDocumentAdded: false,
    document_id: '',
  });
  const [taskInfo, setTaskInfo] = useState<TaskInfo>({
    isTaskRendered: false,
    isTaskAdded: false,
    selectedTasks: [],
  });

  const present = async () => {
    sheetRef.current?.show();
  };

  const { mutate, isPending } = useMutation({
    mutationFn: chatWithAi,
    onMutate: variable => {
      setValue('');
      setChats(prev => [
        ...prev,
        {
          role: 'user',
          type: 'text',
          data: variable.query ?? getFullMessages(variable.action ?? '') ?? '',
        },
      ]);
    },
    onSuccess: data => {
      if (data.type === 'document') {
        setDocumentInfo({
          isDocumentRendered: true,
          isDocumentAdded: false,
          document_id: '',
        });
      }
      if (data.type === 'tasks') {
        setTaskInfo({
          isTaskRendered: true,
          isTaskAdded: false,
          selectedTasks: [],
        });
      }
      setChats(prev => [...prev, { role: 'system', ...data }]);
    },
    meta: {
      showToast: false,
    },
  });

  const handleSend = () => {
    if (value.trim()) {
      mutate({
        query: value,
        id,
        session_id: session,
        page,
        // user: userId as string,
      });
    }
  };

  console.log(chats);

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
        <KeyboardAwareScrollView
          contentContainerStyle={styles.contentContainer}
          nestedScrollEnabled
          bounces={false}
        >
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
          <FlatList
            data={chats}
            renderItem={({ item }) => {
              return item.type === 'json' ? (
                <AiRenderer
                  node={item.data}
                  onEvent={(event: any) => {
                    console.log('AI event:', event);

                    if (event.action === 'open-task') {
                      navigation.navigate('TaskDetails', {
                        taskId: event.taskId,
                      });
                    }

                    if (event.action === 'open-document') {
                      navigation.navigate('DocumentEditor', {
                        documentId: event.documentId,
                      });
                    }

                    if (event.action === 'open-url') {
                      Linking.openURL(event.url);
                    }
                  }}
                />
              ) : null;
            }}
            scrollEnabled={false}
            inverted
            ListEmptyComponent={
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
                  <TouchableButton
                    style={styles.suggestedCard}
                    onPress={() =>
                      mutate({
                        action: 'create_tasks',
                        id,
                        session_id: session,
                        page,
                        // user: userId as string,
                      })
                    }
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={fontSize(16)}
                      color={theme.colors.gray[700]}
                    />
                    <Text style={styles.suggestedText}>Generate a Task</Text>
                  </TouchableButton>
                  <TouchableButton
                    style={styles.suggestedCard}
                    onPress={() =>
                      mutate({
                        action: 'create_document',
                        id,
                        session_id: session,
                        page,
                        // user: userId as string,
                      })
                    }
                  >
                    <Thunderbolt />
                    <Text style={styles.suggestedText}>Create a doc</Text>
                  </TouchableButton>
                  <TouchableButton
                    style={styles.suggestedCard}
                    onPress={() =>
                      mutate({
                        action: 'summarize',
                        id,
                        session_id: session,
                        page,
                        // user: userId as string,
                      })
                    }
                  >
                    <Fireballa />
                    <Text style={styles.suggestedText}>Summarize</Text>
                  </TouchableButton>
                </View>
              </View>
            }
          />
        </KeyboardAwareScrollView>

        {/* Footer Input */}
        <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Ask anything..."
              placeholderTextColor={theme.colors.gray[400]}
              style={styles.textInput}
              value={value}
              onChangeText={setValue}
              readOnly={isPending}
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

          <TouchableButton
            style={styles.sendBtn}
            onPress={handleSend}
            disabled={isPending}
          >
            <Ionicons
              name="arrow-up"
              size={fontSize(18)}
              color={theme.colors.white}
            />
          </TouchableButton>
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
    // paddingBottom: spacing(50),
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
