import { Pressable, ScrollView, Text, View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import { AntDesign } from '@react-native-vector-icons/ant-design';
import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import TaskBadge from './TaskBadge';
import IndividualTask from './IndividualTask';
import AccordionItem from '../ui/Accordion';
import { useState } from 'react';
import { Status } from '../../typescript/interface/status.interface';
import { Task } from '../../typescript/interface/task.interface';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { useNavigation } from '@react-navigation/native';

type TaskListNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'Tasks'
>;

export default function TaskCard({
  defaultExpanded = false,
  status,
  tasks,
  userId,
}: {
  defaultExpanded?: boolean;
  status: Status;
  tasks: Task[];
  userId?: string;
}) {
  const navigation = useNavigation<TaskListNavigationProp>();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.container}>
      <View style={styles.taskTitle}>
        <Pressable
          style={styles.caretButton}
          onPress={() => setIsExpanded(prev => !prev)}
        >
          <FontAwesome5
            name={isExpanded ? 'caret-down' : 'caret-right'}
            iconStyle="solid"
            size={fontSize(16)}
            color={theme.colors.black}
          />
        </Pressable>
        <Pressable onPress={() => setIsExpanded(prev => !prev)}>
          <TaskBadge
            title={status.title}
            count={tasks.length}
            labelColor={status.color.text}
            backgroundColor={status.color.bg}
          />
        </Pressable>

        <Pressable
          style={styles.addTaskButton}
          onPress={() =>
            navigation.navigate('AddEditTask', {
              predefinedStatus: status._id,
              userId,
            })
          }
        >
          <AntDesign name="plus" color="#838383" size={spacing(12)} />
          <Text style={styles.addTaskButtonText}>Add Task</Text>
        </Pressable>
      </View>
      <AccordionItem
        isExpanded={isExpanded}
        viewKey={'he'}
        duration={0}
        style={{ paddingHorizontal: spacing(10), alignItems: 'center' }}
      >
        <View style={styles.taskList}>
          {tasks.length === 0 ? (
            <Text
              style={{
                color: theme.colors.gray[500],
                fontStyle: 'italic',
                textAlign: 'center',
                paddingVertical: spacing(10),
              }}
            >
              No Tasks found...
            </Text>
          ) : (
            tasks.map(_task => (
              <IndividualTask task={_task} key={_task._id} userId={userId} />
            ))
          )}
        </View>
        {/* <View style={styles.addTaskRow}>
          <Pressable style={[styles.addTaskButton, { marginLeft: 0 }]}>
            <AntDesign name="plus" color="#838383" size={spacing(14)} />
            <Text style={styles.addTaskButtonText}>Add Task</Text>
          </Pressable>
        </View> */}
      </AccordionItem>
    </View>
  );
}

const styles = createStyleSheet({
  container: {
    paddingVertical: spacing(5),
  },
  taskTitle: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(16),
    flexDirection: 'row',
    alignItems: 'center',
  },
  caretButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(12),
  },
  addTaskButton: {
    padding: spacing(5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
    marginLeft: 'auto',
  },
  addTaskButtonText: {
    color: '#838383',
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(12),
  },
  taskList: {
    backgroundColor: theme.colors.secondary,
    borderRadius: fontSize(12),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(10),
    gap: spacing(10),
  },
  addTaskRow: {
    paddingHorizontal: spacing(20),
    paddingVertical: spacing(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    width: '100%',
  },
});
