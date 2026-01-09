module.exports = {
  apps: [
    {
      name: "coesco-api",
      cwd: "/opt/coesco/apps/server",
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        ENV: "production",
      },
      error_file: "/opt/coesco/logs/api-error.log",
      out_file: "/opt/coesco/logs/api-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      kill_timeout: 5000,
      listen_timeout: 10000,
      restart_delay: 1000,
    },
  ],
};
