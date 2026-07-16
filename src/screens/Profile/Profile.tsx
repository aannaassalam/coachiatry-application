import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AppButton from '../../components/ui/AppButton';
import AvatarListSkeleton from '../../components/skeletons/AvatarListSkeleton';
import DetailScreenSkeleton from '../../components/skeletons/DetailScreenSkeleton';
import { theme } from '../../theme';
import { fontSize, scale, spacing, verticalScale } from '../../utils';
// or 'react-native-vector-icons/Octicons'
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueries } from '@tanstack/react-query';
import { useState } from 'react';
import { showMessage } from 'react-native-flash-message';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { queryClient } from '../../../App';
import {
  addWatchers,
  deleteMyAccount,
  findWatcherByEmail,
  getMyProfile,
  getUserSuggestions,
  inviteWatchersByEmail,
  revokeViewAccess,
} from '../../api/functions/user.api';
import { ChevronLeft } from '../../assets';
import TouchableButton from '../../components/TouchableButton';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import { getToken, removeToken } from '../../helpers/token-storage';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { AppStackParamList } from '../../types/navigation';
import { User } from '../../typescript/interface/user.interface';
import { removeFCMToken } from '../../api/functions/auth.api';
import messaging from '@react-native-firebase/messaging';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Check, Mail, Pencil, Trash2, UserPlus, X } from 'lucide-react-native';

type SelectedUser = Pick<User, '_id' | 'fullName' | 'email' | 'photo'>;

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'EditProfile'
>;

const RenderWatcher = ({ item }: { item: User }) => {
  const { mutate: revokeMutate, isPending: isRevoking } = useMutation({
    mutationFn: revokeViewAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    meta: {
      invalidateQueries: ['settings-profile'],
    },
  });

  return (
    <View style={styles.watcherRow}>
      <View style={styles.watcherLeft}>
        <SmartAvatar
          src={item.photo}
          name={item.fullName}
          size={fontSize(40)}
        />
        <View>
          <Text style={styles.watcherName}>{item.fullName}</Text>
          <Text style={styles.watcherEmail}>{item.email}</Text>
        </View>
      </View>
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
                onPress: () => revokeMutate(item._id),
              },
            ],
          )
        }
      >
        <Text style={styles.revokeText}>Revoke</Text>
      </TouchableButton>
    </View>
  );
};

const FooterComponent = ({
  isAdding,
  mutate,
  label = 'Add',
  disabled = false,
}: {
  isAdding: boolean;
  mutate: () => void;
  label?: string;
  disabled?: boolean;
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
      <AppButton
        text={label}
        onPress={mutate}
        isLoading={isAdding}
        disabled={disabled}
      />
    </View>
  );
};

export default function Profile() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { setAuthData } = useAuth();
  const [addPersonModal, setAddPersonModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  const [
    { data: profile, isLoading },
    { data = [], isLoading: isPeopleLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: ['settings-profile'],
        queryFn: ({ signal }: { signal: AbortSignal }) => getMyProfile(signal),
      },
      {
        queryKey: ['suggest-users', debouncedSearch, 'watchers'],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          getUserSuggestions(debouncedSearch, 'watchers', signal),
      },
    ],
  });

  const [isSigningOut, setIsSigningOut] = useState(false);

  // Tear down the local session: clear cached data, drop the FCM token (both on
  // the backend and locally), sign out of Google, and wipe the stored auth
  // token. Shared by the Logout and Delete Account flows.
  const clearSession = async () => {
    queryClient.clear();
    const token = await getToken();
    if (token) {
      // Best-effort; on delete the account may already be gone.
      await removeFCMToken(token).catch(() => {});
    }
    await GoogleSignin.signOut().catch(() => {});
    await messaging().deleteToken();
    await removeToken();

    setAuthData({ token: '', user: null });
  };

  const signOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await clearSession();
    } catch (err) {
      console.log(err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const { mutate: deleteAccountMutate, isPending: isDeletingAccount } =
    useMutation({
      mutationFn: deleteMyAccount,
      // Show the full-screen loader (same overlay as logout) for the whole
      // delete → sign-out sequence, so it stays up continuously through the
      // session teardown rather than flickering off when the request settles.
      onMutate: () => {
        setIsSigningOut(true);
      },
      // Deletion is a soft delete on the backend (account deactivated). Once it
      // succeeds we tear down the local session so the user lands back on auth.
      onSuccess: async () => {
        showMessage({
          message: 'Account deleted',
          description: 'Your account has been deleted.',
          type: 'success',
        });
        await clearSession();
      },
      onError: () => {
        setIsSigningOut(false);
        showMessage({
          message: 'Error',
          description: 'Could not delete your account. Please try again.',
          type: 'danger',
        });
      },
    });

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and sign you out. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAccountMutate(),
        },
      ],
    );
  };

  const handleCopyShareLink = async () => {
    // `\`...${shareId}\` || ''` is always truthy, so it would copy a link with
    // the literal "undefined" when shareId is missing — guard it instead.
    Clipboard.setString(
      profile?.shareId
        ? `https://coachiatry.vercel.app/share/user/${profile.shareId}`
        : '',
    );
    showMessage({
      message: 'Success',
      description: 'Link copied to clipboard!',
      type: 'success',
    });
  };

  const closeAddPerson = () => {
    setAddPersonModal(false);
    setSelectedUsers([]);
    setInvitedEmails([]);
    setSearch('');
  };

  // Resolve a typed email: add the person if they already have an account, or
  // stage an email invite if they don't.
  const { mutate: resolveEmail, isPending: isResolving } = useMutation({
    mutationFn: findWatcherByEmail,
    onSuccess: (res, email) => {
      const normalized = email.trim().toLowerCase();
      if (res.isSelf) {
        showMessage({
          message: "That's your email",
          description: "You can't add yourself as a watcher.",
          type: 'warning',
        });
        return;
      }
      if (res.found && res.user) {
        if (res.alreadyWatcher) {
          showMessage({
            message: 'Already added',
            description: `${res.user.fullName} is already watching you.`,
            type: 'info',
          });
          return;
        }
        setSelectedUsers(prev =>
          prev.some(u => u._id === res.user!._id) ? prev : [...prev, res.user!],
        );
      } else {
        setInvitedEmails(prev =>
          prev.includes(normalized) ? prev : [...prev, normalized],
        );
      }
      setSearch('');
    },
  });

  const { mutate: submitMutate, isPending: isAdding } = useMutation({
    mutationFn: async () => {
      if (selectedUsers.length) {
        await addWatchers(selectedUsers.map(u => u._id));
      }
      if (invitedEmails.length) {
        await inviteWatchersByEmail(invitedEmails);
      }
    },
    onSuccess: () => {
      const added = selectedUsers.length;
      const invited = invitedEmails.length;
      closeAddPerson();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['settings-profile'] });
      showMessage({
        message: 'Success',
        description: [
          added ? `${added} watcher${added > 1 ? 's' : ''} added` : '',
          invited ? `${invited} invite${invited > 1 ? 's' : ''} sent` : '',
        ]
          .filter(Boolean)
          .join(' · '),
        type: 'success',
      });
    },
  });

  const suggestions = data.filter(
    _data => !profile?.sharedViewers?.map(_sv => _sv._id).includes(_data._id),
  );
  const trimmedEmail = search.trim().toLowerCase();
  // Offer an email invite when the query looks like an email that isn't already
  // staged (as a selected user or a pending invite).
  const showInviteRow =
    isValidEmail(trimmedEmail) &&
    !invitedEmails.includes(trimmedEmail) &&
    !selectedUsers.some(u => u.email?.toLowerCase() === trimmedEmail);
  const hasStaged = selectedUsers.length > 0 || invitedEmails.length > 0;
  const footerLabel =
    invitedEmails.length > 0 && selectedUsers.length === 0
      ? 'Send Invite'
      : invitedEmails.length > 0 && selectedUsers.length > 0
        ? 'Add & Invite'
        : 'Add';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      bounces={false}
      overScrollMode="never"
    >
      <View style={{ backgroundColor: theme.colors.white }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableButton
            onPress={() => navigation.goBack()}
            style={{
              paddingHorizontal: spacing(5),
              paddingVertical: spacing(3),
            }}
          >
            <ChevronLeft />
          </TouchableButton>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Info */}
        {!isLoading && (
          <View style={styles.profileSection}>
            <SmartAvatar
              src={profile?.photo}
              name={profile?.fullName}
              imageStyle={styles.profilePic}
              style={{ marginBottom: spacing(20) }}
              size={scale(70)}
              key={profile?.photo}
            />
            {/* <Image source={assets.images.Avatar2} style={styles.profilePic} /> */}
            <Text style={styles.name}>{profile?.fullName}</Text>
            <Text style={styles.email}>{profile?.email}</Text>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <AppButton
                text="Edit Profile"
                onPress={() => navigation.navigate('EditProfile')}
                leftIcon={<Pencil color={theme.colors.primary} size={14} />}
                variant="secondary-outline"
                style={{
                  flex: 1,
                  padding: spacing(8),
                  borderRadius: fontSize(6),
                }}
                textStyle={{ fontSize: fontSize(14) }}
              />
              <AppButton
                text="Logout"
                onPress={signOut}
                leftIcon={
                  <AntDesign
                    name="logout"
                    color={theme.colors.primary}
                    size={18}
                  />
                }
                variant="secondary-outline"
                style={{
                  flex: 1,
                  padding: spacing(8),
                  borderRadius: fontSize(6),
                }}
                textStyle={{ fontSize: fontSize(14) }}
              />
            </View>
          </View>
        )}
      </View>

      {!isLoading && (
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableButton
            style={styles.menuRow}
            onPress={() => navigation.navigate('CategoryStatusSettings')}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}>
                <Ionicons
                  name="pricetags-outline"
                  size={fontSize(18)}
                  color={theme.colors.primary}
                />
              </View>
              <View>
                <Text style={styles.menuLabel}>Categories & Statuses</Text>
                <Text style={styles.menuSubLabel}>
                  Manage your task categories and statuses
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={fontSize(18)}
              color={theme.colors.gray[400]}
            />
          </TouchableButton>
        </View>
      )}

      {isLoading ? (
        <DetailScreenSkeleton showAvatar rows={4} showSections={1} />
      ) : (
        <View style={styles.watchersSection}>
          <Text style={styles.sectionTitle}>Watchers</Text>
          <FlatList
            data={profile?.sharedViewers}
            keyExtractor={item => item._id}
            renderItem={({ item }) => <RenderWatcher item={item} />}
            scrollEnabled={false}
            contentContainerStyle={{ gap: spacing(12), marginTop: spacing(10) }}
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
                  No watchers added
                </Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          <View style={styles.bottomButtons}>
            <AppButton
              text="Copy Link"
              onPress={handleCopyShareLink}
              leftIcon={
                <Ionicons
                  name="link-outline"
                  size={18}
                  color={theme.colors.gray[700]}
                />
              }
              style={{
                backgroundColor: theme.colors.gray[200],
                paddingVertical: spacing(8),
                paddingHorizontal: spacing(14),
              }}
              textStyle={{
                color: theme.colors.gray[900],
                fontSize: fontSize(14),
              }}
            />
            <AppButton
              text="+ Add Person"
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
      {!isLoading && (
        <View style={styles.dangerSection}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.dangerCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerLabel}>Delete Account</Text>
              <Text style={styles.dangerSubLabel}>
                Permanently delete your account and sign out. This action cannot
                be undone.
              </Text>
            </View>
            <TouchableButton
              style={styles.deleteButton}
              onPress={confirmDeleteAccount}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <>
                  <Trash2 size={fontSize(14)} color={theme.colors.white} />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </>
              )}
            </TouchableButton>
          </View>
        </View>
      )}

      <Modal
        visible={addPersonModal}
        onRequestClose={closeAddPerson}
        animationType="slide"
        statusBarTranslucent
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
                placeholder="Search name or enter email…"
                style={styles.searchHeaderInput}
                placeholderTextColor={theme.colors.gray[500]}
                value={search}
                onChangeText={val => setSearch(val)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
              />
              <Pressable style={styles.cancelBtn} onPress={closeAddPerson}>
                <Text>Cancel</Text>
              </Pressable>
            </View>
          </View>
          {isPeopleLoading ? (
            <AvatarListSkeleton />
          ) : (
            <>
              <KeyboardAwareFlatList
                data={suggestions}
                contentContainerStyle={[
                  styles.searchContentContainer,
                  { paddingBottom: insets.bottom },
                ]}
                style={{
                  backgroundColor: theme.colors.gray[50],
                  flex: 1,
                }}
                keyboardShouldPersistTaps="handled"
                keyExtractor={item => item._id}
                ListHeaderComponent={
                  <View>
                    {/* Invite-by-email action */}
                    {showInviteRow && (
                      <TouchableButton
                        style={styles.inviteRow}
                        onPress={() => resolveEmail(trimmedEmail)}
                        disabled={isResolving || isAdding}
                      >
                        <View style={styles.inviteIconWrap}>
                          <UserPlus
                            size={fontSize(18)}
                            color={theme.colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inviteTitle}>
                            Invite via email
                          </Text>
                          <Text
                            style={styles.inviteSubtitle}
                            numberOfLines={1}
                          >
                            {trimmedEmail}
                          </Text>
                        </View>
                        {isResolving ? (
                          <ActivityIndicator
                            size="small"
                            color={theme.colors.primary}
                          />
                        ) : (
                          <View style={styles.invitePill}>
                            <Mail
                              size={fontSize(13)}
                              color={theme.colors.white}
                            />
                            <Text style={styles.invitePillText}>Invite</Text>
                          </View>
                        )}
                      </TouchableButton>
                    )}

                    {/* Staged selections */}
                    {hasStaged && (
                      <View style={styles.chipsWrap}>
                        {selectedUsers.map(u => (
                          <View key={u._id} style={styles.chip}>
                            <Text style={styles.chipText} numberOfLines={1}>
                              {u.fullName}
                            </Text>
                            <Pressable
                              hitSlop={8}
                              onPress={() =>
                                setSelectedUsers(prev =>
                                  prev.filter(x => x._id !== u._id),
                                )
                              }
                            >
                              <X
                                size={fontSize(13)}
                                color={theme.colors.gray[500]}
                              />
                            </Pressable>
                          </View>
                        ))}
                        {invitedEmails.map(email => (
                          <View
                            key={email}
                            style={[styles.chip, styles.inviteChip]}
                          >
                            <Mail
                              size={fontSize(12)}
                              color={theme.colors.primary}
                            />
                            <Text
                              style={[styles.chipText, styles.inviteChipText]}
                              numberOfLines={1}
                            >
                              {email}
                            </Text>
                            <Pressable
                              hitSlop={8}
                              onPress={() =>
                                setInvitedEmails(prev =>
                                  prev.filter(x => x !== email),
                                )
                              }
                            >
                              <X
                                size={fontSize(13)}
                                color={theme.colors.primary}
                              />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                }
                renderItem={({ item }) => {
                  const isSelected = selectedUsers.some(
                    u => u._id === item._id,
                  );
                  return (
                    <TouchableButton
                      style={styles.watcherRow}
                      onPress={() =>
                        setSelectedUsers(prev =>
                          isSelected
                            ? prev.filter(u => u._id !== item._id)
                            : [...prev, item],
                        )
                      }
                      disabled={isAdding}
                    >
                      <View style={styles.watcherLeft}>
                        <SmartAvatar
                          src={item.photo}
                          name={item.fullName}
                          size={fontSize(40)}
                        />
                        <View>
                          <Text style={styles.watcherName}>
                            {item.fullName}
                          </Text>
                          <Text style={styles.watcherEmail}>{item.email}</Text>
                        </View>
                      </View>
                      {isSelected && (
                        <Check
                          size={fontSize(14)}
                          color={theme.colors.gray[500]}
                        />
                      )}
                    </TouchableButton>
                  );
                }}
                ItemSeparatorComponent={() => (
                  <View
                    style={[styles.separator, { marginBottom: spacing(10) }]}
                  />
                )}
              />
              <FooterComponent
                isAdding={isAdding}
                disabled={!hasStaged}
                label={footerLabel}
                mutate={() => submitMutate()}
              />
            </>
          )}
        </View>
      </Modal>

      <Modal
        visible={isSigningOut}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {}}
      >
        <View style={styles.signOutBackdrop}>
          <View style={styles.signOutCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.signOutText}>
              {isDeletingAccount ? 'Deleting account…' : 'Logging out…'}
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  signOutBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutCard: {
    backgroundColor: theme.colors.white,
    paddingVertical: spacing(20),
    paddingHorizontal: spacing(28),
    borderRadius: fontSize(12),
    alignItems: 'center',
    minWidth: scale(160),
    gap: spacing(12),
  },
  signOutText: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[900],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(16),
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[950],
  },

  profileSection: {
    alignItems: 'center',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(24),
  },
  profilePic: {
    borderRadius: fontSize(40),
  },
  name: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[900],
    marginBottom: spacing(6),
  },
  email: {
    fontSize: fontSize(16),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[600],
    marginBottom: spacing(14),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing(10),
    width: '100%',
    marginTop: spacing(12),
  },
  menuSection: {
    paddingHorizontal: spacing(16),
    paddingTop: spacing(16),
    paddingBottom: spacing(6),
    marginTop: spacing(10),
    backgroundColor: theme.colors.white,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(14),
    borderRadius: fontSize(12),
    backgroundColor: theme.colors.secondary,
    marginTop: spacing(10),
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    flex: 1,
  },
  menuIcon: {
    width: spacing(38),
    height: spacing(38),
    borderRadius: spacing(19),
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[900],
  },
  menuSubLabel: {
    fontSize: fontSize(12),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[500],
    marginTop: spacing(2),
  },
  watchersSection: {
    paddingHorizontal: spacing(16),
    paddingTop: spacing(16),
    marginTop: spacing(10),
    backgroundColor: theme.colors.white,
  },
  dangerSection: {
    paddingHorizontal: spacing(16),
    paddingTop: spacing(16),
    paddingBottom: spacing(24),
    marginTop: spacing(10),
    backgroundColor: theme.colors.white,
  },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: fontSize(12),
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(14),
  },
  dangerLabel: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.semiBold,
    color: '#DC2626',
  },
  dangerSubLabel: {
    fontSize: fontSize(12),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[600],
    marginTop: spacing(2),
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(6),
    backgroundColor: '#EF4444',
    borderRadius: fontSize(8),
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(14),
    minWidth: scale(84),
  },
  deleteButtonText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(13),
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
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: fontSize(12),
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(14),
    marginBottom: spacing(14),
  },
  inviteIconWrap: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '1A',
  },
  inviteTitle: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[900],
  },
  inviteSubtitle: {
    fontSize: fontSize(12),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[600],
    marginTop: spacing(1),
  },
  invitePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(5),
    backgroundColor: theme.colors.primary,
    borderRadius: fontSize(100),
    paddingVertical: spacing(6),
    paddingHorizontal: spacing(12),
  },
  invitePillText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(12),
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(8),
    marginBottom: spacing(14),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
    maxWidth: '100%',
    backgroundColor: theme.colors.gray[100],
    borderRadius: fontSize(100),
    paddingVertical: spacing(6),
    paddingHorizontal: spacing(12),
  },
  chipText: {
    flexShrink: 1,
    fontSize: fontSize(13),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[800],
  },
  inviteChip: {
    backgroundColor: theme.colors.primary + '14',
  },
  inviteChipText: {
    color: theme.colors.primary,
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
});
