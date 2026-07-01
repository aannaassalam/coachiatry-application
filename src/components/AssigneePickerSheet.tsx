import {
  useInfiniteQuery,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import ActionSheet, {
  FlatList,
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
  TaskAssignee,
} from '../api/functions/task.api';
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
import { theme } from '../theme';
import { Task } from '../typescript/interface/task.interface';
import { User } from '../typescript/interface/user.interface';
import { fontSize, scale, spacing } from '../utils';
import { Skeleton } from './ui/Skeleton';
import { SmartAvatar } from './ui/SmartAvatar';

const SHEET_ID = 'assignee-sheet';

type AssigneeRow = { user: TaskAssignee; assigned: boolean };

export default function AssigneePickerSheet(
  props: SheetProps<'assignee-sheet'>,
) {
  const { styles } = useStyles(stylesheet);
  const { profile } = useAuth();
  const taskId = props.payload?.taskId ?? '';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Keep the skeleton up until the open animation finishes, so the real list
  // never swaps in mid-slide (which reads as a blink). By the time `onOpen`
  // fires, the prefetched data (warmed on tap) is usually already there.
  const [opened, setOpened] = useState(false);

  // Read the (already cached) task so the checkmarks react to optimistic toggles
  // and the currently-assigned users can be pinned on top.
  const { data: task } = useQuery({
    queryKey: ['task', taskId],
    queryFn: ({ signal }) => getTask(taskId, signal),
    enabled: !!taskId,
  });

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['task-assignees', taskId, debouncedSearch],
    queryFn: ({ pageParam, signal }) =>
      getTaskAssignees(
        { taskId, page: pageParam as number, search: debouncedSearch },
        signal,
      ),
    initialPageParam: 1,
    enabled: !!taskId,
    staleTime: 60 * 1000,
    getNextPageParam: lastPage =>
      lastPage.meta && lastPage.meta.currentPage < lastPage.meta.totalPages
        ? lastPage.meta.currentPage + 1
        : undefined,
  });

  const canAssign = data?.pages?.[0]?.canAssign ?? true;

  const assignees = useMemo(() => task?.assignedTo ?? [], [task?.assignedTo]);
  const assignedIds = useMemo(
    () => new Set(assignees.map(u => u._id)),
    [assignees],
  );

  // Server already excludes assigned users from candidates, but dedupe
  // defensively (optimistic adds can momentarily overlap).
  const candidateList = useMemo(
    () =>
      (data?.pages.flatMap(p => p.assignees) ?? []).filter(
        u => !assignedIds.has(u._id),
      ),
    [data, assignedIds],
  );

  // Pinned-on-top assignees come straight from the task; filter by search too.
  const assignedFiltered = useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    if (!s) return assignees;
    return assignees.filter(
      u =>
        (u.fullName || '').toLowerCase().includes(s) ||
        (u.email || '').toLowerCase().includes(s),
    );
  }, [assignees, debouncedSearch]);

  const rows = useMemo<AssigneeRow[]>(
    () => [
      ...assignedFiltered.map(u => ({ user: u as TaskAssignee, assigned: true })),
      ...candidateList.map(u => ({ user: u, assigned: false })),
    ],
    [assignedFiltered, candidateList],
  );

  const { mutate: assign, isPending } = useMutation({
    mutationFn: assignToggle,
    onMutate: async ({ coachId }) => {
      await queryClient.cancelQueries({ queryKey: ['task', taskId] });
      const prev = queryClient.getQueryData<Task>(['task', taskId]);
      const candidate = rows.find(r => r.user._id === coachId)?.user;

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
      queryClient.invalidateQueries({ queryKey: ['task-assignees', taskId] });
    },
  });

  const renderRow = ({ item }: { item: AssigneeRow }) => {
    const user = item.user;
    const checked = assignedIds.has(user._id);
    const isMe = user._id === profile?._id;
    return (
      <Pressable
        style={styles.row}
        disabled={isPending}
        onPress={() => assign({ taskId, coachId: user._id })}
      >
        <SmartAvatar src={user.photo} name={user.fullName} size={scale(28)} />
        <View style={styles.rowText}>
          <Text style={styles.name} numberOfLines={1}>
            {isMe ? 'Me' : user.fullName}
          </Text>
          {!!user.role && <Text style={styles.role}>{user.role}</Text>}
        </View>
        <View style={styles.checkWrap}>
          {checked && (
            <Feather name="check" size={fontSize(18)} color="#16A34A" />
          )}
        </View>
      </Pressable>
    );
  };

  const nothingToShow =
    !isLoading && rows.length === 0 && canAssign;

  return (
    <ActionSheet
      id={SHEET_ID}
      useBottomSafeAreaPadding
      closeOnTouchBackdrop
      indicatorStyle={styles.indicator}
      gestureEnabled
      drawUnderStatusBar={false}
      onOpen={() => setOpened(true)}
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
            <Feather
              name="x"
              size={fontSize(20)}
              color={theme.colors.gray[500]}
            />
          </Pressable>
        </View>

        {!canAssign && !isLoading ? (
          <Text style={styles.note}>
            You can’t change this task’s assignees.
          </Text>
        ) : (
          <>
            <View style={styles.searchBox}>
              <Feather
                name="search"
                size={fontSize(16)}
                color={theme.colors.gray[400]}
              />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search people..."
                placeholderTextColor={theme.colors.gray[400]}
                style={styles.searchInput}
              />
            </View>

            {/* Fixed-height area so the sheet opens to a stable height and
                doesn't re-animate (glitch) when the skeleton swaps to the list. */}
            <View style={styles.listArea}>
              {!opened || isLoading ? (
                <View style={styles.list}>
                  {[0, 1, 2, 3].map(i => (
                    <View key={i} style={styles.row}>
                      <Skeleton
                        width={scale(28)}
                        height={scale(28)}
                        borderRadius={100}
                      />
                      <Skeleton width="50%" height={14} borderRadius={4} />
                    </View>
                  ))}
                </View>
              ) : nothingToShow ? (
                <Text style={styles.note}>No people found.</Text>
              ) : (
                <FlatList
                  data={rows}
                  keyExtractor={item => item.user._id}
                  renderItem={renderRow}
                  style={styles.scroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  onEndReachedThreshold={0.3}
                  onEndReached={() => {
                    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                  }}
                  ListFooterComponent={
                    isFetchingNextPage ? (
                      <Text style={styles.footerNote}>Loading…</Text>
                    ) : null
                  }
                />
              )}
            </View>
          </>
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(8),
    paddingHorizontal: spacing(12),
    height: scale(40),
    borderRadius: fontSize(10),
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(14),
    color: theme.colors.gray[900],
    padding: 0,
  },
  listArea: {
    height: scale(320),
  },
  scroll: {
    flex: 1,
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
  footerNote: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[400],
    paddingVertical: spacing(10),
    textAlign: 'center',
  },
});
