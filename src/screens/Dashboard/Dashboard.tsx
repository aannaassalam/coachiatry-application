import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueries } from '@tanstack/react-query';
import moment from 'moment';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getAllConversations } from '../../api/functions/chat.api';
import { getAllDocuments } from '../../api/functions/document.api';
import { getAllStatuses } from '../../api/functions/status.api';
import { getAllTasks } from '../../api/functions/task.api';
import { ChevronLeft } from '../../assets';
import TaskBadge from '../../components/Tasks/TaskBadge';
import TouchableButton from '../../components/TouchableButton';
import AppBadge from '../../components/ui/AppBadge';
import AppHeader from '../../components/ui/AppHeader';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import { Document } from '../../typescript/interface/document.interface';
import { Status } from '../../typescript/interface/status.interface';
import { Task } from '../../typescript/interface/task.interface';
import { fontSize, scale, spacing } from '../../utils';

moment.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s',
    s: '%ds',
    ss: '%ds',
    m: '1m',
    mm: '%dm',
    h: '1h',
    hh: '%dh',
    w: '1w',
    ww: '%dw',
    d: '1d',
    dd: '%dd',
    M: '1m',
    MM: '%dm',
    y: '1y',
    yy: '%dy',
  },
});

type ScreenNavigationProp = NativeStackNavigationProp<AppStackParamList>;

interface TaskCardProps {
  title: string;
  count: number;
  color: string;
  labelColor?: string;
  tasks?: Task[];
}

const TaskCard: React.FC<TaskCardProps> = ({
  title,
  count,
  color,
  labelColor,
  tasks = [],
}) => {
  const navigation = useNavigation<ScreenNavigationProp>();

  return (
    <View>
      {/* Label */}
      <TaskBadge
        title={title}
        count={count}
        labelColor={labelColor || theme.colors.gray[900]}
        backgroundColor={color}
        marginBottom={spacing(6)}
      />

      {/* Tasks List */}
      {tasks?.length > 0 && (
        <View style={styles.taskList}>
          {tasks.map(task => (
            <Pressable
              onPress={() =>
                navigation.navigate('TaskDetails', { taskId: task._id })
              }
              key={task._id}
              style={styles.taskCard}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDate}>
                  {moment(task.dueDate).format('D MMM, YYYY')}
                </Text>
              </View>
              {(task.subtasks ?? [])?.length > 0 && (
                <View style={styles.progressContainer}>
                  <Ionicons
                    name="git-branch-outline"
                    size={fontSize(16)}
                    color={theme.colors.gray[700]}
                  />
                  <Text style={styles.progressText}>
                    {task.subtasks?.filter(_st => _st.completed).length}/
                    {task.subtasks?.length}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

const TasksSection = ({
  status,
  tasks,
}: {
  status: Status[];
  tasks: Task[];
}) => {
  const navigation = useNavigation<ScreenNavigationProp>();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Task Status</Text>
        {/* <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity> */}
      </View>

      {/* Task Sections */}
      <View style={{ gap: spacing(14), paddingHorizontal: spacing(16) }}>
        {status
          .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
          .map(_status => {
            const tasksForStatus = tasks.filter(
              _task => _task.status._id === _status._id,
            );
            return (
              <TaskCard
                key={_status._id}
                title={_status.title}
                count={tasksForStatus.length}
                color={_status.color.bg}
                labelColor={_status.color.text}
                tasks={tasksForStatus}
              />
            );
          })}
      </View>
      <TouchableButton
        activeOpacity={0.8}
        style={styles.footerRow}
        onPress={() => navigation.navigate('Tasks')}
      >
        <Text style={styles.headerTitle}>View More</Text>
        <TouchableButton style={{ transform: [{ rotateZ: '180deg' }] }}>
          <ChevronLeft />
        </TouchableButton>
      </TouchableButton>
    </View>
  );
};

const DocumentsSection = ({ documents }: { documents: Document[] }) => {
  const navigation = useNavigation<ScreenNavigationProp>();

  const renderItem = ({ item }: { item: Document }) => (
    <TouchableButton
      style={styles.docCard}
      onPress={() =>
        navigation.navigate('DocumentEditor', {
          mode: 'view',
          documentId: item._id,
        })
      }
    >
      <View style={styles.docLeft}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="document"
            size={fontSize(18)}
            color={theme.colors.gray[600]}
          />
        </View>
        <View style={{ maxWidth: '73%' }}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.docTitle}>
            {item.title}
          </Text>
          <Text style={styles.docDate}>
            Updated : {moment(item.updatedAt).format('D MMM, YYYY')}
          </Text>
        </View>
      </View>
      <View
        style={{
          position: 'absolute',
          top: '20%',
          right: spacing(10),
        }}
      >
        <AppBadge
          bgColor={item.tag?.color.bg}
          dotColor={item.tag?.color.text}
          text={item.tag?.title}
        />
      </View>
    </TouchableButton>
  );

  return (
    <View style={styles.card}>
      <TouchableButton
        activeOpacity={0.8}
        style={styles.headerRow}
        onPress={() => navigation.navigate('Documents')}
      >
        <Text style={styles.headerTitle}>Documents</Text>
        <TouchableButton style={{ transform: [{ rotateZ: '180deg' }] }}>
          <ChevronLeft />
        </TouchableButton>
      </TouchableButton>

      {/* List */}
      <FlatList
        data={documents}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        scrollEnabled={false}
        contentContainerStyle={{ gap: spacing(8) }}
        style={{ padding: spacing(8), marginTop: spacing(-8) }}
      />
    </View>
  );
};

const ChatSection = ({ chats }: { chats: ChatConversation[] }) => {
  const { profile } = useAuth();
  const navigation = useNavigation<ScreenNavigationProp>();

  const renderItem = ({
    item,
    index,
  }: {
    item: ChatConversation;
    index: number;
  }) => {
    const isLast = index === chats.length - 1; // 👈 check if last card
    const chatUser = item.members.find(
      _member => _member.user._id !== profile?._id,
    );
    const details: { photo?: string; name?: string } = {
      photo: chatUser?.user.photo,
      name: chatUser?.user.fullName,
    };

    if (item && item.type === 'group') {
      details.photo = item.groupPhoto;
      details.name = item.name;
    }

    return (
      <TouchableButton
        activeOpacity={0.8}
        style={[styles.chatCard, isLast && { borderBottomWidth: 0 }]}
      >
        <View style={styles.leftRow}>
          <SmartAvatar
            src={details.photo}
            name={details.name}
            size={scale(40)}
            fontSize={fontSize(16)}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.name}>
                {details.name}
              </Text>
              <Text style={styles.timeText}>
                {moment(item.lastMessage?.createdAt).fromNow(true)}
              </Text>
            </View>
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={styles.messageText}
            >
              {item.lastMessage?.sender?._id === profile?._id &&
              item.isDeletable
                ? 'You: '
                : null}
              {item.lastMessage?.content ||
                (item.lastMessage?.type === 'image'
                  ? '📷 Images'
                  : item.lastMessage?.type === 'video'
                    ? '🎥 Videos'
                    : item.lastMessage?.type === 'file'
                      ? '📁 Files'
                      : undefined)}
            </Text>
          </View>
        </View>
      </TouchableButton>
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <TouchableButton
        activeOpacity={0.8}
        style={styles.headerRow}
        onPress={() => navigation.navigate('Chats')}
      >
        <Text style={styles.headerTitle}>All messages</Text>
        <TouchableButton style={{ transform: [{ rotateZ: '180deg' }] }}>
          <ChevronLeft />
        </TouchableButton>
      </TouchableButton>

      {/* List */}
      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={item => item._id!}
        scrollEnabled={false}
        contentContainerStyle={{ gap: spacing(8) }}
        style={{ padding: spacing(8), marginTop: spacing(-8) }}
      />
    </View>
  );
};

function Dashboard() {
  const [
    { data: status = [], isLoading: isStatusLoading },
    { data: tasks = [], isLoading },
    { data: chats = { data: [] }, isLoading: isChatsLoading },
    { data: documents = { data: [] }, isLoading: isDocumentsLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: ['status'],
        queryFn: getAllStatuses,
      },
      {
        queryKey: ['tasks'],
        queryFn: () =>
          getAllTasks({
            startDate: moment().startOf('month').toISOString(),
            endDate: moment().endOf('month').toISOString(),
          }),
      },
      {
        queryKey: ['conversations-dashboard'],
        queryFn: () => getAllConversations({ limit: 4, sort: '-updatedAt' }),
      },
      {
        queryKey: ['documents'],
        queryFn: () =>
          getAllDocuments({
            sort: '-updatedAt',
            tab: 'all',
            limit: 4,
            page: 1,
          }),
      },
    ],
  });

  const slicedTasks = tasks?.slice(0, 5);
  const isAllLoading =
    isLoading || isStatusLoading || isChatsLoading || isDocumentsLoading;

  return (
    <View style={styles.container}>
      <AppHeader heading="Dashboard" showSearch />
      {isAllLoading ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing(16),
          }}
          style={{ backgroundColor: theme.colors.gray[50] }}
          showsVerticalScrollIndicator={false}
        >
          <TasksSection status={status} tasks={slicedTasks} />
          <DocumentsSection documents={documents.data} />
          <ChatSection chats={chats.data} />
        </ScrollView>
      )}
    </View>
  );
}

export default Dashboard;
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
    position: 'relative',
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.darkGray,
    shadowColor: theme.colors.gray[300],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: spacing(16),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(12),
    borderBottomColor: theme.colors.darkGray,
    padding: spacing(16),
    borderBottomWidth: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing(12),
    borderTopColor: theme.colors.darkGray,
    padding: spacing(16),
    borderTopWidth: 1,
  },
  headerTitle: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.primary,
  },
  // Tasks

  taskList: {
    backgroundColor: theme.colors.secondary,
    borderRadius: fontSize(12),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(12),
    gap: spacing(10),
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    gap: spacing(5),
    borderRadius: fontSize(10),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  taskTitle: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[900],
    marginBottom: spacing(4),
  },
  taskDate: {
    fontSize: fontSize(12),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[700],
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[100],
    paddingHorizontal: spacing(8),
    paddingVertical: spacing(4),
    borderRadius: fontSize(8),
  },
  progressText: {
    marginLeft: spacing(4),
    fontSize: fontSize(13),
    color: theme.colors.gray[700],
    fontFamily: theme.fonts.lato.regular,
  },
  // docs
  docCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(8),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(6),
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
  },
  iconContainer: {
    backgroundColor: theme.colors.gray[100],
    padding: spacing(8),
    borderRadius: fontSize(8),
  },
  docTitle: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[900],
    marginBottom: spacing(4),
  },
  docDate: {
    fontSize: fontSize(12),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[600],
  },
  // chats
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(12),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(4),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
  },
  fallbackAvatar: {
    backgroundColor: '#F9E2CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: fontSize(16),
    fontFamily: theme.fonts.archivo.semiBold,
    color: '#DF6C00',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
  },
  name: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[800],
    maxWidth: '90%',
    flex: 1,
  },
  unreadDot: {
    width: fontSize(8),
    height: fontSize(8),
    borderRadius: fontSize(4),
    backgroundColor: theme.colors.primary,
  },
  messageText: {
    fontSize: fontSize(13),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[500],
    marginTop: spacing(2),
    lineHeight: fontSize(18),
  },
  timeText: {
    fontSize: fontSize(12),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[600],
  },
});
