import messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';
import {PermissionsAndroid} from 'react-native';

const requestNotificationPermission = async () => {
  // ios
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    return enabled;
  }
  // android
  else if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      return true;
    }
  }
};

const getNotificationToken = async () => messaging().getToken();

export const notification = {
  requestNotificationPermission,
  getNotificationToken,
};
