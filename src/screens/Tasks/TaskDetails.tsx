import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Octicons } from '@react-native-vector-icons/octicons';
import { queryClient } from '../../../App';
import {
  deleteTask,
  getTask,
  markSubtaskAsCompleted,
} from '../../api/functions/task.api';
import { Calendar, ChevronLeft } from '../../assets';
import TouchableButton from '../../components/TouchableButton';
import Badge from '../../components/ui/Badge';
import CheckBox from '../../components/ui/CheckBox';
import Priority from '../../components/ui/Priority';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import { hapticOptions } from '../../helpers/utils';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { Subtask, Task } from '../../typescript/interface/task.interface';
import { fontSize, scale, spacing, verticalScale } from '../../utils';

type AddEditTaskNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'TaskDetails'
>;

const Subtasks = ({
  subtasks,
  taskId,
}: {
  subtasks: Subtask[];
  taskId: string;
}) => {
  const [localCompleted, setLocalCompleted] = useState<Record<string, boolean>>(
    () => Object.fromEntries(subtasks.map(s => [s._id, s.completed ?? false])),
  );

  useEffect(() => {
    setLocalCompleted(
      Object.fromEntries(subtasks.map(s => [s._id, s.completed ?? false])),
    );
  }, [subtasks]);

  const { mutate } = useMutation({
    mutationFn: markSubtaskAsCompleted,
    onMutate: async ({ task_id, subtask_id }) => {
      showMessage({
        type: 'info',
        message: 'Updating...',
        description: 'Updating subtask as completed...',
      });
      // Cancel ongoing queries to avoid overwrite
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousResponse = queryClient.getQueryData<Task[]>(['tasks']);

      // Update query cache immediately
      const updatedTasks = previousResponse?.map(task =>
        task._id === task_id
          ? {
              ...task,
              subtasks: task?.subtasks?.map(subtask =>
                subtask._id === subtask_id
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask,
              ),
            }
          : task,
      );

      queryClient.setQueryData(['tasks'], updatedTasks);
      return { previousResponse };
    },
    onSuccess: () => {
      ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
      showMessage({
        message: 'Success',
        description: 'Updated subtask progress',
        type: 'success',
      });
    },
    meta: {
      invalidateQueries: ['tasks', taskId],
    },
  });

  const handleToggle = (id: string) => {
    setLocalCompleted(prev => ({
      ...prev,
      [id]: !prev[id],
    }));

    mutate({ task_id: taskId, subtask_id: id });
  };

  return (
    subtasks?.length > 0 && (
      <>
        <View style={styles.subtasksHeader}>
          <Text style={styles.sectionTitle}>Subtasks</Text>
        </View>

        {subtasks?.map(item => (
          <TouchableButton
            key={item._id}
            style={styles.subtaskItem}
            onPress={() => handleToggle(item._id)}
          >
            <CheckBox checked={localCompleted[item._id]} />
            <Text
              style={[
                styles.subtaskText,
                item.completed && styles.subtaskCompletedText,
              ]}
            >
              {item.title}
            </Text>
          </TouchableButton>
        ))}
      </>
    )
  );
};

const TaskDetailsScreen = () => {
  const navigation = useNavigation<AddEditTaskNavigationProp>();
  const route = useRoute<RouteProp<AppStackParamList, 'TaskDetails'>>();
  const { taskId } = route.params;
  const width = Dimensions.get('screen').width;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId as string),
  });

  const { mutate } = useMutation({
    mutationFn: deleteTask,
    onMutate: () => {
      showMessage({
        type: 'info',
        message: 'Deleting...',
        description: 'Deleting task, Please wait...',
      });
      navigation.goBack();
    },
    meta: {
      invalidateQueries: ['tasks'],
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableButton
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft />
        </TouchableButton>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Menu
            renderer={renderers.Popover}
            onOpen={() =>
              ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions)
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
                TriggerTouchableComponent: TouchableOpacity,
              }}
              style={styles.iconButton}
            >
              {/* <TouchableOpacity style={styles.iconButton}> */}
              <Ionicons
                name="ellipsis-horizontal"
                size={fontSize(18)}
                color={theme.colors.gray[600]}
              />
              {/* </TouchableOpacity> */}
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
                  navigation.navigate('AddEditTask', { taskId: data?._id })
                }
              >
                <Octicons
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
                  Alert.prompt(
                    'Delete Task',
                    'Are you sure you want to delete this task?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => mutate(data?._id ?? ''),
                      },
                    ],
                    'default',
                  )
                }
              >
                <Octicons name="trash" color="#ef4444" size={fontSize(16)} />
                <Text style={[styles.optionText, { color: '#ef4444' }]}>
                  Delete
                </Text>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>
      </View>

      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" />
        </View>
      ) : !data ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text
            style={{
              fontSize: fontSize(14),
              color: theme.colors.gray[500],
              fontStyle: 'italic',
            }}
          >
            No details found
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
        >
          {/* Task Title */}
          <Text style={styles.title}>{data?.title}</Text>

          {/* Subtasks */}
          <Subtasks subtasks={data?.subtasks ?? []} taskId={taskId} />

          <View style={styles.divider} />

          {/* Creator */}
          <View style={styles.row}>
            <Text style={styles.label}>Assigned to</Text>
            <View style={styles.creatorInfo}>
              <SmartAvatar
                src={data?.assignedTo.photo}
                size={scale(20)}
                name={data?.assignedTo.fullName}
                fontSize={fontSize(14)}
              />
              <Text>{data?.assignedTo?.fullName}</Text>
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
                {data?.dueDate
                  ? moment(data?.dueDate).format('DD MMM, yyyy  •  hh:mm A')
                  : '-'}
              </Text>
            </View>
          </View>

          {/* Duration */}
          <View style={styles.row}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>
              {moment
                .utc(
                  moment
                    .duration(data?.taskDuration, 'minute')
                    .asMilliseconds(),
                )
                .format('H [Hours]  m [Minutes]')}
            </Text>
          </View>

          {/* Repeat */}
          <View style={styles.row}>
            <Text style={styles.label}>Repeat</Text>
            <Text style={[styles.value, { textTransform: 'capitalize' }]}>
              {data?.frequency}
            </Text>
          </View>

          {/* Reminder */}
          <View style={styles.row}>
            <Text style={styles.label}>Reminder</Text>
            <Text style={styles.value}>
              {data?.remindBefore?.toString().padStart(2, '0') ?? 0} mins before
            </Text>
          </View>

          {/* Category */}
          <View style={styles.row}>
            <Text style={styles.label}>Category</Text>
            {data?.category && (
              <Badge
                title={data?.category.title}
                color={data?.category.color.text}
                bgColor={data?.category?.color?.bg}
              />
            )}
          </View>

          <View style={styles.divider} />

          {/* Priority & Status */}
          <View
            style={[
              styles.row,
              { marginVertical: 0, marginBottom: spacing(5) },
            ]}
          >
            <Text style={styles.label}>Priority</Text>
            <Priority priority={data?.priority ?? 'medium'} />
          </View>

          <View style={[styles.row, { marginVertical: 0 }]}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusTag(data?.status?.color.bg)}>
              <Text style={styles.statusText(data?.status?.color.text)}>
                {data?.status.title}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <View>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>{data?.description}</Text>
            </View>
          </View>
        </ScrollView>
      )}
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
    paddingHorizontal: spacing(10),
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
    letterSpacing: 0.5,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
  },
  statusTag: (bgColor: string) => ({
    backgroundColor: bgColor,
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(4),
    borderRadius: spacing(8),
  }),
  statusText: (textColor: string) => ({
    color: textColor,
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(12),
  }),
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
