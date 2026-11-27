/**
 * Academia: banco de preguntas (editable por los docentes) y progreso de cada alumno.
 * Las respuestas se califican aquí, en el servidor, con la misma función que usa la pantalla.
 */
import { randomUUID } from 'node:crypto';
import { LECCIONES, MODULOS, PREGUNTAS_BASE } from '../../src/data/academiaCurso';
import { calificar, mezclar, validarPregunta, type AlcancePregunta, type Pregunta, type Respuesta } from '../../src/lib/preguntas';
import { diaLima, ErrorApp, type AuditLab, type Usuario } from '../db';

export const VIDAS = 3;
export const MAX_PREGUNTAS_LECCION = 8;
export const SEGUNDOS_CONTRARRELOJ = 60;
/** En cada lección entran primero las preguntas del docente (hasta este número) y se completa con las demás. */
export const MAX_PREGUNTAS_DOCENTE_LECCION = 4;

/**
 * Qué preguntas ve cada quien (condición SQL sobre «p»):
 *  - las base y las del admin, todos;
 *  - las de un docente, solo los alumnos de sus aulas (de la elegida, o de cualquiera si no eligió).
 */
const VISIBLE_PARA_ALUMNO = `(p.base = 1
  OR p.autor_id IN (SELECT id FROM usuarios WHERE rol = 'admin')
  OR p.aula_id IN (SELECT aula_id FROM aula_alumnos WHERE alumno_id = ?)
  OR (p.aula_id IS NULL AND p.autor_id IN (SELECT a.docente_id FROM aulas a JOIN aula_alumnos m ON m.aula_id = a.id WHERE m.alumno_id = ?)))`;
const VISIBLE_PARA_DOCENTE = `(p.base = 1 OR p.autor_id IN (SELECT id FROM usuarios WHERE rol = 'admin') OR p.autor_id = ?)`;

interface FilaPregunta {
  id: string;
  leccion_id: string;
  tipo: string;
  enunciado: string;
  explicacion: string;
  datos: string;
  autor_id: string | null;
  autor: string | null;
  autor_rol: string | null;
  aula_id: string | null;
  aula_nombre: string | null;
  base: number;
  editada: number;
  activo: number;
  actualizado: string;
}

export interface RespuestaEnviada {
  preguntaId: string;
  respuesta: Respuesta | null;
}

const alcanceDe = (f: FilaPregunta): AlcancePregunta => (f.base ? 'base' : f.autor_rol === 'docente' ? 'aula' : 'general');

const aPregunta = (f: FilaPregunta): Pregunta =>
  ({
    ...(JSON.parse(f.datos) as object),
    id: f.id,
    leccionId: f.leccion_id,
    tipo: f.tipo,
    enunciado: f.enunciado,
    explicacion: f.explicacion,
    autor: f.base ? null : f.autor ?? 'Docente',
    activo: f.activo === 1,
    editada: f.editada === 1,
    alcance: alcanceDe(f),
    autorId: f.autor_id,
    aulaId: f.aula_id,
    aulaNombre: f.aula_nombre,
  }) as Pregunta;

/** Separa lo que va en columnas de lo que va en el JSON de datos. */
function partes(p: Pregunta) {
  const {
    id: _i, leccionId, tipo, enunciado, explicacion, autor: _a, activo: _ac, editada: _e,
    alcance: _al, autorId: _ai, aulaId: _au, aulaNombre: _an, respondida: _r, acierto: _ok, editable: _ed, ...datos
  } = p as Pregunta & Record<string, unknown>;
  return { leccionId, tipo, enunciado: String(enunciado ?? '').trim(), explicacion: String(explicacion ?? '').trim(), datos: JSON.stringify(datos) };
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);

export class Academia {
  constructor(private lab: AuditLab) {
    lab.db.exec(`
      CREATE TABLE IF NOT EXISTS preguntas (
        id TEXT PRIMARY KEY,
        leccion_id TEXT NOT NULL,
        tipo TEXT NOT NULL,
        enunciado TEXT NOT NULL,
        explicacion TEXT NOT NULL DEFAULT '',
        datos TEXT NOT NULL,
        autor_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
        base INTEGER NOT NULL DEFAULT 0,
        editada INTEGER NOT NULL DEFAULT 0,
        activo INTEGER NOT NULL DEFAULT 1,
        creado TEXT NOT NULL,
        actualizado TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS academia_intentos (
        id TEXT PRIMARY KEY,
        alumno_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        modo TEXT NOT NULL,
        leccion_id TEXT,
        aciertos INTEGER NOT NULL,
        total INTEGER NOT NULL,
        estrellas INTEGER NOT NULL DEFAULT 0,
        xp INTEGER NOT NULL DEFAULT 0,
        segundos INTEGER NOT NULL DEFAULT 0,
        completada INTEGER NOT NULL DEFAULT 0,
        fecha TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS academia_intentos_alumno ON academia_intentos (alumno_id, fecha);
      CREATE TABLE IF NOT EXISTS academia_respuestas (
        intento_id TEXT NOT NULL REFERENCES academia_intentos(id) ON DELETE CASCADE,
        alumno_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        pregunta_id TEXT NOT NULL,
        correcta INTEGER NOT NULL,
        fecha TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS academia_respuestas_pregunta ON academia_respuestas (pregunta_id);
      CREATE INDEX IF NOT EXISTS academia_respuestas_alumno ON academia_respuestas (alumno_id, fecha);
    `);
    // v4: las preguntas de un docente pueden ir a una de sus aulas.
    const columnas = (lab.db.prepare('PRAGMA table_info(preguntas)').all() as { name: string }[]).map((c) => c.name);
    if (!columnas.includes('aula_id')) lab.db.exec('ALTER TABLE preguntas ADD COLUMN aula_id TEXT REFERENCES aulas(id) ON DELETE SET NULL');
    // Preguntas base nuevas: se agregan sin tocar las que ya se editaron.
    const ins = lab.db.prepare(
      'INSERT OR IGNORE INTO preguntas (id, leccion_id, tipo, enunciado, explicacion, datos, base, creado, actualizado) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)'
    );
    const ahora = lab.iso();
    for (const p of PREGUNTAS_BASE) {
      const x = partes(p);
      ins.run(p.id, x.leccionId, x.tipo, x.enunciado, x.explicacion, x.datos, ahora, ahora);
    }
  }

  // --- Banco de preguntas ---------------------------------------------------------------------------------------

  private filas(where = '', ...args: (string | number)[]) {
    return (
      this.lab.db
        .prepare(
          `SELECT p.*, u.nombre AS autor, u.rol AS autor_rol, au.nombre AS aula_nombre FROM preguntas p
           LEFT JOIN usuarios u ON u.id = p.autor_id LEFT JOIN aulas au ON au.id = p.aula_id ${where}`
        )
        .all(...args) as unknown as FilaPregunta[]
    ).map(aPregunta);
  }

  pregunta(id: string): Pregunta | null {
    return this.filas('WHERE p.id = ?', id)[0] ?? null;
  }

  /** ¿Puede este usuario cambiar la pregunta? El admin, todas; el docente, solo las suyas. */
  puedeEditar(u: Usuario, p: Pregunta) {
    return u.rol === 'admin' || (u.rol === 'docente' && p.alcance === 'aula' && p.autorId === u.id);
  }

  private exigirEdicion(u: Usuario, id: string): Pregunta {
    const p = this.pregunta(id);
    if (!p) throw new ErrorApp('Pregunta no encontrada.', 404);
    if (!this.puedeEditar(u, p))
      throw new ErrorApp(
        p.alcance === 'aula' ? 'Esta pregunta es de otro docente.' : 'Las preguntas del sistema las edita el administrador. Puedes duplicarla para tus aulas.',
        403
      );
    return p;
  }

  /** ¿La puede usar este docente (en sus retos)? Las base, las del admin y las suyas. */
  visibleParaDocente(docenteId: string, id: string) {
    return !!this.lab.db.prepare(`SELECT 1 FROM preguntas p WHERE p.id = ? AND ${VISIBLE_PARA_DOCENTE}`).get(id, docenteId);
  }

  /**
   * Banco con estadísticas de uso. El docente ve las del sistema y las suyas, con los aciertos de sus alumnos;
   * el admin ve todo, con los aciertos de todos.
   */
  banco(u: Usuario) {
    const esDocente = u.rol === 'docente';
    const alumnos = esDocente ? this.alumnosDeDocente(u.id) : null;
    const filtro = alumnos ? (alumnos.length ? `WHERE alumno_id IN (${alumnos.map(() => '?').join(',')})` : 'WHERE 0') : '';
    const stats = new Map(
      (
        this.lab.db.prepare(`SELECT pregunta_id AS id, COUNT(*) AS n, SUM(correcta) AS ok FROM academia_respuestas ${filtro} GROUP BY pregunta_id`).all(...(alumnos ?? [])) as {
          id: string;
          n: number;
          ok: number;
        }[]
      ).map((s) => [s.id, s])
    );
    const orden = new Map(LECCIONES.map((l, i) => [l.id, i]));
    const lista = esDocente ? this.filas(`WHERE ${VISIBLE_PARA_DOCENTE}`, u.id) : this.filas();
    return lista
      .sort((a, b) => (orden.get(a.leccionId) ?? 99) - (orden.get(b.leccionId) ?? 99) || a.id.localeCompare(b.id))
      .map((p) => {
        const s = stats.get(p.id);
        return { ...p, respondida: s?.n ?? 0, acierto: s ? pct(s.ok, s.n) : null, editable: this.puedeEditar(u, p) };
      });
  }

  private alumnosDeDocente(docenteId: string): string[] {
    return (
      this.lab.db.prepare('SELECT DISTINCT m.alumno_id AS id FROM aula_alumnos m JOIN aulas a ON a.id = m.aula_id WHERE a.docente_id = ?').all(docenteId) as { id: string }[]
    ).map((f) => f.id);
  }

  /** Aula de destino: el docente solo puede elegir una suya (o ninguna = todas sus aulas). El admin publica para todos. */
  private aulaDestino(u: Usuario, aulaId: unknown): string | null {
    if (u.rol !== 'docente' || !aulaId) return null;
    const aula = this.lab.aulas.aula(String(aulaId));
    if (!aula || aula.docenteId !== u.id) throw new ErrorApp('Elige una de tus aulas.');
    return aula.id;
  }

  crearPregunta(autor: Usuario, p: Pregunta): Pregunta {
    const err = validarPregunta(p);
    if (err) throw new ErrorApp(err);
    if (!LECCIONES.some((l) => l.id === p.leccionId)) throw new ErrorApp('Lección no válida.');
    const aulaId = this.aulaDestino(autor, p.aulaId);
    const id = `p-${randomUUID().slice(0, 8)}`;
    const x = partes(p);
    this.lab.db
      .prepare('INSERT INTO preguntas (id, leccion_id, tipo, enunciado, explicacion, datos, autor_id, aula_id, creado, actualizado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, x.leccionId, x.tipo, x.enunciado, x.explicacion, x.datos, autor.id, aulaId, this.lab.iso(), this.lab.iso());
    return this.pregunta(id)!;
  }

  actualizarPregunta(u: Usuario, id: string, p: Pregunta): Pregunta {
    const actual = this.exigirEdicion(u, id);
    const err = validarPregunta(p);
    if (err) throw new ErrorApp(err);
    const x = partes(p);
    const aulaId = actual.alcance === 'aula' && u.rol === 'docente' ? this.aulaDestino(u, p.aulaId) : actual.aulaId ?? null;
    this.lab.db
      .prepare('UPDATE preguntas SET leccion_id = ?, tipo = ?, enunciado = ?, explicacion = ?, datos = ?, aula_id = ?, editada = 1, actualizado = ? WHERE id = ?')
      .run(x.leccionId, x.tipo, x.enunciado, x.explicacion, x.datos, aulaId, this.lab.iso(), id);
    return this.pregunta(id)!;
  }

  cambiarEstado(u: Usuario, id: string, activo: boolean) {
    this.exigirEdicion(u, id);
    this.lab.db.prepare('UPDATE preguntas SET activo = ? WHERE id = ?').run(activo ? 1 : 0, id);
  }

  /** Deja una pregunta base como venía en el sistema (solo el admin). */
  restaurar(u: Usuario, id: string): Pregunta {
    const original = PREGUNTAS_BASE.find((p) => p.id === id);
    if (!original) throw new ErrorApp('Solo se pueden restaurar las preguntas base del sistema.');
    this.exigirEdicion(u, id);
    const x = partes(original);
    this.lab.db
      .prepare('UPDATE preguntas SET leccion_id = ?, tipo = ?, enunciado = ?, explicacion = ?, datos = ?, editada = 0, activo = 1, actualizado = ? WHERE id = ?')
      .run(x.leccionId, x.tipo, x.enunciado, x.explicacion, x.datos, this.lab.iso(), id);
    return this.pregunta(id)!;
  }

  eliminar(u: Usuario, id: string) {
    const p = this.exigirEdicion(u, id);
    if (p.alcance === 'base') throw new ErrorApp('Las preguntas base no se eliminan; puedes desactivarlas.');
    this.lab.db.prepare('DELETE FROM preguntas WHERE id = ?').run(id);
  }

  /** Preguntas activas de una lección que ve este alumno. */
  activasDeLeccion(leccionId: string, alumnoId: string) {
    return this.filas(`WHERE p.leccion_id = ? AND p.activo = 1 AND ${VISIBLE_PARA_ALUMNO}`, leccionId, alumnoId, alumnoId);
  }

  private visiblesPara(alumnoId: string, extra = '', ...args: string[]) {
    return this.filas(`WHERE p.activo = 1 AND ${VISIBLE_PARA_ALUMNO} ${extra}`, alumnoId, alumnoId, ...args);
  }

  // --- Progreso del alumno --------------------------------------------------------------------------------------

  /** Mejor intento completado de cada lección. */
  private mejores(alumnoId: string) {
    const filas = this.lab.db
      .prepare(
        "SELECT leccion_id AS id, MAX(xp) AS xp, MAX(estrellas) AS estrellas, COUNT(*) AS intentos, MAX(CASE WHEN completada = 1 THEN 1 ELSE 0 END) AS completada FROM academia_intentos WHERE alumno_id = ? AND modo = 'leccion' GROUP BY leccion_id"
      )
      .all(alumnoId) as { id: string; xp: number; estrellas: number; intentos: number; completada: number }[];
    return new Map(filas.map((f) => [f.id, f]));
  }

  xp(alumnoId: string): number {
    const r = this.lab.db
      .prepare("SELECT SUM(m) AS t FROM (SELECT MAX(xp) AS m FROM academia_intentos WHERE alumno_id = ? AND modo = 'leccion' AND completada = 1 GROUP BY leccion_id)")
      .get(alumnoId) as { t: number | null };
    return r.t ?? 0;
  }

  fechas(alumnoId: string): string[] {
    return (this.lab.db.prepare('SELECT fecha FROM academia_intentos WHERE alumno_id = ?').all(alumnoId) as { fecha: string }[]).map((f) => f.fecha);
  }

  precision(alumnoId: string, leccionIds?: string[]): number | null {
    const filas = this.lab.db.prepare('SELECT a.pregunta_id AS id, a.correcta, p.leccion_id AS leccion FROM academia_respuestas a LEFT JOIN preguntas p ON p.id = a.pregunta_id WHERE a.alumno_id = ?').all(alumnoId) as {
      id: string;
      correcta: number;
      leccion: string;
    }[];
    const f = leccionIds ? filas.filter((x) => leccionIds.includes(x.leccion)) : filas;
    return pct(f.filter((x) => x.correcta).length, f.length);
  }

  resumen(alumnoId: string) {
    const m = this.mejores(alumnoId);
    const ultima = this.lab.db.prepare('SELECT MAX(fecha) AS f FROM academia_intentos WHERE alumno_id = ?').get(alumnoId) as { f: string | null };
    return {
      xp: this.xp(alumnoId),
      lecciones: [...m.values()].filter((x) => x.completada).length,
      estrellas: [...m.values()].reduce((s, x) => s + (x.completada ? x.estrellas : 0), 0),
      precision: this.precision(alumnoId),
      ultima: ultima.f,
    };
  }

  private desbloqueadas(alumnoId: string): Set<string> {
    const m = this.mejores(alumnoId);
    const ok = new Set<string>();
    LECCIONES.forEach((l, i) => {
      if (i === 0 || m.get(LECCIONES[i - 1].id)?.completada) ok.add(l.id);
    });
    return ok;
  }

  /** Observados: preguntas cuya última respuesta del alumno fue incorrecta. */
  private observadas(alumnoId: string): Pregunta[] {
    const filas = this.lab.db
      .prepare(
        `SELECT pregunta_id AS id, correcta FROM academia_respuestas r WHERE alumno_id = ? AND rowid = (SELECT MAX(rowid) FROM academia_respuestas x WHERE x.alumno_id = r.alumno_id AND x.pregunta_id = r.pregunta_id)`
      )
      .all(alumnoId) as { id: string; correcta: number }[];
    const ids = filas.filter((f) => !f.correcta).map((f) => f.id);
    return ids.map((id) => this.pregunta(id)).filter((p): p is Pregunta => !!p && p.activo !== false);
  }

  progreso(alumnoId: string) {
    const m = this.mejores(alumnoId);
    const abiertas = this.desbloqueadas(alumnoId);
    const visibles = this.visiblesPara(alumnoId);
    const cuenta = new Map<string, number>();
    const deDocente = new Map<string, number>();
    for (const p of visibles) {
      cuenta.set(p.leccionId, (cuenta.get(p.leccionId) ?? 0) + 1);
      if (p.alcance === 'aula') deDocente.set(p.leccionId, (deDocente.get(p.leccionId) ?? 0) + 1);
    }
    const record = this.lab.db.prepare("SELECT MAX(aciertos) AS r FROM academia_intentos WHERE alumno_id = ? AND modo = 'contrarreloj'").get(alumnoId) as { r: number | null };
    return {
      xp: this.xp(alumnoId),
      precision: this.precision(alumnoId),
      vidas: VIDAS,
      segundosContrarreloj: SEGUNDOS_CONTRARRELOJ,
      recordContrarreloj: record.r ?? 0,
      observadas: this.observadas(alumnoId).length,
      preguntasDeTuDocente: visibles.filter((p) => p.alcance === 'aula').length,
      lecciones: Object.fromEntries(
        LECCIONES.map((l) => {
          const x = m.get(l.id);
          return [
            l.id,
            {
              desbloqueada: abiertas.has(l.id),
              completada: !!x?.completada,
              estrellas: x?.completada ? x.estrellas : 0,
              mejorXp: x?.completada ? x.xp : 0,
              intentos: x?.intentos ?? 0,
              preguntas: Math.min(cuenta.get(l.id) ?? 0, MAX_PREGUNTAS_LECCION),
              deTuDocente: deDocente.get(l.id) ?? 0,
              precision: this.precision(alumnoId, [l.id]),
            },
          ];
        })
      ),
      modulos: Object.fromEntries(MODULOS.map((mod) => [mod.id, { precision: this.precision(alumnoId, mod.lecciones.map((l) => l.id)) }])),
    };
  }

  leccionParaJugar(alumnoId: string, leccionId: string) {
    const l = LECCIONES.find((x) => x.id === leccionId);
    if (!l) throw new ErrorApp('Lección no encontrada.', 404);
    if (!this.desbloqueadas(alumnoId).has(leccionId)) throw new ErrorApp('Primero completa la lección anterior.', 403);
    const preguntas = this.elegirPreguntas(this.activasDeLeccion(leccionId, alumnoId));
    if (!preguntas.length) throw new ErrorApp('Esta lección todavía no tiene preguntas.');
    return { leccion: l, preguntas, vidas: VIDAS };
  }

  /** Primero las del docente (para que sus alumnos sí las vean), luego las demás, y todo mezclado. */
  private elegirPreguntas(pool: Pregunta[]) {
    const delDocente = mezclar(pool.filter((p) => p.alcance === 'aula')).slice(0, MAX_PREGUNTAS_DOCENTE_LECCION);
    const resto = mezclar(pool.filter((p) => p.alcance !== 'aula')).slice(0, MAX_PREGUNTAS_LECCION - delDocente.length);
    return mezclar([...delDocente, ...resto]);
  }

  /** Califica en el servidor y guarda cada respuesta (para el seguimiento del docente). */
  private calificarYGuardar(alumnoId: string, intentoId: string, respuestas: RespuestaEnviada[]) {
    const detalle: { preguntaId: string; correcta: boolean }[] = [];
    const ins = this.lab.db.prepare('INSERT INTO academia_respuestas (intento_id, alumno_id, pregunta_id, correcta, fecha) VALUES (?, ?, ?, ?, ?)');
    for (const r of respuestas ?? []) {
      const p = this.pregunta(r.preguntaId);
      if (!p) continue;
      const ok = calificar(p, r.respuesta);
      detalle.push({ preguntaId: p.id, correcta: ok });
      ins.run(intentoId, alumnoId, p.id, ok ? 1 : 0, this.lab.iso());
    }
    return detalle;
  }

  registrarLeccion(alumnoId: string, leccionId: string, respuestas: RespuestaEnviada[], segundos: number) {
    if (!this.desbloqueadas(alumnoId).has(leccionId)) throw new ErrorApp('Primero completa la lección anterior.', 403);
    const pool = this.activasDeLeccion(leccionId, alumnoId);
    const ids = new Set(pool.map((p) => p.id));
    const validas = (respuestas ?? []).filter((r) => ids.has(r.preguntaId)).slice(0, MAX_PREGUNTAS_LECCION);
    if (!validas.length) throw new ErrorApp('No hay respuestas para registrar.');
    const antes = this.lab.estadoAlumno(alumnoId);
    const insigniasAntes = new Set(antes.insignias.map((i) => i.id));
    const previo = this.mejores(alumnoId).get(leccionId);

    const id = randomUUID();
    this.lab.db
      .prepare("INSERT INTO academia_intentos (id, alumno_id, modo, leccion_id, aciertos, total, fecha) VALUES (?, ?, 'leccion', ?, 0, 0, ?)")
      .run(id, alumnoId, leccionId, this.lab.iso());
    const detalle = this.calificarYGuardar(alumnoId, id, validas);
    const aciertos = detalle.filter((d) => d.correcta).length;
    const errores = detalle.length - aciertos;
    const disponibles = Math.min(pool.length, MAX_PREGUNTAS_LECCION);
    const completada = errores < VIDAS && detalle.length >= disponibles;
    const precision = aciertos / Math.max(1, detalle.length);
    const estrellas = completada ? (precision >= 0.9 ? 3 : precision >= 0.7 ? 2 : 1) : 0;
    const xp = completada ? aciertos * 10 + estrellas * 15 : 0;
    this.lab.db
      .prepare('UPDATE academia_intentos SET aciertos = ?, total = ?, estrellas = ?, xp = ?, segundos = ?, completada = ? WHERE id = ?')
      .run(aciertos, detalle.length, estrellas, xp, Math.max(0, Math.round(segundos || 0)), completada ? 1 : 0, id);

    const despues = this.lab.estadoAlumno(alumnoId);
    const nuevas = despues.insignias.filter((i) => !insigniasAntes.has(i.id)).map((i) => i.id);
    for (const n of nuevas) this.lab.avisar(alumnoId, { tipo: 'logro', titulo: `Nueva insignia: ${NOMBRE_INSIGNIA_ACADEMIA[n] ?? n}`, texto: 'Revísala en tu perfil.', enlace: '/app/perfil' });
    this.lab.avisarNivel(alumnoId, antes.nivel.level, despues);
    const idx = LECCIONES.findIndex((l) => l.id === leccionId);
    return {
      aciertos,
      total: detalle.length,
      errores,
      completada,
      estrellas,
      xp,
      xpGanado: despues.xp - antes.xp,
      marcaAnterior: previo?.completada ? previo.xp : null,
      siguiente: completada && LECCIONES[idx + 1] ? LECCIONES[idx + 1].id : null,
      detalle,
      insigniasNuevas: nuevas,
    };
  }

  contrarreloj(alumnoId: string) {
    const abiertas = [...this.desbloqueadas(alumnoId)];
    const pool = this.visiblesPara(alumnoId, "AND p.tipo IN ('vf', 'opcion', 'calculo')").filter((p) => abiertas.includes(p.leccionId));
    return { segundos: SEGUNDOS_CONTRARRELOJ, preguntas: mezclar(pool).slice(0, 40) };
  }

  registrarContrarreloj(alumnoId: string, respuestas: RespuestaEnviada[]) {
    const antes = this.lab.db.prepare("SELECT MAX(aciertos) AS r FROM academia_intentos WHERE alumno_id = ? AND modo = 'contrarreloj'").get(alumnoId) as { r: number | null };
    const insigniasAntes = new Set(this.insignias(alumnoId).map((i) => i.id));
    const id = randomUUID();
    this.lab.db
      .prepare("INSERT INTO academia_intentos (id, alumno_id, modo, aciertos, total, segundos, completada, fecha) VALUES (?, ?, 'contrarreloj', 0, 0, ?, 1, ?)")
      .run(id, alumnoId, SEGUNDOS_CONTRARRELOJ, this.lab.iso());
    const detalle = this.calificarYGuardar(alumnoId, id, (respuestas ?? []).slice(0, 60));
    const aciertos = detalle.filter((d) => d.correcta).length;
    this.lab.db.prepare('UPDATE academia_intentos SET aciertos = ?, total = ? WHERE id = ?').run(aciertos, detalle.length, id);
    for (const n of this.insignias(alumnoId).filter((i) => !insigniasAntes.has(i.id)))
      this.lab.avisar(alumnoId, { tipo: 'logro', titulo: `Nueva insignia: ${NOMBRE_INSIGNIA_ACADEMIA[n.id]}`, texto: 'Revísala en tu perfil.', enlace: '/app/perfil' });
    return { aciertos, total: detalle.length, record: Math.max(aciertos, antes.r ?? 0), nuevoRecord: aciertos > (antes.r ?? 0), detalle };
  }

  repaso(alumnoId: string) {
    return { preguntas: mezclar(this.observadas(alumnoId)).slice(0, MAX_PREGUNTAS_LECCION) };
  }

  registrarRepaso(alumnoId: string, respuestas: RespuestaEnviada[]) {
    const id = randomUUID();
    this.lab.db.prepare("INSERT INTO academia_intentos (id, alumno_id, modo, aciertos, total, completada, fecha) VALUES (?, ?, 'repaso', 0, 0, 1, ?)").run(id, alumnoId, this.lab.iso());
    const detalle = this.calificarYGuardar(alumnoId, id, (respuestas ?? []).slice(0, MAX_PREGUNTAS_LECCION));
    const aciertos = detalle.filter((d) => d.correcta).length;
    this.lab.db.prepare('UPDATE academia_intentos SET aciertos = ?, total = ? WHERE id = ?').run(aciertos, detalle.length, id);
    return { aciertos, total: detalle.length, pendientes: this.observadas(alumnoId).length, detalle };
  }

  insignias(alumnoId: string): { id: string; fecha: string }[] {
    const out: { id: string; fecha: string }[] = [];
    const primera = (sql: string, ...a: string[]) => (this.lab.db.prepare(sql).get(...a) as { f: string | null } | undefined)?.f ?? null;
    const perfecta = primera("SELECT MIN(fecha) AS f FROM academia_intentos WHERE alumno_id = ? AND modo = 'leccion' AND estrellas = 3", alumnoId);
    if (perfecta) out.push({ id: 'badge-sin-observaciones', fecha: perfecta });
    const veloz = primera("SELECT MIN(fecha) AS f FROM academia_intentos WHERE alumno_id = ? AND modo = 'contrarreloj' AND aciertos >= 12", alumnoId);
    if (veloz) out.push({ id: 'badge-reflejos', fecha: veloz });
    // Módulo completo: todas sus lecciones completadas.
    for (const mod of MODULOS) {
      const fechas = mod.lecciones.map((l) => primera("SELECT MIN(fecha) AS f FROM academia_intentos WHERE alumno_id = ? AND modo = 'leccion' AND completada = 1 AND leccion_id = ?", alumnoId, l.id));
      if (fechas.every(Boolean)) {
        out.push({ id: 'badge-modulo', fecha: fechas.sort().at(-1)! });
        break;
      }
    }
    return out;
  }

  // --- Seguimiento del docente ----------------------------------------------------------------------------------

  seguimiento(alumnoIds: string[]) {
    const lecciones = LECCIONES.length;
    const alumnos = alumnoIds.map((id) => {
      const r = this.resumen(id);
      const m = this.lab.resumenMisiones(id);
      return {
        id,
        ...r,
        totalLecciones: lecciones,
        modulos: Object.fromEntries(MODULOS.map((mod) => [mod.id, this.precision(id, mod.lecciones.map((l) => l.id))])),
        misiones: { xp: m.xp, casos: m.casos },
        ultimaActividad: [r.ultima, m.ultima].filter(Boolean).sort().at(-1) ?? null,
      };
    });

    const respuestas = alumnoIds.length
      ? (this.lab.db
          .prepare(
            `SELECT r.pregunta_id AS id, r.correcta, r.fecha, p.leccion_id AS leccion FROM academia_respuestas r LEFT JOIN preguntas p ON p.id = r.pregunta_id WHERE r.alumno_id IN (${alumnoIds.map(() => '?').join(',')})`
          )
          .all(...alumnoIds) as { id: string; correcta: number; fecha: string; leccion: string }[])
      : [];

    const dominio = MODULOS.map((mod) => {
      const ids = mod.lecciones.map((l) => l.id);
      const r = respuestas.filter((x) => ids.includes(x.leccion));
      const completaron = alumnoIds.filter((a) => {
        const m = this.mejores(a);
        return ids.every((l) => m.get(l)?.completada);
      }).length;
      return { moduloId: mod.id, titulo: mod.titulo, numero: mod.numero, precision: pct(r.filter((x) => x.correcta).length, r.length), respuestas: r.length, completaron };
    });

    const porPregunta = new Map<string, { n: number; ok: number }>();
    for (const r of respuestas) {
      const s = porPregunta.get(r.id) ?? { n: 0, ok: 0 };
      s.n++;
      s.ok += r.correcta;
      porPregunta.set(r.id, s);
    }
    const masFalladas = [...porPregunta.entries()]
      .filter(([, s]) => s.n >= 2)
      .map(([id, s]) => ({ id, s, p: this.pregunta(id) }))
      .filter((x) => x.p)
      .map((x) => ({ id: x.id, enunciado: x.p!.enunciado, tipo: x.p!.tipo, leccionId: x.p!.leccionId, respuestas: x.s.n, acierto: pct(x.s.ok, x.s.n)! }))
      .sort((a, b) => a.acierto - b.acierto || b.respuestas - a.respuestas)
      .slice(0, 8);

    const actividad = Array.from({ length: 14 }, (_, i) => {
      const dia = diaLima(new Date(this.lab.ahora().getTime() - (13 - i) * 86400000));
      return { dia, intentos: 0 };
    });
    if (alumnoIds.length) {
      const filas = this.lab.db
        .prepare(`SELECT fecha FROM academia_intentos WHERE alumno_id IN (${alumnoIds.map(() => '?').join(',')})`)
        .all(...alumnoIds) as { fecha: string }[];
      for (const f of filas) {
        const d = actividad.find((a) => a.dia === diaLima(f.fecha));
        if (d) d.intentos++;
      }
    }

    const conPrec = alumnos.filter((a) => a.precision !== null);
    return {
      alumnos,
      dominio,
      masFalladas,
      actividad,
      totalLecciones: lecciones,
      precision: conPrec.length ? Math.round(conPrec.reduce((s, a) => s + a.precision!, 0) / conPrec.length) : null,
      leccionesPromedio: alumnos.length ? Math.round((alumnos.reduce((s, a) => s + a.lecciones, 0) / alumnos.length) * 10) / 10 : 0,
    };
  }

  detalleAlumno(alumnoId: string) {
    const prog = this.progreso(alumnoId);
    const intentos = this.lab.db
      .prepare('SELECT modo, leccion_id AS leccionId, aciertos, total, estrellas, xp, completada, fecha FROM academia_intentos WHERE alumno_id = ? ORDER BY fecha DESC LIMIT 40')
      .all(alumnoId);
    return { progreso: prog, intentos, observadas: this.observadas(alumnoId).map((p) => ({ id: p.id, enunciado: p.enunciado, leccionId: p.leccionId })) };
  }

  resumenGeneral() {
    const intentos = (this.lab.db.prepare('SELECT COUNT(*) AS n FROM academia_intentos').get() as { n: number }).n;
    const r = this.lab.db.prepare('SELECT COUNT(*) AS n, SUM(correcta) AS ok FROM academia_respuestas').get() as { n: number; ok: number | null };
    const preguntas = this.lab.db
      .prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN p.base = 0 AND u.rol = 'docente' THEN 1 ELSE 0 END) AS docentes FROM preguntas p LEFT JOIN usuarios u ON u.id = p.autor_id WHERE p.activo = 1")
      .get() as { n: number; docentes: number | null };
    const porDocente = this.lab.db
      .prepare(
        "SELECT u.id, u.nombre, COUNT(*) AS n FROM preguntas p JOIN usuarios u ON u.id = p.autor_id WHERE p.base = 0 AND u.rol = 'docente' AND p.activo = 1 GROUP BY u.id ORDER BY n DESC"
      )
      .all() as { id: string; nombre: string; n: number }[];
    const alumnos = (this.lab.db.prepare("SELECT id FROM usuarios WHERE rol = 'estudiante' AND activo = 1").all() as { id: string }[]).map((f) => f.id);
    const general = this.seguimiento(alumnos);
    return {
      intentos,
      respuestas: r.n,
      precision: pct(r.ok ?? 0, r.n),
      preguntas: preguntas.n,
      preguntasDocentes: preguntas.docentes ?? 0,
      porDocente,
      dominio: general.dominio,
      masFalladas: general.masFalladas.slice(0, 5),
      leccionesPromedio: general.leccionesPromedio,
    };
  }
}

export const NOMBRE_INSIGNIA_ACADEMIA: Record<string, string> = {
  'badge-sin-observaciones': 'Sin observaciones',
  'badge-reflejos': 'Reflejos de auditor',
  'badge-modulo': 'Módulo certificado',
};
