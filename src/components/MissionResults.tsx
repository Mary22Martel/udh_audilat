import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  FileCheck2,
  Flame,
  Shield,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { getLevelForXp } from '../data/academyData';
import { Mission, MissionRunResult, StudentProfile } from '../types/audit';

interface MissionResultsProps {
  mission: Mission;
  result: MissionRunResult;
  student: StudentProfile;
  onReturnToOperations: () => void;
  onReplayMission: () => void;
  /** Lo que el servidor registró: cuánto XP sumó de verdad este intento. */
  registro?: { xpGanado: number; mejoraMarca: boolean; marcaAnterior: number | null } | null;
  /** Texto del botón para volver (el docente vuelve a su panel). */
  returnLabel?: string;
}

const RANK_LABELS: Record<MissionRunResult['rankGrade'], { title: string; color: string; border: string }> = {
  S: { title: 'Auditor Impecable', color: 'text-[var(--c-oro)]', border: 'border-[var(--c-oro)]' },
  A: { title: 'Defensa Sólida', color: 'text-[var(--c-teal)]', border: 'border-[var(--c-teal)]' },
  B: { title: 'Desempeño Competente', color: 'text-[var(--c-texto)]', border: 'border-[var(--c-linea-fuerte)]' },
  C: { title: 'Requiere Refuerzo', color: 'text-rose-400', border: 'border-rose-400/60' },
};

export const MissionResults: React.FC<MissionResultsProps> = ({
  mission,
  result,
  student,
  onReturnToOperations,
  onReplayMission,
  registro,
  returnLabel,
}) => {
  const [showDossierModal, setShowDossierModal] = useState(false);
  const currentLevel = getLevelForXp(student.xp);
  const mins = Math.floor(result.durationSeconds / 60);
  const secs = result.durationSeconds % 60;
  const rankMeta = RANK_LABELS[result.rankGrade];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Celebratory Rank & XP Banner */}
      <motion.section
        initial={{ opacity: 0, scale: 0.97, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[var(--c-panel)] border border-[var(--c-teal)]/40 rounded-xl p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Rank Grade Seal */}
            <motion.div
              initial={{ scale: 1.5, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className={`w-20 h-20 rounded-2xl bg-[var(--c-fondo)] border-2 ${rankMeta.border} flex flex-col items-center justify-center shrink-0 shadow-xl`}
            >
              <span className="text-[10px] uppercase tracking-wider text-[var(--c-suave)]">Rango</span>
              <span className={`font-display text-4xl font-extrabold ${rankMeta.color}`}>
                {result.rankGrade}
              </span>
            </motion.div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--c-teal)]">
                <ShieldCheck className="w-4 h-4" />
                <span>Misión Completada · {mission.dossierCode}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--c-texto)]">
                {mission.title}
              </h2>
              <p className="text-sm text-[var(--c-suave)]">
                Evaluación: <strong className={rankMeta.color}>{rankMeta.title}</strong> · {mission.companyName}
              </p>
            </div>
          </div>

          <div className="bg-[var(--c-fondo)] border border-[var(--c-oro)]/40 rounded-xl px-6 py-4 text-center shrink-0">
            <p className="text-[11px] uppercase tracking-wider text-[var(--c-suave)]">
              {registro ? 'XP sumado a tu total' : 'Puntaje del intento'}
            </p>
            <p className="font-display text-3xl font-extrabold text-[var(--c-oro)] font-mono-tabular mt-1">
              +{registro ? registro.xpGanado : result.xpEarned} XP
            </p>
            {registro && registro.marcaAnterior !== null && (
              <p className="text-[11px] text-[var(--c-suave)] mt-1 max-w-[220px]">
                {registro.mejoraMarca
                  ? `¡Nueva marca! Antes tenías ${registro.marcaAnterior} XP en este caso.`
                  : `Intento de ${result.xpEarned} XP. Tu marca sigue en ${registro.marcaAnterior} XP; solo suma si la superas.`}
              </p>
            )}
            <p className="text-xs text-[var(--c-teal)] mt-1">Rango: {currentLevel.title}</p>
          </div>
        </div>

        {/* 5 Game Telemetry Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-[var(--c-linea)]">
          <div className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-lg p-3.5">
            <p className="text-xs text-[var(--c-suave)]">Precisión</p>
            <p className="font-display text-2xl font-bold text-[var(--c-teal)] font-mono-tabular mt-1">
              {result.accuracyPercent}%
            </p>
          </div>
          <div className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-lg p-3.5">
            <p className="text-xs text-[var(--c-suave)]">Escudo Fiscal</p>
            <p className="font-display text-2xl font-bold text-[var(--c-texto)] font-mono-tabular mt-1 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[var(--c-teal)]" />
              <span>{result.integrityRemaining}%</span>
            </p>
          </div>
          <div className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-lg p-3.5">
            <p className="text-xs text-[var(--c-suave)]">Combo Máximo</p>
            <p className="font-display text-2xl font-bold text-[var(--c-oro)] font-mono-tabular mt-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[var(--c-oro)]" />
              <span>x{result.maxCombo}</span>
            </p>
          </div>
          <div className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-lg p-3.5">
            <p className="text-xs text-[var(--c-suave)]">Hallazgos</p>
            <p className="font-display text-2xl font-bold text-[var(--c-texto)] font-mono-tabular mt-1">
              {result.anomaliesFound}/{result.anomaliesTotal}
            </p>
          </div>
          <div className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-lg p-3.5 col-span-2 sm:col-span-1">
            <p className="text-xs text-[var(--c-suave)]">Tiempo</p>
            <p className="font-display text-2xl font-bold text-[var(--c-texto)] font-mono-tabular mt-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[var(--c-suave)]" />
              <span>
                {mins}m {secs.toString().padStart(2, '0')}s
              </span>
            </p>
          </div>
        </div>

        {/* Newly Unlocked Badges */}
        {result.newlyUnlockedBadges.length > 0 && (
          <div className="bg-[var(--c-fondo)] border border-[var(--c-oro)]/40 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-[var(--c-oro)] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[var(--c-oro)]">
                  Insignias desbloqueadas en esta misión
                </p>
                <p className="text-sm font-medium text-[var(--c-texto)]">
                  {result.newlyUnlockedBadges.join(' · ')}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.section>

      {/* Learning Report & Decision Review */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl p-6 space-y-5">
          <h3 className="font-display text-lg font-bold text-[var(--c-texto)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--c-teal)]" />
            <span>Informe de Aprendizaje</span>
          </h3>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--c-teal)]">
              Lo que resolviste con solidez
            </h4>
            {result.strengths.length > 0 ? (
              <ul className="space-y-2 text-xs text-[var(--c-texto)]">
                {result.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--c-teal)] shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--c-suave)]">
                Completaste el flujo de auditoría. Revisa las observaciones para elevar tu rango.
              </p>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-[var(--c-linea)]">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--c-oro)]">
              Oportunidades de mejora
            </h4>
            {result.improvements.length > 0 ? (
              <ul className="space-y-2 text-xs text-[var(--c-suave)]">
                {result.improvements.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-[var(--c-oro)] shrink-0 mt-0.5" />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--c-teal)]">
                Desempeño sobresaliente sin observaciones pendientes.
              </p>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t border-[var(--c-linea)]">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--c-suave)]">
              Competencias desarrolladas
            </h4>
            <ul className="space-y-1.5 text-xs text-[var(--c-texto)]">
              {result.developedCompetencies.map((comp) => (
                <li key={comp}>· {comp}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-6 bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold text-[var(--c-texto)]">
            Evaluación de Decisiones ({result.decisionsOptimal}/{result.decisionsTotal} óptimas)
          </h3>
          <div className="space-y-3">
            {result.decisionSummaries.map((dec, idx) => (
              <div
                key={idx}
                className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-lg p-4 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--c-texto)]">{dec.title}</span>
                  <span className={dec.isOptimal ? 'text-[var(--c-teal)] font-medium' : 'text-[var(--c-oro)] font-medium'}>
                    {dec.isOptimal ? 'Óptima' : 'Con riesgo'}
                  </span>
                </div>
                <p className="text-[var(--c-texto)]/90">Elección: {dec.chosenOption}</p>
                <p className="text-[var(--c-suave)] leading-relaxed">{dec.consequence}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <button
          onClick={() => setShowDossierModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--c-panel)] hover:bg-[var(--c-elevado)] border border-[var(--c-linea)] text-xs font-medium text-[var(--c-texto)] transition-colors"
        >
          <FileCheck2 className="w-4 h-4 text-[var(--c-teal)]" />
          <span>Consultar expediente final</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onReplayMission}
            className="px-4 py-2.5 rounded-lg bg-[var(--c-panel)] hover:bg-[var(--c-elevado)] border border-[var(--c-linea)] text-xs font-medium text-[var(--c-texto)] transition-colors"
          >
            Reintentar por Rango S
          </button>
          <button
            onClick={onReturnToOperations}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--c-teal)] hover:bg-[var(--c-teal-hover)] text-[var(--c-sobre)] text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{returnLabel ?? 'Volver a mis casos'}</span>
          </button>
        </div>
      </div>

      {showDossierModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[var(--c-texto)]">
                Resumen del Expediente Final · {mission.dossierCode}
              </h3>
              <button
                onClick={() => setShowDossierModal(false)}
                className="text-xs text-[var(--c-suave)] hover:text-[var(--c-texto)]"
              >
                Cerrar
              </button>
            </div>
            <p className="text-xs text-[var(--c-suave)]">
              Puntaje de conformación documental:{' '}
              <strong className="text-[var(--c-teal)]">{result.dossierScorePercent}%</strong>.
            </p>
            <div className="divide-y divide-[var(--c-linea)] text-xs">
              {mission.documents.map((doc) => {
                const included = result.selectedDossierDocIds.includes(doc.id);
                return (
                  <div key={doc.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-[var(--c-texto)]">
                        <span className="font-mono-tabular text-[var(--c-teal)] mr-2">{doc.code}</span>
                        {doc.title}
                      </p>
                      {doc.dossierNote && (
                        <p className="text-[var(--c-suave)] mt-0.5">{doc.dossierNote}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={included ? 'text-[var(--c-teal)] font-medium' : 'text-[var(--c-suave)]'}>
                        {included ? 'Adjuntado' : 'Excluido'}
                      </p>
                      <p className="text-[11px] text-[var(--c-suave)]">
                        {doc.isRequiredForDossier ? 'Sustento requerido' : 'No válido como sustento'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
