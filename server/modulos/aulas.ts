/**
 * Aulas: el docente crea su aula y comparte un código; el alumno lo escribe y queda unido.
 * Un alumno puede estar en varias aulas (por ejemplo, dos cursos distintos).
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { ErrorApp, type AuditLab, type FilaUsuario, type Usuario } from '../db';

export interface Aula {
  id: string;
  docenteId: string;
  docente: string;
  nombre: string;
  codigo: string;
  archivada: boolean;
  creado: string;
  alumnos: number;
}

interface FilaAula {
  id: string;
  docente_id: string;
  docente: string;
  nombre: string;
  codigo: string;
  archivada: number;
  creado: string;
  alumnos: number;
}

const aAula = (f: FilaAula): Aula => ({
  id: f.id,
  docenteId: f.docente_id,
  docente: f.docente,
  nombre: f.nombre,
  codigo: f.codigo,
  archivada: f.archivada === 1,
  creado: f.creado,
  alumnos: f.alumnos,
});

const SELECT = `SELECT a.*, u.nombre AS docente, (SELECT COUNT(*) FROM aula_alumnos m WHERE m.aula_id = a.id) AS alumnos
  FROM aulas a JOIN usuarios u ON u.id = a.docente_id`;

/** Código corto y fácil de dictar en clase, p. ej. AUD-7KQ2. */
function nuevoCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = randomBytes(4);
  return 'AUD-' + Array.from(b, (x) => letras[x % letras.length]).join('');
}

export class Aulas {
  constructor(private lab: AuditLab) {
    lab.db.exec(`
      CREATE TABLE IF NOT EXISTS aulas (
        id TEXT PRIMARY KEY,
        docente_id TEXT NOT NULL REFERENCES usuarios(id),
        nombre TEXT NOT NULL,
        codigo TEXT NOT NULL UNIQUE,
        archivada INTEGER NOT NULL DEFAULT 0,
        creado TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS aula_alumnos (
        aula_id TEXT NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
        alumno_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        unido TEXT NOT NULL,
        PRIMARY KEY (aula_id, alumno_id)
      );
    `);
    this.migrarDocenteAsignado();
  }

  /** Bases anteriores asignaban un docente a cada alumno: se convierte en un aula por docente. */
  private migrarDocenteAsignado() {
    const docentes = this.lab.db
      .prepare("SELECT DISTINCT docente_id AS id FROM usuarios WHERE rol = 'estudiante' AND docente_id IS NOT NULL")
      .all() as { id: string }[];
    for (const d of docentes) {
      const doc = this.lab.usuario(d.id);
      if (!doc || doc.rol !== 'docente') continue;
      const aula = this.deDocente(d.id)[0] ?? this.crear(d.id, `Aula de ${doc.nombre}`);
      const alumnos = this.lab.db.prepare('SELECT id FROM usuarios WHERE docente_id = ?').all(d.id) as { id: string }[];
      for (const a of alumnos) this.agregarAlumno(aula.id, a.id, false);
      this.lab.db.prepare('UPDATE usuarios SET docente_id = NULL WHERE docente_id = ?').run(d.id);
    }
  }

  aula(id: string): Aula | null {
    const f = this.lab.db.prepare(`${SELECT} WHERE a.id = ?`).get(id) as FilaAula | undefined;
    return f ? aAula(f) : null;
  }

  todas(): Aula[] {
    return (this.lab.db.prepare(`${SELECT} ORDER BY a.archivada, u.nombre, a.nombre`).all() as unknown as FilaAula[]).map(aAula);
  }

  deDocente(docenteId: string): Aula[] {
    return (this.lab.db.prepare(`${SELECT} WHERE a.docente_id = ? ORDER BY a.archivada, a.creado DESC`).all(docenteId) as unknown as FilaAula[]).map(aAula);
  }

  delAlumno(alumnoId: string): { id: string; nombre: string; docente: string; codigo: string }[] {
    return (
      this.lab.db
        .prepare(`${SELECT} JOIN aula_alumnos m ON m.aula_id = a.id WHERE m.alumno_id = ? AND a.archivada = 0 ORDER BY m.unido`)
        .all(alumnoId) as unknown as FilaAula[]
    ).map((f) => ({ id: f.id, nombre: f.nombre, docente: f.docente, codigo: f.codigo }));
  }

  filasAlumnos(aulaId: string): FilaUsuario[] {
    return this.lab.db
      .prepare('SELECT u.* FROM usuarios u JOIN aula_alumnos m ON m.alumno_id = u.id WHERE m.aula_id = ? ORDER BY u.nombre')
      .all(aulaId) as unknown as FilaUsuario[];
  }

  esMiembro(aulaId: string, alumnoId: string) {
    return !!this.lab.db.prepare('SELECT 1 FROM aula_alumnos WHERE aula_id = ? AND alumno_id = ?').get(aulaId, alumnoId);
  }

  /** El docente dueño, el admin o un alumno del aula. */
  exigirAcceso(u: Usuario, aulaId: string, soloGestion = false): Aula {
    const a = this.aula(aulaId);
    if (!a) throw new ErrorApp('Aula no encontrada.', 404);
    if (u.rol === 'admin') return a;
    if (u.rol === 'docente' && a.docenteId === u.id) return a;
    if (!soloGestion && u.rol === 'estudiante' && this.esMiembro(aulaId, u.id)) return a;
    throw new ErrorApp('No tienes acceso a esta aula.', 403);
  }

  crear(docenteId: string, nombre: string): Aula {
    const n = String(nombre ?? '').trim();
    if (n.length < 3) throw new ErrorApp('Escribe un nombre para el aula (por ejemplo, «Auditoría Tributaria – Sección A»).');
    const d = this.lab.usuario(docenteId);
    if (!d || d.rol !== 'docente') throw new ErrorApp('El aula debe pertenecer a un docente.');
    let codigo = nuevoCodigo();
    while (this.lab.db.prepare('SELECT 1 FROM aulas WHERE codigo = ?').get(codigo)) codigo = nuevoCodigo();
    const id = randomUUID();
    this.lab.db.prepare('INSERT INTO aulas (id, docente_id, nombre, codigo, creado) VALUES (?, ?, ?, ?, ?)').run(id, docenteId, n, codigo, this.lab.iso());
    return this.aula(id)!;
  }

  actualizar(aulaId: string, cambios: { nombre?: string; archivada?: boolean; nuevoCodigo?: boolean }): Aula {
    const a = this.aula(aulaId);
    if (!a) throw new ErrorApp('Aula no encontrada.', 404);
    const nombre = cambios.nombre !== undefined ? String(cambios.nombre).trim() : a.nombre;
    if (nombre.length < 3) throw new ErrorApp('Escribe un nombre para el aula.');
    let codigo = a.codigo;
    if (cambios.nuevoCodigo) {
      codigo = nuevoCodigo();
      while (this.lab.db.prepare('SELECT 1 FROM aulas WHERE codigo = ?').get(codigo)) codigo = nuevoCodigo();
    }
    this.lab.db.prepare('UPDATE aulas SET nombre = ?, archivada = ?, codigo = ? WHERE id = ?').run(nombre, (cambios.archivada ?? a.archivada) ? 1 : 0, codigo, aulaId);
    return this.aula(aulaId)!;
  }

  agregarAlumno(aulaId: string, alumnoId: string, avisar = true) {
    if (this.esMiembro(aulaId, alumnoId)) return;
    this.lab.db.prepare('INSERT INTO aula_alumnos (aula_id, alumno_id, unido) VALUES (?, ?, ?)').run(aulaId, alumnoId, this.lab.iso());
    const a = this.aula(aulaId);
    if (avisar && a)
      this.lab.avisar(alumnoId, { tipo: 'aula', titulo: `Te uniste a «${a.nombre}»`, texto: `Docente: ${a.docente}. Aquí verás sus competencias por equipos.`, enlace: '/app/aulas' });
  }

  quitarAlumno(aulaId: string, alumnoId: string) {
    this.lab.db.prepare('DELETE FROM aula_alumnos WHERE aula_id = ? AND alumno_id = ?').run(aulaId, alumnoId);
  }

  /** El alumno escribe el código que le dio su docente. */
  unirse(alumnoId: string, codigo: string): Aula {
    const c = String(codigo ?? '').trim().toUpperCase().replace(/\s+/g, '');
    const conGuion = c.startsWith('AUD-') ? c : c.startsWith('AUD') ? `AUD-${c.slice(3)}` : `AUD-${c}`;
    const f = this.lab.db.prepare(`${SELECT} WHERE a.codigo = ?`).get(conGuion) as FilaAula | undefined;
    if (!f) throw new ErrorApp('No encontramos un aula con ese código. Revisa que esté bien escrito.', 404);
    if (f.archivada === 1) throw new ErrorApp('Esa aula ya está cerrada.');
    if (this.esMiembro(f.id, alumnoId)) throw new ErrorApp(`Ya estás en «${f.nombre}».`);
    this.agregarAlumno(f.id, alumnoId);
    return this.aula(f.id)!;
  }
}
