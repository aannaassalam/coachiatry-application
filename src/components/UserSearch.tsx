import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  Search as SearchIcon,
  SearchX,
  X,
} from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createStyleSheet } from 'react-native-unistyles';
import { getUsers } from '../api/functions/user.api';
import { useDebounce } from '../hooks/useDebounce';
import { theme } from '../theme';
import { AppStackParamList } from '../types/navigation';
import { User } from '../typescript/interface/user.interface';
import { fontSize, scale, spacing } from '../utils';
import TouchableButton from './TouchableButton';
import { Skeleton } from './ui/Skeleton';
import { SmartAvatar } from './ui/SmartAvatar';

type UserSearchNavigationProp = NativeStackNavigationProp<AppStackParamList>;

interface UserSearchProps {
  visible: boolean;
  onClose: () => void;
}

const UserResultsSkeleton = () => (
  <View style={styles.skeletonWrap}>
    {[0, 1, 2, 3, 4, 5].map(i => (
      <View key={i} style={styles.userCard}>
        <Skeleton width={scale(42)} height={scale(42)} borderRadius={999} />
        <View style={styles.skeletonBody}>
          <Skeleton width="55%" height={14} borderRadius={5} />
          <Skeleton width="30%" height={12} borderRadius={5} />
        </View>
      </View>
    ))}
  </View>
);

export default function UserSearch({ visible, onClose }: UserSearchProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<UserSearchNavigationProp>();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const debouncedSearch = useDebounce(query, 300);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ['users-search', debouncedSearch],
      queryFn: ({ pageParam = 1, signal }) =>
        getUsers({ search: debouncedSearch, page: pageParam }, signal),
      initialPageParam: 1,
      getNextPageParam: lastPage => {
        const { currentPage, totalPages } = lastPage.meta;
        return currentPage < totalPages ? currentPage + 1 : undefined;
      },
      enabled: visible,
    });

  const users = data?.pages.flatMap(page => page.data) ?? [];
  const hasQuery = !!debouncedSearch.trim();

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const onItemPress = (id: string) => {
    handleClose();
    navigation.navigate('UserDetails', { id });
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableButton
      style={styles.userCard}
      onPress={() => onItemPress(item._id)}
    >
      <SmartAvatar
        src={item.photo}
        size={scale(42)}
        name={item.fullName}
        fontSize={fontSize(18)}
      />
      <View style={styles.itemBody}>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {item.fullName}
        </Text>
        {!!item.role && (
          <Text style={styles.role} numberOfLines={1} ellipsizeMode="tail">
            {item.role}
          </Text>
        )}
      </View>
      <ChevronRight size={fontSize(18)} color={theme.colors.gray[300]} />
    </TouchableButton>
  );

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
            <Text style={styles.heading}>Search Users</Text>
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

        {isLoading ? (
          <View style={styles.listBg}>
            <UserResultsSkeleton />
          </View>
        ) : (
          <KeyboardAwareFlatList
            data={users}
            contentContainerStyle={[
              styles.searchContentContainer,
              users.length === 0 && styles.searchContentEmpty,
              { paddingBottom: insets.bottom + spacing(20) },
            ]}
            style={styles.listBg}
            renderItem={renderItem}
            keyExtractor={item => item._id}
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
                  {hasQuery ? 'No users found' : 'Search users'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {hasQuery
                    ? `We couldn't find anyone for “${debouncedSearch.trim()}”`
                    : 'Start typing to find people by name'}
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
  skeletonWrap: {
    padding: spacing(16),
    paddingTop: spacing(14),
    gap: spacing(10),
  },
  skeletonBody: {
    flex: 1,
    gap: spacing(8),
  },
  userCard: {
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
  role: {
    fontSize: fontSize(12),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[500],
    textTransform: 'capitalize',
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
