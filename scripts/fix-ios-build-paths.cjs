// Expo SDK 54 pod scripts do not quote project paths containing spaces.
// Run after pod install and before xcodebuild when building locally.
const fs = require('node:fs');
const path = require('node:path');
function writeChanged(file, text) { if (fs.readFileSync(file, 'utf8') !== text) fs.writeFileSync(file, text); }
const root = path.resolve(__dirname, '../artifacts/seoulmono-app');
const pbx = path.join(root, 'ios/Pods/Pods.xcodeproj/project.pbxproj');
let source = fs.readFileSync(pbx, 'utf8');
for (const name of ['get-app-config-ios.sh', 'create-updates-resources-ios.sh']) {
  source = source.replaceAll('bash -l -c \\"$PODS_TARGET_SRCROOT/../scripts/' + name + '\\"', 'bash \\"$PODS_TARGET_SRCROOT/../scripts/' + name + '\\"');
}
writeChanged(pbx, source);
for (const rel of ['expo-constants/scripts/get-app-config-ios.sh', 'expo-updates/scripts/create-updates-resources-ios.sh']) {
  const file = path.join(root, 'node_modules', rel);
  const text = fs.readFileSync(file, 'utf8').replaceAll('$(basename $PROJECT_DIR)', '$(basename "$PROJECT_DIR")');
  writeChanged(file, text);
}
const appPbx = path.join(root, 'ios/app.xcodeproj/project.pbxproj');
let appSource = fs.readFileSync(appPbx, 'utf8');
appSource = appSource.replace(/`\\"\$NODE_BINARY\\" --print [^`]+`/g, (command, offset, full) => {
  return full.slice(offset - 2, offset) === '\\"' ? command : '\\"' + command + '\\"';
});
writeChanged(appPbx, appSource);
