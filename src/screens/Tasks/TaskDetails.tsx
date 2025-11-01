import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar, Checkbox, Divider } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Calendar, ChevronLeft } from '../../assets';
import { theme } from '../../theme';
import { fontSize, scale, spacing, verticalScale } from '../../utils';
import { createStyleSheet } from 'react-native-unistyles';
import CheckBox from '../../components/ui/CheckBox';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import Badge from '../../components/ui/Badge';
import Priority from '../../components/ui/Priority';

const TaskDetailsScreen = () => {
  const navigation = useNavigation();
  const [subtasks, setSubtasks] = React.useState([
    {
      id: 1,
      title: 'Follow up with the client about pending content approval.',
      done: false,
    },
    {
      id: 2,
      title: 'Follow up with the client about pending content approval.',
      done: true,
    },
    {
      id: 3,
      title: 'Draft a blog post outline on “AI in everyday productivity.”',
      done: false,
    },
  ]);

  const toggleSubtask = (id: number) => {
    setSubtasks(prev =>
      prev.map(item => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons
              name="ellipsis-horizontal"
              size={fontSize(18)}
              color={theme.colors.gray[600]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Task Title */}
        <Text style={styles.title}>
          Wireframe splash page for new sales funnel
        </Text>

        {/* Subtasks */}
        <View style={styles.subtasksHeader}>
          <Text style={styles.sectionTitle}>Subtasks</Text>
        </View>

        {subtasks.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.subtaskItem}
            onPress={() => toggleSubtask(item.id)}
          >
            <CheckBox checked={item.done} />
            <Text
              style={[
                styles.subtaskText,
                item.done && styles.subtaskCompletedText,
              ]}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />

        {/* Creator */}
        <View style={styles.row}>
          <Text style={styles.label}>Created by</Text>
          <View style={styles.creatorInfo}>
            <SmartAvatar src="https://i.pravatar.cc/100" size={scale(20)} />
            <Text style={styles.creatorName}>Damien Green</Text>
          </View>
        </View>

        {/* Due Date */}
        <View style={styles.row}>
          <Text style={styles.label}>Due date & Time</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing(4),
            }}
          >
            <Calendar width={scale(14)} height={scale(14)} />
            <Text style={styles.value}>
              {moment(new Date(2023, 0, 10, 8, 0)).format(
                'DD MMM, yyyy  •  hh:mm a',
              )}
            </Text>
          </View>
        </View>

        {/* Duration */}
        <View style={styles.row}>
          <Text style={styles.label}>Duration</Text>
          <Text style={styles.value}>45 Mins</Text>
        </View>

        {/* Repeat */}
        <View style={styles.row}>
          <Text style={styles.label}>Repeat</Text>
          <Text style={styles.value}>Daily</Text>
        </View>

        {/* Reminder */}
        <View style={styles.row}>
          <Text style={styles.label}>Reminder</Text>
          <Text style={styles.value}>15 Mins</Text>
        </View>

        {/* Category */}
        <View style={styles.row}>
          <Text style={styles.label}>Category</Text>
          <Badge title="Health" color="#e67e22" bgColor="#FFF0D8" />
        </View>

        <View style={styles.divider} />

        {/* Priority & Status */}
        <View
          style={[styles.row, { marginVertical: 0, marginBottom: spacing(5) }]}
        >
          <Text style={styles.label}>Priority</Text>
          <Priority priority="high" />
        </View>

        <View style={[styles.row, { marginVertical: 0 }]}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusTag}>
            <Text style={styles.statusText}>Overdue</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Description */}
        <View>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>
              Lorem ipsum is placeholder text commonly used in the graphic,
              print, and publishing industries for previewing layouts and visual
              mockups.
            </Text>
            <Text style={[styles.descriptionText, { marginTop: 8 }]}>
              Lorem ipsum is placeholder text commonly used in the graphic,
              print, and publishing industries for previewing layouts and visual
              mockups.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default TaskDetailsScreen;

const styles = createStyleSheet({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  scrollContent: {
    padding: spacing(20),
    // paddingBottom: spacing(80),
  },
  title: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.medium,
    marginBottom: spacing(12),
    color: '#000',
  },
  subtasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginVertical: spacing(4),
    paddingVertical: spacing(6),
    paddingHorizontal: spacing(8),
    gap: spacing(8),
  },
  subtaskText: {
    flex: 1,
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.black,
  },
  subtaskCompletedText: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  divider: {
    height: verticalScale(8),
    backgroundColor: '#F9F9F9',
    width: Dimensions.get('screen').width,
    marginLeft: spacing(-20),
    marginVertical: spacing(14),
  },
  row: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    gap: spacing(12),
    marginVertical: spacing(5),
    paddingVertical: spacing(4),
  },
  label: {
    color: '#4F4D55',
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(14),
    width: scale(100),
  },
  value: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: '#000',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
  },
  statusTag: {
    backgroundColor: '#ffe5e5',
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(4),
    borderRadius: spacing(8),
  },
  statusText: {
    color: '#e74c3c',
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(12),
  },
  sectionTitle: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
    color: '#4F4D55',
    marginBottom: spacing(8),
  },
  descriptionBox: {
    backgroundColor: '#F7F7F7',
    padding: spacing(12),
    borderRadius: spacing(7),
  },
  descriptionText: {
    color: '#444',
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    lineHeight: spacing(18),
  },
});
