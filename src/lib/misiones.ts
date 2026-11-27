import { INITIAL_BADGES, INITIAL_NOTIFICATIONS } from '../data/academyData';
import { INITIAL_MISSIONS } from '../data/missionsData';
import type { BadgeItem, Mission, StudentProfile } from '../types/audit';
import type { EstadoAlumno, Perfil } from './api';
import { MISIONES_ACTIVAS } from './reglas';

/** Las misiones con el estado de este alumno: completada, disponible o en preparación. */
/** Misiones que ve el alumno: solo las activas (las que siguen en preparación no se muestran por ahora). */
export function misionesDelAlumno(estado: EstadoAlumno | null): Mission[] {
  const hechas = new Set(estado?.completadas ?? []);
  return INITIAL_MISSIONS.filter((m) => (MISIONES_ACTIVAS as readonly string[]).includes(m.id)).map((m) => ({
    ...m,
    status: hechas.has(m.id) ? 'completado' : 'disponible',
  }));
}

/**
 * La siguiente misión recomendada: la primera que aún no resolvió.
 * Si ya resolvió todas, la de menor precisión, para que mejore su marca.
 */
export function siguienteMision(misiones: Mission[], estado?: EstadoAlumno): Mission | undefined {
  const pendiente = misiones.find((m) => m.status === 'disponible');
  if (pendiente) return pendiente;
  const hechas = misiones.filter((m) => m.status === 'completado');
  return [...hechas].sort((a, b) => (estado?.mejores[a.id]?.precision ?? 0) - (estado?.mejores[b.id]?.precision ?? 0))[0];
}

/** Comunicaciones (esquela de SUNAT, mensaje de gerencia…) con las que empieza cada caso. */
export function comunicacionesDe(misionId: string) {
  return INITIAL_NOTIFICATIONS.filter((n) => n.missionId === misionId);
}

export function insigniasDelAlumno(estado: EstadoAlumno | null): BadgeItem[] {
  const ganadas = new Map((estado?.insignias ?? []).map((i) => [i.id, i.fecha]));
  return INITIAL_BADGES.map((b) => {
    const fecha = ganadas.get(b.id);
    return {
      ...b,
      unlocked: !!fecha,
      unlockedAt: fecha ? new Date(fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) : undefined,
    };
  });
}

/** Perfil en el formato que usan las pantallas de la sala y los resultados. */
export function perfilAlumno(usuario: Perfil, estado: EstadoAlumno | null): StudentProfile {
  return {
    name: usuario.nombre,
    code: usuario.codigo ?? '',
    faculty: 'Escuela Profesional de Contabilidad – UDH',
    semester: usuario.aulas[0] ? usuario.aulas[0].nombre : '',
    xp: estado?.xp ?? 0,
    streakDays: estado?.racha ?? 0,
    completedMissionsCount: estado?.completadas.length ?? 0,
    casesReviewedCount: estado?.intentos ?? 0,
  };
}
