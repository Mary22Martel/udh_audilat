import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Scale, Sparkles } from 'lucide-react';
import { ACADEMY_TOPICS } from '../data/academyData';
import { INITIAL_MISSIONS } from '../data/missionsData';
import { MISIONES_ACTIVAS, MISIONES_POR_TEMA } from '../lib/reglas';
import { AcademyTopic } from '../types/audit';

interface AcademyViewProps {
  /** Abre el caso donde se aplica el tema. */
  onPracticeMission: (missionId: string) => void;
  /** Tema que se abre primero (p. ej. desde «Temas a reforzar»). */
  initialTopicId?: string | null;
  /** Misiones que el alumno ya resolvió, para marcarlas. */
  completedMissionIds?: string[];
}

const CATEGORIES: ('Todas' | AcademyTopic['category'])[] = [
  'Todas',
  'Tributos e IGV',
  'Fiscalización SUNAT',
  'Sustento Documental',
  'Impuesto a la Renta',
];

export const AcademyView: React.FC<AcademyViewProps> = ({ onPracticeMission, initialTopicId, completedMissionIds = [] }) => {
  const [category, setCategory] = useState<'Todas' | AcademyTopic['category']>('Todas');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    ACADEMY_TOPICS.some((t) => t.id === initialTopicId) ? initialTopicId! : ACADEMY_TOPICS[0].id
  );
  useEffect(() => {
    if (initialTopicId && ACADEMY_TOPICS.some((t) => t.id === initialTopicId)) {
      setCategory('Todas');
      setSelectedTopicId(initialTopicId);
    }
  }, [initialTopicId]);
  const misionesDelTema = (id: string) =>
    (MISIONES_POR_TEMA[id] ?? [])
      .filter((mid) => (MISIONES_ACTIVAS as readonly string[]).includes(mid))
      .map((mid) => INITIAL_MISSIONS.find((m) => m.id === mid))
      .filter(Boolean) as typeof INITIAL_MISSIONS;

  const visibleTopics = ACADEMY_TOPICS.filter(
    (t) => category === 'Todas' || t.category === category
  );
  const currentTopic =
    visibleTopics.find((t) => t.id === selectedTopicId) || visibleTopics[0];

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--c-texto)]">
          Academia tributaria
        </h2>
        <p className="text-sm text-[var(--c-suave)] mt-1">
          La teoría que necesitas para cada caso. Cada ficha te dice en qué misión la vas a aplicar.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1 p-1 bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-lg w-fit overflow-x-auto max-w-full">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              category === cat
                ? 'bg-[var(--c-elevado)] text-[var(--c-teal)]'
                : 'text-[var(--c-suave)] hover:text-[var(--c-texto)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Split Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-2.5">
          {visibleTopics.map((topic) => {
            const active = topic.id === currentTopic?.id;
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  active
                    ? 'bg-[var(--c-elevado)] border-[var(--c-teal)]/60 text-[var(--c-texto)]'
                    : 'bg-[var(--c-panel)] border-[var(--c-linea)] hover:border-[var(--c-linea-fuerte)] text-[var(--c-suave)]'
                }`}
              >
                <p className="text-[11px] font-medium text-[var(--c-teal)]">{topic.category}</p>
                <h3 className="font-display text-sm font-bold text-[var(--c-texto)] mt-1">
                  {topic.title}
                </h3>
                <p className="text-[11px] text-[var(--c-suave)] mt-1.5 font-mono-tabular">
                  Se usa en: {misionesDelTema(topic.id).map((m) => m.number.replace(/misi[oó]n\s*/i, 'M')).join(' · ') || '—'}
                </p>
              </button>
            );
          })}
        </div>

        {currentTopic && (
          <div className="lg:col-span-8 bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-2xl shadow-tema p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--c-teal)] flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{currentTopic.category}</span>
              </p>
              <h3 className="font-display text-2xl font-bold text-[var(--c-texto)]">
                {currentTopic.title}
              </h3>
              <p className="text-xs font-mono-tabular text-[var(--c-oro)] flex items-center gap-1.5 pt-1">
                <Scale className="w-3.5 h-3.5" />
                <span>{currentTopic.legalBasis}</span>
              </p>
            </div>

            <p className="text-sm text-[var(--c-texto)]/90 leading-relaxed">{currentTopic.summary}</p>

            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--c-suave)]">
                Requisitos clave en auditoría
              </h4>
              <ul className="space-y-2 text-sm text-[var(--c-suave)]">
                {currentTopic.requirements.map((req) => (
                  <li key={req} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[var(--c-teal)] shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--c-oro)]">
                Caso Práctico Resuelto
              </h4>
              <p className="text-sm text-[var(--c-texto)]">{currentTopic.practicalExample.scenario}</p>
              <p className="text-sm text-[var(--c-teal)] leading-relaxed">
                Resolución: {currentTopic.practicalExample.resolution}
              </p>
            </div>

            <p className="text-xs text-[var(--c-suave)] flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[var(--c-oro)] shrink-0 mt-0.5" />
              <span>Consejo de campo: {currentTopic.auditTip}</span>
            </p>

            <div className="pt-4 border-t border-[var(--c-linea)] space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--c-suave)]">Aplícalo en estos casos</h4>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {misionesDelTema(currentTopic.id).map((m) => {
                  const hecha = completedMissionIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => onPracticeMission(m.id)}
                      className="group text-left p-3.5 rounded-xl border border-[var(--c-linea)] hover:border-[var(--c-teal)]/60 bg-[var(--c-fondo)] transition-colors flex items-center gap-3"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-[11px] font-mono-tabular text-[var(--c-teal)]">
                          {m.number} {hecha && <span className="text-[var(--c-oro)]">· resuelto</span>}
                        </span>
                        <span className="block text-sm font-semibold text-[var(--c-texto)] truncate">{m.title}</span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-[var(--c-suave)] group-hover:text-[var(--c-teal)] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
