import {StaticScreenProps} from '@react-navigation/native';
import WebViewComponent from '../components/webviewComponent';
import {StatusBar, View} from 'react-native';

const WebviewScreen = ({route}: StaticScreenProps<any>) => {
  console.log('route.params', route.params);
  return (
    <View style={{flex: 1}}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <WebViewComponent link={route.params.link} />
    </View>
  );
};

export default WebviewScreen;
