import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { chatWithAi } from '../api/functions/ai.api';
import {
  assets,
  CoachAi,
  Fireballa,
  SheetBlueCoachAi,
  SheetCoachAi,
  Thunderbolt,
} from '../assets';
import { theme } from '../theme';
import { AppStackParamList } from '../types/navigation';
import { fontSize, spacing } from '../utils';
import { AiRenderer } from './AiRenderer';
import TouchableButton from './TouchableButton';
import AppButton from './ui/AppButton';
import CheckBox from './ui/CheckBox';
import { importBulkTasks } from '../api/functions/task.api';

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
      data: any;
      type: 'json';
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

const SystemMessage = ({
  chat,
  setIsModalOpen,
  // taskInfo,
  // setTaskInfo,
}: {
  chat: Chat;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  taskInfo: TaskInfo | null;
  setTaskInfo: React.Dispatch<React.SetStateAction<TaskInfo>>;
}) => {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const [selectedTasksId, setSelectedTasksId] = useState<string[]>([]);
  const [taskInfo, setTaskInfo] = useState<TaskInfo>({
    isTaskRendered: false,
    isTaskAdded: false,
    selectedTasks: [],
  });

  useEffect(() => {
    if (chat.type === 'tasks') {
      setTaskInfo({
        isTaskRendered: true,
        isTaskAdded: false,
        selectedTasks: [],
      });
    }
  }, [chat.type]);

  const { mutate: addTasks, isPending: isAddingTasks } = useMutation({
    mutationFn: importBulkTasks,
    onSuccess: () => {
      setTaskInfo({
        isTaskRendered: false,
        isTaskAdded: true,
        selectedTasks: [],
      });
    },
    meta: {
      invalidateQueries: ['tasks'],
      showToast: false,
    },
  });

  const toggleTaskCheckbox = (task: ChatTask) => {
    setSelectedTasksId(prev =>
      prev.includes(task.tempId)
        ? prev.filter(_p => _p !== task.tempId)
        : [...prev, task.tempId],
    );
    setTaskInfo(prev => ({
      ...prev,
      selectedTasks: prev.selectedTasks.find(_st => _st.tempId === task.tempId)
        ? prev.selectedTasks.filter(_st => _st.tempId !== task.tempId)
        : [...prev.selectedTasks, task],
    }));
  };

  return chat.type === 'json' ? (
    <AiRenderer
      node={chat.data}
      onEvent={(event: any) => {
        console.log('AI event:', event);

        if (event.action === 'open-task') {
          navigation.navigate('TaskDetails', {
            taskId: event.id,
          });
        }

        if (event.action === 'create_task') {
          navigation.navigate('AddEditTask', {});
        }

        if (event.action === 'create_document') {
          navigation.navigate('DocumentEditor', {
            mode: 'add',
            title: event.document.title,
            tag: event.document.tag.id,
            content: event.document.content,
          });
        }

        if (event.action === 'open-document') {
          navigation.navigate('DocumentEditor', {
            documentId: event.id,
            mode: 'view',
          });
        }

        if (event.action === 'open-url') {
          Linking.openURL(event.url);
        }

        if (event.action === 'navigate') {
          if (event.label.toLowerCase().includes('task')) {
            navigation.navigate('Tasks');
          } else if (event.label.toLowerCase().includes('document')) {
            navigation.navigate('Documents');
          }
        }

        setIsModalOpen(false);
      }}
    />
  ) : chat.type === 'tasks' ? (
    <View style={styles.taskContainer}>
      <Text style={styles.taskHeading}>
        {taskInfo?.isTaskAdded
          ? 'Task added to your task board'
          : 'Here are the task generated based on your profile & data'}
      </Text>
      {!taskInfo?.isTaskAdded ? (
        <Text style={styles.taskSubHeading}>
          Click on tasks to select and import into your tasklist
        </Text>
      ) : null}
      <FlatList
        data={chat.data.tasks}
        renderItem={({ item }) =>
          !taskInfo?.isTaskAdded ? (
            <TouchableButton
              style={styles.taskItem}
              onPress={() => toggleTaskCheckbox(item)}
              disabled={isAddingTasks}
            >
              <CheckBox
                checked={selectedTasksId.includes(item.tempId)}
                disabled={isAddingTasks}
              />
              <Text style={styles.taskText}>{item.title}</Text>
            </TouchableButton>
          ) : null
        }
        keyExtractor={_item => _item.tempId}
        scrollEnabled={false}
        ListFooterComponent={
          <View
            style={[
              styles.taskFooter,
              taskInfo?.isTaskAdded && { justifyContent: 'center' },
            ]}
          >
            {!taskInfo?.isTaskAdded && taskInfo?.isTaskRendered ? (
              <>
                <AppButton
                  text="Import tasks"
                  variant="secondary-outline"
                  style={{
                    paddingVertical: spacing(8),
                    borderColor: theme.colors.primary,
                  }}
                  textStyle={{
                    fontSize: fontSize(14),
                    color: theme.colors.primary,
                  }}
                  onPress={() =>
                    addTasks({
                      tasks: taskInfo.selectedTasks?.map(_task => ({
                        title: _task.title,
                        description: _task.description,
                        priority: _task.priority,
                        category: _task.category.id,
                        frequency: _task.recurrence ?? 'none',
                      })),
                      // userId: userId as string,
                    })
                  }
                  isLoading={isAddingTasks}
                  disabled={taskInfo.selectedTasks.length === 0}
                />
                <AppButton
                  text="Select all"
                  variant="secondary-outline"
                  style={{
                    paddingVertical: spacing(8),
                    borderColor: theme.colors.primary,
                  }}
                  textStyle={{
                    fontSize: fontSize(14),
                    color: theme.colors.primary,
                  }}
                  onPress={() => {
                    setSelectedTasksId(
                      chat.data.tasks.map(_task => _task.tempId),
                    );

                    setTaskInfo(prev => ({
                      ...prev,
                      selectedTasks: chat.data.tasks,
                    }));
                  }}
                  disabled={isAddingTasks}
                />
              </>
            ) : (
              <AppButton
                text="View tasks"
                variant="secondary-outline"
                style={{ flex: 1 }}
                // style={{
                //   paddingVertical: spacing(8),
                //   borderColor: theme.colors.primary,
                // }}
                // textStyle={{
                //   fontSize: fontSize(14),
                //   color: theme.colors.primary,
                // }}
                onPress={() => {
                  navigation.navigate('Tasks');
                  setIsModalOpen(false);
                }}
                isLoading={isAddingTasks}
              />
            )}
          </View>
        }
      />
    </View>
  ) : null;
};

function CoachAiSheet({
  id,
  page,
  children,
}: {
  id?: string;
  page: 'general' | 'document' | 'chat';
  children: React.ReactNode;
}) {
  const [session] = useState(moment.now().toString());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

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
    setIsModalOpen(true);
  };

  React.useEffect(() => {
    dot1.value = withRepeat(withTiming(1, { duration: 600 }), -1, true);
    dot2.value = withDelay(
      200,
      withRepeat(withTiming(1, { duration: 600 }), -1, true),
    );
    dot3.value = withDelay(
      400,
      withRepeat(withTiming(1, { duration: 600 }), -1, true),
    );
  }, [dot1, dot2, dot3]);

  const style1 = useAnimatedStyle(() => ({
    opacity: dot1.value,
  }));

  const style2 = useAnimatedStyle(() => ({
    opacity: dot2.value,
  }));

  const style3 = useAnimatedStyle(() => ({
    opacity: dot3.value,
  }));

  const { mutate, isPending } = useMutation({
    mutationFn: chatWithAi,
    onMutate: variable => {
      setValue('');
      setChats(prev => [
        {
          role: 'user',
          type: 'json',
          data: {
            type: 'view',
            style: {
              paddingVertical: spacing(10),
              paddingHorizontal: spacing(15),
              backgroundColor: theme.colors.primary,
              borderRadius: 10,
              alignSelf: 'flex-end',
              marginVertical: spacing(15),
            },
            children: [
              {
                type: 'text',
                style: { color: theme.colors.white, fontSize: fontSize(14) },
                text:
                  variable.query ??
                  getFullMessages(variable.action ?? '') ??
                  '',
              },
            ],
          },
        },
        ...prev,
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
      // if (data.type === 'tasks') {
      //   setTaskInfo({
      //     isTaskRendered: true,
      //     isTaskAdded: false,
      //     selectedTasks: [],
      //   });
      // }
      setChats(prev => [{ role: 'system', ...data }, ...prev]);
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

  return (
    <View>
      <TouchableButton activeOpacity={0.8} onPress={present}>
        {children}
      </TouchableButton>
      <Modal
        style={{ backgroundColor: theme.colors.white }}
        visible={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? spacing(60) : 0}
            style={{
              flex: 1,
            }}
          >
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
            >
              {/* Top Header Section */}
              <ImageBackground
                source={assets.images.CoachAiBackground} // <-- replace this with your blue image
                resizeMode="cover"
                style={styles.header}
                imageStyle={{
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                }}
              >
                <View style={styles.headerContent}>
                  <SheetCoachAi />
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setIsModalOpen(false)}
                  >
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
                  return (
                    <SystemMessage
                      chat={item}
                      setIsModalOpen={setIsModalOpen}
                      taskInfo={taskInfo}
                      setTaskInfo={setTaskInfo}
                    />
                  );
                }}
                contentContainerStyle={{
                  flexGrow: 1,
                  backgroundColor: theme.colors.white,
                  padding: spacing(20),
                  minHeight: spacing(400),
                }}
                keyExtractor={(_, index) => index.toString()}
                scrollEnabled={false}
                inverted
                ListHeaderComponent={
                  isPending ? (
                    <View style={styles.container}>
                      <Text style={styles.text}>Thinking</Text>
                      <Animated.Text style={[styles.dot, style1]}>
                        .
                      </Animated.Text>
                      <Animated.Text style={[styles.dot, style2]}>
                        .
                      </Animated.Text>
                      <Animated.Text style={[styles.dot, style3]}>
                        .
                      </Animated.Text>
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  <View style={styles.body}>
                    <View style={styles.welcomeRow}>
                      <SheetBlueCoachAi />
                      <Text style={styles.welcomeText}>
                        Welcome back! Feel free to ask me anything. How can I
                        help?
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
                        <Text style={styles.suggestedText}>
                          Generate a Task
                        </Text>
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
            </ScrollView>

            {/* Footer Input */}
            <View style={[styles.footer]}>
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
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

export default CoachAiSheet;
const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
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
    paddingTop: spacing(10),
    backgroundColor: theme.colors.white,
    flex: 1,
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing(10),
  },
  text: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: 16,
    color: theme.colors.gray[700],
  },
  dot: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: 16,
    color: theme.colors.gray[700],
    marginLeft: 2,
  },
  taskContainer: {
    paddingHorizontal: spacing(10),
  },
  taskHeading: {
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(18),
    lineHeight: fontSize(24),
    color: theme.colors.gray[800],
    marginBottom: spacing(8),
  },
  taskSubHeading: {
    fontFamily: theme.fonts.archivo.regular,
    fontSize: fontSize(14),
    // lineHeight: fontSize(24),
    color: theme.colors.gray[600],
    marginBottom: spacing(16),
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(8),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  taskText: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[800],
  },
  taskFooter: {
    marginTop: spacing(16),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing(10),
  },
});
