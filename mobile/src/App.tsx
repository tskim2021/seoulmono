import React, {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useHideSplashScreen} from './hooks';
import {useForegroundNotification} from './hooks/useForegroundNotification';
import {
  createNavigationContainerRef,
  createStaticNavigation,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {StaticParamList} from '@react-navigation/native';

import WebviewScreen from './screens/webviewScreen';
import CameraQrScreen from './screens/cameraQrScreen';
import {notification} from './libs/notification';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import {Platform} from 'react-native';
import {geolocation} from './libs/geolocation';
import notifee, {EventType} from '@notifee/react-native';

import messaging from '@react-native-firebase/messaging';

const RootStack = createNativeStackNavigator({
  initialRouteName: 'WebviewScreen',
  screenOptions: {
    headerShown: false,
  },
  screens: {
    WebviewScreen: {
      screen: WebviewScreen,
      initialParams: {
        link: undefined,
      },
    },
    CameraQrScreen: {
      screen: CameraQrScreen,
    },
  },
});

const Navigation = createStaticNavigation(RootStack);

export type RootStackParamList = StaticParamList<typeof RootStack>;

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
export function navigate(data: any) {
  if (navigationRef.isReady()) {
    navigationRef.setParams<'WebviewScreen'>(data);
  }
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

function App(): React.JSX.Element {
  useHideSplashScreen();
  useForegroundNotification();

  useEffect(() => {
    async function initialize() {
      await notification.requestNotificationPermission();
      notification.getNotificationToken().then(console.log);
      // await geolocation.checkPermission();

      if (Platform.OS === 'ios') {
        check(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY).then(result => {
          if (result === RESULTS.DENIED) {
            request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
          }
        });
      }
    }

    initialize();

    messaging().onNotificationOpenedApp(remoteMessage => {
      Platform.OS === 'android'
        ? setTimeout(() => navigate(remoteMessage.data), 1000)
        : navigate(remoteMessage.data);
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (Platform.OS === 'android') {
          if (remoteMessage) {
            setTimeout(() => navigate(remoteMessage.data), 1000);
          }
        }
      })
      .catch(console.error);

    notifee.onBackgroundEvent(async event => {
      console.log('event.detail.notification', event.detail.notification);
      notifee.decrementBadgeCount();
      delete event.detail.notification?.android;
      delete event.detail.notification?.ios;
      navigate(event.detail.notification?.data);
    });

    return notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS) {
        notifee.decrementBadgeCount();
        delete detail.notification?.android;
        delete detail.notification?.ios;
        navigate(detail.notification?.data);
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <Navigation ref={navigationRef} />
    </SafeAreaProvider>
  );
}

export default App;
