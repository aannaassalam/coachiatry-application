import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../theme';
import { fontSize, scale, spacing } from '../../utils';
import AppButton from '../../components/ui/AppButton';
import Octicons from 'react-native-vector-icons/Octicons';
import AntDesign from 'react-native-vector-icons/AntDesign'; // or 'react-native-vector-icons/Octicons'
// or 'react-native-vector-icons/Octicons'
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { assets, ChevronLeft } from '../../assets';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { removeToken } from '../../helpers/token-storage';
import { queryClient } from '../../../App';
import { useAuth } from '../../hooks/useAuth';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
type ProfileScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'EditProfile'
>;
export default function Profile() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { profile, setAuthData } = useAuth();
  const watchers = [
    {
      id: '1',
      name: 'Mom',
      email: 'riya.mom@gmail.com',
      avatar: assets.images.Avatar2,
    },
    {
      id: '2',
      name: 'Coach Saurav',
      email: 'coach.s@email.com',
      avatar: assets.images.Avatar3,
    },
  ];

  const signOut = async () => {
    queryClient.removeQueries();
    setAuthData({ token: '', user: null });
    await removeToken();
  };

  const renderWatcher = ({ item }: { item: any }) => (
    <View style={styles.watcherRow}>
      <View style={styles.watcherLeft}>
        <Image source={item.avatar} style={styles.avatar} />
        <View>
          <Text style={styles.watcherName}>{item.name}</Text>
          <Text style={styles.watcherEmail}>{item.email}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.revokeButton}>
        <Text style={styles.revokeText}>Revoke</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: theme.colors.white }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <SmartAvatar
            src={profile?.photo}
            name={profile?.fullName}
            imageStyle={styles.profilePic}
            fontSize={fontSize(22)}
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
              leftIcon={
                <Octicons
                  name="pencil"
                  color={theme.colors.primary}
                  size={14}
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
      </View>

      {/* Watchers */}
      <View style={styles.watchersSection}>
        <Text style={styles.sectionTitle}>Watchers</Text>
        <FlatList
          data={watchers}
          keyExtractor={item => item.id}
          renderItem={renderWatcher}
          scrollEnabled={false}
          contentContainerStyle={{ gap: spacing(12), marginTop: spacing(10) }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        <View style={styles.bottomButtons}>
          <AppButton
            text="Copy Link"
            onPress={() => {}}
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
            onPress={() => {}}
            variant="primary"
            style={{
              paddingVertical: spacing(8),
              paddingHorizontal: spacing(14),
            }}
            textStyle={{ fontSize: fontSize(14) }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
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
  avatar: {
    width: fontSize(40),
    height: fontSize(40),
    borderRadius: fontSize(20),
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
});
