import {
  appleAuth,
  appleAuthAndroid,
} from '@invertase/react-native-apple-authentication';
import {jwtDecode} from 'jwt-decode';
import {config} from '../config';
import {Alert, Platform} from 'react-native';

const iosLogin = async () => {
  try {
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    const body = {
      provider: 'apple',
      providerId: appleAuthRequestResponse.user,
      userName:
        appleAuthRequestResponse.fullName?.givenName! +
        appleAuthRequestResponse.fullName?.familyName!,
      email: appleAuthRequestResponse.email!,
      accessToken: '',
      idToken: appleAuthRequestResponse.identityToken!,
    };

    console.log('ios login response', body);

    return body;
  } catch (e) {
    console.log('ios login error', e);
  }
};

const androidLogin = async () => {
  try {
    appleAuthAndroid.configure({
      clientId: config.apple.clientId,
      redirectUri: config.apple.redirectUri,
      scope: appleAuthAndroid.Scope.ALL,
      responseType: appleAuthAndroid.ResponseType.ALL,
    });
    const response = await appleAuthAndroid.signIn();

    if (response.id_token) {
      const decoded = jwtDecode(response.id_token!);
      const body = {
        provider: 'apple',
        providerId: decoded.sub!,
        userName: `${response.user?.name?.firstName} ${response.user?.name?.lastName}`,
        email: response.user?.email || '',
        accessToken: '',
        idToken: response.id_token!,
      };

      return body;
    }
  } catch (error) {
    console.log('android login error', error);
    return {};
  }
};

const login = async () => {
  if (Platform.OS === 'ios') {
    return iosLogin();
  } else if (Platform.OS === 'android') {
    return androidLogin();
  } else {
    throw new Error('other platform not supported');
  }
};

const logout = async () => {};
const unlink = async () => {};

export const apple = {
  login,
  logout,
  unlink,
};
