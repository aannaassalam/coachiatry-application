import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AppHeader from '../../components/ui/AppHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { fontSize, scale, spacing } from '../../utils';
import { Image } from 'react-native';
import AppButton from '../../components/ui/AppButton';
import { Modal } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getClients } from '../../api/functions/coach.api';
import { User } from '../../typescript/interface/user.interface';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import { getUsers } from '../../api/functions/user.api';

type ClientScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'UserDetails'
>;

export default function Users() {
  const navigation = useNavigation<ClientScreenNavigationProp>();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ['all-users'],
    queryFn: ({ pageParam = 1 }) => getUsers({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const { currentPage, totalPages } = lastPage.meta;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });

  const users = data?.pages.flatMap(page => page.data) ?? [];

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.userCard}
      onPress={() => navigation.navigate('UserDetails', { id: item._id })}
    >
      <View style={styles.userInfo}>
        <SmartAvatar
          src={item.photo}
          size={scale(48)}
          name={item.fullName}
          fontSize={fontSize(22)}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {item.fullName}
          </Text>
          <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
            {item.role}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader heading="Users & Permissions" showSearch />
      {/* <View style={{ paddingHorizontal: spacing(16) }}>
        <View style={styles.buttonContainer}>
          <Pressable style={styles.filterIcon} onPress={() => {}}>
            <Image source={assets.icons.filter} style={styles.sortIcon} />
          </Pressable>
          <Pressable style={styles.filterIcon} onPress={() => {}}>
            <Image source={assets.icons.sort} style={styles.sortIcon} />
          </Pressable>
          <AppButton
            text="Add a New Client"
            onPress={() => {}}
            variant="secondary-outline"
            style={{
              padding: spacing(8),
              borderRadius: fontSize(6),
              marginLeft: 'auto',
            }}
            textStyle={{ fontSize: fontSize(14) }}
          />
        </View>
      </View> */}
      {/* <ScrollView showsVerticalScrollIndicator={false}> */}
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            // marginTop: spacing(6),
            paddingHorizontal: spacing(16),
            paddingBottom: spacing(4),
          }}
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
                  gap: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ActivityIndicator size="small" />
                <Text>Loading more users...</Text>
              </View>
            ) : null
          }
        />
      )}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.addBtn}
        onPress={() => navigation.navigate('AddEditUser', {})}
      >
        <Ionicons name="add" size={25} color={theme.colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
    position: 'relative',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing(12),
    alignItems: 'center',
    marginTop: spacing(6),
    paddingBottom: spacing(6),
  },
  filterIcon: {
    padding: spacing(7),
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.colors.gray[200],
  },
  sortIcon: {
    width: 20,
    height: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(14),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    flex: 1,
  },
  name: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.regular,
    color: theme.colors.gray[900],
  },
  email: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[500],
    marginTop: spacing(6),
    textTransform: 'capitalize',
  },
  rightInfo: {
    alignItems: 'flex-end',
    gap: spacing(6),
    width: fontSize(60),
  },
  age: {
    fontSize: fontSize(13),
    fontFamily: theme.fonts.archivo.regular,
    color: theme.colors.gray[900],
  },
  gender: {
    fontSize: fontSize(13),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[600],
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000060',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(16),
    padding: spacing(20),
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalName: {
    fontSize: fontSize(20),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[950],
    marginBottom: spacing(6),
    marginTop: spacing(10),
  },
  modalEmail: {
    fontSize: fontSize(16),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[600],
    marginBottom: spacing(18),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing(10),
    width: '100%',
    marginTop: spacing(6),
  },
  addBtn: {
    position: 'absolute',
    bottom: spacing(16),
    right: spacing(16),
    padding: spacing(10),
    backgroundColor: theme.colors.primary,
    borderRadius: 100,
  },
});
