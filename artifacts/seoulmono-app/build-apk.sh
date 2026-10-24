#!/bin/bash
# ALL따옴 모바일 앱 - Android APK 빌드 스크립트
# Expo EAS를 통해 클라우드에서 빌드
#
# 사용 방법:
#   EXPO_TOKEN=<your-token> ./build-apk.sh
#

set -e

echo "================================"
echo "  ALL따옴 APK 빌드 시작"
echo "================================"
echo ""

# EXPO_TOKEN 확인
if [ -z "$EXPO_TOKEN" ]; then
    echo "오류: EXPO_TOKEN 환경변수가 설정되지 않았습니다."
    echo "Expo Access Token을 https://expo.dev/settings/access-tokens에서 발급하세요."
    exit 1
fi

# EAS Build 시작 (non-interactive, 완료 대기)
echo "[1/1] EAS Android APK 빌드 시작..."
echo "빌드는 Expo 클라우드 서버에서 실행됩니다 (약 10~15분 소요)"
echo ""

EAS_NO_VCS=1 EXPO_TOKEN="$EXPO_TOKEN" npx eas build --platform android --profile preview --non-interactive

echo ""
echo "================================"
echo "  빌드 요청 완료!"
echo "================================"
echo "빌드 상태 확인: https://expo.dev/accounts/pinkfighter/projects/seoulmono-app/builds"
