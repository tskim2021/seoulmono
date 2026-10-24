module.exports = {
  apps: [
    {
      // 탈모2 관리자 → seoulmono 운영 DB(kapp_s001) 연결본.
      // 앱이 직접 dotenv 로 cwd 의 .env 를 읽으므로 pm2 env 갱신 함정이 없다.
      name: "seoulmono-admin",
      script: "dist/index.js",
      cwd: "/var/www/seoulmono/artifacts/seoulmono-admin",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      error_file: "/var/www/seoulmono/artifacts/seoulmono-admin/logs/err.log",
      out_file: "/var/www/seoulmono/artifacts/seoulmono-admin/logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
