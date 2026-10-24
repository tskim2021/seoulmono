import React from 'react';
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

if (__DEV__) {
  globalThis.RNFBDebug = true;
  globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
}

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  await notifee.displayNotification(remoteMessage);
  await notifee.incrementBadgeCount();
});

notifee.onBackgroundEvent(async event => {
  console.log('Background event', event);
});

function HeadlessCheck({isHeadless}) {
  if (isHeadless) {
    return null;
  }
  return <App />;
}

AppRegistry.registerComponent(appName, () => HeadlessCheck);
