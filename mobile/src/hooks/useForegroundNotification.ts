import {useEffect} from 'react';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';

const displayNotification = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
) => {
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'default',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    ...remoteMessage,
    title: remoteMessage.notification?.title,
    body: remoteMessage.notification?.body,
    android: {
      channelId,
    },
    ios: {
      foregroundPresentationOptions: {
        banner: true,
        badge: true,
        sound: true,
        list: true,
      },
    },
  });
};

export const useForegroundNotification = () => {
  useEffect(() => {
    const unsubscribe = messaging().onMessage(displayNotification);
    return unsubscribe;
  }, []);
};
