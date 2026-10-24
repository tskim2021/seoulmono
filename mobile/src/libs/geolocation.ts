import Geolocation from '@react-native-community/geolocation';
import {Platform} from 'react-native';
import {check, PERMISSIONS} from 'react-native-permissions';

function getPermissionName(platform: string) {
  if (platform === 'ios') {
    return PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
  } else if (platform === 'android') {
    return PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
  } else {
    throw new Error('サポートされていないプラットフォームです。');
  }
}

const checkPermission = async () => {
  return new Promise<boolean>(resolve => {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      enableBackgroundLocationUpdates: true,
      locationProvider: 'auto',
    });

    check(getPermissionName(Platform.OS))
      .then(status => {
        if (status === 'denied') {
          Geolocation.requestAuthorization(
            () => resolve(true),
            () => resolve(false),
          );
        } else {
          if (status === 'unavailable') resolve(false);
          else if (status === 'blocked') resolve(false);
          else if (status === 'limited') resolve(false);
          else if (status === 'granted') resolve(true);
        }
      })
      .catch(() => {
        resolve(false);
      });
  });
};

const getCurrentPosition = async () => {
  return new Promise<{
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  } | null>(resolve => {
    Geolocation.getCurrentPosition(
      position => resolve(position.coords),
      () => resolve(null),
    );
  });
};

export const geolocation = {
  checkPermission,
  getCurrentPosition,
};
