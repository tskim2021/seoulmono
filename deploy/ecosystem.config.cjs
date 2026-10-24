module.exports = {
  apps: [
    {
      name: "seoulmono-api",
      cwd: "/var/www/seoulmono/artifacts/api-server",
      script: "dist/index.mjs",
      interpreter_args: "--enable-source-maps",
      env_file: "/var/www/seoulmono/.env",
      env: { NODE_ENV: "production", PORT: "8080" },
      autorestart: true,
      max_memory_restart: "512M",
    },
  ],
};
