import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import * as yup from 'yup';
import { queryClient } from '../../../App';
import {
  updateProfile,
  updateProfilePicture,
} from '../../api/functions/user.api';
import { ChevronLeft } from '../../assets';
import TouchableButton from '../../components/TouchableButton';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';
import { fontSize, scale, spacing } from '../../utils';
import { updatePassword } from '../../api/functions/auth.api';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const schema = yup.object().shape({
  fullName: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
});

const EditProfile = () => {
  const { profile } = useAuth();
  const [photo, setPhoto] = useState<string | undefined>(profile?.photo);
  const [imageData, setImageData] = useState<Asset | null>(null);

  // Password handling
  const [password, setPassword] = useState('');

  const navigation = useNavigation();

  const { mutate, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      navigation.goBack();
    },
  });

  const { mutate: updatePicture, isPending: isPictureUpdating } = useMutation({
    mutationFn: updateProfilePicture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const { mutate: mutatePassword, isPending: isPasswordUpdatePending } =
    useMutation({
      mutationFn: updatePassword,
      onSuccess: () => {
        setPassword('');
      },
    });

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: profile?.fullName,
      email: profile?.email,
    },
    disabled: isPending,
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
        if (!response.didCancel && response.assets && response.assets[0].uri) {
          setPhoto(response.assets[0].uri);
          setImageData(response.assets[0]);
        }
      },
    );
  };

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    mutate(data);
    if (imageData) {
      updatePicture(imageData);
    }
  };

  const onUpdatePassword = () => {
    if (password && password.trim()) {
      Alert.alert(
        'Change Password',
        'Are you sure you want to change password?',
        [
          { text: 'No', style: 'destructive' },
          {
            text: 'Yes',
            style: 'default',
            onPress: () => mutatePassword({ password }),
          },
        ],
      );
    }
  };

  return (
    <KeyboardAwareScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
      style={{ backgroundColor: theme.colors.white }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableButton style={{paddingHorizontal: spacing(5),
              paddingVertical: spacing(3)}} onPress={() => navigation.goBack()}>
          <ChevronLeft />
        </TouchableButton>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <TouchableButton
          activeOpacity={0.8}
          style={styles.avatarWrapper}
          onPress={pickImage}
        >
          <SmartAvatar
            src={photo}
            name={profile?.fullName}
            imageStyle={styles.avatar}
            fontSize={fontSize(22)}
            size={scale(100)}
            key={new Date().toDateString()}
          />
          {/* <Image
            source={photo ? { uri: photo } : assets.images.Avatar2}
            style={styles.avatar}
          /> */}
        </TouchableButton>

        <TouchableButton onPress={pickImage} activeOpacity={0.8}>
          <Text style={styles.changePhoto}>Change Photo</Text>
        </TouchableButton>
      </View>

      {/* Input Fields */}
      <View style={styles.form}>
        <FormProvider {...form}>
          <AppInput
            label="Full name"
            placeholder="Enter full name"
            name="fullName"
            //   value={name}
            //   onChangeText={setName}
          />

          <AppInput
            label="Email"
            placeholder="Enter email ID"
            keyboardType="email-address"
            name="email"
            disabled
            //   value={email}
            //   onChangeText={setEmail}
          />
        </FormProvider>

        {/* Password */}
        <View style={styles.passwordWrapper}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordBox}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter new password"
              // secureTextEntry
              style={styles.passwordInput}
              readOnly={isPasswordUpdatePending}
            />

            <TouchableButton
              style={styles.changeButton}
              onPress={onUpdatePassword}
              disabled={isPasswordUpdatePending}
            >
              <Text style={styles.changeText}>Change</Text>
            </TouchableButton>
          </View>
        </View>
      </View>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <AppButton
          text="Save Changes"
          onPress={form.handleSubmit(onSubmit)}
          isLoading={isPending}
        />
      </View>
    </KeyboardAwareScrollView>
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
