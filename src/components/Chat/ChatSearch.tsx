import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search as SearchIcon, SearchX, X } from 'lucide-react-native';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createStyleSheet } from 'react-native-unistyles';
import { getAllConversations } from '../../api/functions/chat.api';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import { fontSize, scale, spacing } from '../../utils';
import { SmartAvatar } from '../ui/SmartAvatar';
import TouchableButton from '../TouchableButton';

const SkeletonRow = () => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[skeletonStyles.row, animStyle]}>
      <View style={skeletonStyles.avatar} />
      <View style={skeletonStyles.body}>
        <View style={skeletonStyles.nameBar} />
        <View style={skeletonStyles.msgBar} />
      </View>
      <View style={skeletonStyles.timeBar} />
    </Animated.View>
  );
};

const SkeletonList = () => (
  <View style={skeletonStyles.wrap}>
    {Array.from({ length: 6 }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </View>
);

const skeletonStyles = createStyleSheet({
  wrap: {
    padding: spacing(16),
    paddingTop: spacing(14),
    gap: spacing(10),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: fontSize(14),
    backgroundColor: theme.colors.white,
    padding: spacing(12),
  },
  body: {
    flex: 1,
    gap: spacing(8),
  },
  avatar: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    backgroundColor: theme.colors.gray[200],
  },
  nameBar: {
    height: 14,
    width: '60%',
    borderRadius: 7,
    backgroundColor: theme.colors.gray[200],
  },
  msgBar: {
    height: 12,
    width: '40%',
    borderRadius: 6,
    backgroundColor: theme.colors.gray[100],
  },
  timeBar: {
    height: 10,
    width: 30,
    borderRadius: 5,
    backgroundColor: theme.colors.gray[100],
  },
});

type ChatSearchNavigationProp = NativeStackNavigationProp<AppStackParamList>;

interface ChatSearchProps {
  visible: boolean;
  onClose: () => void;
}

const previewText = (item: ChatConversation) =>
  item.lastMessage?.content ||
  (item.lastMessage?.type === 'image'
    ? '📷 Images'
    : item.lastMessage?.type === 'video'
      ? '🎥 Videos'
      : item.lastMessage?.type === 'file'
        ? '📁 Files'
        : '');

export default function ChatSearch({ visible, onClose }: ChatSearchProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ChatSearchNavigationProp>();
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const debouncedSearch = useDebounce(query, 300);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ['conversations-search', debouncedSearch],
      queryFn: ({ pageParam = 1, signal }) =>
        getAllConversations(
          {
            page: pageParam,
            search: debouncedSearch,
            sort: '-updatedAt',
          },
          signal,
        ),
      initialPageParam: 1,
      getNextPageParam: lastPage => {
        const { currentPage, totalPages } = lastPage.meta;
        return currentPage < totalPages ? currentPage + 1 : undefined;
      },
      enabled: visible && debouncedSearch.length > 0,
    });

  const conversations = data?.pages.flatMap(page => page.data) ?? [];
  const hasQuery = debouncedSearch.length > 0;

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const onItemPress = (roomId: string) => {
    handleClose();
    navigation.navigate('ChatRoom', { roomId });
  };

  const renderItem = ({ item }: { item: ChatConversation }) => {
    const chatUser = item.members.find(
      _member => _member.user._id !== profile?._id,
    );
    const details: { photo?: string; name?: string } = {
      photo: chatUser?.user.photo,
      name: chatUser?.user.fullName,
    };

    if (item.type === 'group') {
      details.photo = item.groupPhoto;
      details.name = item.name;
    }

    return (
      <TouchableButton
        style={styles.chatCard}
        onPress={() => onItemPress(item._id!)}
      >
        <SmartAvatar
          src={details.photo}
          size={scale(42)}
          name={details.name}
          fontSize={fontSize(18)}
        />
        <View style={styles.itemBody}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {details.name}
          </Text>
          <Text style={styles.lastMsg} numberOfLines={1} ellipsizeMode="tail">
            {previewText(item)}
          </Text>
        </View>
        {item.lastMessage?.createdAt && (
          <Text style={styles.time}>
            {moment(item.lastMessage.createdAt).fromNow(true)}
          </Text>
        )}
      </TouchableButton>
    );
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={handleClose}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onShow={() => {
        // Force dark status-bar icons for the light modal (Android only).
        if (Platform.OS === 'android') {
          StatusBar.setBarStyle('dark-content');
        }
        // autoFocus marks the input focused without raising the keyboard, so
        // focus explicitly once the open animation has finished.
        setTimeout(
          () => inputRef.current?.focus(),
          Platform.OS === 'android' ? 150 : 50,
        );
      }}
    >
      {visible && Platform.OS === 'android' && (
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
      )}
      <View
        style={[
          styles.modalRoot,
          {
            paddingTop:
              Platform.OS === 'ios'
                ? insets.top
                : Math.max(insets.top, StatusBar.currentHeight ?? 0),
          },
        ]}
      >
        <View style={styles.searchHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.heading}>Search Chats</Text>
            <Pressable
              onPress={handleClose}
              hitSlop={spacing(10)}
              style={styles.closeBtn}
            >
              <X size={fontSize(20)} color={theme.colors.gray[700]} />
            </Pressable>
          </View>

          <View style={styles.searchField}>
            <SearchIcon size={fontSize(18)} color={theme.colors.gray[400]} />
            <TextInput
              ref={inputRef}
              placeholder="Search by name..."
              style={styles.searchFieldInput}
              placeholderTextColor={theme.colors.gray[400]}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={spacing(10)}
                style={styles.clearBtn}
              >
                <X size={fontSize(15)} color={theme.colors.gray[500]} />
              </Pressable>
            )}
          </View>
        </View>

        {isLoading && hasQuery ? (
          <View style={styles.listBg}>
            <SkeletonList />
          </View>
        ) : (
          <FlatList
            data={conversations}
            contentContainerStyle={[
              styles.searchContentContainer,
              conversations.length === 0 && styles.searchContentEmpty,
              { paddingBottom: insets.bottom + spacing(20) },
            ]}
            style={styles.listBg}
            renderItem={renderItem}
            keyExtractor={item => item._id ?? item.createdAt}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.6}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                  <Text style={styles.footerText}>Loading more...</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  {hasQuery ? (
                    <SearchX
                      size={fontSize(26)}
                      color={theme.colors.gray[400]}
                    />
                  ) : (
                    <SearchIcon
                      size={fontSize(26)}
                      color={theme.colors.gray[400]}
                    />
                  )}
                </View>
                <Text style={styles.emptyTitle}>
                  {hasQuery ? 'No conversations found' : 'Search chats'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {hasQuery
                    ? `We couldn't find anything for “${debouncedSearch.trim()}”`
                    : 'Start typing to find your conversations'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = createStyleSheet({
  modalRoot: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  searchHeader: {
    paddingHorizontal: spacing(20),
    paddingTop: spacing(14),
    paddingBottom: spacing(14),
    backgroundColor: theme.colors.white,
    gap: spacing(14),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: fontSize(22),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[950],
  },
  closeBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray[100],
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
    height: scale(46),
    paddingHorizontal: spacing(14),
    borderRadius: fontSize(14),
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  searchFieldInput: {
    flex: 1,
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(15),
    color: theme.colors.gray[900],
    padding: 0,
  },
  clearBtn: {
    width: scale(20),
    height: scale(20),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray[200],
  },
  listBg: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  searchContentContainer: {
    padding: spacing(16),
    paddingTop: spacing(14),
    gap: spacing(10),
  },
  searchContentEmpty: {
    flexGrow: 1,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: fontSize(14),
    backgroundColor: theme.colors.white,
    padding: spacing(12),
    shadowColor: theme.colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemBody: {
    flex: 1,
    gap: spacing(4),
  },
  name: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[900],
  },
  lastMsg: {
    fontSize: fontSize(13),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[500],
  },
  time: {
    fontSize: fontSize(12),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[400],
    alignSelf: 'flex-start',
  },
  footerLoader: {
    marginVertical: spacing(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(8),
  },
  footerText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[500],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(40),
    paddingBottom: spacing(60),
  },
  emptyIconCircle: {
    width: scale(72),
    height: scale(72),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray[100],
    marginBottom: spacing(16),
  },
  emptyTitle: {
    color: theme.colors.gray[800],
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(16),
    marginBottom: spacing(6),
    textAlign: 'center',
  },
  emptySubtitle: {
    color: theme.colors.gray[500],
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    textAlign: 'center',
    lineHeight: fontSize(19),
  },
});
