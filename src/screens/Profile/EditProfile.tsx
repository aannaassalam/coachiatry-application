import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { assets, ChevronLeft } from '../../assets';

const EditProfile = () => {
  const [photo, setPhoto] = useState<string | null>(
    'https://i.pravatar.cc/150?img=12',
  );
  const [name, setName] = useState('Amanda Haydenson');
  const [email, setEmail] = useState('amanahay@gmail.com');

  // Password handling
  const [password, setPassword] = useState('******');
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const navigation = useNavigation();

  const pickImage = () => {
    launchImageLibrary(
      { mediaType: 'photo', maxHeight: 1080, maxWidth: 1080, quality: 0.9 },
      response => {
        if (response.didCancel) return;
        if (!response.didCancel && response.assets && response.assets[0].uri) {
          setPhoto(response.assets[0].uri);
        }
      },
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.avatarWrapper}
          onPress={pickImage}
        >
          <Image
            source={photo ? { uri: photo } : assets.images.Avatar2}
            style={styles.avatar}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
          <Text style={styles.changePhoto}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Input Fields */}
      <View style={styles.form}>
        <AppInput
          label="Full name"
          placeholder="Enter full name"
          //   value={name}
          //   onChangeText={setName}
        />

        <AppInput
          label="Email"
          placeholder="Enter email ID"
          keyboardType="email-address"
          //   value={email}
          //   onChangeText={setEmail}
        />

        {/* Password */}
        <View style={styles.passwordWrapper}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordBox}>
            {isEditingPassword ? (
              <TextInput
                value={password === '******' ? '' : password}
                onChangeText={setPassword}
                placeholder="Enter new password"
                secureTextEntry
                style={styles.passwordInput}
                autoFocus
              />
            ) : (
              <Text style={styles.passwordText}>******</Text>
            )}

            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => {
                setIsEditingPassword(prev => !prev);
                if (isEditingPassword) {
                  setPassword('******');
                }
              }}
            >
              <Text style={styles.changeText}>
                {isEditingPassword ? 'Cancel' : 'Change'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <AppButton text="Save Changes" onPress={() => {}} />
      </View>
    </ScrollView>
  );
};

export default EditProfile;

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
    marginBottom: spacing(24),
  },
  avatarWrapper: {
    borderRadius: fontSize(50),
    overflow: 'hidden',
  },
  avatar: {
    width: fontSize(100),
    height: fontSize(100),
    borderRadius: fontSize(50),
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
  passwordWrapper: {
    marginTop: spacing(6),
  },
  passwordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: fontSize(10),
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(10),
    justifyContent: 'space-between',
  },
  passwordText: {
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[900],
    fontSize: fontSize(14),
  },
  passwordInput: {
    flex: 1,
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[900],
    fontSize: fontSize(14),
    padding: 0,
  },
  changeButton: {
    paddingHorizontal: spacing(8),
    paddingVertical: spacing(4),
    borderRadius: fontSize(6),
    backgroundColor: theme.colors.gray[100],
    marginLeft: spacing(8),
  },
  changeText: {
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.primary,
    fontSize: fontSize(13),
  },
  saveButtonContainer: {
    marginTop: 'auto',
  },
});
