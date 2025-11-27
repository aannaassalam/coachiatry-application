import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import {
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as yup from 'yup';
import {
  googleAuth,
  signup,
  updateFCMToken,
} from '../../api/functions/auth.api';
import { assets } from '../../assets';
import TouchableButton from '../../components/TouchableButton';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import { getToken, onError } from '../../helpers/utils';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import { fontSize, SCREEN_WIDTH, spacing } from '../../utils';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Signup'
>;

const schema = yup.object().shape({
  fullName: yup.string().required(),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export default function SignUp() {
  const insets = useSafeAreaInsets();
  const { setAuthData } = useAuth();
  const { styles } = useStyles(stylesheet);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [showPassword, setShowPassword] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: signup,
    onSuccess: async _data => {
      setAuthData(_data.data);
      // const fcmToken = await getToken();
      // await updateFCMToken(fcmToken as string);
    },
  });

  const { mutate: google, isPending: isGooglePending } = useMutation({
    mutationFn: googleAuth,
    onSuccess: async data => {
      setAuthData(data.data);
      // const fcmToken = await getToken();
      // console.log(fcmToken);
      // await updateFCMToken(fcmToken as string);
    },
  });

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
    disabled: isPending || isGooglePending,
  });

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    mutate(data);
  };

  const GoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.type === 'success' && userInfo.data?.idToken) {
        google(userInfo.data?.idToken);
      } else {
        await GoogleSignin.signOut();
      }
      console.log('User Info:', userInfo);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[
        styles.container,
        { paddingBottom: insets.bottom, paddingTop: insets.top },
      ]}
    >
      <ImageBackground
        source={assets.images.AuthBackground}
        resizeMode="cover"
        style={styles.bgImage}
      >
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          style={{
            flex: 1,
          }}
        >
          <View style={styles.card}>
            {/* Header */}
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Enter the fields below to get started
            </Text>
            <View style={{ gap: spacing(16) }}>
              <FormProvider {...form}>
                <AppInput
                  name="fullName"
                  label="Your Name"
                  placeholder="Enter Name"
                />
                <AppInput
                  name="email"
                  label="Email ID"
                  placeholder="Enter email ID"
                  keyboardType="email-address"
                />
                <View>
                  <View style={styles.passwordRow}>
                    <Text style={styles.label}>Password</Text>
                  </View>
                  <Controller
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <View style={styles.passwordInputWrapper}>
                        <TextInput
                          placeholder="Enter password"
                          placeholderTextColor={theme.colors.gray[500]}
                          secureTextEntry={!showPassword}
                          style={[styles.input, { flex: 1, borderWidth: 0 }]}
                          {...field}
                          onChangeText={field.onChange}
                        />
                        <Pressable
                          onPress={() => setShowPassword(!showPassword)}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color={theme.colors.primary}
                          />
                        </Pressable>
                      </View>
                    )}
                  />
                </View>
              </FormProvider>
            </View>

            {/* Signup Button */}
            <AppButton
              text="Create Account"
              style={{ marginBottom: spacing(14) }}
              onPress={form.handleSubmit(onSubmit, onError)}
              isLoading={isPending}
              disabled={isGooglePending}
            />

            {/* Google Sign-up */}
            <AppButton
              text="Sign up with Google"
              variant="outline"
              leftIcon={<Image source={assets.icons.googleIcon} />}
              onPress={GoogleLogin}
              disabled={isPending}
              isLoading={isGooglePending}
            />
            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Signup */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Already have an account? </Text>
              <TouchableButton
                onPress={() => navigation.navigate('Login')}
                disabled={isPending || isGooglePending}
              >
                <Text style={styles.signupLink}>Sign In</Text>
              </TouchableButton>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const stylesheet = createStyleSheet({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    // justifyContent: 'center',
    // alignItems: 'center',
    position: 'relative',
  },
  bgImage: {
    flex: 1,
    justifyContent: 'center',
    width: SCREEN_WIDTH,
  },
  card: {
    width: '95%',
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(16),
    paddingVertical: spacing(24),
    paddingHorizontal: spacing(16),
    shadowColor: theme.colors.gray[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginInline: 'auto',
  },
  title: {
    fontSize: fontSize(20),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing(5),
  },
  subtitle: {
    fontSize: fontSize(13),
    color: theme.colors.gray[800],
    textAlign: 'center',
    marginTop: spacing(5),
    marginBottom: spacing(24),
    letterSpacing: fontSize(-0.18),
    fontFamily: theme.fonts.lato.regular,
  },
  label: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[950],
    marginBottom: spacing(8),
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
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  forgot: {
    fontSize: fontSize(12),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[950],
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: fontSize(1),
    borderColor: theme.colors.gray[200],
    borderRadius: fontSize(10),
    paddingHorizontal: spacing(14),
    paddingLeft: 0,
    marginBottom: spacing(16),
    paddingBottom: spacing(0.5),
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing(20),
  },
  dividerLine: {
    flex: 1,
    height: fontSize(1),
    backgroundColor: theme.colors.gray[200],
  },
  dividerText: {
    marginHorizontal: spacing(10),
    color: theme.colors.gray[500],
    fontSize: fontSize(13),
    fontFamily: theme.fonts.lato.regular,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: theme.colors.gray[700],
    fontSize: fontSize(13),
    fontFamily: theme.fonts.lato.regular,
  },
  signupLink: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(13),
  },
});
