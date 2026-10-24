import {Alert, PermissionsAndroid, Platform} from 'react-native';
import RNFetchBlob from 'react-native-blob-util';

export const handleFileDownload = (url: string) => {
  const isFileDownloadUrl = (fileUrl: string) => {
    const fileExtensions = [
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.zip',
      '.txt',
    ];
    return fileExtensions.some(ext => fileUrl.toLowerCase().includes(ext));
  };

  const downloadFile = async (fileUrl: string) => {
    try {
      const fileName = fileUrl.split('/').pop();
      const downloadPath =
        Platform.OS === 'android'
          ? `${RNFetchBlob.fs.dirs.DownloadDir}/${fileName}`
          : fileName;

      Alert.alert('ファイルのダウンロード', 'ファイルをダウンロードしますか?', [
        {text: 'キャンセル', style: 'cancel'},
        {
          text: 'OK',
          onPress: async () => {
            try {
              if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                  Alert.alert(
                    '権限が必要です',
                    'ファイルをダウンロードするには、ストレージの権限が必要です。',
                  );
                  return;
                }
              }

              const configOptions = {
                fileCache: true,
                addAndroidDownloads: {
                  useDownloadManager: true,
                  notification: true,
                  path: downloadPath,
                  description: 'ファイルをダウンロード中...',
                  title: fileName,
                  mime: 'application/octet-stream',
                },
                progress: (received: number, total: number) => {
                  const progress = (received / total) * 100;
                  console.log(`ダウンロード進捗: ${progress}%`);
                },
              };

              const response = await RNFetchBlob.config(configOptions).fetch(
                'GET',
                fileUrl,
              );

              if (Platform.OS === 'ios') {
                RNFetchBlob.ios.previewDocument(response.path());
              } else {
                Alert.alert('ダウンロード完了', 'ファイルをダウンロードしました。', [
                  {
                    text: 'ファイルを開く',
                    onPress: () => {
                      RNFetchBlob.android.actionViewIntent(
                        response.path(),
                        'application/octet-stream',
                      );
                    },
                  },
                  {text: 'OK'},
                ]);
              }
            } catch (error) {
              Alert.alert('エラー', 'ファイルのダウンロード中にエラーが発生しました。');
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert('エラー', 'ファイルのダウンロードを処理できません。');
    }
  };

  if (isFileDownloadUrl(url)) {
    downloadFile(url);
    return false;
  }
};
