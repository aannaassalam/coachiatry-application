import { useMutation, useQuery } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';
import ActionSheet, {
  ScrollView,
  SheetManager,
  SheetProps,
} from 'react-native-actions-sheet';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import { queryClient } from '../../App';
import {
  assignToggle,
  getTask,
  getTaskAssignees,
} from '../api/functions/task.api';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../theme';
import { Task } from '../typescript/interface/task.interface';
import { User } from '../typescript/interface/user.interface';
import { fontSize, scale, spacing } from '../utils';
import { Skeleton } from './ui/Skeleton';
import { SmartAvatar } from './ui/SmartAvatar';

const SHEET_ID = 'assignee-sheet';

export default function AssigneePickerSheet(
  props: SheetProps<'assignee-sheet'>,
) {
  const { styles } = useStyles(stylesheet);
  const { profile } = useAuth();
  const taskId = props.payload?.taskId ?? '';

  // Read the (already cached) task so the checkmarks react to optimistic toggles.
  const { data: task } = useQuery({
    queryKey: ['task', taskId],
    queryFn: ({ signal }) => getTask(taskId, signal),
    enabled: !!taskId,
  });

  const { data: assigneeData, isLoading } = useQuery({
    queryKey: ['task-assignees', taskId],
    queryFn: ({ signal }) => getTaskAssignees(taskId, signal),
    enabled: !!taskId,
    staleTime: 60 * 1000,
  });

  const assignedIds = new Set((task?.assignedTo ?? []).map(u => u._id));

  const { mutate: assign, isPending } = useMutation({
    mutationFn: assignToggle,
    onMutate: async ({ coachId }) => {
      await queryClient.cancelQueries({ queryKey: ['task', taskId] });
      const prev = queryClient.getQueryData<Task>(['task', taskId]);
      const candidate = assigneeData?.assignees.find(u => u._id === coachId);

      queryClient.setQueryData<Task>(['task', taskId], old => {
        if (!old) return old;
        const current = old.assignedTo ?? [];
        const exists = current.some(u => u._id === coachId);
        return {
          ...old,
          assignedTo: exists
            ? current.filter(u => u._id !== coachId)
            : candidate
              ? [...current, candidate as unknown as User]
              : current,
        };
      });

      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['task', taskId], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['status'] });
    },
  });

  return (
    <ActionSheet
      id={SHEET_ID}
      useBottomSafeAreaPadding
      closeOnTouchBackdrop
      indicatorStyle={styles.indicator}
      gestureEnabled
      drawUnderStatusBar={false}
      containerStyle={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Assign to</Text>
          <Pressable
            style={styles.closeButton}
            hitSlop={spacing(8)}
            onPress={() => SheetManager.hide(SHEET_ID)}
          >
            <Feather name="x" size={fontSize(20)} color={theme.colors.gray[500]} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.list}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={styles.row}>
                <Skeleton width={scale(28)} height={scale(28)} borderRadius={100} />
                <Skeleton width="50%" height={14} borderRadius={4} />
              </View>
            ))}
          </View>
        ) : !assigneeData?.canAssign ? (
          <Text style={styles.note}>
            You can’t change this task’s assignees.
          </Text>
        ) : assigneeData.assignees.length === 0 ? (
          <Text style={styles.note}>No one available to assign.</Text>
        ) : (
          <ScrollView
            style={styles.scroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {assigneeData.assignees.map(user => {
              const checked = assignedIds.has(user._id);
              const isMe = user._id === profile?._id;
              return (
                <Pressable
                  key={user._id}
                  style={styles.row}
                  disabled={isPending}
                  onPress={() => assign({ taskId, coachId: user._id })}
                >
                  <SmartAvatar
                    src={user.photo}
                    name={user.fullName}
                    size={scale(28)}
                  />
                  <View style={styles.rowText}>
                    <Text style={styles.name} numberOfLines={1}>
                      {isMe ? 'Me' : user.fullName}
                    </Text>
                    {!!user.role && (
                      <Text style={styles.role}>{user.role}</Text>
                    )}
                  </View>
                  <View style={styles.checkWrap}>
                    {checked && (
                      <Feather
                        name="check"
                        size={fontSize(18)}
                        color="#16A34A"
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </ActionSheet>
  );
}

const stylesheet = createStyleSheet({
  container: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#f9f9f9',
  },
  indicator: {
    width: spacing(40),
    height: spacing(5),
    borderRadius: 999,
    backgroundColor: theme.colors.gray[300],
    marginTop: spacing(10),
  },
  content: {
    padding: spacing(20),
    paddingTop: spacing(16),
    gap: spacing(12),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(18),
    color: theme.colors.gray[950],
  },
  closeButton: {
    padding: spacing(2),
  },
  scroll: {
    maxHeight: scale(320),
  },
  list: {
    gap: spacing(4),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(6),
    borderRadius: fontSize(10),
  },
  rowText: {
    flex: 1,
  },
  name: {
    fontFamily: theme.fonts.lato.bold,
    fontSize: fontSize(14),
    color: theme.colors.gray[900],
  },
  role: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(12),
    color: theme.colors.gray[500],
    textTransform: 'capitalize',
    marginTop: spacing(1),
  },
  checkWrap: {
    width: scale(20),
    alignItems: 'center',
  },
  note: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[500],
    paddingVertical: spacing(16),
    textAlign: 'center',
  },
});
