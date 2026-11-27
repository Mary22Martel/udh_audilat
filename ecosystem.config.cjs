// Configuración de PM2 para el servidor (CloudPanel u otro con Nginx delante).
//   pm2 start ecosystem.config.cjs   → arranca AUDIT LAB y lo reinicia si se cae
//   pm2 restart auditlab              → después de actualizar
//   pm2 logs auditlab                 → ver qué está pasando
module.exports = {
  apps: [
    {
      name: 'auditlab',
      cwd: __dirname,
      script: 'npm',
      args: 'start',
      max_memory_restart: '400M',
      env: {
        PORT: 3004, // debe coincidir con el «App Port» del sitio en CloudPanel
        HOST: '127.0.0.1', // solo se entra por el dominio (Nginx), no directo al puerto
        COOKIE_SEGURA: 'true', // el sitio va con https (certificado de Let's Encrypt)
        TRAS_PROXY: 'true', // Nginx va delante: usar la IP real del visitante
      },
    },
  ],
};
