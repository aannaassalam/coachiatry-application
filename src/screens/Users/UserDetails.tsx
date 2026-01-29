import React, { useMemo } from 'react';
import Animated from 'react-native-reanimated';
import { fontSize, scale, spacing, verticalScale } from '../../utils';
import { theme } from '../../theme';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeft } from '../../assets';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import AppButton from '../../components/ui/AppButton';
import { useMutation, useQueries } from '@tanstack/react-query';
import {
  deleteUser,
  getAllUsers,
  getUserById,
} from '../../api/functions/user.api';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AppStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { User } from '../../typescript/interface/user.interface';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu';
import TouchableButton from '../../components/TouchableButton';
import { Pencil } from 'lucide-react-native';
import { hapticOptions } from '../../helpers/utils';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';
import { queryClient } from '../../../App';
import { PaginatedResponse } from '../../typescript/interface/common.interface';
import { showMessage } from 'react-native-flash-message';

const RenderWatcher = ({ item }: { item: User }) => {
  return (
    <View style={styles.watcherRow}>
      <View style={styles.watcherLeft}>
        <SmartAvatar
          src={item.photo}
          name={item.fullName}
          size={fontSize(40)}
          fontSize={fontSize(16)}
        />
        <View>
          <Text style={styles.watcherName}>{item.fullName}</Text>
          <Text style={styles.watcherEmail}>{item.role}</Text>
        </View>
      </View>
    </View>
  );
};

export default function UserDetails() {
  const route = useRoute<RouteProp<AppStackParamList, 'UserDetails'>>();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AppStackParamList, 'UserDetails'>
    >();
  const { id } = route.params;

  const [
    { data, isLoading },
    { data: allUsers, isLoading: isAllUsersLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: ['user', id],
        queryFn: () => getUserById(id),
      },
      {
        queryKey: ['total-users'],
        queryFn: getAllUsers,
      },
    ],
  });

  const { mutate: userDelete, isPending: isDeleting } = useMutation({
    mutationFn: deleteUser,
    onMutate: async (id: string) => {
      showMessage({
        type: 'info',
        message: 'Deleting...',
        description: 'Deleting user, Please wait...',
      });
      await queryClient.cancelQueries({
        queryKey: ['all-users'],
      });

      const previousData = queryClient.getQueryData<{
        pages: PaginatedResponse<User[]>[];
        pageParams: number[];
      }>(['all-users']);

      if (!previousData) {
        return { previousData };
      }

      const updatedPages = previousData.pages.map(page => {
        const filteredData = page.data.filter(user => user._id !== id);

        const removedCount = page.data.length - filteredData.length;

        if (removedCount === 0) return page;

        const newTotalCount = Math.max(page.meta.totalCount - removedCount, 0);

        return {
          ...page,
          data: filteredData,
          meta: {
            ...page.meta,
            totalCount: newTotalCount,
            totalPages: Math.max(Math.ceil(newTotalCount / page.meta.limit), 1),
          },
        };
      });

      queryClient.setQueryData(['all-users'], {
        ...previousData,
        pages: updatedPages,
      });

      return { previousData };
    },
    onSuccess: () => {
      navigation.goBack();
      queryClient.invalidateQueries({ queryKey: ['total-users'] });
    },
    meta: {
      invalidateQueries: ['all-users'],
    },
  });

  const managedBy = useMemo(() => {
    if (!data || !allUsers) return [];

    return allUsers.filter(user =>
      data.assignedCoach.map(ac => ac._id).includes(user._id),
    );
  }, [data, allUsers]);

  console.log(data);

  const isAllLoading = isLoading || isAllUsersLoading || isDeleting;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            paddingHorizontal: spacing(5),
            paddingVertical: spacing(3),
          }}
        >
          <ChevronLeft />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Details</Text>
        <Menu
          renderer={renderers.Popover}
          onOpen={() =>
            ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions)
          }
          rendererProps={{
            placement: 'bottom',
          }}
        >
          <MenuTrigger
            customStyles={{
              TriggerTouchableComponent: TouchableButton,
              triggerTouchable: {
                activeOpacity: 0.5,
              },
            }}
            style={styles.iconButton}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={fontSize(22)}
              color={theme.colors.gray[600]}
            />
          </MenuTrigger>
          <MenuOptions
            customStyles={{
              optionsContainer: {
                width: scale(100),
                borderRadius: 10,
                paddingVertical: scale(5),
              },
            }}
          >
            <MenuOption
              style={styles.option}
              onSelect={() =>
                navigation.navigate('AddEditUser', { id: data?._id })
              }
            >
              <Pencil color={theme.colors.gray[900]} size={fontSize(16)} />
              <Text style={styles.optionText}>Edit</Text>
            </MenuOption>
            <MenuOption
              value={1}
              style={styles.option}
              onSelect={() =>
                Alert.alert(
                  'Delete Document',
                  'Are you sure you want to delete this document?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => userDelete(data?._id as string),
                    },
                  ],
                )
              }
            >
              <Octicons name="trash" color="#ef4444" size={fontSize(16)} />
              <Text style={[styles.optionText, { color: '#ef4444' }]}>
                Delete
              </Text>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>
      <ScrollView
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: spacing(30), flexGrow: 1 }}
        // bounces={false}
        scrollEnabled={!isAllLoading}
        style={{ backgroundColor: theme.colors.white }}
      >
        {/* BIG HEADER (part of scroll content) */}
        {/* top row: back arrow centered title uses spacing to match small header layout */}
        {isAllLoading ? (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <>
            <View style={styles.profileCenter}>
              <SmartAvatar
                src={data?.photo}
                name={data?.fullName}
                size={scale(70)}
                style={{ marginBottom: spacing(12) }}
                fontSize={fontSize(36)}
              />
              <View style={{ flex: 1, gap: spacing(8) }}>
                <Text style={styles.bigName}>{data?.fullName}</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 6,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={[styles.bigEmail, { textTransform: 'capitalize' }]}
                  >
                    {data?.role}
                  </Text>
                  <View
                    style={{
                      width: scale(5),
                      height: scale(5),
                      backgroundColor: theme.colors.gray[400],
                      borderRadius: 10,
                      marginTop: 2,
                    }}
                  />
                  <Text style={styles.bigEmail}>{data?.email}</Text>
                </View>
                <AppButton
                  text="View Details"
                  onPress={() =>
                    navigation.navigate('ClientDetails', {
                      userId: id,
                      fromUsersScreen: true,
                    })
                  }
                  variant="secondary-outline"
                  style={{
                    padding: spacing(8),
                    borderRadius: fontSize(6),
                    alignSelf: 'flex-start',
                  }}
                  textStyle={{ fontSize: fontSize(14) }}
                />
              </View>
            </View>
            <View style={styles.watchersSection}>
              <Text style={styles.sectionTitle}>Managed by</Text>
              <FlatList
                data={managedBy}
                keyExtractor={item => item._id}
                renderItem={({ item }) => <RenderWatcher item={item} />}
                scrollEnabled={false}
                contentContainerStyle={{
                  gap: spacing(12),
                  marginTop: spacing(10),
                }}
                ListEmptyComponent={() => (
                  <View
                    style={{
                      height: verticalScale(50),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: fontSize(12),
                        fontStyle: 'italic',
                        color: theme.colors.gray[500],
                      }}
                    >
                      This user is not managed by anyone
                    </Text>
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    paddingTop: spacing(8),
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(16),
    // paddingBottom: spacing(30),
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[950],
  },

  profileCenter: {
    gap: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(16),
  },
  bigName: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[900],
  },
  bigEmail: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[600],
  },

  extraRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing(12),
    width: '100%',
    paddingHorizontal: spacing(12),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
  },

  //   buttonRow: {
  //     flexDirection: 'row',
  //     gap: spacing(10),
  //     width: '100%',
  //     marginTop: spacing(16),
  //     paddingHorizontal: spacing(16),
  //   },
  emptyContainer: {
    marginTop: spacing(30),
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.gray[500],
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
  },
  watchersSection: {
    paddingHorizontal: spacing(16),
    paddingTop: spacing(16),
    marginTop: spacing(10),
    backgroundColor: theme.colors.white,
  },
  sectionTitle: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[700],
    marginBottom: spacing(10),
  },
  watcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  watcherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
  },
  watcherName: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[900],
    marginBottom: spacing(4),
  },
  watcherEmail: {
    fontSize: fontSize(13),
    color: theme.colors.gray[600],
    fontFamily: theme.fonts.lato.regular,
    textTransform: 'capitalize',
  },
  separator: {
    height: 1,
    marginTop: spacing(10),
    backgroundColor: theme.colors.gray[200],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
  },
  optionText: {
    fontSize: fontSize(16),
  },
  iconButton: {
    padding: spacing(4),
    paddingHorizontal: spacing(10),
  },
});
