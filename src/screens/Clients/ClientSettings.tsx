import Clipboard from '@react-native-clipboard/clipboard';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  Alert,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';
import { showMessage } from 'react-native-flash-message';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import { queryClient } from '../../../App';
import { getAllCategoriesByCoach } from '../../api/functions/category.api';
import { getAllStatusesByCoach } from '../../api/functions/status.api';
import {
  addWatchers,
  findWatcherByEmail,
  getUserById,
  inviteWatchersByEmail,
  revokeViewAccess,
  setClientPassword,
  updateProfilePicture,
  updateUser,
} from '../../api/functions/user.api';
import { ChevronLeft } from '../../assets';
import TouchableButton from '../../components/TouchableButton';
import AppButton from '../../components/ui/AppButton';
import Badge from '../../components/ui/Badge';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import { theme } from '../../theme';
import { Category } from '../../typescript/interface/category.interface';
import { Status } from '../../typescript/interface/status.interface';
import { User } from '../../typescript/interface/user.interface';
import { AppStackParamList } from '../../types/navigation';
import { fontSize, scale, spacing } from '../../utils';

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Section = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => {
  const { styles } = useStyles(stylesheet);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
};

export default function ClientSettings() {
  const navigation = useNavigation();
  const { styles } = useStyles(stylesheet);
  const { params } =
    useRoute<RouteProp<AppStackParamList, 'ClientSettings'>>();
  const { userId } = params;

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [watcherEmail, setWatcherEmail] = useState('');

  // Warm from the caches ClientDetails already fills; staleTime keeps entering
  // this screen from refetching all three and shifting the layout.
  const { data: client } = useQuery({
    queryKey: ['clientDetails', userId],
    queryFn: ({ signal }) => getUserById(userId, signal),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories', userId],
    queryFn: ({ signal }) => getAllCategoriesByCoach(userId, signal),
    staleTime: 5 * 60 * 1000,
  });

  const { data: statuses = [] } = useQuery<Status[]>({
    queryKey: ['status', userId],
    queryFn: ({ signal }) => getAllStatusesByCoach(userId, signal),
    staleTime: 5 * 60 * 1000,
  });

  // Seed once per target, not on every refetch — otherwise a background
  // refresh overwrites what is being typed.
  useEffect(() => {
    setFullName(client?.fullName ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const watchers = (client?.sharedViewers ?? []) as User[];

  const invalidateClient = () =>
    queryClient.invalidateQueries({ queryKey: ['clientDetails', userId] });

  const { mutate: saveName, isPending: isSavingName } = useMutation({
    // Name only: sending assignedCoach would make the backend reassign this
    // person to the requesting coach, dropping their other coaches.
    mutationFn: () => updateUser({ userId, name: fullName.trim() }),
    onSuccess: () => {
      invalidateClient();
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      showMessage({ message: 'Profile updated', type: 'success' });
    },
  });

  const { mutate: uploadPhoto, isPending: isUploadingPhoto } = useMutation({
    mutationFn: (file: Asset) => updateProfilePicture(file, userId),
    onSuccess: () => {
      invalidateClient();
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      showMessage({ message: 'Profile picture updated', type: 'success' });
    },
  });

  const { mutate: savePassword, isPending: isSavingPassword } = useMutation({
    mutationFn: () => setClientPassword({ userId, password }),
    onSuccess: () => {
      setPassword('');
      showMessage({ message: 'Password updated', type: 'success' });
    },
  });

  const { mutate: revokeWatcher, isPending: isRevoking } = useMutation({
    mutationFn: (viewerId: string) => revokeViewAccess(viewerId, userId),
    onSuccess: () => {
      invalidateClient();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      showMessage({ message: 'Access revoked', type: 'success' });
    },
  });

  // One email in, one of two outcomes: add them if they already have an
  // account, otherwise email them an invite to this person's share link.
  const { mutate: addWatcherByEmail, isPending: isAddingWatcher } = useMutation({
    mutationFn: async (email: string) => {
      const found = await findWatcherByEmail(email, userId);
      if (found.isSelf) return 'self' as const;
      if (found.alreadyWatcher) return 'already' as const;
      if (found.found && found.user) {
        await addWatchers([found.user._id], userId);
        return 'added' as const;
      }
      await inviteWatchersByEmail([email], userId);
      return 'invited' as const;
    },
    onSuccess: outcome => {
      if (outcome === 'self') {
        showMessage({
          message: "That's this person's own email",
          type: 'warning',
        });
        return;
      }
      if (outcome === 'already') {
        showMessage({ message: 'Already a watcher', type: 'info' });
        return;
      }
      setWatcherEmail('');
      invalidateClient();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      showMessage({
        message: outcome === 'added' ? 'Watcher added' : 'Invitation sent',
        type: 'success',
      });
    },
  });

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
        const asset = response.assets?.[0];
        if (asset?.uri) uploadPhoto(asset);
      },
    );
  };

  const copyShareLink = () => {
    if (!client?.shareId) return;
    Clipboard.setString(
      `https://coachiatry.vercel.app/share/user/${client.shareId}`,
    );
    showMessage({ message: 'Invitation link copied', type: 'success' });
  };

  const onAddWatcher = () => {
    const email = watcherEmail.trim().toLowerCase();
    if (!isValidEmail(email)) {
      showMessage({ message: 'Enter a valid email address', type: 'warning' });
      return;
    }
    addWatcherByEmail(email);
  };

  const onSavePassword = () => {
    if (password.trim().length < 8) {
      showMessage({
        message: 'Password must be at least 8 characters',
        type: 'warning',
      });
      return;
    }
    Alert.alert(
      'Change password',
      `Set a new password for ${client?.fullName ?? 'this user'}? They are not notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Change', style: 'default', onPress: () => savePassword() },
      ],
    );
  };

  const onRevoke = (watcher: User) =>
    Alert.alert(
      'Revoke access',
      `${watcher.fullName} will lose access to this person's tasks, and their direct chat is removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => revokeWatcher(watcher._id),
        },
      ],
    );

  // Reuses the existing delete sheet (with its transfer-tasks step); the
  // callback refreshes this client's lists rather than the signed-in user's.
  const confirmDeleteTaxonomy = (
    type: 'category' | 'status',
    item: Category | Status,
    all: (Category | Status)[],
  ) =>
    SheetManager.show('delete-taxonomy-sheet', {
      payload: {
        type,
        item: { _id: item._id, title: item.title },
        options: all
          .filter(other => other._id !== item._id)
          .map(other => ({
            value: other._id,
            label: other.title,
            bg: other.color.bg,
            text: other.color.text,
          })),
        onDeleted: () =>
          queryClient.invalidateQueries({
            queryKey: [type === 'category' ? 'categories' : 'status', userId],
          }),
      },
    });

  const renderTaxonomy = (
    type: 'category' | 'status',
    items: (Category | Status)[],
  ) =>
    items.length ? (
      items.map(item => (
        <View key={item._id} style={styles.taxonomyRow}>
          <Badge
            title={item.title}
            bgColor={item.color.bg}
            color={item.color.text}
          />
          {item.public ? (
            <View style={styles.defaultPill}>
              <Text style={styles.defaultPillText}>Default</Text>
            </View>
          ) : (
            <TouchableButton
              style={styles.deleteButton}
              hitSlop={spacing(10)}
              onPress={() => confirmDeleteTaxonomy(type, item, items)}
            >
              <Feather name="trash-2" size={fontSize(15)} color="#DC2626" />
            </TouchableButton>
          )}
        </View>
      ))
    ) : (
      <Text style={styles.emptyText}>
        No {type === 'category' ? 'categories' : 'statuses'} yet
      </Text>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableButton
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft />
        </TouchableButton>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: spacing(24) }} />
      </View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >
        <Section
          title="Basic information"
          subtitle="Profile picture and name"
        >
          <View style={styles.avatarSection}>
            <TouchableButton
              activeOpacity={0.8}
              onPress={pickImage}
              disabled={isUploadingPhoto}
            >
              <SmartAvatar
                src={client?.photo}
                name={client?.fullName}
                size={scale(72)}
              />
            </TouchableButton>
            <TouchableButton onPress={pickImage} disabled={isUploadingPhoto}>
              <Text style={styles.changePhoto}>
                {isUploadingPhoto ? 'Uploading…' : 'Change photo'}
              </Text>
            </TouchableButton>
          </View>

          <Text style={styles.label}>Full name</Text>
          <View style={styles.inlineRow}>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor={theme.colors.gray[400]}
              style={styles.input}
            />
            <AppButton
              text="Save"
              style={styles.inlineButton}
              disabled={
                isSavingName ||
                !fullName.trim() ||
                fullName.trim() === client?.fullName
              }
              isLoading={isSavingName}
              onPress={() => saveName()}
            />
          </View>
          <Text style={styles.helper}>{client?.email}</Text>
        </Section>

        <Section
          title="Password"
          subtitle="Set a new password. They are not notified."
        >
          <View style={styles.inlineRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="New password"
              placeholderTextColor={theme.colors.gray[400]}
              secureTextEntry
              style={styles.input}
            />
            <AppButton
              text="Update"
              style={styles.inlineButton}
              disabled={isSavingPassword || !password}
              isLoading={isSavingPassword}
              onPress={onSavePassword}
            />
          </View>
        </Section>

        <Section
          title="Watchers"
          subtitle="People who can view this person's sheet"
        >
          <View style={styles.inlineRow}>
            <TextInput
              value={watcherEmail}
              onChangeText={setWatcherEmail}
              placeholder="Add by email"
              placeholderTextColor={theme.colors.gray[400]}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <AppButton
              text="Add"
              style={styles.inlineButton}
              disabled={isAddingWatcher || !watcherEmail.trim()}
              isLoading={isAddingWatcher}
              onPress={onAddWatcher}
            />
          </View>

          <TouchableButton
            style={styles.copyLinkRow}
            disabled={!client?.shareId}
            onPress={copyShareLink}
          >
            <Feather
              name="link-2"
              size={fontSize(14)}
              color={theme.colors.primary}
            />
            <Text style={styles.copyLinkText}>Copy invitation link</Text>
          </TouchableButton>

          {watchers.length ? (
            watchers.map(watcher => (
              <View key={watcher._id} style={styles.watcherRow}>
                <SmartAvatar
                  src={watcher.photo}
                  name={watcher.fullName}
                  size={fontSize(38)}
                />
                <View style={styles.watcherText}>
                  <Text style={styles.watcherName} numberOfLines={1}>
                    {watcher.fullName}
                  </Text>
                  <Text style={styles.watcherEmail} numberOfLines={1}>
                    {watcher.email}
                  </Text>
                </View>
                <TouchableButton
                  style={styles.revokeButton}
                  disabled={isRevoking}
                  onPress={() => onRevoke(watcher)}
                >
                  <Text style={styles.revokeText}>Revoke</Text>
                </TouchableButton>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No watchers yet</Text>
          )}
        </Section>

        <Section title="Categories">{renderTaxonomy('category', categories)}</Section>
        <Section title="Statuses">{renderTaxonomy('status', statuses)}</Section>
      </KeyboardAwareScrollView>
    </View>
  );
}

const stylesheet = createStyleSheet({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
  },
  iconButton: {
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(3),
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[950],
  },
  body: {
    paddingHorizontal: spacing(16),
    paddingBottom: spacing(40),
    gap: spacing(14),
  },
  section: {
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: fontSize(14),
    padding: spacing(14),
    gap: spacing(8),
  },
  sectionTitle: {
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(15),
    color: theme.colors.gray[950],
  },
  sectionSubtitle: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(12),
    color: theme.colors.gray[600],
  },
  avatarSection: {
    alignItems: 'center',
    gap: spacing(6),
    paddingVertical: spacing(6),
  },
  changePhoto: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(13),
  },
  label: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[800],
  },
  helper: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(12),
    color: theme.colors.gray[500],
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(8),
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: fontSize(10),
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(9),
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(14),
    color: theme.colors.gray[900],
  },
  inlineButton: {
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(10),
  },
  copyLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
    paddingVertical: spacing(6),
  },
  copyLinkText: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(13),
    color: theme.colors.primary,
  },
  watcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
    paddingVertical: spacing(8),
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  watcherText: {
    flex: 1,
    minWidth: 0,
  },
  watcherName: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(14),
    color: theme.colors.gray[900],
  },
  watcherEmail: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(12),
    color: theme.colors.gray[500],
  },
  revokeButton: {
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(6),
    borderRadius: fontSize(8),
    backgroundColor: '#FEE2E2',
  },
  revokeText: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(12),
    color: '#DC2626',
  },
  taxonomyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(12),
    backgroundColor: theme.colors.secondary,
    borderRadius: fontSize(12),
  },
  deleteButton: {
    width: spacing(28),
    height: spacing(28),
    borderRadius: spacing(14),
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultPill: {
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(4),
    borderRadius: 100,
    backgroundColor: theme.colors.gray[100],
  },
  defaultPillText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(11),
    color: theme.colors.gray[500],
  },
  emptyText: {
    fontFamily: theme.fonts.lato.italic,
    fontSize: fontSize(13),
    color: theme.colors.gray[500],
    paddingVertical: spacing(10),
    textAlign: 'center',
  },
});
