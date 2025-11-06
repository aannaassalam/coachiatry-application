import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
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
  const { data = null, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  useEffect(() => {
    (async () => {
      const t = await getToken();
      setToken(t ?? '');
    })();
  }, []);

  const setAuthData = async ({
    token: _token,
    user,
  }: {
    token: string;
    user: User | null;
  }) => {
    setToken(_token);
    await queryClient.setQueryData(['profile'], user);
    await setServerToken(_token);
  };

  return (
    <AuthContext.Provider
      value={{ token, profile: data, isProfileLoading: isLoading, setAuthData }}
    >
      {children}
    </AuthContext.Provider>
  );
}
