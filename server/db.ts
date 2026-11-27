/**
 * Base de datos de AUDIT LAB (SQLite incluido en Node, sin instalar nada más).
 * Núcleo: usuarios, sesiones, avisos y las misiones (práctica libre).
 * Las aulas, la Academia y los proyectos por equipos están en server/modulos/.
 */
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { AUDITOR_LEVELS, getLevelForXp } from '../src/data/academyData';
import { INITIAL_MISSIONS } from '../src/data/missionsData';
import { MISIONES_ACTIVAS, REGLAS_INSIGNIAS, mejorPorMision, promedioCompetencias, rachaDias, xpTotal } from '../src/lib/reglas';
import type { MissionRunResult } from '../src/types/audit';
import { Academia } from './modulos/academia';
import { Aulas } from './modulos/aulas';
import { Proyectos } from './modulos/proyectos';

export type Rol = 'admin' | 'docente' | 'estudiante';
export const ROLES: Rol[] = ['admin', 'docente', 'estudiante'];

export class ErrorApp extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

export interface Usuario {
  id: string;
  rol: Rol;
  nombre: string;
  correo: string;
  codigo: string | null;
  activo: boolean;
  creado: string;
  ultimoAcceso: string | null;
}

export interface Aviso {
  id: string;
  tipo: 'bienvenida' | 'logro' | 'nivel' | 'resultado' | 'sistema' | 'aula' | 'proyecto';
  titulo: string;
  texto: string;
  misionId: string | null;
  enlace: string | null;
  creado: string;
  leido: boolean;
}

export interface FilaUsuario {
  id: string;
  rol: Rol;
  nombre: string;
  correo: string;
  codigo: string | null;
  docente_id: string | null;
  activo: number;
  creado: string;
  ultimo_acceso: string | null;
  clave: string;
}

const SESION_DIAS = 7;
export const MISIONES = new Map(INITIAL_MISSIONS.map((m) => [m.id, m]));

// --- Contraseñas (scrypt con sal) ------------------------------------------------------------------------------

export function cifrarClave(clave: string): string {
  const sal = randomBytes(16);
  const hash = scryptSync(clave, sal, 64);
  return `scrypt$${sal.toString('hex')}$${hash.toString('hex')}`;
}

function claveCorrecta(clave: string, guardada: string): boolean {
  const [, salHex, hashHex] = guardada.split('$');
  if (!salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  const real = scryptSync(clave, Buffer.from(salHex, 'hex'), esperado.length);
  return timingSafeEqual(esperado, real);
}

/** Contraseña temporal fácil de dictar: sin letras que se confundan (0/O, 1/l). */
export function claveTemporal(): string {
  const letras = 'abcdefghjkmnpqrstuvwxyz';
  const nums = '23456789';
  const b = randomBytes(8);
  let s = '';
  for (let i = 0; i < 5; i++) s += letras[b[i] % letras.length];
  for (let i = 5; i < 8; i++) s += nums[b[i] % nums.length];
  return s;
}

const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

export function validarCorreo(correo: string): string {
  const c = String(correo ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) throw new ErrorApp(`Correo no válido: «${correo}».`);
  return c;
}

export function validarClave(clave: string) {
  if (typeof clave !== 'string' || clave.length < 8) throw new ErrorApp('La contraseña debe tener al menos 8 caracteres.');
}

export function aUsuario(f: FilaUsuario): Usuario {
  return {
    id: f.id,
    rol: f.rol,
    nombre: f.nombre,
    correo: f.correo,
    codigo: f.codigo,
    activo: f.activo === 1,
    creado: f.creado,
    ultimoAcceso: f.ultimo_acceso,
  };
}

export const diaLima = (d: Date | string) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

// --- Validación de un intento de misión enviado por el navegador -----------------------------------------------

function validarResultado(r: MissionRunResult): MissionRunResult {
  if (!r || typeof r !== 'object') throw new ErrorApp('Resultado vacío.');
  const mision = MISIONES.get(r.missionId);
  if (!mision || !(MISIONES_ACTIVAS as readonly string[]).includes(r.missionId)) throw new ErrorApp('Misión no válida.');
  const pares: [keyof MissionRunResult, keyof MissionRunResult][] = [
    ['anomaliesFound', 'anomaliesTotal'],
    ['comparisonsSolved', 'comparisonsTotal'],
    ['classificationsCorrect', 'classificationsTotal'],
    ['brokenLinksFlagged', 'brokenLinksTotal'],
    ['decisionsOptimal', 'decisionsTotal'],
  ];
  for (const [a, b] of pares) {
    const x = Number(r[a]);
    const t = Number(r[b]);
    if (!Number.isFinite(x) || !Number.isFinite(t) || x < 0 || t < 0 || x > t || t > 100)
      throw new ErrorApp(`Dato inválido en el resultado (${String(a)}).`);
  }
  const acc = Number(r.accuracyPercent);
  const dossier = Number(r.dossierScorePercent);
  const xp = Number(r.xpEarned);
  if (!(acc >= 0 && acc <= 100) || !(dossier >= 0 && dossier <= 100)) throw new ErrorApp('Porcentaje fuera de rango.');
  if (!(xp >= 0 && xp <= mision.xpReward * 2)) throw new ErrorApp('XP fuera de rango.');
  if (!['S', 'A', 'B', 'C'].includes(r.rankGrade)) throw new ErrorApp('Rango no válido.');
  return r;
}

const NOMBRE_INSIGNIA: Record<string, string> = {
  'badge-detective': 'Detective de inconsistencias',
  'badge-igv': 'Experto en IGV',
  'badge-dossier': 'Maestro del expediente',
  'badge-inventarios': 'Especialista en inventarios',
  'badge-estratega': 'Auditor estratégico',
};

// ---------------------------------------------------------------------------------------------------------------

export class AuditLab {
  readonly db: DatabaseSync;
  readonly ahora: () => Date;
  readonly aulas: Aulas;
  readonly academia: Academia;
  readonly proyectos: Proyectos;

  constructor(opciones: { ruta: string; ahora?: () => Date }) {
    if (opciones.ruta !== ':memory:') mkdirSync(path.dirname(opciones.ruta), { recursive: true });
    this.db = new DatabaseSync(opciones.ruta);
    this.ahora = opciones.ahora ?? (() => new Date());
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        rol TEXT NOT NULL CHECK (rol IN ('admin', 'docente', 'estudiante')),
        nombre TEXT NOT NULL,
        correo TEXT NOT NULL UNIQUE,
        clave TEXT NOT NULL,
        codigo TEXT,
        docente_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
        activo INTEGER NOT NULL DEFAULT 1,
        creado TEXT NOT NULL,
        ultimo_acceso TEXT
      );
      CREATE TABLE IF NOT EXISTS sesiones (
        token TEXT PRIMARY KEY,
        usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        expira TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS resultados (
        id TEXT PRIMARY KEY,
        usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        mision_id TEXT NOT NULL,
        completado TEXT NOT NULL,
        xp INTEGER NOT NULL,
        precision INTEGER NOT NULL,
        datos TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS resultados_usuario ON resultados (usuario_id, completado);
      CREATE TABLE IF NOT EXISTS avisos (
        id TEXT PRIMARY KEY,
        usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL,
        titulo TEXT NOT NULL,
        texto TEXT NOT NULL,
        mision_id TEXT,
        creado TEXT NOT NULL,
        leido INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS avisos_usuario ON avisos (usuario_id, creado);
    `);
    // Bases creadas antes de existir el enlace de los avisos.
    const columnasAviso = (this.db.prepare('PRAGMA table_info(avisos)').all() as { name: string }[]).map((c) => c.name);
    if (!columnasAviso.includes('enlace')) this.db.exec('ALTER TABLE avisos ADD COLUMN enlace TEXT');

    this.aulas = new Aulas(this);
    this.academia = new Academia(this);
    this.proyectos = new Proyectos(this);
  }

  iso() {
    return this.ahora().toISOString();
  }

  // --- Usuarios -------------------------------------------------------------------------------------------------

  hayAdmin(): boolean {
    return !!this.db.prepare("SELECT 1 FROM usuarios WHERE rol = 'admin' AND activo = 1 LIMIT 1").get();
  }

  usuario(id: string): Usuario | null {
    const f = this.db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id) as FilaUsuario | undefined;
    return f ? aUsuario(f) : null;
  }

  crearUsuario(datos: {
    rol: Rol;
    nombre: string;
    correo: string;
    clave?: string;
    codigo?: string | null;
    aulaId?: string | null;
  }): { usuario: Usuario; clave: string } {
    if (!ROLES.includes(datos.rol)) throw new ErrorApp('Rol no válido.');
    const nombre = String(datos.nombre ?? '').trim().replace(/\s+/g, ' ');
    if (nombre.length < 3) throw new ErrorApp('Escribe el nombre completo.');
    const correo = validarCorreo(datos.correo);
    const clave = datos.clave?.trim() || claveTemporal();
    validarClave(clave);
    if (this.db.prepare('SELECT 1 FROM usuarios WHERE correo = ?').get(correo))
      throw new ErrorApp(`Ya existe una cuenta con el correo ${correo}.`, 409);
    if (datos.aulaId && datos.rol === 'estudiante' && !this.aulas.aula(datos.aulaId)) throw new ErrorApp('El aula elegida no existe.');
    const id = randomUUID();
    this.db
      .prepare('INSERT INTO usuarios (id, rol, nombre, correo, clave, codigo, creado) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, datos.rol, nombre, correo, cifrarClave(clave), datos.codigo?.trim() || null, this.iso());
    if (datos.rol === 'estudiante') {
      this.avisar(id, {
        tipo: 'bienvenida',
        titulo: 'Bienvenido a AUDIT LAB',
        texto: 'Empieza por la Academia para aprender lo básico y luego pon a prueba lo aprendido en las misiones.',
        enlace: '/app/academia',
      });
      if (datos.aulaId) this.aulas.agregarAlumno(datos.aulaId, id);
    }
    return { usuario: this.usuario(id)!, clave };
  }

  /**
   * Crea varias cuentas a la vez desde texto pegado (una por línea):
   *   Nombre completo, correo@udh.edu.pe[, código]
   */
  crearLote(datos: { rol: Rol; aulaId?: string | null; texto: string }) {
    const creados: { nombre: string; correo: string; clave: string }[] = [];
    const errores: { linea: number; texto: string; error: string }[] = [];
    String(datos.texto ?? '')
      .split(/\r?\n/)
      .forEach((bruta, i) => {
        const linea = bruta.trim();
        if (!linea) return;
        const partes = linea.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
        const correo = partes.find((p) => p.includes('@'));
        const resto = partes.filter((p) => p !== correo);
        const codigo = resto.find((p) => /^\d{6,}$/.test(p)) ?? null;
        const nombre = resto.filter((p) => p !== codigo).join(' ');
        try {
          if (!correo) throw new ErrorApp('Falta el correo.');
          const r = this.crearUsuario({ rol: datos.rol, nombre, correo, codigo, aulaId: datos.aulaId });
          creados.push({ nombre: r.usuario.nombre, correo: r.usuario.correo, clave: r.clave });
        } catch (e) {
          errores.push({ linea: i + 1, texto: linea, error: (e as Error).message });
        }
      });
    return { creados, errores };
  }

  actualizarUsuario(id: string, cambios: Partial<{ nombre: string; correo: string; codigo: string | null; rol: Rol; activo: boolean }>, quien?: string): Usuario {
    const u = this.usuario(id);
    if (!u) throw new ErrorApp('Usuario no encontrado.', 404);
    const nombre = cambios.nombre !== undefined ? String(cambios.nombre).trim() : u.nombre;
    if (nombre.length < 3) throw new ErrorApp('Escribe el nombre completo.');
    const correo = cambios.correo !== undefined ? validarCorreo(cambios.correo) : u.correo;
    if (correo !== u.correo && this.db.prepare('SELECT 1 FROM usuarios WHERE correo = ?').get(correo))
      throw new ErrorApp(`Ya existe una cuenta con el correo ${correo}.`, 409);
    const rol = cambios.rol ?? u.rol;
    if (!ROLES.includes(rol)) throw new ErrorApp('Rol no válido.');
    const activo = cambios.activo ?? u.activo;
    if (quien === id && (rol !== 'admin' || !activo)) throw new ErrorApp('No puedes quitarte el rol de administrador ni desactivar tu propia cuenta.');
    if (u.rol === 'docente' && rol !== 'docente' && this.aulas.deDocente(id).length)
      throw new ErrorApp('Este docente tiene aulas. Archívalas o asígnalas antes de cambiarle el rol.');
    const codigo = cambios.codigo !== undefined ? cambios.codigo?.trim() || null : u.codigo;
    this.db.prepare('UPDATE usuarios SET nombre = ?, correo = ?, codigo = ?, rol = ?, activo = ? WHERE id = ?').run(nombre, correo, codigo, rol, activo ? 1 : 0, id);
    if (!activo) this.db.prepare('DELETE FROM sesiones WHERE usuario_id = ?').run(id);
    return this.usuario(id)!;
  }

  fijarClave(id: string, clave?: string): string {
    if (!this.usuario(id)) throw new ErrorApp('Usuario no encontrado.', 404);
    const nueva = clave?.trim() || claveTemporal();
    validarClave(nueva);
    this.db.prepare('UPDATE usuarios SET clave = ? WHERE id = ?').run(cifrarClave(nueva), id);
    this.db.prepare('DELETE FROM sesiones WHERE usuario_id = ?').run(id);
    return nueva;
  }

  cambiarMiClave(id: string, actual: string, nueva: string) {
    const f = this.db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id) as FilaUsuario | undefined;
    if (!f || !claveCorrecta(String(actual ?? ''), f.clave)) throw new ErrorApp('La contraseña actual no es correcta.');
    validarClave(nueva);
    this.db.prepare('UPDATE usuarios SET clave = ? WHERE id = ?').run(cifrarClave(nueva), id);
  }

  eliminarUsuario(id: string, quien: string) {
    if (id === quien) throw new ErrorApp('No puedes eliminar tu propia cuenta.');
    if (this.aulas.deDocente(id).length) throw new ErrorApp('Este docente tiene aulas. Desactiva la cuenta en lugar de eliminarla.');
    const r = this.db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
    if (r.changes === 0) throw new ErrorApp('Usuario no encontrado.', 404);
  }

  /** Crea el administrador o le pone una nueva contraseña (comando `npm run crear-admin`). */
  fijarAdmin(correo: string, clave: string, nombre = 'Administración AUDIT LAB'): 'creado' | 'actualizado' {
    const c = validarCorreo(correo);
    validarClave(clave);
    const f = this.db.prepare('SELECT id FROM usuarios WHERE correo = ?').get(c) as { id: string } | undefined;
    if (!f) {
      this.crearUsuario({ rol: 'admin', nombre, correo: c, clave });
      return 'creado';
    }
    this.db.prepare("UPDATE usuarios SET rol = 'admin', activo = 1, clave = ? WHERE id = ?").run(cifrarClave(clave), f.id);
    this.db.prepare('DELETE FROM sesiones WHERE usuario_id = ?').run(f.id);
    return 'actualizado';
  }

  // --- Sesiones -------------------------------------------------------------------------------------------------

  ingresar(correo: string, clave: string): { token: string; usuario: Usuario } {
    const c = String(correo ?? '').trim().toLowerCase();
    const f = this.db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(c) as FilaUsuario | undefined;
    if (!f || !claveCorrecta(String(clave ?? ''), f.clave)) throw new ErrorApp('Correo o contraseña incorrectos.', 401);
    if (f.activo !== 1) throw new ErrorApp('Tu cuenta está desactivada. Consulta con el administrador.', 403);
    const token = randomBytes(32).toString('base64url');
    const expira = new Date(this.ahora().getTime() + SESION_DIAS * 86400000).toISOString();
    this.db.prepare('INSERT INTO sesiones (token, usuario_id, expira) VALUES (?, ?, ?)').run(hashToken(token), f.id, expira);
    this.db.prepare('UPDATE usuarios SET ultimo_acceso = ? WHERE id = ?').run(this.iso(), f.id);
    this.db.prepare('DELETE FROM sesiones WHERE expira < ?').run(this.iso());
    return { token, usuario: aUsuario(f) };
  }

  usuarioDeSesion(token: string | undefined): Usuario | null {
    if (!token) return null;
    const f = this.db
      .prepare('SELECT u.* FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token = ? AND s.expira > ? AND u.activo = 1')
      .get(hashToken(token), this.iso()) as FilaUsuario | undefined;
    return f ? aUsuario(f) : null;
  }

  salir(token: string | undefined) {
    if (token) this.db.prepare('DELETE FROM sesiones WHERE token = ?').run(hashToken(token));
  }

  // --- Avisos (campanita) ---------------------------------------------------------------------------------------

  avisar(usuarioId: string, a: { tipo: Aviso['tipo']; titulo: string; texto: string; misionId?: string | null; enlace?: string | null }) {
    this.db
      .prepare('INSERT INTO avisos (id, usuario_id, tipo, titulo, texto, mision_id, enlace, creado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), usuarioId, a.tipo, a.titulo, a.texto, a.misionId ?? null, a.enlace ?? (a.misionId ? `/app/casos/${a.misionId}` : null), this.iso());
  }

  avisos(usuarioId: string): Aviso[] {
    const filas = this.db.prepare('SELECT * FROM avisos WHERE usuario_id = ? ORDER BY creado DESC, rowid DESC LIMIT 30').all(usuarioId) as unknown as {
      id: string;
      tipo: Aviso['tipo'];
      titulo: string;
      texto: string;
      mision_id: string | null;
      enlace: string | null;
      creado: string;
      leido: number;
    }[];
    return filas.map((f) => ({ id: f.id, tipo: f.tipo, titulo: f.titulo, texto: f.texto, misionId: f.mision_id, enlace: f.enlace, creado: f.creado, leido: f.leido === 1 }));
  }

  marcarAvisos(usuarioId: string, id?: string) {
    if (id) this.db.prepare('UPDATE avisos SET leido = 1 WHERE usuario_id = ? AND id = ?').run(usuarioId, id);
    else this.db.prepare('UPDATE avisos SET leido = 1 WHERE usuario_id = ?').run(usuarioId);
  }

  // --- Misiones (práctica libre) --------------------------------------------------------------------------------

  resultados(usuarioId: string): (MissionRunResult & { id: string; fechaIso: string })[] {
    const filas = this.db.prepare('SELECT id, completado, datos FROM resultados WHERE usuario_id = ? ORDER BY completado DESC').all(usuarioId) as unknown as {
      id: string;
      completado: string;
      datos: string;
    }[];
    return filas.map((f) => ({ ...(JSON.parse(f.datos) as MissionRunResult), id: f.id, fechaIso: f.completado }));
  }

  /** Resumen corto de misiones de un alumno (para tablas y clasificación). */
  resumenMisiones(usuarioId: string) {
    const r = this.resultados(usuarioId);
    const mejores = [...mejorPorMision(r).values()];
    return {
      xp: xpTotal(r),
      casos: mejores.length,
      intentos: r.length,
      precision: mejores.length ? Math.round(mejores.reduce((s, x) => s + x.accuracyPercent, 0) / mejores.length) : null,
      ultima: r[0]?.fechaIso ?? null,
    };
  }

  estadoAlumno(usuarioId: string) {
    const resultados = this.resultados(usuarioId);
    const xpMisiones = xpTotal(resultados);
    const xpAcademia = this.academia.xp(usuarioId);
    const xp = xpMisiones + xpAcademia;
    const nivel = getLevelForXp(xp);
    const siguiente = AUDITOR_LEVELS.find((l) => l.level === nivel.level + 1) ?? null;
    const mejores = mejorPorMision(resultados);

    const insignias: { id: string; fecha: string }[] = [];
    for (const regla of REGLAS_INSIGNIAS) {
      const primero = [...resultados].reverse().find((r) => regla.cumple(r));
      if (primero) insignias.push({ id: regla.id, fecha: primero.fechaIso });
    }
    insignias.push(...this.academia.insignias(usuarioId));

    const precisiones = [...mejores.values()].map((r) => r.accuracyPercent);
    const fechas = [...resultados.map((r) => r.fechaIso), ...this.academia.fechas(usuarioId)];
    return {
      xp,
      xpMisiones,
      xpAcademia,
      nivel: { ...nivel },
      siguienteNivel: siguiente ? { ...siguiente } : null,
      racha: rachaDias(fechas, this.ahora()),
      completadas: [...mejores.keys()],
      mejores: Object.fromEntries([...mejores.entries()].map(([k, r]) => [k, { xp: r.xpEarned, precision: r.accuracyPercent, rango: r.rankGrade }])),
      precisionPromedio: precisiones.length ? Math.round(precisiones.reduce((a, b) => a + b, 0) / precisiones.length) : null,
      intentos: resultados.length,
      resultados,
      insignias,
      competencias: promedioCompetencias(resultados),
      avisos: this.avisos(usuarioId),
      aulas: this.aulas.delAlumno(usuarioId),
    };
  }

  /** Guarda un intento de misión. Cuenta el mejor intento de cada misión: repetir solo suma si supera la marca. */
  registrarResultado(usuarioId: string, bruto: MissionRunResult) {
    const r = validarResultado(bruto);
    const antes = this.estadoAlumno(usuarioId);
    const mision = MISIONES.get(r.missionId)!;
    const precision = Math.round(r.accuracyPercent);
    this.db
      .prepare('INSERT INTO resultados (id, usuario_id, mision_id, completado, xp, precision, datos) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), usuarioId, r.missionId, this.iso(), Math.round(r.xpEarned), precision, JSON.stringify(r));

    const despues = this.estadoAlumno(usuarioId);
    const xpGanado = despues.xp - antes.xp;
    const yaTenia = new Set(antes.insignias.map((i) => i.id));
    const nuevas = despues.insignias.filter((i) => !yaTenia.has(i.id)).map((i) => i.id);
    const prevMejor = antes.mejores[r.missionId];

    this.avisar(usuarioId, {
      tipo: 'resultado',
      titulo: `Expediente ${mision.dossierCode} presentado · Rango ${r.rankGrade}`,
      texto: prevMejor
        ? xpGanado > 0
          ? `Superaste tu marca anterior (${prevMejor.xp} XP). Sumas +${xpGanado} XP.`
          : `Tu mejor marca en este caso sigue siendo ${prevMejor.xp} XP, así que este intento no suma XP.`
        : `Precisión ${precision} %. Sumas +${xpGanado} XP.`,
      misionId: r.missionId,
    });
    for (const id of nuevas) this.avisar(usuarioId, { tipo: 'logro', titulo: `Nueva insignia: ${NOMBRE_INSIGNIA[id] ?? id}`, texto: 'Revísala en tu perfil.', enlace: '/app/perfil' });
    this.avisarNivel(usuarioId, antes.nivel.level, despues);
    return { estado: this.estadoAlumno(usuarioId), xpGanado, mejoraMarca: !prevMejor || r.xpEarned > prevMejor.xp, marcaAnterior: prevMejor?.xp ?? null, insigniasNuevas: nuevas };
  }

  avisarNivel(usuarioId: string, nivelAntes: number, despues: { nivel: { level: number; title: string }; xp: number }) {
    if (despues.nivel.level > nivelAntes)
      this.avisar(usuarioId, { tipo: 'nivel', titulo: `Subiste a ${despues.nivel.title}`, texto: `Ahora tienes ${despues.xp.toLocaleString('es-PE')} XP.`, enlace: '/app/perfil' });
  }

  // --- Clasificación ---------------------------------------------------------------------------------------------

  /**
   * Misiones: clasificación general de todos los estudiantes (es práctica libre).
   * Academia: clasificación de un aula.
   */
  clasificacion(usuario: Usuario, opciones: { tipo?: 'misiones' | 'academia'; aulaId?: string | null } = {}) {
    const tipo = opciones.tipo ?? 'misiones';
    let alumnos: FilaUsuario[];
    if (tipo === 'academia') {
      const aulaId = opciones.aulaId ?? (usuario.rol === 'estudiante' ? this.aulas.delAlumno(usuario.id)[0]?.id : this.aulas.deDocente(usuario.id)[0]?.id);
      if (!aulaId) return { tipo, aula: null, puestos: [] };
      this.aulas.exigirAcceso(usuario, aulaId);
      alumnos = this.aulas.filasAlumnos(aulaId);
      const aula = this.aulas.aula(aulaId);
      return { tipo, aula: aula ? { id: aula.id, nombre: aula.nombre } : null, puestos: this.ordenar(usuario, alumnos, 'academia') };
    }
    alumnos = this.db.prepare("SELECT * FROM usuarios WHERE rol = 'estudiante' AND activo = 1").all() as unknown as FilaUsuario[];
    return { tipo, aula: null, puestos: this.ordenar(usuario, alumnos, 'misiones') };
  }

  private ordenar(usuario: Usuario, alumnos: FilaUsuario[], tipo: 'misiones' | 'academia') {
    const filas = alumnos
      .filter((a) => a.activo === 1)
      .map((a) => {
        if (tipo === 'misiones') {
          const m = this.resumenMisiones(a.id);
          return { id: a.id, nombre: a.nombre, codigo: a.codigo, xp: m.xp, misiones: m.casos, precision: m.precision };
        }
        const ac = this.academia.resumen(a.id);
        return { id: a.id, nombre: a.nombre, codigo: a.codigo, xp: ac.xp, misiones: ac.lecciones, precision: ac.precision };
      });
    return filas
      .sort((a, b) => b.xp - a.xp || (b.precision ?? 0) - (a.precision ?? 0) || a.nombre.localeCompare(b.nombre))
      .map((a, i) => {
        const total = this.estadoNivel(a.id);
        return { puesto: i + 1, ...a, nivel: total, esYo: a.id === usuario.id };
      });
  }

  private estadoNivel(id: string) {
    return getLevelForXp(xpTotal(this.resultados(id)) + this.academia.xp(id)).title;
  }

  // --- Administración -------------------------------------------------------------------------------------------

  listarUsuarios() {
    const filas = this.db.prepare('SELECT * FROM usuarios ORDER BY rol, nombre').all() as unknown as FilaUsuario[];
    return filas.map((f) => {
      const base = aUsuario(f);
      if (f.rol === 'estudiante') {
        const m = this.resumenMisiones(f.id);
        const a = this.academia.resumen(f.id);
        return { ...base, aulas: this.aulas.delAlumno(f.id).map((x) => x.nombre), xp: m.xp + a.xp, misiones: m.casos, lecciones: a.lecciones };
      }
      if (f.rol === 'docente') {
        const aulas = this.aulas.deDocente(f.id);
        return { ...base, aulasDocente: aulas.length, alumnos: aulas.reduce((s, x) => s + x.alumnos, 0) };
      }
      return base;
    });
  }

  resumenAdmin() {
    const cuenta = (rol: Rol) => (this.db.prepare('SELECT COUNT(*) AS n FROM usuarios WHERE rol = ?').get(rol) as { n: number }).n;
    const semana = new Date(this.ahora().getTime() - 7 * 86400000).toISOString();
    const activos = (this.db.prepare('SELECT COUNT(*) AS n FROM usuarios WHERE ultimo_acceso >= ?').get(semana) as { n: number }).n;
    const sinAula = (
      this.db.prepare("SELECT COUNT(*) AS n FROM usuarios u WHERE rol = 'estudiante' AND NOT EXISTS (SELECT 1 FROM aula_alumnos m WHERE m.alumno_id = u.id)").get() as { n: number }
    ).n;
    const intentosMisiones = (this.db.prepare('SELECT COUNT(*) AS n FROM resultados').get() as { n: number }).n;
    const actividad = Array.from({ length: 14 }, (_, i) => {
      const dia = diaLima(new Date(this.ahora().getTime() - (13 - i) * 86400000));
      return { dia, misiones: 0, academia: 0 };
    });
    for (const r of this.db.prepare('SELECT completado AS f FROM resultados').all() as { f: string }[]) {
      const d = actividad.find((a) => a.dia === diaLima(r.f));
      if (d) d.misiones++;
    }
    for (const r of this.db.prepare('SELECT fecha AS f FROM academia_intentos').all() as { f: string }[]) {
      const d = actividad.find((a) => a.dia === diaLima(r.f));
      if (d) d.academia++;
    }
    return {
      usuarios: { admin: cuenta('admin'), docente: cuenta('docente'), estudiante: cuenta('estudiante'), activosSemana: activos, sinAula },
      intentosMisiones,
      academia: this.academia.resumenGeneral(),
      actividad,
      aulas: this.aulas.todas(),
      proyectos: this.proyectos.contar(),
      misiones: INITIAL_MISSIONS.map((m) => ({
        id: m.id,
        numero: m.number,
        titulo: m.title,
        estado: (MISIONES_ACTIVAS as readonly string[]).includes(m.id) ? 'activa' : 'en_preparacion',
        resolvieron: (this.db.prepare('SELECT COUNT(DISTINCT usuario_id) AS n FROM resultados WHERE mision_id = ?').get(m.id) as { n: number }).n,
      })),
    };
  }
}
