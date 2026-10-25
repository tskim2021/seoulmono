import fs from 'node:fs';
import crypto from 'node:crypto';
import http2 from 'node:http2';
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
export function loadPushConfig() {
  try { return JSON.parse(fs.readFileSync(process.env.SEOULMONO_PUSH_CONFIG || '/etc/seoulmono/push.json', 'utf8')); } catch { return {}; }
}
export function createPushTransport(config = loadPushConfig()) {
  let googleToken, appleToken, account, appleKey;
  try { account = JSON.parse(fs.readFileSync(config.fcm?.serviceAccountFile, 'utf8')); crypto.createPrivateKey(account.private_key); } catch { account = null; }
  try { appleKey = fs.readFileSync(config.apns?.keyFile, 'utf8'); crypto.createPrivateKey(appleKey); } catch { appleKey = null; }
  const ready = { android: !!(account?.project_id === 'seoulmono-43c89' && account?.client_email), ios: !!(appleKey && config.apns?.keyId && config.apns?.teamId && config.apns?.topic === 'com.seoulmono.app') };
  async function send(device, payload) {
    if (!ready[device.platform]) return { ok: false, retry: false, code: 'provider-not-configured' };
    const now = Math.floor(Date.now() / 1000);
    if (device.platform === 'android') {
      if (!googleToken || googleToken.exp < now + 90) {
        const unsigned = encode({ alg: 'RS256', typ: 'JWT' }) + '.' + encode({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
        const assertion = unsigned + '.' + crypto.sign('RSA-SHA256', Buffer.from(unsigned), account.private_key).toString('base64url');
        const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }), signal: AbortSignal.timeout(15000) });
        const result = await response.json();
        if (!response.ok || !result.access_token) return { ok: false, retry: response.status >= 500, code: 'fcm-auth-' + response.status };
        googleToken = { value: result.access_token, exp: now + result.expires_in };
      }
      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`, { method: 'POST', headers: { Authorization: 'Bearer ' + googleToken.value, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: { token: device.token, notification: { title: payload.title, body: payload.body }, data: { path: payload.path, campaignId: String(payload.id) }, android: { priority: 'high', ttl: '86400s', notification: { channel_id: 'seoulmono-news', sound: 'default' } } } }), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (response.status === 401) googleToken = null;
      return { ok: response.ok, invalid: !!result.error?.details?.some(d => d.errorCode === 'UNREGISTERED'), retry: response.status === 429 || response.status >= 500, code: result.error?.status || 'fcm-' + response.status };
    }
    if (!appleToken || appleToken.exp < now) {
      const unsigned = encode({ alg: 'ES256', kid: config.apns.keyId }) + '.' + encode({ iss: config.apns.teamId, iat: now });
      appleToken = { value: unsigned + '.' + crypto.sign('sha256', Buffer.from(unsigned), { key: appleKey, dsaEncoding: 'ieee-p1363' }).toString('base64url'), exp: now + 3000 };
    }
    return new Promise(resolve => {
      const client = http2.connect('https://api.push.apple.com');
      let done = false, status = 0, data = '';
      const finish = result => { if (done) return; done = true; clearTimeout(timer); client.destroy(); resolve(result); };
      const timer = setTimeout(() => finish({ ok: false, retry: true, code: 'apns-timeout' }), 15000);
      client.on('error', () => finish({ ok: false, retry: true, code: 'apns-connection' }));
      const request = client.request({ ':method': 'POST', ':path': '/3/device/' + device.token, authorization: 'bearer ' + appleToken.value, 'apns-topic': 'com.seoulmono.app', 'apns-push-type': 'alert', 'apns-priority': '10', 'apns-expiration': String(now + 86400) });
      request.on('response', headers => { status = headers[':status']; });
      request.on('data', chunk => { data += chunk; });
      request.on('error', () => finish({ ok: false, retry: true, code: 'apns-stream' }));
      request.on('end', () => { let reason; try { reason = JSON.parse(data).reason; } catch {} finish({ ok: status === 200, invalid: status === 410 || reason === 'BadDeviceToken', retry: status === 429 || status >= 500, code: reason || 'apns-' + status }); });
      request.end(JSON.stringify({ aps: { alert: { title: payload.title, body: payload.body }, sound: 'default' }, path: payload.path, campaignId: String(payload.id) }));
    });
  }
  return { ready, send };
}
