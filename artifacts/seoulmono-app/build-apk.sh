#!/bin/bash
# ソウルモノ モバイルアプリ - Android APK ビルドスクリプト
# Expo EAS を使ってクラウドでビルド
#
# 使い方:
#   EXPO_TOKEN=<your-token> ./build-apk.sh
#

set -e

echo "================================"
echo "  ソウルモノ APK ビルド開始"
echo "================================"
echo ""

# EXPO_TOKEN の確認
if [ -z "$EXPO_TOKEN" ]; then
    echo "エラー: EXPO_TOKEN 環境変数が設定されていません。"
    echo "Expo Access Token を https://expo.dev/settings/access-tokens で発行してください。"
    exit 1
fi

# EAS Build 開始 (non-interactive, 完了まで待機)
echo "[1/1] EAS Android APK ビルド開始..."
echo "ビルドは Expo クラウドサーバー上で実行されます (約10〜15分)"
echo ""

EAS_NO_VCS=1 EXPO_TOKEN="$EXPO_TOKEN" npx eas build --platform android --profile preview --non-interactive

echo ""
echo "================================"
echo "  ビルドリクエスト完了!"
echo "================================"
echo "ビルド状況の確認: https://expo.dev/accounts/pinkfighter/projects/seoulmono-app/builds"
