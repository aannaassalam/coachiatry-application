import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import moment from 'moment';
import {
  Alert,
  Dimensions,
  Platform,
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
import { deleteTask } from '../../api/functions/task.api';
import { hapticOptions } from '../../helpers/utils';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { Task } from '../../typescript/interface/task.interface';
import { fontSize, scale, spacing } from '../../utils';
import TouchableButton from '../TouchableButton';
import Lucide from '@react-native-vector-icons/lucide';

type TaskScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'Tasks'
>;

export default function IndividualTask({
  task,
  userId,
}: {
  task: Task;
  userId?: string;
}) {
  const navigation = useNavigation<TaskScreenNavigationProp>();
  const width = Dimensions.get('screen').width;

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(10),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(14),
    gap: spacing(5),
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
