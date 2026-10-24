import {useEffect} from 'react';
import SplashScreen from 'react-native-splash-screen';

export const useHideSplashScreen = () => {
  useEffect(() => {
    setTimeout(() => {
      SplashScreen.hide();
    }, 2000);
  }, []);
};
