import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
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
import { SmartAvatar } from './ui/SmartAvatar';
import TouchableButton from './TouchableButton';

type UserSearchNavigationProp = NativeStackNavigationProp<AppStackParamList>;

interface UserSearchProps {
  visible: boolean;
  onClose: () => void;
}

export default function UserSearch({ visible, onClose }: UserSearchProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<UserSearchNavigationProp>();
  const [query, setQuery] = useState('');

  const debouncedSearch = useDebounce(query, 300);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['users-search', debouncedSearch],
    queryFn: ({ pageParam = 1 }) =>
      getUsers({ search: debouncedSearch, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const { currentPage, totalPages } = lastPage.meta;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: visible,
  });

  const users = data?.pages.flatMap(page => page.data) ?? [];

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
        fontSize={fontSize(20)}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {item.fullName}
        </Text>
        <Text style={styles.role} numberOfLines={1} ellipsizeMode="tail">
          {item.role}
        </Text>
      </View>
    </TouchableButton>
  );

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
          <Text style={styles.heading}>Search Users</Text>
          <View style={styles.searchRow}>
            <TextInput
              placeholder="Search by name..."
              style={styles.searchHeaderInput}
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
        {isLoading ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <KeyboardAwareFlatList
            data={users}
            contentContainerStyle={[
              styles.searchContentContainer,
              { paddingBottom: insets.bottom },
            ]}
            style={{
              backgroundColor: theme.colors.gray[50],
              flex: 1,
            }}
            renderItem={renderItem}
            keyExtractor={item => item._id}
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
                  {debouncedSearch ? 'No users found' : 'Start typing to search'}
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
  searchHeaderInput: {
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
  searchContentContainer: {
    padding: spacing(20),
    paddingTop: spacing(10),
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    paddingVertical: spacing(12),
  },
  name: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.regular,
    color: theme.colors.gray[900],
  },
  role: {
    fontSize: fontSize(13),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[500],
    marginTop: spacing(4),
    textTransform: 'capitalize',
  },
});
