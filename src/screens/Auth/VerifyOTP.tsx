import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Pressable,
  KeyboardAvoidingView,
  ImageBackground,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { theme } from '../../theme';
import { assets } from '../../assets';
import { fontSize, SCREEN_WIDTH, spacing } from '../../utils';
import AppInput from '../../components/ui/AppInput';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppCheckBox from '../../components/ui/AppCheckBox';
import AppButton from '../../components/ui/AppButton';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, AuthStackParamList } from '../../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FormProvider, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import {
  forgotPassword,
  updateFCMToken,
  verifyOtp,
} from '../../api/functions/auth.api';
import { yupResolver } from '@hookform/resolvers/yup';
import { getToken, onError } from '../../helpers/utils';
import TouchableButton from '../../components/TouchableButton';
import { OtpInput } from 'react-native-otp-entry';
import { useAuth } from '../../hooks/useAuth';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'VerifyOTP'
>;

export default function VerifyOTP() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<AuthStackParamList, 'VerifyOTP'>>();
  const { email } = route.params;
  const { setAuthData } = useAuth();
  const { styles } = useStyles(stylesheet);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [otp, setOtp] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: verifyOtp,
    onSuccess: async _data => {
      setAuthData(_data.data);
      const fcmToken = await getToken();
      await updateFCMToken(fcmToken as string);
      //   navigation.goBack();
    },
  });

  const onSubmit = () => {
    mutate({ email: email, otp });
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
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter OTP sent to your at {email}
            </Text>
            <View style={{ gap: spacing(16) }}>
              <OtpInput
                numberOfDigits={6}
                focusColor="black"
                blurOnFilled
                type="numeric"
                onTextChange={text => setOtp(text)}
                onFilled={text => mutate({ email, otp: text })}
                disabled={isPending}
              />
            </View>

            {/* Signup Button */}
            <AppButton
              text="Submit"
              style={{ marginVertical: spacing(14) }}
              onPress={onSubmit}
              isLoading={isPending}
            />

            {/* Signup */}
            <View style={styles.signupRow}>
              {/* <Text style={styles.signupText}>Already have an account? </Text> */}
              <TouchableButton onPress={navigation.goBack} disabled={isPending}>
                <Text style={styles.signupLink}>Go Back</Text>
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
