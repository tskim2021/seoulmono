import React, {useCallback, useEffect, useRef} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WebView} from 'react-native-webview';
import {receiveMessage} from '../message';
import {
  OnShouldStartLoadWithRequest,
  ShouldStartLoadRequest,
  WebViewNavigation,
  WebViewScrollEvent,
} from 'react-native-webview/lib/WebViewTypes';
import {handleFileDownload} from '../utils/filedownload';
import {useBackPressHandler} from '../hooks/useBackPressHandler';
import {config} from '../config';
import {Button, Platform, ToastAndroid} from 'react-native';
import RefreshController from './refreshController';
import {linking} from '../libs/linking';
import SendIntentAndroid from 'react-native-send-intent';

const pays = [
  'supertoss://',
  'kb-acp://',
  'liivbank://',
  'newliiv://',
  'kbbank://',
  'nhappcardansimclick://',
  'nhallonepayansimclick://',
  'nonghyupcardansimclick://',
  'lottesmartpay://',
  'lotteappcard://',
  'mpocket.online.ansimclick://',
  'ansimclickscard://',
  'tswansimclick://',
  'ansimclickipcollect://',
  'vguardstart://',
  'samsungpay://',
  'scardcertiapp://',
  'shinhan-sr-ansimclick://',
  'smshinhanansimclick://',
  'com.wooricard.wcard://',
  'newsmartpib://',
  'citispay://',
  'citicardappkr://',
  'citimobileapp://',
  'cloudpay://',
  'hanawalletmembers://',
  'hdcardappcardansimclick://',
  'smhyundaiansimclick://',
  'shinsegaeeasypayment://',
  'payco://',
  'lpayapp://',
  'ispmobile://',
  'tauthlink://',
  'ktauthexternalcall://',
  'upluscorporation://',
  'kftc-bankpay://',
  'kakaotalk://',
  'wooripay://',
  'lmslpay://',
  'naversearchthirdlogin://',
  'hanaskcardmobileportal://',
  'kb-bankpay://',
  'kakaobank://',
];

const WebViewComponent = ({
  webviewRef,
  onScroll = () => {},
}: {
  webviewRef: React.RefObject<WebView<{}>>;
  onScroll?: (event: WebViewScrollEvent) => void;
  link: string;
}) => {
  const [navState, setNavState] = React.useState<WebViewNavigation>();

  useBackPressHandler(webviewRef, navState?.canGoBack ?? false);

  const handleUrlChange = useCallback((url: string) => {
    if (Platform.OS === 'android' && url.startsWith('intent:')) {
      SendIntentAndroid.openChromeIntent(url)
        .then(isOpened => {
          if (!isOpened) {
            ToastAndroid.show('앱 실행에 실패했습니다.', ToastAndroid.SHORT);
          }
        })
        .catch(() => {
          ToastAndroid.show('앱 실행에 실패했습니다.', ToastAndroid.SHORT);
        });

      return false;
    }

    handleFileDownload(url);

    if (
      !url.startsWith('http') &&
      !url.startsWith('https') &&
      !url.startsWith('about:blank')
    ) {
      return false;
    }

    if (!url.includes(config.appName)) {
      linking.externalBrowser(url);
      return false;
    }

    return true;
  }, []);

  const onShouldStartLoadWithRequest: OnShouldStartLoadWithRequest = (
    event: ShouldStartLoadRequest,
  ) => handleUrlChange(event.url);

  const onNavigationStateChange = (event: WebViewNavigation) => {
    handleUrlChange(event.url);
    setNavState(event);
  };

  return (
    <SafeAreaView
      edges={['right', 'left', 'top', 'bottom']}
      style={{flex: 1, backgroundColor: 'white'}}>
      <WebView
        // @ts-ignore
        onScroll={onScroll}
        originWhitelist={['*']}
        ref={webviewRef}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        allowsInlineMediaPlayback={true}
        pullToRefreshEnabled={true}
        allowsBackForwardNavigationGestures={true}
        mediaPlaybackRequiresUserAction={true}
        sharedCookiesEnabled={true}
        androidLayerType={'hardware'}
        contentMode={'recommended'}
        geolocationEnabled={false}
        cacheEnabled={true}
        showsHorizontalScrollIndicator={false}
        applicationNameForUserAgent={config.customUserAgent}
        textZoom={100}
        source={{uri: config.url}}
        onMessage={event => receiveMessage(webviewRef, event)}
        injectedJavaScript={config.injectedJavaScript}
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onContentProcessDidTerminate={() => {
          webviewRef.current?.reload();
        }}
      />
    </SafeAreaView>
  );
};

export default function App({link}: {link: string}) {
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    if (!link) return;
    webviewRef.current?.injectJavaScript(`
      window.location.href = '${link}';
    `);
  }, [link]);

  return Platform.OS === 'ios' ? (
    <WebViewComponent webviewRef={webviewRef} link={link} />
  ) : (
    <RefreshController webviewRef={webviewRef}>
      <WebViewComponent webviewRef={webviewRef} link={link} />
    </RefreshController>
  );
}
