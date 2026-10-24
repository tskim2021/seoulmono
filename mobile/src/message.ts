import {WebView} from 'react-native-webview';
import {WebViewMessageEvent} from 'react-native-webview/lib/WebViewTypes';
import {notification} from './libs/notification';
import {Alert} from 'react-native';
import {MESSAGE_KEY} from './constants';
import {geolocation} from './libs/geolocation';
import {device} from './libs/deviceInfo';
import {linking} from './libs/linking';
import {kakao} from './libs/kakao';
import {naver} from './libs/naver';

const safeJSONParse = (data: string): {key: string; value: string} | null => {
  try {
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
};

export const receiveMessage = async (
  webviewRef: React.RefObject<WebView>,
  event: WebViewMessageEvent,
) => {
  const data = safeJSONParse(event.nativeEvent.data);
  if (!data) return;

  const {key, value} = data;
  const sendMessage = (response: any) => {
    webviewRef.current?.postMessage(JSON.stringify({key, value: response}));
  };

  try {
    switch (key) {
      // 푸시 권한 확인
      case MESSAGE_KEY.notification.checkPermission: {
        const result = await notification.requestNotificationPermission();
        sendMessage(result);
        break;
      }
      // 푸시 토큰 조회
      case MESSAGE_KEY.notification.getToken: {
        const result = await notification.getNotificationToken();
        sendMessage(result);
        break;
      }

      // 위치 권한 확인
      case MESSAGE_KEY.location.checkPermission: {
        const result = await geolocation.checkPermission();
        sendMessage(result);
        break;
      }
      // 현재 위치 조회
      case MESSAGE_KEY.location.getCurrentPosition: {
        const result = await geolocation.getCurrentPosition();
        sendMessage(result);
        break;
      }

      // 기기 정보 조회
      case MESSAGE_KEY.device.getInfo: {
        const result = device.getInfo();
        sendMessage(result);
        break;
      }

      // 링크 이동
      case MESSAGE_KEY.linking.openSettings: {
        linking.openSettings();
        break;
      }

      // 외부 브라우저 실행
      case MESSAGE_KEY.linking.externalBrowser: {
        linking.externalBrowser(value);
        break;
      }

      // 인앱 브라우저 실행
      case MESSAGE_KEY.linking.inappBrowser: {
        linking.inappBrowser(value);
        break;
      }

      // 카카오 로그인
      case MESSAGE_KEY.kakao.login: {
        try {
          const result = await kakao.login();
          sendMessage(result);
        } catch (e) {
          // 취소 또는 실패 시 웹에 null 전달 (콜백이 무한 대기하지 않도록)
          console.log('[Kakao Login Error]', e);
          sendMessage(null);
        }
        break;
      }

      // 카카오 로그아웃
      case MESSAGE_KEY.kakao.logout: {
        await kakao.logout();
        break;
      }

      // 카카오 링크 해제
      case MESSAGE_KEY.kakao.unlink: {
        await kakao.unlink();
        break;
      }

      // 네이버 로그인
      case MESSAGE_KEY.naver.login: {
        try {
          const result = await naver.login();
          sendMessage(result);
        } catch (e) {
          // 실패 시 웹에 null 전달
          console.log('[Naver Login Error]', e);
          sendMessage(null);
        }
        break;
      }

      // 네이버 로그아웃
      case MESSAGE_KEY.naver.logout: {
        await naver.logout();
        break;
      }

      // 네이버 링크 해제
      case MESSAGE_KEY.naver.unlink: {
        await naver.unlink();
        break;
      }

      default: {
        console.log('처리할 수 없는 메시지입니다', key);
        break;
      }
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      Alert.alert(e.message);
    } else {
      Alert.alert('알 수 없는 오류가 발생했습니다', JSON.stringify(e));
    }
  }
};
