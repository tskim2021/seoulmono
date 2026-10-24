// Expo SDK 54 pod scripts do not quote project paths containing spaces.
// Run after pod install and before xcodebuild when building locally.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../artifacts/seoulmono-app');
const pbx = path.join(root, 'ios/Pods/Pods.xcodeproj/project.pbxproj');
let source = fs.readFileSync(pbx, 'utf8');
for (const name of ['get-app-config-ios.sh', 'create-updates-resources-ios.sh']) {
  source = source.replaceAll('bash -l -c \\"$PODS_TARGET_SRCROOT/../scripts/' + name + '\\"', 'bash \\"$PODS_TARGET_SRCROOT/../scripts/' + name + '\\"');
}
fs.writeFileSync(pbx, source);
for (const rel of ['expo-constants/scripts/get-app-config-ios.sh', 'expo-updates/scripts/create-updates-resources-ios.sh']) {
  const file = path.join(root, 'node_modules', rel);
  const text = fs.readFileSync(file, 'utf8').replaceAll('$(basename $PROJECT_DIR)', '$(basename "$PROJECT_DIR")');
  fs.writeFileSync(file, text);
}
