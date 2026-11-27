// Copia de seguridad de la base de datos, sin detener el servidor.
//   npm run respaldo   → crea data/respaldos/auditlab-AAAA-MM-DD_HHMM.db y deja solo las 14 más recientes
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUTA_DB = process.env.AUDITLAB_DB ?? path.join(RAIZ, 'data', 'auditlab.db');
const CARPETA = path.join(path.dirname(RUTA_DB), 'respaldos');
const GUARDAR = 14;

mkdirSync(CARPETA, { recursive: true });
const d = new Date();
const dos = (n: number) => String(n).padStart(2, '0');
const sello = `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}_${dos(d.getHours())}${dos(d.getMinutes())}`; // hora local
const destino = path.join(CARPETA, `auditlab-${sello}.db`);
const db = new DatabaseSync(RUTA_DB);
// VACUUM INTO hace una copia consistente aunque el servidor esté escribiendo.
db.exec(`VACUUM INTO '${destino.replace(/'/g, "''")}'`);
db.close();
const viejos = readdirSync(CARPETA)
  .filter((f) => /^auditlab-.*\.db$/.test(f))
  .sort()
  .reverse()
  .slice(GUARDAR);
for (const f of viejos) rmSync(path.join(CARPETA, f));
console.log(`✓ Respaldo creado: ${destino}${viejos.length ? ` (se borraron ${viejos.length} antiguos)` : ''}`);
