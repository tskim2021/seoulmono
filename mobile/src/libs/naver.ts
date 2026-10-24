import NaverLogin from '@react-native-seoul/naver-login';
import {config} from '../config';

// initialize はアプリ起動時に一度だけ呼び出す
NaverLogin.initialize(config.naver);

const login = async () => {
  const {successResponse, failureResponse, isCancelled} =
    await NaverLogin.login();

  if (isCancelled) {
    console.log('[Naver Login] ユーザーがキャンセルしました。');
    return null;
  }

  if (!successResponse?.accessToken) {
    console.log('[Naver Login] ログイン失敗:', failureResponse);
    throw new Error(
      failureResponse?.message ?? 'NAVERログインに失敗しました。',
    );
  }

  const profileResult = await NaverLogin.getProfile(
    successResponse.accessToken,
  );

  const result = {
    ...successResponse,
    profile: profileResult.response,
  };

  console.log('[Naver Login]', JSON.stringify(result, null, 2));
  return result;
};

const logout = async () => {
  try {
    await NaverLogin.logout();
  } catch (error) {
    console.log('[Naver Logout Error]', error);
  }
};

const unlink = async () => {
  try {
    await NaverLogin.deleteToken();
  } catch (error) {
    console.log('[Naver Unlink Error]', error);
  }
};

export const naver = {
  login,
  logout,
  unlink,
};
