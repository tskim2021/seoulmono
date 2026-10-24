module.exports = {
  apps: [
    {
      name: "seoulmono-api",
      cwd: "/var/www/seoulmono/artifacts/api-server",
      script: "dist/index.mjs",
      node_args: ["--env-file=/var/www/seoulmono/.env", "--enable-source-maps"],
      env: { NODE_ENV: "production", PORT: "8080" },
      autorestart: true,
      max_memory_restart: "512M",
    },
  ],
};
