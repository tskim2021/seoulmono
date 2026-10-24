import {
  isKakaoTalkLoginAvailable,
  loginWithKakaoTalk,
  loginWithKakaoAccount,
  getProfile,
  logout as kakaoLogout,
  unlink as kakaoUnlink,
} from '@react-native-seoul/kakao-login';

/**
 * カカオログイン
 * - カカオトークアプリがインストールされていれば loginWithKakaoTalk() を使用 → アプリで自動ログイン
 * - インストールされていなければ loginWithKakaoAccount() を使用 → Webログイン
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
