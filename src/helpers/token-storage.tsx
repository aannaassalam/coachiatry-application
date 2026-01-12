import * as Keychain from 'react-native-keychain';

export const getToken = async () => {
  const credentials = await Keychain.getGenericPassword({
    service: 'auth-token',
  });
  if (!credentials) return null;
  return credentials.password;
};

export const setToken = async (token: string) => {
  await Keychain.setGenericPassword('token', token, {
    service: 'auth-token',
    storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
  });
};

export const removeToken = async () => {
  try {
    // Overwrite with dummy values first (prevents native crash)
    await Keychain.setGenericPassword('token', 'dummy', {
      service: 'auth-token',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });

    // Then safely reset
    await Keychain.resetGenericPassword({
      service: 'auth-token',
    });
  } catch (err) {
    // Absolutely ignore — logout must never fail
    console.log(err);
  }
};
