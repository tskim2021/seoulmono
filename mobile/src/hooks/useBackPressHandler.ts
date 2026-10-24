import {useEffect, useRef, useState} from 'react';
import {WebView} from 'react-native-webview';
import {BackHandler, ToastAndroid} from 'react-native';

export const useBackPressHandler = (
  webViewRef: React.RefObject<WebView>,
  canGoBack: boolean,
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [backPressCount, setBackPressCount] = useState(0);

  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }

      if (backPressCount === 0) {
        ToastAndroid.show(
          'もう一度押すとアプリが終了します。',
          ToastAndroid.SHORT,
        );
        setBackPressCount(1);

        timeoutRef.current = setTimeout(() => {
          setBackPressCount(0);
          timeoutRef.current = null;
        }, 2000);
        return true;
      }

      BackHandler.exitApp();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => {
      backHandler.remove();
      clearTimeout(timeoutRef.current ?? undefined);
    };
  }, [backPressCount, canGoBack, webViewRef]);
};
