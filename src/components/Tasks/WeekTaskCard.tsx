import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import moment from 'moment';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu';
import { createStyleSheet } from 'react-native-unistyles';
import { Feather } from '@react-native-vector-icons/feather';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { Octicons } from '@react-native-vector-icons/octicons';
import { deleteTask } from '../../api/functions/task.api';
import { Calendar } from '../../assets';
import { hapticOptions } from '../../helpers/utils';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { Task } from '../../typescript/interface/task.interface';
import { fontSize, scale, spacing, verticalScale } from '../../utils';
import TouchableButton from '../TouchableButton';
import Badge from '../ui/Badge';
import { SmartAvatar } from '../ui/SmartAvatar';
import TaskBadge from './TaskBadge';
import Lucide from '@react-native-vector-icons/lucide';

type TaskScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'Tasks'
>;

export default function WeekTaskCard({
  day,
  defaultExpanded = false,
  tasks,
  date,
}: {
  day: {
    title: string;
    bgColor: string;
    accentColor: string;
  };
  defaultExpanded?: boolean;
  tasks: Task[];
  date: string;
}) {
  const width = Dimensions.get('screen').width;

  const navigation = useNavigation<TaskScreenNavigationProp>();
  const [taskVisible, setTaskVisible] = useState(defaultExpanded);

  const { mutate } = useMutation({
    mutationFn: deleteTask,
    onMutate: () => {
      showMessage({
        type: 'info',
        message: 'Deleting...',
        description: 'Deleting task, Please wait...',
      });
    },
    meta: {
      invalidateQueries: ['tasks'],
    },
  });

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.cardHead}
        onPress={() => setTaskVisible(prev => !prev)}
      >
        <View style={[styles.caretButton]}>
          <FontAwesome5
            name={taskVisible ? 'caret-down' : 'caret-right'}
            iconStyle="solid"
            size={fontSize(16)}
            color={theme.colors.black}
          />
        </View>
        <TaskBadge
          title={day.title}
          backgroundColor={day.bgColor}
          labelColor={day.accentColor}
          count={tasks.length}
        />
      </Pressable>
      {taskVisible && (
        <>
          <TouchableButton
            style={styles.addTaskButton}
            onPress={() =>
              navigation.navigate('AddEditTask', {
                predefinedDueDate: date,
              })
            }
          >
            <Feather name="plus" color="#838383" size={fontSize(16)} />
            <Text style={styles.addTaskText}>Add Task</Text>
          </TouchableButton>
          {tasks.map(task => {
            return (
              <Menu
                key={task._id}
                renderer={renderers.Popover}
                onOpen={() =>
                  ReactNativeHapticFeedback.trigger(
                    'impactMedium',
                    hapticOptions,
                  )
                }
                rendererProps={{
                  placement: 'bottom',
                  anchorStyle: {
                    marginLeft: width * 0.85,
                    marginTop: -30,
                  },
                }}
              >
                <MenuTrigger
                  triggerOnLongPress
                  onAlternativeAction={() =>
                    navigation.navigate('TaskDetails', { taskId: task._id })
                  }
                  customStyles={{
                    TriggerTouchableComponent: TouchableOpacity,
                    triggerTouchable: {
                      activeOpacity: 0.5,
                    },
                  }}
                  style={styles.taskCard}
                >
                  <Text style={styles.taskTitle} numberOfLines={2}>
                    {task.title}
                  </Text>
                  <View style={styles.taskCardRow}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing(2),
                      }}
                    >
                      <Calendar width={scale(16)} height={scale(16)} />
                      <Text style={styles.metaLabel}>Start:</Text>
                      <Text style={styles.metaDate}>
                        {moment(task?.createdAt).format('MMM DD')}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: scale(4),
                        height: scale(4),
                        backgroundColor: theme.colors.gray[200],
                        borderRadius: 100,
                      }}
                    />
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <SmartAvatar
                        src={task?.assignedTo.photo}
                        name={task?.assignedTo.fullName}
                        size={scale(16)}
                        fontSize={fontSize(14)}
                        style={styles.avatar}
                      />
                      <Text style={styles.authorName}>
                        {task?.assignedTo.fullName}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignSelf: 'flex-start' }}>
                    <Badge
                      title={task.category.title}
                      bgColor={task.category.color.bg}
                      color={task.category.color.text}
                    />
                  </View>
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
                    onSelect={() =>
                      navigation.navigate('AddEditTask', { taskId: task._id })
                    }
                  >
                    <Lucide
                      name="pencil"
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
                        'Delete task',
                        'Are you sure you want to delete this task?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => mutate(task._id),
                          },
                        ],
                        'default',
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
            );
          })}
        </>
      )}
    </View>
  );
}

const styles = createStyleSheet({
  card: {
    padding: spacing(8),
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    marginBottom: spacing(16),
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(5),
  },
  caretButton: {
    // width: 20,
    height: verticalScale(20),
    width: scale(25),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(8),
  },
  addTaskButton: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(12),
    backgroundColor: '#F9F9F9',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    gap: spacing(6),
    marginTop: spacing(12),
    marginBottom: spacing(8),
  },
  addTaskText: {
    color: '#838383',
  },
  taskCard: {
    padding: spacing(14),
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#F3F3F3',
    borderRadius: 8,
    marginBottom: spacing(8),
  },
  taskTitle: {
    color: theme.colors.black,
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(16),
    marginBottom: spacing(12),
  },
  taskCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
    marginBottom: spacing(10),
  },

  metaLabel: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[700],
    marginLeft: spacing(3),
  },
  metaDate: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[900],
  },
  avatar: {
    marginRight: spacing(8),
  },
  authorName: {
    fontSize: fontSize(13),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.black,
  },
  option: {
    flexDirection: 'row',
    gap: spacing(10),
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
  },
  optionText: {
    fontSize: fontSize(16),
  },
});
