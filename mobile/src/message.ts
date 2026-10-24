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
      // プッシュ通知の権限確認
      case MESSAGE_KEY.notification.checkPermission: {
        const result = await notification.requestNotificationPermission();
        sendMessage(result);
        break;
      }
      // プッシュトークン取得
      case MESSAGE_KEY.notification.getToken: {
        const result = await notification.getNotificationToken();
        sendMessage(result);
        break;
      }

      // 位置情報の権限確認
      case MESSAGE_KEY.location.checkPermission: {
        const result = await geolocation.checkPermission();
        sendMessage(result);
        break;
      }
      // 現在地の取得
      case MESSAGE_KEY.location.getCurrentPosition: {
        const result = await geolocation.getCurrentPosition();
        sendMessage(result);
        break;
      }

      // 端末情報の取得
      case MESSAGE_KEY.device.getInfo: {
        const result = device.getInfo();
        sendMessage(result);
        break;
      }

      // リンク移動
      case MESSAGE_KEY.linking.openSettings: {
        linking.openSettings();
        break;
      }

      // 外部ブラウザの起動
      case MESSAGE_KEY.linking.externalBrowser: {
        linking.externalBrowser(value);
        break;
      }

      // アプリ内ブラウザの起動
      case MESSAGE_KEY.linking.inappBrowser: {
        linking.inappBrowser(value);
        break;
      }

      // カカオログイン
      case MESSAGE_KEY.kakao.login: {
        try {
          const result = await kakao.login();
          sendMessage(result);
        } catch (e) {
          // キャンセルまたは失敗時はWebへnullを渡す (コールバックが無限に待機しないように)
          console.log('[Kakao Login Error]', e);
          sendMessage(null);
        }
        break;
      }

      // カカオログアウト
      case MESSAGE_KEY.kakao.logout: {
        await kakao.logout();
        break;
      }

      // カカオ連携解除
      case MESSAGE_KEY.kakao.unlink: {
        await kakao.unlink();
        break;
      }

      // NAVERログイン
      case MESSAGE_KEY.naver.login: {
        try {
          const result = await naver.login();
          sendMessage(result);
        } catch (e) {
          // 失敗時はWebへnullを渡す
          console.log('[Naver Login Error]', e);
          sendMessage(null);
        }
        break;
      }

      // NAVERログアウト
      case MESSAGE_KEY.naver.logout: {
        await naver.logout();
        break;
      }

      // NAVER連携解除
      case MESSAGE_KEY.naver.unlink: {
        await naver.unlink();
        break;
      }

      default: {
        console.log('処理できないメッセージです', key);
        break;
      }
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      Alert.alert(e.message);
    } else {
      Alert.alert('不明なエラーが発生しました', JSON.stringify(e));
    }
  }
};
