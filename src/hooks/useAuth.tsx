import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { User } from '../typescript/interface/user.interface';
import { getToken, setToken as setServerToken } from '../helpers/token-storage';
import { useQuery } from '@tanstack/react-query';
import { fetchProfile } from '../api/functions/user.api';
import { queryClient } from '../../App';

type AuthContextTypes = {
  token: string;
  profile: User | null;
  isProfileLoading: boolean;
  setAuthData: (body: { token: string; user: User | null }) => void;
};

const AuthContext = createContext<AuthContextTypes>({
  token: '',
  profile: null,
  isProfileLoading: true,
  setAuthData: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string>('');
  // `tokenLoaded` tracks whether we've read the keychain yet, so the profile
  // query stays disabled (rather than firing token-less and 401-ing) until we
  // actually know whether there's a session.
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const { data = null, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: ({ signal }) => fetchProfile(signal),
    // Only fetch /user/me once we hold a token. Without this the query fired on
    // the auth screen (and in the gap right after logout) with no Authorization
    // header, which the backend answers with 401 for every attempt.
    enabled: !!token,
  });

  useEffect(() => {
    (async () => {
      const t = await getToken();
      setToken(t ?? '');
      setTokenLoaded(true);
    })();
  }, []);

  const setAuthData = async ({
    token: _token,
    user,
  }: {
    token: string;
    user: User | null;
  }) => {
    // Persist the token FIRST so any query that refetches below (e.g. the
    // always-on ['profile'] observer) authenticates as the NEW user — the axios
    // interceptor reads the token from storage on every request.
    await setServerToken(_token);
    setToken(_token);

    // Wipe EVERY cached query on any identity change (login or logout).
    // Previously only ['profile'] was reseeded, so every other key
    // (['settings-profile'], tasks, chats, …) kept the previous account's data
    // until it was garbage-collected — which is how a fresh login could show
    // the prior user's details on the settings screen (and anywhere else).
    // removeQueries (not clear) so the in-flight login mutation that called us
    // isn't wiped from the mutation cache mid-settle.
    queryClient.removeQueries();

    // Seed the profile so consumers don't flash empty while /user/me refetches.
    if (user) {
      queryClient.setQueryData(['profile'], user);
    }
  };

  // Memoize the context value so every useAuth() consumer (avatars, chat rows,
  // dashboard, etc.) doesn't re-render on every AuthProvider render.
  const value = useMemo(
    () => ({
      token,
      profile: data,
      // Still "loading" until the keychain read resolves, so consumers don't
      // treat the brief token-less startup window as "logged out".
      isProfileLoading: !tokenLoaded || isLoading,
      setAuthData,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, data, isLoading, tokenLoaded],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
