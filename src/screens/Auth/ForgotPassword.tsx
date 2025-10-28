import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { theme } from '../../theme';
import { assets } from '../../assets';
import { fontSize, SCREEN_WIDTH, spacing } from '../../utils';
import AppInput from '../../components/ui/AppInput';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppCheckBox from '../../components/ui/AppCheckBox';
import AppButton from '../../components/ui/AppButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;
export default function ForgotPassword() {
  const { styles } = useStyles(stylesheet);
  const navigation = useNavigation<LoginScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <Image source={assets.images.AuthBackground} style={styles.bgImage} />
      <View style={styles.card}>
        {/* Header */}
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your email to receive password reset instructions
        </Text>
        <View style={{ gap: spacing(16) }}>
          <AppInput
            label="Email ID"
            placeholder="Enter email address"
            keyboardType="email-address"
          />
        </View>

        {/* Signup Button */}
        <AppButton text="Submit" style={{ marginVertical: spacing(14) }} />

        {/* Signup */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signupLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const stylesheet = createStyleSheet({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bgImage: {
    position: 'absolute',
    bottom: 0,
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
