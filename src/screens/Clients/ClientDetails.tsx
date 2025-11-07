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
import { fontSize, spacing } from '../../utils';
import AppButton from '../../components/ui/AppButton';
import { useNavigation } from '@react-navigation/native';

import { assets, ChevronLeft, MapPin, User } from '../../assets';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import ClientTabs from '../../components/Clients/ClientTabs';

export default function ClientDetails() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
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

  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: theme.colors.white }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Client Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image source={assets.images.Avatar2} style={styles.profilePic} />
          <Text style={styles.name}>Amanda Haydenson</Text>
          <Text style={styles.email}>amanahay8899sin@gmail.com</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <User />
              <Text style={styles.text}>Female</Text>
            </View>
            {/* Age */}
            <View style={styles.infoItem}>
              <Date />
              <Text style={styles.text}>21 years</Text>
            </View>

            {/* Location */}
            <View style={styles.infoItem}>
              <MapPin />
              <Text style={styles.text}>New York</Text>
            </View>
          </View>
          {/* Buttons */}
          <View style={styles.buttonRow}>
            <AppButton
              text="Chat Now"
              onPress={() => {}}
              variant="secondary-outline"
              style={{
                flex: 1,
                padding: spacing(9),
                borderRadius: fontSize(6),
              }}
              textStyle={{ fontSize: fontSize(14) }}
            />
            <AppButton
              text="View task"
              onPress={() => {}}
              style={{
                flex: 1,
                padding: spacing(9),
                borderRadius: fontSize(6),
              }}
              textStyle={{ fontSize: fontSize(14) }}
            />
          </View>
        </View>
      </View>

      {/* Watchers */}
      <ClientTabs />
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
    width: fontSize(70),
    height: fontSize(70),
    borderRadius: fontSize(40),
    marginBottom: spacing(20),
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
    marginBottom: spacing(10),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing(10),
    width: '100%',
    marginTop: spacing(20),
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(24),
    marginTop: spacing(6),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
  },
  text: {
    fontSize: fontSize(14),
    color: theme.colors.gray[700],
    fontFamily: theme.fonts.lato.regular,
  },
});
