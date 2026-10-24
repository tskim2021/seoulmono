# ソウルモノ — seoulmono.com

既存の sorosoroseoul を複製したサービスです。画面・機能の基準は原本Gitの `e3a08208720a831c5d8d398ce605c9e790cf3a1c` に含まれる運用スナップショットです。

## 運用ファイル

- `artifacts/shop-live`: `shop-dist-snapshot` の実稼働Web。レイアウト、バナー、マスコット、検索・ログイン処理を保持。ブランド名・ドメインのみ変更。
- `artifacts/api-server-live/index.mjs`: `api-server-compiled-snapshot` の実稼働API。DB構造と処理を保持。新ドメインとローカル待受を適用し、秘密情報は環境変数から取得。
- `artifacts/seoulmono-admin`: `sorosoro-admin2-live-snapshot` の管理システム。`/admin/`、ポート8090。既存管理者のID・パスワードハッシュを非公開のDB移行で維持。新規管理者は生成しません。
- `artifacts/seoulmono-app`: Gitの `artifacts/allddaom-app` を複製。名前「ソウルモノ」、ID `com.seoulmono.app`、API `https://seoulmono.com/api`。既存アプリの画面を維持します。

**`artifacts/shop` を単独でビルドすると運用画面になりません。** `deploy/install-live.sh` が実稼働スナップショットを配置します。原本の別途ローカル開発中のアプリは、このGit版には含めていません。

## 配置・更新

Node.js 24、pnpm 10.34.8、MariaDB、Nginx、PM2。サーバー配置先は `/var/www/seoulmono`。

```sh
# 新規サーバーの基盤準備（カタログ・設定・既存管理者は非公開DBバックアップから別途復元）
CERTBOT_EMAIL=you@example.com bash deploy/setup-server.sh
# 既存サーバーのコード更新
 git pull --ff-only
 bash deploy/update.sh
```

`.env` と管理システムの `.env` はサーバー専用・0600。秘密情報、管理者ハッシュ、DBダンプ、署名鍵をGitに追加しません。`deploy/schema.sql` はデータを含まない原本スキーマです。

2026-10-24の復元では商品2,894件、カテゴリー21件、画面設定、既存管理者1件を独立したDB `seoulmono_live` に複製しました。一般会員と注文は0件です。原本サーバーは読み取りのみ。切替前バックアップは新サーバーの `/root/seoulmono-backups/pre-original-restore/` に保存。

## アプリのビルド状況

Android `1.0.1` / `com.seoulmono.app` のARM64プレビューAPKをローカル生成しました（Gradle releaseビルド、開発用署名）。Google Playの公開ビルドではありません。iOSはJavaScriptバンドル検証のみで、IPA・TestFlight配布は未実施です。旧サービスのEAS/OTAプロジェクトとは分離しています。

SMTP・決済・SNSログインのサービス認証情報は新サーバーに未設定です。画面/APIの複製と、実際のメール配信・決済・ストア公開は別の確認段階です。
