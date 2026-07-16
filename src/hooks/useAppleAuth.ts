import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  appleAuth as RNAppleAuth,
  AppleError,
} from '@invertase/react-native-apple-authentication';
import { appleAuth as appleAuthApi } from '../api/functions/auth.api';
import { useAuth } from './useAuth';

/**
 * Native "Sign in with Apple" for iOS. Runs the Apple authorization sheet,
 * forwards the resulting identity token (and, on the first authorization only,
 * the user's name) to the backend, and logs the user in via the same
 * `setAuthData` path the Google flow uses.
 *
 * iOS-only — the button that calls this must be gated on `Platform.OS === 'ios'`.
 */
export const useAppleAuth = () => {
  const { setAuthData } = useAuth();
  // Covers the whole operation — the native Apple sheet AND the backend call —
  // so callers can disable UI from the very first tap, not just once the
  // network request begins. The mutation's isPending only covers the latter.
  const [isRunning, setIsRunning] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: appleAuthApi,
    onSuccess: data => setAuthData(data.data),
    onError: err => console.log('[apple-auth] backend', err),
    onSettled: () => setIsRunning(false),
  });

  const signInWithApple = async () => {
    if (isRunning || isPending) return;
    setIsRunning(true);
    try {
      const res = await RNAppleAuth.performRequest({
        requestedOperation: RNAppleAuth.Operation.LOGIN,
        // Apple only honors these scopes on the first authorization; the name
        // therefore arrives once and never again.
        requestedScopes: [RNAppleAuth.Scope.FULL_NAME, RNAppleAuth.Scope.EMAIL],
      });

      if (!res.identityToken) {
        // No token means we can't authenticate server-side — bail quietly.
        setIsRunning(false);
        return;
      }

      const fullName = [res.fullName?.givenName, res.fullName?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim();

      // isRunning stays true until the mutation settles (onSettled).
      mutate({
        identityToken: res.identityToken,
        authorizationCode: res.authorizationCode,
        fullName: fullName || undefined,
      });
    } catch (error: any) {
      setIsRunning(false);
      // The user tapping "Cancel" on the Apple sheet is not an error worth
      // surfacing; everything else is logged.
      if (error?.code !== AppleError.CANCELED) {
        console.log('[apple-auth] request', error);
      }
    }
  };

  return { signInWithApple, isApplePending: isRunning || isPending };
};
