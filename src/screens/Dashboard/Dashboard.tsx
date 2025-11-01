import React, { useState } from 'react';
import { theme } from '../../theme';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import AppHeader from '../../components/ui/AppHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fontSize, spacing } from '../../utils';
import { assets, ChevronLeft } from '../../assets';
import AppBadge from '../../components/ui/AppBadge';
import { FlatList } from 'react-native';
import TaskBadge from '../../components/Tasks/TaskBadge';

interface TaskCardProps {
  title: string;
  count: number;
  color: string;
  labelColor?: string;
  activeColor?: string;
  tasks?: { title: string; date: string; progress: string }[];
}

const TaskCard: React.FC<TaskCardProps> = ({
  title,
  count,
  color,
  labelColor,
  activeColor,
  tasks,
}) => {
  const isTodo = title === 'Todo';

  return (
    <View>
      {/* Label */}
      <TaskBadge
        title={title}
        count={count}
        labelColor={activeColor || labelColor || theme.colors.gray[900]}
        backgroundColor={color}
        marginBottom={spacing(6)}
      />

      {/* Tasks List */}
      {isTodo && tasks && (
        <View style={styles.taskList}>
          {tasks.map((task, index) => (
            <View key={index} style={styles.taskCard}>
              <View>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDate}>{task.date}</Text>
              </View>
              <View style={styles.progressContainer}>
                <Ionicons
                  name="git-branch-outline"
                  size={fontSize(16)}
                  color={theme.colors.gray[700]}
                />
                <Text style={styles.progressText}>{task.progress}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
const TasksSection = () => {
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
        <TaskCard
          title="Todo"
          count={2}
          color="#E7E8EB"
          activeColor={theme.colors.primary}
          tasks={[
            {
              title: 'Task from coach',
              date: '22 Oct, 2025',
              progress: '0/2',
            },
            { title: 'new task', date: '16 Oct, 2025', progress: '3/6' },
          ]}
        />
        <TaskCard
          title="new status"
          count={0}
          color="#FFF9DD"
          labelColor="#B6862A"
        />
        <TaskCard
          title="New Status"
          count={0}
          color="#EAE7FD"
          labelColor="#3D2EA6"
        />
      </View>
      <TouchableOpacity activeOpacity={0.8} style={styles.footerRow}>
        <Text style={styles.headerTitle}>View More</Text>
        <TouchableOpacity style={{ transform: [{ rotateZ: '180deg' }] }}>
          <ChevronLeft />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const DocumentsSection = () => {
  const documents = [
    {
      id: '1',
      title: 'Doctor’s Recommendation Letter',
      date: '5 Jul, 2025',
      tag: 'Health',
      tagBg: '#FFF6E6',
      tagColor: '#E8A23A',
    },
    {
      id: '2',
      title: 'Medical History Summary',
      date: '5 Jul, 2025',
      tag: 'Therapy',
      tagBg: '#E7E8EB',
      tagColor: '#23294A',
    },
    {
      id: '3',
      title: 'Prescription – Dr. Neha Sharma',
      date: '5 Jul, 2025',
      tag: 'Fitness',
      tagBg: '#E6F4EC',
      tagColor: '#20A664',
    },
    {
      id: '4',
      title: 'Mental Health Assessment',
      date: '5 Jul, 2025',
      tag: 'Health',
      tagBg: '#FFF6E6',
      tagColor: '#E8A23A',
    },
  ];

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.docCard}>
      <View style={styles.docLeft}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="document"
            size={fontSize(18)}
            color={theme.colors.gray[600]}
          />
        </View>
        <View style={{ maxWidth: '76%' }}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.docTitle}>
            {item.title}
          </Text>
          <Text style={styles.docDate}>Updated : {item.date}</Text>
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
          bgColor={item.tagBg}
          dotColor={item.tagColor}
          text={item.tag}
        />
      </View>
    </View>
  );
  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.8} style={styles.headerRow}>
        <Text style={styles.headerTitle}>Documents</Text>
        <TouchableOpacity style={{ transform: [{ rotateZ: '180deg' }] }}>
          <ChevronLeft />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* List */}
      <FlatList
        data={documents}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        contentContainerStyle={{ gap: spacing(8) }}
        style={{ padding: spacing(8), marginTop: spacing(-8) }}
      />
    </View>
  );
};

const ChatSection = () => {
  const chats = [
    {
      id: '1',
      name: 'Eleanor Pena',
      message: 'Paperless opt-out email sent',
      time: '5s',
      avatar: assets.images.Avatar3,
      unread: false,
    },
    {
      id: '2',
      name: 'Cody Fisher',
      message:
        'Im trying to book an appointment but the assistant isnt picking up the phone....',
      time: '59m',
      avatar: assets.images.Avatar2,
      unread: false,
    },
    {
      id: '3',
      name: 'We Are Three',
      message:
        "I have something on my mind that's been bothering me, but I'm not sure",
      time: '1h',
      avatar: null,
      unread: true,
    },
  ];
  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isLast = index === chats.length - 1; // 👈 check if last card

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.chatCard, isLast && { borderBottomWidth: 0 }]}
      >
        <View style={styles.leftRow}>
          {item.avatar ? (
            <Image source={item.avatar} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.fallbackAvatar]}>
              <Text style={styles.fallbackText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ maxWidth: '76%' }}>
            <View style={styles.nameRow}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.name}>
                {item.name}
              </Text>
            </View>
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={styles.messageText}
            >
              {item.message}
            </Text>
          </View>
        </View>

        <Text style={styles.timeText}>{item.time}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <TouchableOpacity activeOpacity={0.8} style={styles.headerRow}>
        <Text style={styles.headerTitle}>All messages</Text>
        <TouchableOpacity style={{ transform: [{ rotateZ: '180deg' }] }}>
          <ChevronLeft />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* List */}
      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        contentContainerStyle={{ gap: spacing(8) }}
        style={{ padding: spacing(8), marginTop: spacing(-8) }}
      />
    </View>
  );
};
function Dashboard() {
  const [search, setSearch] = useState('');

  return (
    <View style={styles.container}>
      <AppHeader
        heading="Dashboard"
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        onSettingsPress={() => console.log('Settings pressed')}
      />
      <ScrollView
        contentContainerStyle={{
          backgroundColor: theme.colors.gray[50],
          padding: spacing(16),
        }}
        showsVerticalScrollIndicator={false}
      >
        <TasksSection />
        <DocumentsSection />
        <ChatSection />
      </ScrollView>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.addBtn}
        onPress={() => {}}
      >
        <Ionicons name="add" size={25} color={theme.colors.white} />
      </TouchableOpacity>
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
  avatar: {
    width: fontSize(40),
    height: fontSize(40),
    borderRadius: fontSize(20),
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
  addBtn: {
    position: 'absolute',
    bottom: spacing(14),
    right: spacing(14),
    padding: spacing(6),
    backgroundColor: theme.colors.primary,
    borderRadius: 100,
  },
});
