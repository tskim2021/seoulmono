### ハッシュキーの抽出

```
keytool -genkey -v -keystore gongimnara.keystore -alias gongimnara -keyalg RSA -keysize 2048 -validity 10000
keytool -exportcert -alias {my-app-key-alias} -keystore {your-key-path}/{my-app-key}.keystore -storepass android -keypass android | openssl sha1 -binary | openssl base64
```
