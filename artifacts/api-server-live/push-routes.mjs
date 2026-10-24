import crypto from 'node:crypto';
import { createPushTransport } from './push-transport.mjs';
export function safePushPath(value) {
  return typeof value === 'string' && /^\/(?:$|products(?:\?[^#\s]*)?$|product\/[A-Za-z0-9_-]+$|events$|notices$)/.test(value) && !value.includes('://') ? value : '/';
}
export function validDevice(body) {
  return body && ['android', 'ios'].includes(body.platform) && typeof body.token === 'string' && (body.platform === 'ios' ? /^[a-f0-9]{64,256}$/i.test(body.token) : /^[A-Za-z0-9_:\-]{20,4096}$/.test(body.token));
}
export async function installPushRoutes(app, pool, authMiddleware, transport = createPushTransport()) {
  await pool.query(`CREATE TABLE IF NOT EXISTS sm_push_devices (token_hash CHAR(64) PRIMARY KEY, token TEXT NOT NULL, mb_id VARCHAR(255) NOT NULL, platform VARCHAR(10) NOT NULL, enabled TINYINT NOT NULL DEFAULT 1, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX member_enabled (mb_id,enabled))`);
  await pool.query(`CREATE TABLE IF NOT EXISTS sm_push_campaigns (id CHAR(36) PRIMARY KEY, title VARCHAR(100) NOT NULL, body VARCHAR(1000) NOT NULL, path VARCHAR(500) NOT NULL, created_by VARCHAR(255) NOT NULL, target VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS sm_push_deliveries (id BIGINT AUTO_INCREMENT PRIMARY KEY, campaign_id CHAR(36) NOT NULL, token_hash CHAR(64) NOT NULL, mb_id VARCHAR(255) NOT NULL, state VARCHAR(16) NOT NULL DEFAULT 'pending', attempts INT DEFAULT 0, next_attempt DATETIME NOT NULL, last_code VARCHAR(100), UNIQUE KEY campaign_device(campaign_id,token_hash), INDEX pending_jobs(state,next_attempt))`);
  const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
  const hash = token => crypto.createHash('sha256').update(token).digest('hex');
  const activeMember = wrap(async (req, res) => {
    const [rows] = await pool.query("SELECT mb_id FROM g5_member WHERE mb_id=? AND (mb_leave_date IS NULL OR mb_leave_date='') AND (mb_intercept_date IS NULL OR mb_intercept_date='')", [req.user.mb_id]);
    if (!rows.length) return res.status(403).json({ error: 'アカウントを確認してください。' });
    const body = req.body;
    if (!validDevice(body)) return res.status(400).json({ error: '通知トークンが正しくありません。' });
    await pool.query('INSERT INTO sm_push_devices(token_hash,token,mb_id,platform,enabled) VALUES(?,?,?,?,1) ON DUPLICATE KEY UPDATE token=VALUES(token),mb_id=VALUES(mb_id),platform=VALUES(platform),enabled=1', [hash(body.token), body.token, req.user.mb_id, body.platform]);
    res.json({ ok: true, providerReady: transport.ready[body.platform] });
  });
  app.get('/api/push/config', (_req, res) => res.json({ ready: transport.ready }));
  app.post('/api/push/devices', authMiddleware, activeMember);
  app.delete('/api/push/devices', authMiddleware, wrap(async (req, res) => {
    if (typeof req.body?.token !== 'string' || req.body.token.length > 4096) return res.status(400).json({ error: 'トークンを確認してください。' });
    await pool.query('UPDATE sm_push_devices SET enabled=0 WHERE token_hash=? AND mb_id=?', [hash(req.body.token), req.user.mb_id]);
    res.json({ ok: true });
  }));
  async function adminAccess(req, res, next) {
    try {
      if (req.headers.origin && req.headers.origin !== 'https://seoulmono.com' && req.headers.origin !== 'https://www.seoulmono.com') return res.status(403).json({ error: 'アクセスできません。' });
      if (req.headers.authorization) return authMiddleware(req, res, () => { checkAdmin(req.user?.mb_id).catch(next); });
      if (!req.headers.cookie) return res.status(401).json({ error: '管理者ログインが必要です。' });
      const response = await fetch('http://127.0.0.1:8090/trpc/auth.me', { headers: { cookie: req.headers.cookie }, signal: AbortSignal.timeout(5000) });
      const json = await response.json();
      const user = json.result?.data?.json ?? json.result?.data;
      if (user?.role !== 'admin' || !user.openId?.startsWith('g5:')) return res.status(403).json({ error: '管理者ログインが必要です。' });
      return await checkAdmin(user.openId.slice(3));
      async function checkAdmin(id) {
        const [rows] = await pool.query("SELECT mb_id FROM g5_member WHERE mb_id=? AND mb_level>=10 AND (mb_leave_date IS NULL OR mb_leave_date='') AND (mb_intercept_date IS NULL OR mb_intercept_date='')", [id || '']);
        if (!rows.length) return res.status(403).json({ error: '管理者権限が必要です。' });
        req.pushAdmin = id; next();
      }
    } catch (error) { next(error); }
  }
  app.get('/api/push/admin/status', adminAccess, wrap(async (_req, res) => {
    const [devices] = await pool.query('SELECT platform,COUNT(*) AS count FROM sm_push_devices WHERE enabled=1 GROUP BY platform');
    const [campaigns] = await pool.query("SELECT c.*,COUNT(d.id) AS total,SUM(d.state='sent') AS sent,SUM(d.state='pending') AS pending,SUM(d.state='failed') AS failed,SUM(d.state='skipped') AS skipped FROM sm_push_campaigns c LEFT JOIN sm_push_deliveries d ON c.id=d.campaign_id GROUP BY c.id ORDER BY c.created_at DESC LIMIT 20");
    res.json({ ready: transport.ready, devices, campaigns });
  }));
  app.post('/api/push/admin/send', adminAccess, wrap(async (req, res) => {
    const { title, body, target, memberId, requestId, path = '/' } = req.body || {};
    if (typeof title !== 'string' || !title.trim() || title.length > 100 || typeof body !== 'string' || !body.trim() || body.length > 1000 || !['self','member','all'].includes(target) || typeof requestId !== 'string' || !/^[0-9a-f-]{36}$/i.test(requestId) || (target === 'member' && (typeof memberId !== 'string' || !memberId.trim() || memberId.length > 255))) return res.status(400).json({ error: '宛先・タイトル・本文を確認してください。' });
    if (safePushPath(path) !== path) return res.status(400).json({ error: 'アプリ内のリンクを指定してください。' });
    const selected = target === 'self' ? req.pushAdmin : target === 'member' ? memberId.trim() : null;
    const [devices] = await pool.query("SELECT d.* FROM sm_push_devices d JOIN g5_member m ON m.mb_id=d.mb_id WHERE d.enabled=1 AND (m.mb_leave_date IS NULL OR m.mb_leave_date='') AND (m.mb_intercept_date IS NULL OR m.mb_intercept_date='')" + (selected ? ' AND d.mb_id=?' : ''), selected ? [selected] : []);
    if (!devices.length) return res.status(409).json({ error: '対象の端末がありません。アプリでログインし、通知を有効にしてください。' });
    if (devices.some(d => !transport.ready[d.platform])) return res.status(503).json({ error: '対象端末のプッシュ配信設定が完了していません。' });
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [existing] = await conn.query('SELECT id FROM sm_push_campaigns WHERE id=? FOR UPDATE', [requestId]);
      if (!existing.length) {
        await conn.query('INSERT INTO sm_push_campaigns(id,title,body,path,created_by,target) VALUES(?,?,?,?,?,?)', [requestId,title.trim(),body.trim(),path,req.pushAdmin,selected || '*']);
        for (const d of devices) await conn.query('INSERT INTO sm_push_deliveries(campaign_id,token_hash,mb_id,next_attempt) VALUES(?,?,?,NOW())', [requestId,d.token_hash,d.mb_id]);
      }
      await conn.commit(); res.json({ ok: true, campaignId: requestId, queued: devices.length });
    } catch (error) { await conn.rollback(); throw error; } finally { conn.release(); }
  }));
  let draining = false;
  async function drain() {
    if (draining) return;
    draining = true;
    try {
      const [jobs] = await pool.query("SELECT q.*,c.title,c.body,c.path,c.created_at,d.token,d.platform,d.enabled,d.mb_id AS current_member,m.mb_leave_date,m.mb_intercept_date FROM sm_push_deliveries q JOIN sm_push_campaigns c ON c.id=q.campaign_id LEFT JOIN sm_push_devices d ON d.token_hash=q.token_hash LEFT JOIN g5_member m ON m.mb_id=d.mb_id WHERE q.state='pending' AND q.next_attempt<=NOW() ORDER BY q.id LIMIT 20");
      for (const job of jobs) {
        if (!job.enabled || job.current_member !== job.mb_id || job.mb_leave_date || job.mb_intercept_date || Date.now() - new Date(job.created_at).getTime() > 86400000) {
          await pool.query("UPDATE sm_push_deliveries SET state='skipped' WHERE id=?", [job.id]); continue;
        }
        let result;
        try { result = await transport.send(job, { id: job.campaign_id, title: job.title, body: job.body, path: job.path }); }
        catch { result = { ok:false, retry:true, code:'transport-error' }; }
        if (result.invalid) await pool.query('UPDATE sm_push_devices SET enabled=0 WHERE token_hash=?', [job.token_hash]);
        await pool.query('UPDATE sm_push_deliveries SET state=?,attempts=attempts+1,next_attempt=DATE_ADD(NOW(),INTERVAL ? SECOND),last_code=? WHERE id=?', [result.ok ? 'sent' : result.retry && job.attempts < 4 ? 'pending' : 'failed', Math.min(300, 10 * 2 ** job.attempts), String(result.code || '').slice(0,100), job.id]);
      }
    } finally { draining = false; }
  }
  const timer = setInterval(() => drain().catch(() => console.error('[push] queue processing failed')), 5000);
  timer.unref();
  return { ready: transport.ready, drain, close: () => clearInterval(timer) };
}
