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
  getMyProfile,
  getUserSuggestions,
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
import { Check, Pencil } from 'lucide-react-native';

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
      <AppButton text="Add" onPress={mutate} isLoading={isAdding} />
    </View>
  );
};

export default function Profile() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { setAuthData } = useAuth();
  const [addPersonModal, setAddPersonModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

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

  const signOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      queryClient.clear();
      const token = await getToken();
      if (token) {
        await removeFCMToken(token);
      }
      await GoogleSignin.signOut();
      await messaging().deleteToken();
      await removeToken();

      setAuthData({ token: '', user: null });
    } catch (err) {
      console.log(err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleCopyShareLink = async () => {
    Clipboard.setString(
      `https://coachiatry.vercel.app/share/user/${profile?.shareId}` || '',
    );
    showMessage({
      message: 'Success',
      description: 'Link copied to clipboard!',
      type: 'success',
    });
  };

  const { mutate: watchersMutate, isPending: isAdding } = useMutation({
    mutationFn: addWatchers,
    onSuccess: () => {
      setAddPersonModal(false);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    meta: {
      invalidateQueries: ['settings-profile'],
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
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
              key={new Date().toDateString()}
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
      <Modal
        visible={addPersonModal}
        onRequestClose={() => setAddPersonModal(false)}
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
            <AvatarListSkeleton />
          ) : (
            <>
              <KeyboardAwareFlatList
                data={data.filter(
                  _data =>
                    !profile?.sharedViewers
                      .map(_sv => _sv._id)
                      .includes(_data._id),
                )}
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
                        prev.includes(item._id)
                          ? prev.filter(_p => _p !== item._id)
                          : [...prev, item._id],
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
                        <Text style={styles.watcherName}>{item.fullName}</Text>
                        <Text style={styles.watcherEmail}>{item.email}</Text>
                      </View>
                    </View>
                    {selectedUsers.includes(item._id) && (
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
                isAdding={isAdding}
                mutate={() => watchersMutate(selectedUsers)}
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
            <Text style={styles.signOutText}>Logging out…</Text>
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
