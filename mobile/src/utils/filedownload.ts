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

      Alert.alert('파일 다운로드', '파일을 다운로드하시겠습니까?', [
        {text: '취소', style: 'cancel'},
        {
          text: '확인',
          onPress: async () => {
            try {
              if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                  Alert.alert(
                    '권한이 필요합니다',
                    '파일을 다운로드하려면 저장소 권한이 필요합니다.',
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
                  description: '파일 다운로드 중...',
                  title: fileName,
                  mime: 'application/octet-stream',
                },
                progress: (received: number, total: number) => {
                  const progress = (received / total) * 100;
                  console.log(`다운로드 진행률: ${progress}%`);
                },
              };

              const response = await RNFetchBlob.config(configOptions).fetch(
                'GET',
                fileUrl,
              );

              if (Platform.OS === 'ios') {
                RNFetchBlob.ios.previewDocument(response.path());
              } else {
                Alert.alert('다운로드 완료', '파일이 다운로드 되었습니다.', [
                  {
                    text: '파일 열기',
                    onPress: () => {
                      RNFetchBlob.android.actionViewIntent(
                        response.path(),
                        'application/octet-stream',
                      );
                    },
                  },
                  {text: '확인'},
                ]);
              }
            } catch (error) {
              Alert.alert('오류', '파일 다운로드 중 오류가 발생했습니다.');
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert('오류', '파일 다운로드를 처리할 수 없습니다.');
    }
  };

  if (isFileDownloadUrl(url)) {
    downloadFile(url);
    return false;
  }
};
