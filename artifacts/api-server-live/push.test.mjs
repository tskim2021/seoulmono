import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { safePushPath, validDevice, installPushRoutes } from './push-routes.mjs';
import { createPushTransport } from './push-transport.mjs';

test('notification links stay on supported app screens', () => {
  for (const value of ['https://evil.example','//evil.example','/admin','/product/../../admin','javascript:alert(1)',null]) assert.equal(safePushPath(value), '/');
  for (const value of ['/','/product/123','/products?sort=new','/notices','/events']) assert.equal(safePushPath(value), value);
});
test('native push tokens are validated by platform', () => {
  assert.ok(validDevice({ platform:'ios', token:'a'.repeat(64) }));
  assert.ok(validDevice({ platform:'android', token:'a'.repeat(30)+':token' }));
  for(const body of [{platform:'web',token:'a'.repeat(64)},{platform:'ios',token:'nothex'},{platform:'android',token:'bad token'},{}]) assert.equal(!!validDevice(body),false);
});
test('missing provider credentials fail closed', async () => {
  const t=createPushTransport({}); assert.deepEqual(t.ready,{android:false,ios:false});
  assert.equal((await t.send({platform:'ios'},{})).ok,false);
});
test('Firebase credentials cannot cross the Seoulmono project boundary', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'seoulmono-push-test-'));
  try {
    const file=path.join(dir,'account.json');
    const {privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});
    for(const [project_id,expected] of [['unrelated-project',false],['seoulmono-43c89',true]]) {
      fs.writeFileSync(file,JSON.stringify({project_id,client_email:'test@example.invalid',private_key:privateKey}),{mode:0o600});
      assert.equal(createPushTransport({fcm:{serviceAccountFile:file}}).ready.android,expected);
    }
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
async function fixture({ devices=[], admin=true, ready={android:false,ios:false} }={}) {
  const routes=new Map(),writes=[];
  const app=Object.fromEntries(['get','post','delete'].map(method=>[method,(path,...handlers)=>routes.set(method+' '+path,handlers)]));
  const pool={query:async(sql,args)=>{if(sql.startsWith('CREATE'))return[];if(sql.includes('mb_level>=10'))return[admin?[{mb_id:'admin'}]:[]];if(sql.startsWith('SELECT d.*'))return[devices];if(sql.startsWith('UPDATE sm_push_devices')){writes.push(args);return[{}];}throw new Error('Unexpected query '+sql);}};
  const auth=(req,res,next)=>{if(req.headers.authorization!=='Bearer valid')return res.status(401).json({error:'auth'});req.user={mb_id:'admin'};next();};
  const service=await installPushRoutes(app,pool,auth,{ready,send:async()=>{throw new Error('Must not send in tests');}});
  async function call(method,path,body={},headers={authorization:'Bearer valid'}) {
    const req={headers,body};let status=200;
    return new Promise((resolve,reject)=>{const res={status:n=>{status=n;return res;},json:value=>resolve({status,value})};const handlers=routes.get(method+' '+path);let index=0;const next=error=>{if(error)return reject(error);const handler=handlers[index++];if(!handler)return reject(new Error('No response'));try{const value=handler(req,res,next);if(value?.catch)value.catch(reject);}catch(e){reject(e);}};next();});
  }
  return {call,writes,close:service.close};
}
const payload={title:'test',body:'body',target:'self',path:'/',requestId:'a'.repeat(36)};
test('push management rejects missing auth, non-admin and cross-origin requests', async()=>{
  const f=await fixture({admin:false});try{
    assert.equal((await f.call('get','/api/push/admin/status',{},{})).status,401);
    assert.equal((await f.call('get','/api/push/admin/status')).status,403);
    assert.equal((await f.call('post','/api/push/admin/send',payload,{authorization:'Bearer valid',origin:'https://evil.example'})).status,403);
  }finally{f.close();}
});
test('no recipients and unconfigured providers cannot claim a successful send',async()=>{
  const empty=await fixture();try{assert.equal((await empty.call('post','/api/push/admin/send',payload)).status,409);}finally{empty.close();}
  const missing=await fixture({devices:[{platform:'android'}]});try{assert.equal((await missing.call('post','/api/push/admin/send',payload)).status,503);}finally{missing.close();}
});
test('disable token is constrained to the authenticated member',async()=>{
  const f=await fixture();try{assert.equal((await f.call('delete','/api/push/devices',{token:'device-token'})).status,200);assert.equal(f.writes[0][1],'admin');assert.equal(f.writes[0][0].length,64);}finally{f.close();}
});
