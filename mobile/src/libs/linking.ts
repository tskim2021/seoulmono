import {Alert, Linking} from 'react-native';
import {openBrowser} from '@swan-io/react-native-browser';

const openSettings = () => {
  Linking.openSettings();
};

const externalBrowser = (url: string) => {
  Linking.canOpenURL(url).then(result => {
    if (result) {
      Linking.openURL(url);
    } else {
      Alert.alert('無効なURL情報です。');
    }
  });
};

const inappBrowser = (url: string) => {
  openBrowser(url, {}).catch(() => {
    Alert.alert('無効なURL情報です。');
  });
};

export const linking = {
  openSettings,
  externalBrowser,
  inappBrowser,
};
