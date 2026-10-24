import {Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';

export const device = {
  getInfo: () => {
    return {
      platform: Platform.OS,
      appVersion: DeviceInfo.getVersion(),
      uniqueId: DeviceInfo.getUniqueIdSync(),
    };
  },
};
