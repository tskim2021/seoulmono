import {
  isKakaoTalkLoginAvailable,
  loginWithKakaoTalk,
  loginWithKakaoAccount,
  getProfile,
  logout as kakaoLogout,
  unlink as kakaoUnlink,
} from '@react-native-seoul/kakao-login';

/**
 * 카카오 로그인
 * - 카카오톡 앱이 설치되어 있으면 loginWithKakaoTalk() 사용 → 앱 자동 로그인
 * - 설치되어 있지 않으면 loginWithKakaoAccount() 사용 → 웹 로그인
 */
const login = async () => {
  const isAvailable = await isKakaoTalkLoginAvailable();

  const result = isAvailable
    ? await loginWithKakaoTalk({})
    : await loginWithKakaoAccount();

  const profile = await getProfile();

  const response = {
    ...result,
    profile,
  };

  console.log('[Kakao Login]', JSON.stringify(response, null, 2));
  return response;
};

const logout = async () => {
  try {
    await kakaoLogout();
  } catch (error) {
    console.log('[Kakao Logout Error]', error);
  }
};

const unlink = async () => {
  try {
    await kakaoUnlink();
  } catch (error) {
    console.log('[Kakao Unlink Error]', error);
  }
};

export const kakao = {
  login,
  logout,
  unlink,
};
