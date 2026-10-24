import NaverLogin from '@react-native-seoul/naver-login';
import {config} from '../config';

// initialize는 앱 시작 시 한 번만 호출
NaverLogin.initialize(config.naver);

const login = async () => {
  const {successResponse, failureResponse, isCancelled} =
    await NaverLogin.login();

  if (isCancelled) {
    console.log('[Naver Login] 사용자가 취소했습니다.');
    return null;
  }

  if (!successResponse?.accessToken) {
    console.log('[Naver Login] 로그인 실패:', failureResponse);
    throw new Error(
      failureResponse?.message ?? '네이버 로그인에 실패했습니다.',
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
