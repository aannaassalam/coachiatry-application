import * as Keychain from 'react-native-keychain';

export const getToken = async () => {
  const credentials = await Keychain.getGenericPassword();
  if (!credentials) return null;
  return credentials.password;
};

export const setToken = async (token: string) => {
  await Keychain.setGenericPassword('token', token);
};

export const removeToken = async () => {
  await Keychain.resetGenericPassword();
};
