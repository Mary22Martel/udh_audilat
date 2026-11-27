/**
 * Reglas del simulador compartidas por el servidor y la interfaz.
 * Si cambias algo aquí, cambia en los dos lados a la vez.
 */
import type { Mission, MissionRunResult } from '../types/audit';

/** Misiones con caso completo. Las demás aparecen como «En preparación». */
export const MISIONES_ACTIVAS = ['mision-01', 'mision-02', 'mision-03', 'mision-04', 'mision-05'] as const;

// ---------------------------------------------------------------------------------------------------------------
// Competencias: lo que el alumno practica en cada fase de la sala de auditoría.
// ---------------------------------------------------------------------------------------------------------------

export type CompetenciaId = 'deteccion' | 'cruce' | 'clasificacion' | 'cadena' | 'decisiones' | 'expediente';

export const COMPETENCIAS: { id: CompetenciaId; nombre: string; fase: string; descripcion: string }[] = [
  { id: 'deteccion', nombre: 'Detección de anomalías', fase: 'Inspeccionar', descripcion: 'Encuentra los datos irregulares en los comprobantes.' },
  { id: 'cruce', nombre: 'Cruce documental', fase: 'Cruzar', descripcion: 'Compara comprobantes, registros y declaraciones.' },
  { id: 'clasificacion', nombre: 'Clasificación de evidencia', fase: 'Clasificar', descripcion: 'Ordena cada documento según su función probatoria.' },
  { id: 'cadena', nombre: 'Cadena probatoria', fase: 'Tablero', descripcion: 'Detecta dónde se rompe la trazabilidad de la operación.' },
  { id: 'decisiones', nombre: 'Criterio tributario', fase: 'Decidir', descripcion: 'Elige la respuesta correcta frente a SUNAT y la gerencia.' },
  { id: 'expediente', nombre: 'Armado del expediente', fase: 'Presentar', descripcion: 'Selecciona solo los sustentos válidos.' },
];

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null);

/** Porcentaje logrado en cada competencia dentro de un intento (null si la misión no la evalúa). */
export function competenciasDeResultado(r: MissionRunResult): Record<CompetenciaId, number | null> {
  return {
    deteccion: pct(r.anomaliesFound, r.anomaliesTotal),
    cruce: pct(r.comparisonsSolved, r.comparisonsTotal),
    clasificacion: pct(r.classificationsCorrect, r.classificationsTotal),
    cadena: pct(r.brokenLinksFlagged, r.brokenLinksTotal),
    decisiones: pct(r.decisionsOptimal, r.decisionsTotal),
    expediente: Math.round(r.dossierScorePercent),
  };
}

/** Promedio de cada competencia sobre varios intentos. */
export function promedioCompetencias(resultados: MissionRunResult[]): Record<CompetenciaId, number | null> {
  const suma = {} as Record<CompetenciaId, { t: number; n: number }>;
  for (const c of COMPETENCIAS) suma[c.id] = { t: 0, n: 0 };
  for (const r of resultados) {
    const v = competenciasDeResultado(r);
    for (const c of COMPETENCIAS) {
      const x = v[c.id];
      if (x !== null) {
        suma[c.id].t += x;
        suma[c.id].n += 1;
      }
    }
  }
  const out = {} as Record<CompetenciaId, number | null>;
  for (const c of COMPETENCIAS) out[c.id] = suma[c.id].n ? Math.round(suma[c.id].t / suma[c.id].n) : null;
  return out;
}

/** Fichas de la Academia que conviene repasar cuando una competencia sale baja. */
export const REPASO_POR_COMPETENCIA: Record<CompetenciaId, string[]> = {
  deteccion: ['credito-fiscal', 'fehaciencia'],
  cruce: ['notas-credito', 'credito-fiscal'],
  clasificacion: ['bancarizacion', 'fehaciencia'],
  cadena: ['bancarizacion', 'fehaciencia'],
  decisiones: ['fiscalizacion-tipos', 'causalidad-renta'],
  expediente: ['bancarizacion', 'credito-fiscal'],
};

/** En qué misiones se aplica cada ficha de la Academia. */
export const MISIONES_POR_TEMA: Record<string, string[]> = {
  'credito-fiscal': ['mision-01', 'mision-05'],
  bancarizacion: ['mision-01', 'mision-02'],
  'notas-credito': ['mision-01'],
  fehaciencia: ['mision-02', 'mision-03'],
  'fiscalizacion-tipos': ['mision-02', 'mision-05'],
  'causalidad-renta': ['mision-04'],
};

export const UMBRAL_REFORZAR = 60;

// ---------------------------------------------------------------------------------------------------------------
// Insignias: se calculan siempre a partir de los intentos guardados.
// ---------------------------------------------------------------------------------------------------------------

export const REGLAS_INSIGNIAS: { id: string; cumple: (r: MissionRunResult) => boolean }[] = [
  { id: 'badge-detective', cumple: (r) => r.anomaliesFound >= 3 },
  { id: 'badge-igv', cumple: (r) => r.missionId === 'mision-01' && r.accuracyPercent >= 75 },
  { id: 'badge-dossier', cumple: (r) => r.dossierScorePercent === 100 },
  { id: 'badge-inventarios', cumple: (r) => r.missionId === 'mision-03' && r.accuracyPercent >= 70 },
  { id: 'badge-estratega', cumple: (r) => r.decisionsTotal > 0 && r.decisionsOptimal === r.decisionsTotal },
];

// ---------------------------------------------------------------------------------------------------------------
// XP: cuenta el mejor intento de cada misión. Repetir una misión solo suma si mejoras tu marca.
// ---------------------------------------------------------------------------------------------------------------

export function mejorPorMision(resultados: MissionRunResult[]): Map<string, MissionRunResult> {
  const mejor = new Map<string, MissionRunResult>();
  for (const r of resultados) {
    const prev = mejor.get(r.missionId);
    if (!prev || r.xpEarned > prev.xpEarned) mejor.set(r.missionId, r);
  }
  return mejor;
}

export function xpTotal(resultados: MissionRunResult[]): number {
  let t = 0;
  for (const r of mejorPorMision(resultados).values()) t += r.xpEarned;
  return t;
}

/** Días seguidos con al menos un intento, contando hasta hoy o ayer (hora de Lima). */
export function rachaDias(fechasIso: string[], hoy = new Date()): number {
  const dia = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const dias = new Set(fechasIso.map((f) => dia(new Date(f))));
  let racha = 0;
  const cursor = new Date(hoy);
  if (!dias.has(dia(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dias.has(dia(cursor))) {
    racha += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

/** Combo máximo de la sala de auditoría (x2.5) y bonos fijos por fase. */
export const COMBO_MAXIMO = 2.5;
export const XP_CLASIFICACION = 80;
export const XP_RUPTURA = 60;

/**
 * XP más alto que se puede ganar en una misión jugándola perfecto: todo con combo máximo,
 * más la recompensa base y el bono del escudo fiscal al 100 %. El servidor rechaza lo que pase de aquí.
 */
export function xpMaximo(m: Mission): number {
  const aciertos =
    m.documents.reduce((s, d) => s + d.inspectableFields.filter((f) => f.isAnomaly).reduce((t, f) => t + f.xpReward, 0), 0) +
    m.comparisonPairs.reduce((s, c) => s + c.xpReward, 0) +
    XP_CLASIFICACION +
    m.evidenceConnections.filter((c) => c.isBroken).length * XP_RUPTURA +
    m.decisions.reduce((s, d) => s + Math.max(0, ...d.options.filter((o) => o.isOptimal).map((o) => o.xpDelta)), 0);
  return Math.ceil(m.xpReward + aciertos * COMBO_MAXIMO + 80);
}
