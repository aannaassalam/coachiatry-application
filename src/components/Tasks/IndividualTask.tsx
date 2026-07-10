import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import moment from 'moment';
import { Alert, Dimensions, Platform, Text, View } from 'react-native';
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
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';
import { deleteTask } from '../../api/functions/task.api';
import { hapticOptions } from '../../helpers/utils';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { Task } from '../../typescript/interface/task.interface';
import { fontSize, scale, spacing } from '../../utils';
import TouchableButton from '../TouchableButton';
import Badge from '../ui/Badge';
import Priority from '../ui/Priority';
import { SmartAvatar } from '../ui/SmartAvatar';
import { Pencil } from 'lucide-react-native';

const MAX_AVATARS = 3;

type TaskScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'Tasks'
>;

export default function IndividualTask({
  task,
  userId,
  showStatus = false,
}: {
  task: Task;
  userId?: string;
  /**
   * Show the status pill on the card. Redundant when the list is grouped by
   * status (the group header already shows it), so callers pass `true` only
   * when grouping by something else (or not grouping).
   */
  showStatus?: boolean;
}) {
  const navigation = useNavigation<TaskScreenNavigationProp>();
  const width = Dimensions.get('screen').width;

  const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [];
  const shownAssignees = assignees.slice(0, MAX_AVATARS);
  const extraAssignees = assignees.length - shownAssignees.length;

  const hasPriority = !!task.priority;
  const hasCategory = !!task.category?.color;
  const hasStatus = showStatus && !!task.status?.color;
  const hasMeta =
    hasPriority ||
    hasCategory ||
    hasStatus ||
    !!task.user ||
    assignees.length > 0;
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
    <Menu
      key={task._id}
      renderer={renderers.Popover}
      onOpen={() =>
        ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions)
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
          navigation.navigate('TaskDetails', { taskId: task._id, userId })
        }
        customStyles={{
          TriggerTouchableComponent: TouchableButton,
          triggerTouchable: {
            activeOpacity: 0.5,
          },
        }}
        style={styles.taskCard}
      >
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskDate}>
              {task.dueDate
                ? moment(task.dueDate).format('D MMM, YYYY')
                : 'No due date available'}
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
        </View>

        {hasMeta && (
          <View style={styles.metaRow}>
            {hasPriority && (
              <Priority
                priority={task.priority}
                size={scale(14)}
                style={styles.priorityMeta}
              />
            )}
            {hasCategory && (
              <Badge
                title={task.category.title}
                bgColor={task.category.color.bg}
                color={task.category.color.text}
              />
            )}
            {hasStatus && (
              <Badge
                title={task.status.title}
                bgColor={task.status.color.bg}
                color={task.status.color.text}
              />
            )}

            {(!!task.user || assignees.length > 0) && (
              <View style={styles.people}>
              {/* Owner — marked with a small crown to tell it apart from the
                  assignee avatars (which carry no name). */}
              {task.user && (
                <View>
                  <SmartAvatar
                    src={task.user.photo}
                    name={task.user.fullName}
                    size={scale(22)}
                    style={styles.stackAvatar}
                  />
                  <View style={styles.crownBadge}>
                    <FontAwesome5
                      name="crown"
                      solid
                      size={fontSize(7)}
                      color="#B7791F"
                    />
                  </View>
                </View>
              )}

              {assignees.length > 0 && (
                <View style={styles.assigneeStack}>
                  {shownAssignees.map((u, i) => (
                    <SmartAvatar
                      key={u._id}
                      src={u.photo}
                      name={u.fullName}
                      size={scale(22)}
                      style={[
                        styles.stackAvatar,
                        i > 0 && styles.stackOverlap,
                      ]}
                    />
                  ))}
                  {extraAssignees > 0 && (
                    <View style={[styles.moreBadge, styles.stackOverlap]}>
                      <Text style={styles.moreText}>+{extraAssignees}</Text>
                    </View>
                  )}
                </View>
              )}
              </View>
            )}
          </View>
        )}
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
            navigation.navigate('AddEditTask', { taskId: task._id, userId })
          }
        >
          <Pencil color={theme.colors.gray[900]} size={fontSize(16)} />
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
            )
          }
        >
          <Octicons name="trash" color="#ef4444" size={fontSize(16)} />
          <Text style={[styles.optionText, { color: '#ef4444' }]}>Delete</Text>
        </MenuOption>
      </MenuOptions>
    </Menu>
  );
}

const styles = createStyleSheet({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  caretButton: {
    // width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(8),
  },
  taskCard: {
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(10),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(14),
    gap: spacing(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(5),
  },
  // Single wrapping row: priority, category, status and the people cluster all
  // flow inline (no forced second line, so no dead vertical space). Each is a
  // whole unit, so they wrap together rather than mid-badge.
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing(8),
  },
  // Strip the Priority component's built-in left padding so its flag sits flush
  // with the card's left edge (aligned under the title).
  priorityMeta: {
    paddingLeft: 0,
  },
  people: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
    // Push the avatars to the right of the line when everything fits.
    marginLeft: 'auto',
  },
  crownBadge: {
    position: 'absolute',
    bottom: -scale(3),
    right: -scale(3),
    width: scale(13),
    height: scale(13),
    borderRadius: 100,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneeStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },
  stackOverlap: {
    marginLeft: -scale(8),
  },
  moreBadge: {
    minWidth: scale(22),
    height: scale(22),
    paddingHorizontal: spacing(4),
    borderRadius: 100,
    backgroundColor: theme.colors.gray[200],
    borderWidth: 1.5,
    borderColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: fontSize(10),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[700],
  },
  taskTitle: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[900],
    marginBottom: spacing(4),
  },
  taskDate: {
    fontSize: Platform.OS === 'ios' ? fontSize(12) : fontSize(10),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[700],
    marginTop: Platform.OS === 'ios' ? spacing(0) : spacing(2),
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
