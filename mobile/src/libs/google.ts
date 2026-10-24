import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {config} from '../config';

const login = async () => {
  try {
    GoogleSignin.configure({
      webClientId: config.google.webClientId,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (isSuccessResponse(response)) {
      console.log(JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      console.error(response);
    }
  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.IN_PROGRESS:
          console.error(`statusCodes.IN_PROGRESS`);
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          console.error(`statusCodes.PLAY_SERVICES_NOT_AVAILABLE`);
          break;
        default:
          console.error(error);
      }
    } else {
      console.error(error);
    }
  }
};

const logout = async () => {
  try {
    await GoogleSignin.signOut();
  } catch (error) {}
};

const unlink = async () => {
  try {
    await GoogleSignin.revokeAccess();
  } catch (error) {}
};

export const google = {
  login,
  logout,
  unlink,
};
