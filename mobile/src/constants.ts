import {kakao} from './libs/kakao';

export const MESSAGE_KEY = {
  notification: {
    checkPermission: 'CHECK_NOTIFICATION_PERMISSION',
    getToken: 'GET_NOTIFICATION_TOKEN',
  },

  location: {
    checkPermission: 'CHECK_LOCATION_PERMISSION',
    getCurrentPosition: 'GET_CURRENT_POSITION',
  },

  device: {
    getInfo: 'DEVICE_INFO',
  },

  linking: {
    openSettings: 'OPEN_SETTINGS',
    externalBrowser: 'EXTERNAL_BROWSER',
    inappBrowser: 'INAPP_BROWSER',
  },

  kakao: {
    login: 'KAKAO_LOGIN',
    logout: 'KAKAO_LOGOUT',
    unlink: 'KAKAO_UNLINK',
  },

  naver: {
    login: 'NAVER_LOGIN',
    logout: 'NAVER_LOGOUT',
    unlink: 'NAVER_UNLINK',
  },
};
