import { Pressable, ScrollView, Text, View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import TaskBadge from './TaskBadge';
import IndividualTask from './IndividualTask';
import AccordionItem from '../ui/Accordion';
import { useState } from 'react';

export default function TaskCard({
  defaultExpanded = false,
}: {
  defaultExpanded?: boolean;
}) {
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
            size={fontSize(16)}
            color={theme.colors.black}
          />
        </Pressable>
        <TaskBadge
          title="Todo"
          count={15}
          labelColor={theme.colors.primary}
          backgroundColor="#E7E8EB"
        />

        <Pressable style={styles.addTaskButton}>
          <AntDesign name="plus" color="#838383" size={spacing(14)} />
          <Text style={styles.addTaskButtonText}>Add Task</Text>
        </Pressable>
      </View>
      <AccordionItem isExpanded={isExpanded} viewKey={'he'} duration={0}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.task}
          removeClippedSubviews
        >
          <View>
            <IndividualTask />
            <IndividualTask />
            <IndividualTask />
            <IndividualTask />
          </View>
        </ScrollView>
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
  task: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: spacing(16),
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
