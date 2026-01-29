import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { fontSize, spacing, verticalScale } from '../../utils';
import { ChevronLeft } from '../../assets';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { theme } from '../../theme';
import { User } from '../../typescript/interface/user.interface';
import * as yup from 'yup';
import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
} from '../../api/functions/user.api';
import { queryClient } from '../../../App';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../hooks/useAuth';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import AppInput from '../../components/ui/AppInput';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import AppButton from '../../components/ui/AppButton';
import { Modal } from 'react-native';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import TouchableButton from '../../components/TouchableButton';
import { Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onError } from '../../helpers/utils';

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  role: yup
    .string()
    .oneOf(['admin', 'manager', 'coach', 'user'], 'Invalid role')
    .required('Role is required'),
  // assignedCoach: yup.array().of(yup.string().required()).optional().default([]),
});

export function getAssignableUsersForDropdown(params: {
  allUsers: User[];
  creatorId: string;
  creatorRole: 'admin' | 'manager' | 'coach';
  targetRole: 'admin' | 'manager' | 'coach' | 'user';
}) {
  const { allUsers, creatorId, creatorRole, targetRole } = params;

  // ✅ Manager being created => assignable: admins
  if (targetRole === 'manager') {
    return {
      requiresAssignment: true,
      autoAssigned: false,
      options: allUsers
        .filter(u => u.role === 'admin')
        .map(u => ({
          image: u.photo,
          label: u.fullName,
          role: u.role,
          value: u._id,
        })),
    };
  }

  // ✅ Coach being created => assignable: managers
  if (targetRole === 'coach') {
    // Manager creates coach => auto assigned (no dropdown)
    if (creatorRole === 'manager') {
      return {
        requiresAssignment: false,
        autoAssigned: true,
        autoAssignedTo: [creatorId],
        options: [],
      };
    }

    // Admin creates coach => dropdown shows all managers
    if (creatorRole === 'admin') {
      return {
        requiresAssignment: true,
        autoAssigned: false,
        options: allUsers
          .filter(u => u.role === 'manager')
          .map(u => ({
            image: u.photo,
            label: u.fullName,
            role: u.role,
            value: u._id,
          })),
      };
    }

    // Others cannot create coach, but safe fallback
    return { requiresAssignment: false, autoAssigned: false, options: [] };
  }

  // ✅ User/patient being created => assignable: coaches
  if (targetRole === 'user') {
    // Coach creates user => auto assigned to self (no dropdown)
    if (creatorRole === 'coach') {
      return {
        requiresAssignment: false,
        autoAssigned: true,
        autoAssignedTo: [creatorId],
        options: [],
      };
    }

    // Admin creates user => all coaches are allowed
    if (creatorRole === 'admin') {
      return {
        requiresAssignment: true,
        autoAssigned: false,
        options: allUsers
          .filter(u => u.role === 'coach')
          .map(u => ({
            image: u.photo,
            label: u.fullName,
            role: u.role,
            value: u._id,
          })),
      };
    }

    // Manager creates user => only coaches under that manager
    if (creatorRole === 'manager') {
      return {
        requiresAssignment: true,
        autoAssigned: false,
        options: allUsers
          .filter(
            u =>
              u.role === 'coach' &&
              Array.isArray(u.assignedCoach) &&
              u.assignedCoach.includes(creatorId),
          )
          .map(u => ({
            image: u.photo,
            label: u.fullName,
            role: u.role,
            value: u._id,
          })),
      };
    }

    return { requiresAssignment: false, autoAssigned: false, options: [] };
  }

  // ✅ Admin being created: no assignment needed (or you can enforce rules)
  if (targetRole === 'admin') {
    return { requiresAssignment: false, autoAssigned: true, options: [] };
  }

  return { requiresAssignment: false, autoAssigned: false, options: [] };
}

const RenderMember = ({
  item,
  //   removable,
}: {
  item: { label: string; value: string; role: string; image: string };
  //   removable?: boolean;
}) => {
  return (
    <View style={styles.watcherRow}>
      <View style={styles.watcherLeft}>
        <SmartAvatar
          src={item.image}
          name={item.label}
          size={fontSize(40)}
          fontSize={fontSize(16)}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.watcherName}>{item.label}</Text>
          <Text style={styles.watcherEmail}>{item.role}</Text>
        </View>
      </View>
    </View>
  );
};

const FooterComponent = ({
  isAdding,
  mutate,
}: {
  isAdding: boolean;
  mutate: () => void;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingHorizontal: spacing(20),
        paddingTop: spacing(10),
        paddingBottom: insets.bottom + spacing(10),
        marginTop: 'auto',
      }}
    >
      <AppButton text="Done" onPress={mutate} isLoading={isAdding} />
    </View>
  );
};

export default function AddEditUser() {
  const { profile } = useAuth();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AppStackParamList, 'AddEditUser'>
    >();
  const route = useRoute<RouteProp<AppStackParamList, 'AddEditUser'>>();
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const [addPersonModal, setAddPersonModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<
    { label: string; role: string; value: string; image: string }[]
  >([]);
  const [members, setMembers] = useState<
    { label: string; role: string; value: string; image: string }[]
  >([]);

  const [
    { data: allUsers = [], isLoading },
    { data: user, isLoading: isUserLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: ['total-users'],
        queryFn: getAllUsers,
      },
      {
        queryKey: ['user', id],
        queryFn: () => getUserById(id ?? ''),
        enabled: !!id,
      },
    ],
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      form.reset();
      navigation.goBack();
      queryClient.invalidateQueries({ queryKey: ['total-users'] });
    },
    meta: {
      invalidateQueries: ['all-users'],
    },
  });

  const { mutate: edit, isPending: isEditing } = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      form.reset();
      navigation.goBack();
      queryClient.invalidateQueries({ queryKey: ['total-users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
    meta: {
      invalidateQueries: ['all-users'],
    },
  });

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
      // assignedCoach: [],
    },
    disabled: isPending || isEditing,
  });

  const { autoAssigned, options, requiresAssignment } =
    getAssignableUsersForDropdown({
      allUsers: allUsers.filter(u => u._id !== id),
      creatorId: profile?._id || '',
      creatorRole: profile?.role as 'admin' | 'manager' | 'coach',
      targetRole: form.watch('role'),
    });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.fullName,
        email: user.email,
        role: user.role,
      });
      setMembers(
        user.assignedCoach.map(ac => ({
          label: ac.fullName,
          value: ac._id,
          role: ac.role,
          image: ac.photo,
        })),
      );
      setSelectedUsers(
        user.assignedCoach.map(ac => ({
          label: ac.fullName,
          value: ac._id,
          role: ac.role,
          image: ac.photo,
        })),
      );
    }
  }, [user]);

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    mutate({ ...data, assignedCoach: members.map(mem => mem.value) });
  };

  const onEdit = (data: yup.InferType<typeof schema>) => {
    edit({
      userId: id!,
      ...data,
      assignedCoach: members.map(mem => mem.value),
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
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
          <Text style={styles.headerTitle}>Add User</Text>
          <View style={{ width: 24 }} />
        </View>
        {isUserLoading ? (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <>
            <FormProvider {...form}>
              <View style={{ gap: spacing(12) }}>
                <AppInput
                  label="Full Name"
                  name="name"
                  placeholder="Enter name"
                />
                <AppInput
                  label="Email Address"
                  name="email"
                  placeholder="Enter email address"
                  keyboardType="email-address"
                />
                <Controller
                  name="role"
                  control={form.control}
                  render={({ field }) => {
                    return (
                      <View>
                        <Text style={styles.label}>Role</Text>
                        <View style={styles.toggleButtons}>
                          {profile?.role === 'admin' && (
                            <>
                              <TouchableOpacity
                                style={[
                                  styles.toggleButton,
                                  field.value === 'admin' && {
                                    backgroundColor: theme.colors.primary,
                                  },
                                ]}
                                onPress={() => {
                                  setMembers([]);
                                  setSelectedUsers([]);
                                  field.onChange('admin');
                                }}
                              >
                                <Text
                                  style={[
                                    styles.toggleButtonText,
                                    field.value === 'admin' && {
                                      color: theme.colors.white,
                                    },
                                  ]}
                                >
                                  Admin
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.toggleButton,
                                  field.value === 'manager' && {
                                    backgroundColor: theme.colors.primary,
                                  },
                                ]}
                                onPress={() => {
                                  setMembers([]);
                                  setSelectedUsers([]);
                                  field.onChange('manager');
                                }}
                              >
                                <Text
                                  style={[
                                    styles.toggleButtonText,
                                    field.value === 'manager' && {
                                      color: theme.colors.white,
                                    },
                                  ]}
                                >
                                  Manager
                                </Text>
                              </TouchableOpacity>
                            </>
                          )}
                          <TouchableOpacity
                            style={[
                              styles.toggleButton,
                              field.value === 'coach' && {
                                backgroundColor: theme.colors.primary,
                              },
                            ]}
                            onPress={() => {
                              setMembers([]);
                              setSelectedUsers([]);
                              field.onChange('coach');
                            }}
                          >
                            <Text
                              style={[
                                styles.toggleButtonText,
                                field.value === 'coach' && {
                                  color: theme.colors.white,
                                },
                              ]}
                            >
                              Coach
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.toggleButton,
                              field.value === 'user' && {
                                backgroundColor: theme.colors.primary,
                              },
                            ]}
                            onPress={() => {
                              setMembers([]);
                              setSelectedUsers([]);
                              field.onChange('user');
                            }}
                          >
                            <Text
                              style={[
                                styles.toggleButtonText,
                                field.value === 'user' && {
                                  color: theme.colors.white,
                                },
                              ]}
                            >
                              Patient
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }}
                />
                {requiresAssignment && !autoAssigned && (
                  <View style={styles.watchersSection}>
                    <Text style={styles.sectionTitle}>Managed by</Text>
                    <FlatList
                      data={members}
                      keyExtractor={item => item.value}
                      renderItem={({ item }) => <RenderMember item={item} />}
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
                            No members added
                          </Text>
                        </View>
                      )}
                      ItemSeparatorComponent={() => (
                        <View style={styles.separator} />
                      )}
                    />

                    <View style={styles.bottomButtons}>
                      <AppButton
                        text={`+ ${id ? 'Edit' : 'Add'} Member`}
                        onPress={() => setAddPersonModal(true)}
                        variant="primary"
                        style={{
                          paddingVertical: spacing(8),
                          paddingHorizontal: spacing(14),
                        }}
                        textStyle={{ fontSize: fontSize(14) }}
                      />
                    </View>
                  </View>
                )}
              </View>
            </FormProvider>
            <AppButton
              text={id ? 'Save' : 'Submit'}
              onPress={form.handleSubmit(id ? onEdit : onSubmit, onError)}
              style={{ marginTop: 'auto' }}
              isLoading={isPending || isEditing}
            />
          </>
        )}

        <Modal
          visible={addPersonModal}
          onRequestClose={() => setAddPersonModal(false)}
          animationType="slide"
        >
          <View
            style={{
              flex: 1,
              paddingTop: Platform.OS === 'ios' ? insets.top : 0,
            }}
          >
            <View style={styles.searchHeader}>
              <Text style={styles.heading}>Add Member</Text>
              <View style={styles.searchRow}>
                <TextInput
                  placeholder="Search..."
                  style={styles.searchHeaderInput}
                  placeholderTextColor={theme.colors.gray[500]}
                  value={search}
                  onChangeText={val => setSearch(val)}
                  autoFocus
                />
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setAddPersonModal(false)}
                >
                  <Text>Cancel</Text>
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
              <>
                <KeyboardAwareFlatList
                  data={options.filter(
                    op =>
                      !search ||
                      op.label.toLowerCase().includes(search.toLowerCase()),
                  )}
                  contentContainerStyle={[
                    styles.searchContentContainer,
                    { paddingBottom: insets.bottom },
                  ]}
                  style={{
                    backgroundColor: theme.colors.gray[50],
                    flex: 1,
                  }}
                  keyExtractor={item => item.value}
                  renderItem={({ item }) => (
                    <TouchableButton
                      style={styles.watcherRow}
                      onPress={() =>
                        setSelectedUsers(prev =>
                          prev.find(p => p.value === item.value)
                            ? prev.filter(_p => _p.value !== item.value)
                            : [...prev, item],
                        )
                      }
                      // disabled={isAdding}
                    >
                      <View style={styles.watcherLeft}>
                        <SmartAvatar
                          src={item.image}
                          name={item.label}
                          size={fontSize(40)}
                          fontSize={fontSize(16)}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.watcherName}>{item.label}</Text>
                          <Text style={styles.watcherEmail}>{item.role}</Text>
                        </View>
                      </View>
                      {selectedUsers.find(s => s.value === item.value) && (
                        <Check
                          size={fontSize(14)}
                          color={theme.colors.gray[500]}
                        />
                      )}
                    </TouchableButton>
                  )}
                  ItemSeparatorComponent={() => (
                    <View
                      style={[styles.separator, { marginBottom: spacing(10) }]}
                    />
                  )}
                />
                <FooterComponent
                  isAdding={false}
                  mutate={() => {
                    setMembers(selectedUsers);
                    setAddPersonModal(false);
                  }}
                />
              </>
            )}
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    paddingTop: spacing(8),
    paddingHorizontal: spacing(20),
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingHorizontal: spacing(16),
    paddingBottom: spacing(30),
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[950],
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: fontSize(10),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(14),
    fontSize: fontSize(14),
    color: theme.colors.gray[900],
    backgroundColor: theme.colors.white,
  },
  label: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[950],
    marginBottom: spacing(8),
  },
  toggleButtons: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.gray[400],
    padding: spacing(4),
    borderRadius: spacing(10),
  },
  toggleButton: {
    padding: spacing(10),
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderRadius: spacing(7),
  },
  toggleButtonText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(14),
    color: theme.colors.gray[500],
  },
  heading: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[950],
    textAlign: 'center',
  },
  searchContentContainer: {
    padding: spacing(20),
    paddingHorizontal: spacing(20),
    paddingTop: spacing(15),
    // alignItems: 'center',
    // justifyContent: 'center',
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
    paddingHorizontal: Platform.OS === 'ios' ? spacing(15) : spacing(15),
    paddingVertical: Platform.OS === 'ios' ? spacing(12) : spacing(10),
    flex: 1,
  },
  cancelBtn: {
    padding: spacing(5),
  },
  watchersSection: {
    // paddingHorizontal: spacing(16),
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
    paddingRight: spacing(16),
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
  bottomButtons: {
    flexDirection: 'row',
    gap: spacing(10),
    justifyContent: 'flex-end',
    marginTop: spacing(40),
    marginBottom: spacing(16),
  },
});
