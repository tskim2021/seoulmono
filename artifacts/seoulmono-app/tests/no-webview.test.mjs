import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname,'..');
function files(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):[path.join(dir,entry.name)]); }
test('app code has no embedded browser imports or website screen', () => {
  for (const folder of ['app','components','lib','contexts']) for (const file of files(path.join(root,folder))) {
    if (!/\.[jt]sx?$/.test(file)) continue;
    assert.doesNotMatch(fs.readFileSync(file,'utf8'),/react-native-webview|expo-web-browser|<WebView|ReactNativeWebView|injectedJavaScript/,file);
  }
  assert.equal(fs.existsSync(path.join(root,'app/webshop.tsx')),false);
});
test('embedded browser packages are not installed or configured', () => {
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const config=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
  for (const name of ['react-native-webview','expo-web-browser']) {
    assert.equal(pkg.dependencies[name],undefined);
    assert.equal(fs.existsSync(path.join(root,'node_modules',name)),false);
    assert.equal(config.expo.plugins.includes(name),false);
  }
});
test('native order review cannot submit orders or redirect to hosted payment', () => {
  const src=fs.readFileSync(path.join(root,'app/checkout.tsx'),'utf8');
  assert.doesNotMatch(src,/api\.post|openURL|create-session|clearCart\(/);
  assert.match(src,/注文の確定・決済はできません/);
});
