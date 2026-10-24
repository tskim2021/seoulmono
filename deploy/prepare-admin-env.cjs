// Reuses the isolated shop DB. Never creates or resets an admin account.
const fs = require('node:fs');
const { randomBytes } = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'artifacts/seoulmono-admin/.env');
if (!fs.existsSync(target)) {
  const p = process.env;
  if (!p.MYSQL_USER || !p.MYSQL_PASSWORD || !p.MYSQL_DB) throw new Error('Shop database configuration is required');
  const uri = `mysql://${encodeURIComponent(p.MYSQL_USER)}:${encodeURIComponent(p.MYSQL_PASSWORD)}@${p.MYSQL_HOST || '127.0.0.1'}:3306/${p.MYSQL_DB}`;
  const internalKey = p.INTERNAL_API_KEY || randomBytes(32).toString('hex');
  if (!p.INTERNAL_API_KEY) fs.appendFileSync(path.join(root, '.env'), `\nINTERNAL_API_KEY=${internalKey}\n`);
  fs.writeFileSync(target, `DATABASE_URL=${uri}\nSHOP_DATABASE_URL=${uri}\nSESSION_SECRET=${randomBytes(32).toString('hex')}\nINTERNAL_API_KEY=${internalKey}\nSHOP_INTERNAL_URL=http://127.0.0.1:8080/api\nPORT=8090\nNODE_ENV=production\nADMIN2_ENABLE_JOBS=0\n`, { mode: 0o600 });
}
