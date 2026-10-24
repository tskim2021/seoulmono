# ソウルモノ (seoulmono.com)

pnpm モノレポ。日本向けサービス。

- `artifacts/api-server` – API サーバー (Express, port 8080)
- `artifacts/shop` – ショップ (Web)
- `artifacts/order-system` – 発注システム (`/b2b/`)
- `artifacts/seoulmono-admin` – 管理画面
- `artifacts/seoulmono-app`, `mobile` – モバイルアプリ

秘密情報 (`.env*`, Firebase, キーストア) はリポジトリに含めません。

## デプロイ

Node.js 24、pnpm 10.34.8、MariaDB、Nginx、PM2を使用します。

```sh
CERTBOT_EMAIL=you@example.com bash deploy/setup-server.sh
```

更新は `/var/www/seoulmono` で `git pull --ff-only && bash deploy/update.sh` を実行します。
`.env` はサーバーのみで管理し、Node.js の `--env-file` で読み込みます。
`deploy/schema.sql` は空のテーブルと新サービス用設定のみを作成します。
商品・カテゴリー・商品画像の移行は別途行います。会員・注文・決済情報は移行しません。
既存のNginxサイトとSSL設定を保持し、APIはlocalhostで待ち受けます。

## アプリ

`artifacts/seoulmono-app` は既存のExpoアプリを複製したソウルモノ版です。
表示名は「ソウルモノ」、iOS/Android IDは `com.seoulmono.app`、APIは `https://seoulmono.com/api` です。
旧EASプロジェクトとOTA更新から分離しています。
型検査とAndroid/iOSのJavaScript書き出しを確認済みです。APK/IPA作成・TestFlight配布は未実施です。

## 未接続のサービス

SMTP、決済代行、ソーシャルログインは専用認証情報が必要です。
本番の決済・メール配信・配送条件は別途設定と実取引検証が必要です。
