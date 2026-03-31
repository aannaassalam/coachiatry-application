import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
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
      <View style={{ flex: 1, gap: spacing(8) }}>
        <View style={skeletonStyles.nameBar} />
        <View style={skeletonStyles.msgBar} />
      </View>
      <View style={skeletonStyles.timeBar} />
    </Animated.View>
  );
};

const SkeletonList = () => (
  <View style={{ padding: spacing(20), paddingTop: spacing(10), gap: spacing(16) }}>
    {Array.from({ length: 6 }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </View>
);

const skeletonStyles = createStyleSheet({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
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

export default function ChatSearch({ visible, onClose }: ChatSearchProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ChatSearchNavigationProp>();
  const { profile } = useAuth();
  const [query, setQuery] = useState('');

  const debouncedSearch = useDebounce(query, 300);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
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
          fontSize={fontSize(20)}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {details.name}
          </Text>
          <Text style={styles.lastMsg} numberOfLines={1} ellipsizeMode="tail">
            {item.lastMessage?.content ||
              (item.lastMessage?.type === 'image'
                ? '📷 Images'
                : item.lastMessage?.type === 'video'
                  ? '🎥 Videos'
                  : item.lastMessage?.type === 'file'
                    ? '📁 Files'
                    : '')}
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
    >
      <View
        style={{
          flex: 1,
          paddingTop: Platform.OS === 'ios' ? insets.top : 0,
        }}
      >
        <View style={styles.searchHeader}>
          <Text style={styles.heading}>Search Chats</Text>
          <View style={styles.searchRow}>
            <TextInput
              placeholder="Search by name..."
              style={styles.searchInput}
              placeholderTextColor={theme.colors.gray[500]}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            <Pressable style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
        {isLoading && debouncedSearch.length > 0 ? (
          <SkeletonList />
        ) : (
          <FlatList
            data={conversations}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom },
            ]}
            style={{ backgroundColor: theme.colors.gray[50], flex: 1 }}
            renderItem={renderItem}
            keyExtractor={item => item._id ?? item.createdAt}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: theme.colors.gray[200],
                }}
              />
            )}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.6}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View
                  style={{
                    marginVertical: spacing(12),
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                >
                  <ActivityIndicator size="small" />
                  <Text>Loading more...</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing(40),
                }}
              >
                <Text
                  style={{
                    fontSize: fontSize(14),
                    color: theme.colors.gray[500],
                    fontStyle: 'italic',
                  }}
                >
                  {debouncedSearch
                    ? 'No conversations found'
                    : 'Start typing to search'}
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
  heading: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[950],
    textAlign: 'center',
  },
  searchHeader: {
    paddingHorizontal: spacing(20),
    paddingVertical: spacing(20),
    backgroundColor: '#fff',
    paddingBottom: spacing(10),
    gap: spacing(15),
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing(10),
    alignItems: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: 10,
    paddingHorizontal: spacing(15),
    paddingVertical: Platform.OS === 'ios' ? spacing(12) : spacing(10),
    flex: 1,
  },
  cancelBtn: {
    padding: spacing(5),
  },
  cancelText: {},
  listContent: {
    padding: spacing(20),
    paddingTop: spacing(10),
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    paddingVertical: spacing(12),
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
    marginTop: spacing(2),
  },
  time: {
    fontSize: fontSize(12),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[500],
  },
});
