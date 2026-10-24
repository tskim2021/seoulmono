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
      Alert.alert('잘못된 URL 정보 입니다.');
    }
  });
};

const inappBrowser = (url: string) => {
  openBrowser(url, {}).catch(() => {
    Alert.alert('잘못된 URL 정보 입니다.');
  });
};

export const linking = {
  openSettings,
  externalBrowser,
  inappBrowser,
};
