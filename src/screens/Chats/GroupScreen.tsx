import React, { useEffect, useState } from 'react';
import {
  KeyboardAwareFlatList,
  KeyboardAwareScrollView,
} from 'react-native-keyboard-aware-scroll-view';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { theme } from '../../theme';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import TouchableButton from '../../components/TouchableButton';
import { fontSize, scale, spacing, verticalScale } from '../../utils';
import { ChevronLeft } from '../../assets';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import { FormProvider, set, useForm } from 'react-hook-form';
import AppInput from '../../components/ui/AppInput';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import { useDebounce } from '../../hooks/useDebounce';
import AppButton from '../../components/ui/AppButton';
import Lucide from '@react-native-vector-icons/lucide';
import { getUserSuggestions } from '../../api/functions/user.api';
import { User } from '../../typescript/interface/user.interface';
import {
  createGroup,
  editGroup,
  getConversation,
  leaveGroup,
} from '../../api/functions/chat.api';
import { queryClient } from '../../../App';
import { AppStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const RenderMember = ({
  item,
  //   removable,
}: {
  item: Pick<User, '_id' | 'fullName' | 'email' | 'photo'>;
  //   removable?: boolean;
}) => {
  // const route = useRoute<RouteProp<AppStackParamList, 'GroupScreen'>>();
  // const roomId = route.params?.roomId;

  // const { mutate: removeMember, isPending: isRemoving } = useMutation({
  //   mutationFn: editGroup,
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['conversations', roomId] });
  //     //   navigation.goBack();
  //   },
  //   meta: {
  //     showToast: false,
  //     invalidateQueries: ['conversations'],
  //   },
  // });

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
          <Text style={styles.watcherEmail}>{item.email}</Text>
        </View>
      </View>
      {/* {removable && (
        <TouchableButton
          style={styles.revokeButton}
          onPress={() =>
            Alert.alert(
              'Revoke Access',
              'Are you sure you want to revoke access from this user?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Revoke',
                  style: 'destructive',
                    // onPress: () => removeMember({chatId:roomId||'', members: }),
                },
              ],
            )
          }
        >
          <Text style={styles.revokeText}>Remove</Text>
        </TouchableButton>
      )} */}
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

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
});

export default function GroupScreen() {
  const { profile } = useAuth();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AppStackParamList, 'GroupScreen'>
    >();
  const route = useRoute<RouteProp<AppStackParamList, 'GroupScreen'>>();
  const roomId = route.params?.roomId;
  const byCoach = route.params?.byCoach;
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState<string | null>(null);
  const [imageData, setImageData] = useState<Asset | null>(null);
  const [addPersonModal, setAddPersonModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<
    Pick<User, '_id' | 'fullName' | 'email' | 'photo'>[]
  >([]);
  const [members, setMembers] = useState<
    Pick<User, '_id' | 'fullName' | 'email' | 'photo'>[]
  >([]);

  const debouncedSearch = useDebounce(search, 300);

  const [
    { data: groupData, isLoading },
    { data = [], isLoading: isPeopleLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: ['conversations', roomId],
        queryFn: () => getConversation(roomId ?? ''),
        enabled: !!roomId,
      },
      {
        queryKey: ['suggest-users', debouncedSearch, 'group-users'],
        queryFn: () => getUserSuggestions(debouncedSearch, 'group'),
      },
    ],
  });

  const isAdmin =
    groupData?.members?.find(mem => mem.user._id === profile?._id)?.role ===
    'owner';

  const { mutate, isPending } = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      setPhoto('');
      form.reset({
        name: '',
      });
      navigation.goBack();
    },
    meta: {
      invalidateQueries: ['conversations'],
    },
  });

  const { mutate: editMutate, isPending: isEditing } = useMutation({
    mutationFn: editGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', roomId] });
      navigation.goBack();
    },
    meta: {
      invalidateQueries: ['conversations'],
    },
  });

  const { mutate: leave, isPending: isLeaving } = useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => {
      navigation.pop(2);
      //   setRoom(null);
    },
    meta: {
      invalidateQueries: ['conversations'],
    },
  });

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
    },
    disabled: isPending || isEditing || (!isAdmin && !!roomId),
  });

  useEffect(() => {
    if (groupData) {
      console.log(groupData);
      form.reset({
        name: groupData?.name,
      });
      setMembers(
        groupData?.members.map(_mem => ({
          _id: _mem.user._id,
          fullName: _mem.user.fullName,
          email: _mem.user.email,
          photo: _mem.user.photo,
        })) || [],
      );
      setSelectedUsers(
        groupData?.members.map(_mem => ({
          _id: _mem.user._id,
          fullName: _mem.user.fullName,
          email: _mem.user.email,
          photo: _mem.user.photo,
        })) || [],
      );
      setPhoto(groupData?.groupPhoto || null);
    }
  }, [form, groupData]);

  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxHeight: 1080,
        maxWidth: 1080,
        quality: 0.9,
        selectionLimit: 1,
      },
      response => {
        if (response.didCancel) return;
        if (!response.didCancel && response.assets && response.assets[0].uri) {
          setPhoto(response.assets[0].uri);
          setImageData(response.assets[0]);
        }
      },
    );
  };

  const handleSubmit = (formData: yup.InferType<typeof schema>) => {
    if (!roomId && typeof photo !== 'string')
      mutate({
        ...formData,
        groupPhoto: imageData,
        members: members.map(m => m._id),
      });
    if (roomId)
      editMutate({
        ...formData,
        groupPhoto: imageData,
        chatId: roomId,
        members: members.map(m => m._id),
      });
  };

  return (
    <KeyboardAwareScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
      style={{ backgroundColor: theme.colors.white }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableButton
          style={{ paddingHorizontal: spacing(5), paddingVertical: spacing(3) }}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft />
        </TouchableButton>
        <Text style={styles.headerTitle}>
          {roomId ? 'Edit' : 'Create'} group
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing(10),
          }}
        >
          <ActivityIndicator size="small" color={theme.colors.black} />
          <Text
            style={{ fontSize: fontSize(14), color: theme.colors.gray[700] }}
          >
            Fetching details
          </Text>
        </View>
      ) : (
        <>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableButton
              activeOpacity={0.8}
              style={styles.avatarWrapper}
              onPress={pickImage}
              disabled={!isAdmin && !!roomId}
            >
              <SmartAvatar
                src={photo}
                name="C"
                imageStyle={styles.avatar}
                fontSize={fontSize(34)}
                size={scale(100)}
                key={new Date().toDateString()}
              />
            </TouchableButton>

            {isAdmin && !!roomId && (
              <TouchableButton onPress={pickImage} activeOpacity={0.8}>
                <Text style={styles.changePhoto}>Change Photo</Text>
              </TouchableButton>
            )}
          </View>

          {/* Input Fields */}
          <View style={styles.form}>
            <FormProvider {...form}>
              <AppInput label="Name" placeholder="Enter name" name="name" />
            </FormProvider>
          </View>
          <View style={styles.watchersSection}>
            <Text style={styles.sectionTitle}>Members</Text>
            <FlatList
              data={members}
              keyExtractor={item => item._id}
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
                    No members
                  </Text>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />

            {(!roomId || isAdmin) && (
              <View style={styles.bottomButtons}>
                <AppButton
                  text={`+ ${roomId ? 'Edit' : 'Add'} Member`}
                  onPress={() => setAddPersonModal(true)}
                  variant="primary"
                  style={{
                    paddingVertical: spacing(8),
                    paddingHorizontal: spacing(14),
                  }}
                  textStyle={{ fontSize: fontSize(14) }}
                />
              </View>
            )}
          </View>
          <View
            style={{
              marginTop: 'auto',
            }}
          >
            {members.find(m => m._id === profile?._id) && !byCoach && (
              <AppButton
                text="Leave Group"
                variant="outline"
                style={{ marginBottom: spacing(10) }}
                onPress={() => leave(roomId || '')}
                isLoading={isLeaving}
              />
            )}
            {(!roomId || isAdmin) && (
              <AppButton
                text={roomId ? 'Save Changes' : 'Create Group'}
                onPress={form.handleSubmit(handleSubmit)}
                isLoading={isPending || isEditing}
              />
            )}
          </View>
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
            <Text style={styles.heading}>Add Person</Text>
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
          {isPeopleLoading ? (
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
                data={data}
                contentContainerStyle={[
                  styles.searchContentContainer,
                  { paddingBottom: insets.bottom },
                ]}
                style={{
                  backgroundColor: theme.colors.gray[50],
                  flex: 1,
                }}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                  <TouchableButton
                    style={styles.watcherRow}
                    onPress={() =>
                      setSelectedUsers(prev =>
                        prev.find(p => p._id === item._id)
                          ? prev.filter(_p => _p._id !== item._id)
                          : [...prev, item],
                      )
                    }
                    // disabled={isAdding}
                  >
                    <View style={styles.watcherLeft}>
                      <SmartAvatar
                        src={item.photo}
                        name={item.fullName}
                        size={fontSize(40)}
                        fontSize={fontSize(16)}
                      />
                      <View>
                        <Text style={styles.watcherName}>{item.fullName}</Text>
                        <Text style={styles.watcherEmail}>{item.email}</Text>
                      </View>
                    </View>
                    {selectedUsers.find(s => s._id === item._id) && (
                      <Lucide
                        name="check"
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
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: spacing(16),
    backgroundColor: theme.colors.white,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(14),
    marginBottom: spacing(20),
    // paddingHorizontal: spacing(16),
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[950],
  },
  avatarSection: {
    alignItems: 'center',
    // justifyContent: 'center',
    marginBottom: spacing(24),
  },
  avatarWrapper: {
    borderRadius: fontSize(50),
    overflow: 'hidden',
  },
  avatar: {
    // width: fontSize(100),
    // height: fontSize(100),
    // borderRadius: fontSize(50),
  },
  changePhoto: {
    marginTop: spacing(8),
    color: theme.colors.primary,
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(13),
  },
  form: {
    gap: spacing(16),
  },
  label: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[800],
    marginBottom: spacing(6),
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
  },
  watcherEmail: {
    fontSize: fontSize(13),
    color: theme.colors.gray[600],
    fontFamily: theme.fonts.lato.regular,
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
  revokeButton: {
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: fontSize(6),
    paddingVertical: spacing(6),
    paddingHorizontal: spacing(10),
  },
  revokeText: {
    color: theme.colors.gray[900],
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(12),
  },
});
