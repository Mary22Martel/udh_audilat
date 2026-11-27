import React, { type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Building2, CheckSquare, Clock, FileText, Shield } from 'lucide-react';
import { Mission } from '../types/audit';
import { ResilientImage } from './ResilientImage';

interface MissionDetailProps {
  mission: Mission;
  onBack: () => void;
  onStartAudit: (missionId: string) => void;
  /** Texto del enlace para volver (cambia según quién mira el caso). */
  backLabel?: string;
  startLabel?: string;
  /** Contenido extra bajo la portada: esquela de SUNAT, mejor intento, temas de la Academia… */
  extra?: ReactNode;
}

export const MissionDetail: React.FC<MissionDetailProps> = ({
  mission,
  onBack,
  onStartAudit,
  backLabel = 'Volver a mis casos',
  startLabel = 'Iniciar sala de auditoría',
  extra,
}) => {
  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-8 py-8 space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-medium text-[var(--c-suave)] hover:text-[var(--c-texto)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{backLabel}</span>
      </button>

      {/* Briefing Hero */}
      <div className="bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-2xl shadow-tema overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-5 min-h-[240px]">
          <ResilientImage
            src={mission.heroImage}
            alt={mission.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--c-suave)] font-mono-tabular">
              <span className="text-[var(--c-teal)] font-semibold">{mission.number}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[var(--c-oro)]">{mission.dossierCode}</span>
              <span aria-hidden="true">·</span>
              <span>{mission.difficulty}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {mission.estimatedMinutes} min
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--c-texto)]">
              {mission.title}
            </h2>
            <p className="text-sm text-[var(--c-suave)] leading-relaxed">{mission.situation}</p>
          </div>

          <div className="pt-4 border-t border-[var(--c-linea)] flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-[var(--c-suave)]">
              Recompensa estimada:{' '}
              <span className="font-mono-tabular text-[var(--c-oro)] font-bold">
                +{mission.xpReward} XP
              </span>{' '}
              · Plazo simulado: {mission.deadlineDaysLeft} días hábiles
            </div>
            <button
              onClick={() => onStartAudit(mission.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--c-teal)] hover:bg-[var(--c-teal-hover)] text-[var(--c-sobre)] text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <span>{startLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {extra}

      {/* Case Metadata & Objectives */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-2xl shadow-tema p-6 space-y-5">
          <h3 className="font-display text-base font-semibold text-[var(--c-texto)] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--c-teal)]" />
            <span>Ficha del Contribuyente (Ficticio)</span>
          </h3>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 py-2 border-b border-[var(--c-linea)]">
              <dt className="text-[var(--c-suave)]">Razón Social</dt>
              <dd className="text-[var(--c-texto)] font-medium text-right">{mission.companyName}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2 border-b border-[var(--c-linea)]">
              <dt className="text-[var(--c-suave)]">RUC Simulado</dt>
              <dd className="text-[var(--c-texto)] font-mono-tabular">{mission.companyRuc}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2 border-b border-[var(--c-linea)]">
              <dt className="text-[var(--c-suave)]">Actividad</dt>
              <dd className="text-[var(--c-texto)] text-right max-w-[240px]">{mission.economicActivity}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2 border-b border-[var(--c-linea)]">
              <dt className="text-[var(--c-suave)]">Procedimiento</dt>
              <dd className="text-[var(--c-oro)] text-right font-medium">{mission.procedureType}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2 border-b border-[var(--c-linea)]">
              <dt className="text-[var(--c-suave)]">Tributo</dt>
              <dd className="text-[var(--c-texto)] text-right">{mission.taxInvestigated}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-[var(--c-suave)]">Período</dt>
              <dd className="text-[var(--c-texto)] font-mono-tabular">{mission.taxPeriod}</dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-2xl shadow-tema p-6 space-y-3">
            <h3 className="font-display text-base font-semibold text-[var(--c-texto)] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--c-teal)]" />
              <span>Objetivo de la Auditoría</span>
            </h3>
            <p className="text-sm text-[var(--c-suave)] leading-relaxed">{mission.objective}</p>

            <div className="pt-3 border-t border-[var(--c-linea)]">
              <h4 className="text-xs font-semibold text-[var(--c-texto)] mb-2">
                Competencias que entrenarás
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--c-suave)]">
                {mission.competencies.map((comp) => (
                  <li key={comp} className="flex items-start gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-[var(--c-teal)] shrink-0 mt-0.5" />
                    <span>{comp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-2xl shadow-tema p-6 space-y-3">
            <h3 className="font-display text-base font-semibold text-[var(--c-texto)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--c-oro)]" />
              <span>Documentación incluida en el expediente ({mission.documents.length})</span>
            </h3>
            <div className="divide-y divide-[var(--c-linea)]">
              {mission.documents.map((doc) => (
                <div key={doc.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-mono-tabular text-[var(--c-teal)] mr-2">{doc.code}</span>
                    <span className="text-[var(--c-texto)] font-medium">{doc.title}</span>
                  </div>
                  <span className="text-[var(--c-suave)] shrink-0">{doc.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
