import { useNavigation } from '@react-navigation/native';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import moment from 'moment';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';
import { showMessage } from 'react-native-flash-message';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { queryClient } from '../../../App';
import {
  deleteScheduleMessage,
  getScheduleMessages,
} from '../../api/functions/message.api';
import { ChevronLeft } from '../../assets';
import TouchableButton from '../../components/TouchableButton';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { theme } from '../../theme';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import { Message } from '../../typescript/interface/message.interface';
import { fontSize, scale, spacing } from '../../utils';

type ScheduledItem = Omit<Message, 'chat'> & { chat: ChatConversation };

// daily → "Everyday", weekly → "Every <weekday>", monthly/yearly → capitalised.
const formatRepeat = (repeat?: string, scheduledAt?: string | Date) => {
  switch (repeat) {
    case 'daily':
      return 'Everyday';
    case 'weekly':
      return `Every ${moment(scheduledAt).format('dddd')}`;
    case 'monthly':
      return 'Monthly';
    case 'yearly':
      return 'Yearly';
    default:
      return 'Does not repeat';
  }
};

const getRecipientName = (item: ScheduledItem) => {
  if (item.chat?.type === 'group') return item.chat.name ?? 'Group';
  const other = item.chat?.members?.find(
    m => m.user?._id !== item.sender?._id,
  );
  return other?.user?.fullName ?? 'Unknown';
};

export default function ScheduledMessages() {
  const { styles } = useStyles(stylesheet);
  const navigation = useNavigation();

  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['scheduled-messages'],
    queryFn: ({ pageParam = 1, signal }) =>
      getScheduleMessages({ page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const { currentPage, totalPages } = lastPage.meta;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });

  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  const items = (data?.pages.flatMap(p => p.data) ?? []) as ScheduledItem[];

  const { mutate: remove } = useMutation({
    mutationFn: deleteScheduleMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['scheduled-messages'],
        refetchType: 'all',
      });
      showMessage({ type: 'success', message: 'Scheduled message deleted' });
    },
    onError: () =>
      showMessage({ type: 'danger', message: 'Could not delete message' }),
  });

  const confirmDelete = (id?: string) => {
    if (!id) return;
    Alert.alert(
      'Delete scheduled message',
      'This message will no longer be sent. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(id) },
      ],
    );
  };

  const openEdit = (item: ScheduledItem) => {
    SheetManager.show('schedule-message-sheet', {
      payload: {
        chatId: item.chat?._id ?? '',
        receiverName: getRecipientName(item),
        selectedMessage: {
          _id: item._id ?? '',
          content: item.content ?? '',
          scheduledAt: new Date(item.scheduledAt ?? '').toISOString(),
          repeat: item.repeat ?? 'none',
        },
      },
    });
  };

  const renderItem = ({ item }: { item: ScheduledItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.postingRow}>
          <Ionicons
            name="globe-outline"
            size={fontSize(14)}
            color={theme.colors.gray[500]}
          />
          <Text style={styles.postingText}>
            Posting on{' '}
            <Text style={styles.postingStrong}>
              {moment(item.scheduledAt).format('DD-MM-YYYY')}
            </Text>{' '}
            at{' '}
            <Text style={styles.postingStrong}>
              {moment(item.scheduledAt).format('hh:mm a')}
            </Text>
          </Text>
        </View>
        <Menu
          renderer={renderers.Popover}
          rendererProps={{ placement: 'bottom' }}
        >
          <MenuTrigger
            customStyles={{ TriggerTouchableComponent: TouchableOpacity }}
            style={styles.menuTrigger}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={fontSize(16)}
              color={theme.colors.gray[500]}
            />
          </MenuTrigger>
          <MenuOptions
            customStyles={{
              optionsContainer: {
                width: scale(140),
                borderRadius: 10,
                paddingVertical: scale(4),
              },
            }}
          >
            <MenuOption style={styles.menuOption} onSelect={() => openEdit(item)}>
              <Ionicons
                name="create-outline"
                size={fontSize(16)}
                color={theme.colors.gray[700]}
              />
              <Text style={styles.menuOptionText}>Edit</Text>
            </MenuOption>
            <MenuOption
              style={styles.menuOption}
              onSelect={() => confirmDelete(item._id)}
            >
              <Ionicons
                name="trash-outline"
                size={fontSize(16)}
                color="#ef4444"
              />
              <Text style={[styles.menuOptionText, { color: '#ef4444' }]}>
                Delete
              </Text>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>

      <View style={styles.repeatRow}>
        <Text style={styles.repeatLabel}>Repeat</Text>
        <Text style={styles.repeatValue}>
          {formatRepeat(item.repeat, item.scheduledAt)}
        </Text>
      </View>

      <Text style={styles.messageText}>{item.content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableButton
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft />
        </TouchableButton>
        <Text style={styles.headerTitle}>All Scheduled Message</Text>
        <View style={{ width: scale(30) }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item._id ?? String(item.scheduledAt)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No scheduled messages yet.</Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: spacing(16) }}>
                <ActivityIndicator size="small" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const stylesheet = createStyleSheet({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  iconButton: {
    padding: spacing(4),
    paddingHorizontal: spacing(8),
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[900],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing(60),
  },
  emptyText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(14),
    color: theme.colors.gray[500],
  },
  listContent: {
    padding: spacing(16),
    gap: spacing(12),
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(12),
    padding: spacing(14),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    gap: spacing(8),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  postingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
    flex: 1,
  },
  postingText: {
    flex: 1,
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[600],
  },
  postingStrong: {
    fontFamily: theme.fonts.lato.bold,
    color: theme.colors.gray[900],
  },
  menuTrigger: {
    padding: spacing(4),
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(10),
  },
  menuOptionText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(14),
    color: theme.colors.gray[800],
  },
  repeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
  },
  repeatLabel: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[500],
  },
  repeatValue: {
    fontFamily: theme.fonts.lato.bold,
    fontSize: fontSize(13),
    color: theme.colors.gray[800],
  },
  messageText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(14),
    color: theme.colors.gray[800],
    lineHeight: fontSize(20),
  },
});
