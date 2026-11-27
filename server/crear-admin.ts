// Crea un administrador o le pone una nueva contraseña, directamente en data/auditlab.db.
//   npm run crear-admin -- admin@udh.edu.pe "contraseña-de-8-o-más"
// No hace falta detener el servidor.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AuditLab } from './db';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [correo, clave] = process.argv.slice(2);
if (!correo || !clave) {
  console.error('Uso: npm run crear-admin -- admin@udh.edu.pe "contraseña-de-8-o-más"');
  process.exit(1);
}
try {
  const lab = new AuditLab({ ruta: process.env.AUDITLAB_DB ?? path.join(RAIZ, 'data', 'auditlab.db') });
  const r = lab.fijarAdmin(correo, clave);
  console.log(r === 'creado' ? `✓ Administrador creado: ${correo}` : `✓ ${correo} ahora es administrador y tiene la nueva contraseña.`);
  console.log('  Entra en http://localhost:3000/ingresar');
} catch (e) {
  console.error(`✗ ${(e as Error).message}`);
  process.exit(1);
}
