import React, {useState} from 'react';
import {RefreshControl, ScrollView, StyleSheet} from 'react-native';
import WebView from 'react-native-webview';

const RefreshController = ({
  children,
  webviewRef,
}: {
  children: React.ReactNode;
  webviewRef: React.RefObject<WebView>;
}) => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [refresherEnabled, setEnableRefresher] = useState<boolean>(true);

  const triggerRefresh = () => {
    setRefreshing(true);
    webviewRef?.current?.reload();
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleScroll = (event: any) => {
    setEnableRefresher(Number(event.nativeEvent.contentOffset.y) === 0);
  };

  const childrenWithProps = React.Children.map(
    children,
    (child: React.ReactNode) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          // @ts-ignore
          onScroll: (event: any) => handleScroll(event),
        });
      }
      return child;
    },
  );

  return (
    <>
      <ScrollView
        contentContainerStyle={style.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            enabled={refresherEnabled}
            onRefresh={triggerRefresh}
          />
        }>
        {childrenWithProps}
      </ScrollView>
    </>
  );
};

const style = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default RefreshController;
