/** Llamadas al servidor de AUDIT LAB. La sesión viaja en una cookie segura (HttpOnly). */
import type { Pregunta, Respuesta } from './preguntas';
import type { CompetenciaId } from './reglas';
import type { MissionRunResult } from '../types/audit';

export type Rol = 'admin' | 'docente' | 'estudiante';

export interface AulaCorta {
  id: string;
  nombre: string;
  docente: string;
  codigo: string;
}

export interface Perfil {
  id: string;
  rol: Rol;
  nombre: string;
  correo: string;
  codigo: string | null;
  aulas: AulaCorta[];
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

export type Intento = MissionRunResult & { id: string; fechaIso: string };
export type Competencias = Record<CompetenciaId, number | null>;

export interface EstadoAlumno {
  xp: number;
  xpMisiones: number;
  xpAcademia: number;
  aulas: AulaCorta[];
  nivel: { level: number; title: string; minXp: number; maxXp: number };
  siguienteNivel: { level: number; title: string; minXp: number; maxXp: number } | null;
  racha: number;
  completadas: string[];
  mejores: Record<string, { xp: number; precision: number; rango: 'S' | 'A' | 'B' | 'C' }>;
  precisionPromedio: number | null;
  intentos: number;
  resultados: Intento[];
  insignias: { id: string; fecha: string }[];
  competencias: Competencias;
  avisos: Aviso[];
}

export interface Registro {
  estado: EstadoAlumno;
  xpGanado: number;
  mejoraMarca: boolean;
  marcaAnterior: number | null;
  insigniasNuevas: string[];
}

export interface Clasificacion {
  tipo: 'misiones' | 'academia';
  aula: { id: string; nombre: string } | null;
  puestos: Puesto[];
}

export interface Puesto {
  puesto: number;
  id: string;
  nombre: string;
  codigo: string | null;
  xp: number;
  nivel: string;
  misiones: number;
  precision: number | null;
  esYo: boolean;
}

export class ErrorApi extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function llamar<T>(metodo: string, url: string, cuerpo?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, {
      method: metodo,
      credentials: 'same-origin',
      headers: cuerpo !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi('No hay conexión con el servidor. ¿Está corriendo «npm run dev»?', 0);
  }
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && url !== '/api/ingresar' && url !== '/api/yo') window.dispatchEvent(new Event('auditlab:sesion-vencida'));
    throw new ErrorApi((datos as { error?: string }).error ?? 'Ocurrió un error inesperado.', r.status);
  }
  return datos as T;
}

export const api = {
  get: <T>(url: string) => llamar<T>('GET', url),
  post: <T>(url: string, cuerpo: unknown = {}) => llamar<T>('POST', url, cuerpo),
  patch: <T>(url: string, cuerpo: unknown) => llamar<T>('PATCH', url, cuerpo),
  put: <T>(url: string, cuerpo: unknown) => llamar<T>('PUT', url, cuerpo),
  del: <T>(url: string) => llamar<T>('DELETE', url),
};

export const RUTA_INICIO: Record<Rol, string> = { estudiante: '/app', docente: '/docente', admin: '/admin' };
export const NOMBRE_ROL: Record<Rol, string> = { estudiante: 'Estudiante', docente: 'Docente', admin: 'Administrador' };

// --- Academia ---------------------------------------------------------------------------------------------------


export interface ProgresoAcademia {
  xp: number;
  precision: number | null;
  vidas: number;
  segundosContrarreloj: number;
  recordContrarreloj: number;
  observadas: number;
  lecciones: Record<string, { desbloqueada: boolean; completada: boolean; estrellas: number; mejorXp: number; intentos: number; preguntas: number; precision: number | null }>;
  modulos: Record<string, { precision: number | null }>;
}

export interface RespuestaEnviada {
  preguntaId: string;
  respuesta: Respuesta | null;
}

export interface ResultadoLeccion {
  aciertos: number;
  total: number;
  errores: number;
  completada: boolean;
  estrellas: number;
  xp: number;
  xpGanado: number;
  marcaAnterior: number | null;
  siguiente: string | null;
  detalle: { preguntaId: string; correcta: boolean }[];
  insigniasNuevas: string[];
}

export type PreguntaBanco = Pregunta & { respondida: number; acierto: number | null };

// --- Aulas y seguimiento ----------------------------------------------------------------------------------------

export interface AulaDocente {
  id: string;
  docenteId: string;
  docente: string;
  nombre: string;
  codigo: string;
  archivada: boolean;
  creado: string;
  alumnos: number;
}

export interface AlumnoSeguimiento {
  id: string;
  nombre: string;
  correo: string;
  codigo: string | null;
  activo: boolean;
  ultimoAcceso: string | null;
  xp: number;
  lecciones: number;
  totalLecciones: number;
  estrellas: number;
  precision: number | null;
  modulos: Record<string, number | null>;
  misiones: { xp: number; casos: number };
  ultimaActividad: string | null;
}

export interface SeguimientoAula {
  aula: AulaDocente;
  alumnos: AlumnoSeguimiento[];
  dominio: { moduloId: string; titulo: string; numero: number; precision: number | null; respuestas: number; completaron: number }[];
  masFalladas: { id: string; enunciado: string; tipo: string; leccionId: string; respuestas: number; acierto: number }[];
  actividad: { dia: string; intentos: number }[];
  totalLecciones: number;
  precision: number | null;
  leccionesPromedio: number;
  proyectos: ResumenProyecto[];
}

export interface DetalleAlumno {
  alumno: { id: string; nombre: string; correo: string; codigo: string | null; ultimoAcceso: string | null; creado: string; aulas: AulaCorta[] };
  xp: number;
  nivel: { level: number; title: string };
  racha: number;
  insignias: { id: string; fecha: string }[];
  academia: {
    progreso: ProgresoAcademia;
    intentos: { modo: string; leccionId: string | null; aciertos: number; total: number; estrellas: number; xp: number; completada: number; fecha: string }[];
    observadas: { id: string; enunciado: string; leccionId: string }[];
  };
  misiones: { xp: number; casos: number; intentos: number; precision: number | null; ultima: string | null; mejores: Record<string, { xp: number; precision: number; rango: string }> };
}

// --- Proyectos por equipos --------------------------------------------------------------------------------------

export type EstadoProyecto = 'preparacion' | 'sala' | 'en_curso' | 'finalizado';

export interface ResumenProyecto {
  id: string;
  nombre: string;
  descripcion: string;
  aulaId: string;
  aula: string;
  docente: string;
  duracionMin: number;
  estado: EstadoProyecto;
  inicio: string | null;
  fin: string | null;
  creado: string;
  preguntas: number;
  equipos: number;
  entregas: number;
  ganador: string | null;
  miEquipo?: { id: string; nombre: string; color: string } | null;
}

export interface EquipoTablero {
  id: string;
  nombre: string;
  color: string;
  miembros: { id: string; nombre: string }[];
  entregado: boolean;
  aciertos: number;
  total: number;
  segundos: number | null;
  enviadoPor: string | null;
  puesto: number;
}

export type Tablero = ResumenProyecto & { ahora: string; equipos: EquipoTablero[]; miEquipoId: string | null };

export type ProyectoAlumno = Tablero & {
  miEquipo: { id: string; nombre: string; color: string; miembros: { id: string; nombre: string }[] } | null;
  preguntasJuego: Pregunta[];
  entrega: { aciertos: number; total: number; segundos: number; enviadoPor: string; detalle: { preguntaId: string; correcta: boolean }[] | null; respuestas: RespuestaEnviada[] | null } | null;
};

export type DetalleProyectoDocente = ResumenProyecto & {
  preguntaIds: string[];
  listaEquipos: { id: string; nombre: string; color: string; miembros: { id: string; nombre: string }[] }[];
  preguntasCompletas: Pregunta[];
};

// --- Administración ---------------------------------------------------------------------------------------------

export interface UsuarioAdmin {
  id: string;
  rol: Rol;
  nombre: string;
  correo: string;
  codigo: string | null;
  activo: boolean;
  creado: string;
  ultimoAcceso: string | null;
  aulas?: string[];
  aulasDocente?: number;
  alumnos?: number;
  xp?: number;
  misiones?: number;
  lecciones?: number;
}

export interface ResumenAdmin {
  usuarios: { admin: number; docente: number; estudiante: number; activosSemana: number; sinAula: number };
  intentosMisiones: number;
  academia: { intentos: number; respuestas: number; precision: number | null; preguntas: number; preguntasDocentes: number };
  actividad: { dia: string; misiones: number; academia: number }[];
  aulas: AulaDocente[];
  proyectos: { total: number; finalizados: number };
  misiones: { id: string; numero: string; titulo: string; estado: 'activa' | 'en_preparacion'; resolvieron: number }[];
}

/** Segundos como 05:32. */
export const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
