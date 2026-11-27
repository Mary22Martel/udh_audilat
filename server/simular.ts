/**
 * Genera intentos de misión con la misma fórmula que la sala de auditoría.
 * Solo se usa para cargar datos de prueba (npm run datos-demo) y en las pruebas automáticas.
 */
import { INITIAL_MISSIONS } from '../src/data/missionsData';
import type { Pregunta, Respuesta } from '../src/lib/preguntas';
import type { MissionRunResult } from '../src/types/audit';

/** habilidad: 0 (muy flojo) a 1 (perfecto). azar: función que devuelve [0, 1). */
export function simularIntento(misionId: string, habilidad: number, azar: () => number = Math.random): MissionRunResult {
  const m = INITIAL_MISSIONS.find((x) => x.id === misionId);
  if (!m) throw new Error(`Misión desconocida: ${misionId}`);
  const tira = (total: number, h: number) => {
    let n = 0;
    for (let i = 0; i < total; i++) if (azar() < h) n++;
    return n;
  };
  const anomalias = m.documents.flatMap((d) => d.inspectableFields).filter((f) => f.isAnomaly).length;
  const rupturas = m.evidenceConnections.filter((c) => c.isBroken).length;
  const requeridos = m.documents.filter((d) => d.isRequiredForDossier).length;

  const anomaliesFound = tira(anomalias, habilidad);
  const comparisonsSolved = tira(m.comparisonPairs.length, habilidad);
  const classificationsCorrect = tira(m.documents.length, Math.min(1, habilidad + 0.1));
  const brokenLinksFlagged = tira(rupturas, habilidad - 0.05);
  const decisionsOptimal = tira(m.decisions.length, habilidad - 0.1);
  const reqOk = tira(requeridos, habilidad);
  const invalidos = azar() > habilidad ? 1 : 0;
  const dossierScorePercent = Math.max(0, Math.round(((reqOk - invalidos * 0.5) / Math.max(1, requeridos)) * 100));

  const comp = [
    anomalias ? anomaliesFound / anomalias : 1,
    m.comparisonPairs.length ? comparisonsSolved / m.comparisonPairs.length : 1,
    m.decisions.length ? decisionsOptimal / m.decisions.length : 1,
    dossierScorePercent / 100,
  ];
  const accuracyPercent = Math.min(100, Math.max(25, Math.round((comp.reduce((a, b) => a + b, 0) / comp.length) * 100)));
  const integrity = Math.max(0, Math.round(100 - (1 - habilidad) * 90 - azar() * 10));
  const xpEarned = Math.max(140, Math.round(m.xpReward * (accuracyPercent / 100)) + Math.round(habilidad * 220) + Math.round(integrity * 0.8));
  const rankGrade: MissionRunResult['rankGrade'] =
    accuracyPercent >= 90 && integrity >= 85 ? 'S' : accuracyPercent >= 75 ? 'A' : accuracyPercent >= 55 ? 'B' : 'C';

  const improvements: string[] = [];
  const strengths: string[] = [];
  if (anomaliesFound < anomalias) improvements.push(`Quedaron ${anomalias - anomaliesFound} campos observados sin sellar.`);
  else strengths.push('Identificaste el 100% de las inconsistencias documentales del expediente.');
  if (decisionsOptimal < m.decisions.length) improvements.push('Refuerza la subsanación voluntaria frente a errores u omisiones tributarias.');
  else strengths.push('Mantuviste el Escudo Fiscal sólido aplicando criterio normativo y gradualidad.');
  if (dossierScorePercent < 80) improvements.push('Evita incluir comprobantes sin bancarización como crédito fiscal válido.');
  else strengths.push('Conformaste un expediente de respuesta coherente con sustentos válidos.');

  return {
    missionId: m.id,
    completedAt: new Date().toLocaleDateString('es-PE'),
    durationSeconds: Math.round(600 + azar() * 900),
    xpEarned,
    accuracyPercent,
    anomaliesFound,
    anomaliesTotal: anomalias,
    comparisonsSolved,
    comparisonsTotal: m.comparisonPairs.length,
    classificationsCorrect,
    classificationsTotal: m.documents.length,
    brokenLinksFlagged,
    brokenLinksTotal: rupturas,
    decisionsOptimal,
    decisionsTotal: m.decisions.length,
    dossierScorePercent,
    errorsCount: Math.round((1 - habilidad) * 8),
    strengths,
    improvements,
    developedCompetencies: m.competencies,
    newlyUnlockedBadges: [],
    selectedDossierDocIds: [],
    rankGrade,
    integrityRemaining: integrity,
    maxCombo: Math.round(habilidad * 6),
    decisionSummaries: m.decisions.map((d, i) => {
      const ok = i < decisionsOptimal;
      const opt = d.options.find((o) => o.isOptimal === ok) ?? d.options[0];
      return { title: d.contextTitle, chosenOption: opt.text, isOptimal: opt.isOptimal, consequence: opt.consequence };
    }),
  };
}

// --- Respuestas simuladas para la Academia y los proyectos -----------------------------------------------------


/** La respuesta correcta de una pregunta. */
export function respuestaCorrecta(p: Pregunta): Respuesta {
  switch (p.tipo) {
    case 'opcion':
      return { tipo: 'opcion', indice: p.correcta };
    case 'vf':
      return { tipo: 'vf', valor: p.correcta };
    case 'calculo':
      return { tipo: 'calculo', valor: p.respuesta };
    case 'clasificar':
      return { tipo: 'clasificar', grupos: p.items.map((i) => i.grupo) };
    case 'asiento':
      return { tipo: 'asiento', lineas: p.lineas };
    case 'documento':
      return { tipo: 'documento', marcados: p.errores };
    case 'ordenar':
      return { tipo: 'ordenar', orden: p.pasos };
  }
}

/** Una respuesta equivocada (para simular alumnos que se confunden). */
export function respuestaIncorrecta(p: Pregunta): Respuesta {
  switch (p.tipo) {
    case 'opcion':
      return { tipo: 'opcion', indice: (p.correcta + 1) % p.opciones.length };
    case 'vf':
      return { tipo: 'vf', valor: !p.correcta };
    case 'calculo':
      return { tipo: 'calculo', valor: p.respuesta * 1.16 + 1 };
    case 'clasificar':
      return { tipo: 'clasificar', grupos: p.items.map((i, k) => (k === 0 ? (i.grupo + 1) % p.grupos.length : i.grupo)) };
    case 'asiento':
      return { tipo: 'asiento', lineas: p.lineas.map((l, k) => (k === 0 ? { codigo: l.codigo, debe: l.haber, haber: l.debe } : l)) };
    case 'documento':
      return { tipo: 'documento', marcados: ['fecha'] };
    case 'ordenar':
      return { tipo: 'ordenar', orden: [...p.pasos].reverse() };
  }
}
