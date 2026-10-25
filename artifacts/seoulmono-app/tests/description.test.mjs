import test from 'node:test';
import assert from 'node:assert/strict';
import { descriptionBlocks, descriptionImageUrl } from '../lib/description.ts';

test('Japanese descriptions preserve paragraph, image and heading order', () => {
  const result = descriptionBlocks('<h2>商品 &amp; 特徴</h2><p>毎日<br>1粒</p><img src="/uploads/a.jpg" width="600" height="1200"><p>お召し上がり方</p>');
  assert.deepEqual(result.map(x => x.type), ['text','text','image','text']);
  assert.equal(result[0].text,'商品 & 特徴'); assert.equal(result[0].heading,true);
  assert.equal(result[1].text,'毎日\n1粒'); assert.equal(result[2].uri,'https://seoulmono.com/uploads/a.jpg'); assert.equal(result[2].ratio,0.5);
});
test('scripts, browser frames and forms never become description content', () => {
  const result = descriptionBlocks('<script>alert(1)</script><iframe>hidden</iframe><style>body{}</style><form>hidden</form><p onclick="alert(1)">表示する説明</p>');
  assert.equal(result.length,1); assert.equal(result[0].text,'表示する説明');
});
test('only HTTPS images are accepted, without embedded credentials', () => {
  for (const url of ['', 'javascript:alert(1)', 'data:text/html,<script>x</script>', 'file:///private/data', 'http://example.com/a.jpg','https://user:pass@example.com/a']) assert.equal(descriptionImageUrl(url),undefined);
  assert.equal(descriptionImageUrl('//seoulmono.com/data/a.jpg'),'https://seoulmono.com/data/a.jpg');
});
test('native table cells retain Japanese entities and line breaks', () => {
  const result = descriptionBlocks('<table><tr><th>名称</th><th>内容量</th></tr><tr><td>ビタミン</td><td>30粒<br>1か月分</td></tr></table>');
  assert.deepEqual(result,[{type:'table',rows:[['名称','内容量'],['ビタミン','30粒\n1か月分']]}]);
});
test('image layout tables and lazy images remain visible in order', () => {
  const result = descriptionBlocks('<table><tr><td><img data-src="/a.jpg"></td><td><img src="/b.jpg"></td></tr></table>');
  assert.deepEqual(result.map(x => x.uri),['https://seoulmono.com/a.jpg','https://seoulmono.com/b.jpg']);
});
test('empty and malformed HTML do not crash or create a fake description', () => {
  assert.deepEqual(descriptionBlocks('   <p><br></p>'),[]);
  assert.equal(descriptionBlocks('<div><p>説明<b>未閉鎖')[0].text,'説明未閉鎖');
});
