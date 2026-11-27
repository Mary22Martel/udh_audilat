/**
 * Arranca el servidor de AUDIT LAB.
 *   npm run dev    → servidor (puerto 3001) + página con recarga automática (puerto 3000)
 *   npm start      → sirve la versión compilada (dist/) y la API en el puerto 3001
 *
 * Variables de entorno (opcionales):
 *   PORT=3001            puerto
 *   HOST=127.0.0.1       en un servidor con Nginx delante, para que solo se entre por el dominio
 *   COOKIE_SEGURA=true   cuando el sitio va con https
 *   TRAS_PROXY=true      cuando hay Nginx/CloudPanel delante (para leer la IP real de cada visitante)
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearApp } from './app';
import { AuditLab } from './db';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = Number(process.env.PORT ?? 3001);
const RUTA_DB = process.env.AUDITLAB_DB ?? path.join(RAIZ, 'data', 'auditlab.db');

const lab = new AuditLab({ ruta: RUTA_DB });
const app = crearApp(lab, {
  logger: true,
  cookieSegura: process.env.COOKIE_SEGURA === 'true',
  // Registro de alumnos desde el login: AUDITLAB_REGISTRO=cerrado lo apaga;
  // AUDITLAB_DOMINIO_REGISTRO=* acepta cualquier correo (por defecto solo @udh.edu.pe).
  registroAbierto: process.env.AUDITLAB_REGISTRO !== 'cerrado',
  dominioRegistro: process.env.AUDITLAB_DOMINIO_REGISTRO === '*' ? null : (process.env.AUDITLAB_DOMINIO_REGISTRO ?? 'udh.edu.pe'),
  carpetaWeb: path.join(RAIZ, 'dist'),
  trasProxy: process.env.TRAS_PROXY === 'true',
});

if (!lab.hayAdmin()) {
  app.log.warn('AUDIT LAB: todavía no hay administrador. Créalo con:  npm run crear-admin -- admin@udh.edu.pe "tu-clave"');
  app.log.warn('            o carga cuentas de prueba con:          npm run datos-demo');
}

app.listen({ port: PUERTO, host: process.env.HOST ?? '0.0.0.0' }).catch((e) => {
  app.log.error(e);
  process.exit(1);
});
