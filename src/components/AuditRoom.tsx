import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Columns2,
  Eye,
  FileCheck2,
  FileSearch,
  Flame,
  FolderKanban,
  GitBranch,
  HelpCircle,
  Lightbulb,
  Send,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ACADEMY_TOPICS } from '../data/academyData';
import {
  AcademyTopic,
  AuditDocument,
  ClassificationBucketId,
  InspectableField,
  Mission,
  MissionRunResult,
} from '../types/audit';
import { soundFx } from '../utils/soundFx';
import { XP_CLASIFICACION, XP_RUPTURA } from '../lib/reglas';
import { DocumentPaper } from './DocumentPaper';
import { ResilientImage } from './ResilientImage';
import { TaxCalculator } from './TaxCalculator';

type WorkbenchTab = 'viewer' | 'compare' | 'classify' | 'board' | 'decisions';

interface AuditRoomProps {
  mission: Mission;
  onExit: () => void;
  onCompleteMission: (result: MissionRunResult) => void;
}

const MANAGER_PORTRAIT = '/images/portrait_gerente_huanuco.webp';
const INSPECTOR_PORTRAIT = '/images/portrait_auditor_sunat.webp';

const BUCKETS: { id: ClassificationBucketId; title: string; subtitle: string }[] = [
  { id: 'comprobantes', title: 'Comprobantes de pago', subtitle: 'Facturas y notas de crédito' },
  { id: 'sustentos_pago', title: 'Sustentos de pago', subtitle: 'Extractos bancarios y giros' },
  { id: 'registros_contables', title: 'Registros contables', subtitle: 'Formato 8.1, 14.1, Kardex y PDT' },
  { id: 'evidencias_operacion', title: 'Evidencias de operaciones', subtitle: 'Esquelas, guías y contratos' },
];

export const AuditRoom: React.FC<AuditRoomProps> = ({
  mission,
  onExit,
  onCompleteMission,
}) => {
  const [startTime] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(soundFx.enabled);

  const [activeTab, setActiveTab] = useState<WorkbenchTab>('viewer');
  const [selectedDocId, setSelectedDocId] = useState<string>(mission.documents[0]?.id ?? '');
  const [openedDocIds, setOpenedDocIds] = useState<string[]>(
    mission.documents[0]?.id ? [mission.documents[0].id] : []
  );
  const [inspectionMode, setInspectionMode] = useState(true);
  const [zoom, setZoom] = useState(1);

  // Game HUD State: Fiscal Shield, Combo & Floating Callouts
  const [fiscalIntegrity, setFiscalIntegrity] = useState(100);
  const [combo, setCombo] = useState(0);
  /** Bonos que ya se dieron (validar la clasificación o sellar una ruptura solo suma la primera vez). */
  const premiados = useRef(new Set<string>());
  const [maxCombo, setMaxCombo] = useState(0);
  const [shieldShake, setShieldShake] = useState(false);
  const [callout, setCallout] = useState<{ id: number; text: string; tone: 'good' | 'bad' } | null>(
    null
  );

  // Mechanic A: Inspectable fields
  const [activeField, setActiveField] = useState<InspectableField | null>(null);
  const [resolvedFields, setResolvedFields] = useState<
    Record<string, { isCorrect: boolean; explanation: string }>
  >({});

  // Mechanic C: Document Comparison
  const [activePairIdx, setActivePairIdx] = useState(0);
  const [solvedComparisons, setSolvedComparisons] = useState<
    Record<string, { isCorrect: boolean; detail: string }>
  >({});

  // Mechanic B: Drag & Drop Classification
  const [docBuckets, setDocBuckets] = useState<Record<string, ClassificationBucketId>>({});
  const [classificationChecked, setClassificationChecked] = useState(false);
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [selectedDocToAssign, setSelectedDocToAssign] = useState<string | null>(null);

  // Mechanic D: Forensic Evidence Board
  const [flaggedBrokenEdges, setFlaggedBrokenEdges] = useState<Record<string, boolean>>({});
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(
    mission.evidenceConnections[0]?.id ?? null
  );

  // Mechanic E: Narrative Decisions
  const [decisionChoices, setDecisionChoices] = useState<Record<string, string>>({});
  const [visibleDecisionHint, setVisibleDecisionHint] = useState<Record<string, boolean>>({});

  // Mechanic F: Dossier Builder
  const [selectedDossierDocs, setSelectedDossierDocs] = useState<string[]>(
    mission.documents.filter((d) => d.kind === 'carta_sunat').map((d) => d.id)
  );

  // Right Assistant Panel
  const [assistantTab, setAssistantTab] = useState<'guide' | 'calculator'>('guide');
  const [revealedHintsCount, setRevealedHintsCount] = useState(0);
  const [activeAcademyTopic, setActiveAcademyTopic] = useState<AcademyTopic | null>(null);

  const [sessionXp, setSessionXp] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);

  // Live mission timer
  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!callout) return;
    const t = setTimeout(() => setCallout(null), 2600);
    return () => clearTimeout(t);
  }, [callout]);

  const toggleSound = () => {
    const next = !soundEnabled;
    soundFx.enabled = next;
    setSoundEnabled(next);
    if (next) soundFx.playClick();
  };

  const triggerPositiveHit = (baseXp: number, label: string) => {
    const nextCombo = combo + 1;
    const multiplier = Math.min(2.5, 1 + (nextCombo - 1) * 0.25);
    const awarded = Math.round(baseXp * multiplier);

    setCombo(nextCombo);
    setMaxCombo((m) => Math.max(m, nextCombo));
    setSessionXp((prev) => prev + awarded);
    setFiscalIntegrity((prev) => Math.min(100, prev + 3));
    soundFx.playDiscovery(nextCombo);
    setCallout({
      id: Date.now(),
      text: `${label} · +${awarded} XP${nextCombo > 1 ? ` · Combo x${multiplier.toFixed(2).replace(/\.00$/, '')}` : ''}`,
      tone: 'good',
    });
  };

  const triggerShieldDamage = (damage: number, label: string) => {
    setCombo(0);
    setErrorsCount((prev) => prev + 1);
    setFiscalIntegrity((prev) => Math.max(15, prev - damage));
    setShieldShake(true);
    setTimeout(() => setShieldShake(false), 380);
    soundFx.playError();
    setCallout({
      id: Date.now(),
      text: `${label} · -${damage}% Escudo Fiscal`,
      tone: 'bad',
    });
  };

  const currentDoc: AuditDocument | undefined =
    mission.documents.find((d) => d.id === selectedDocId) || mission.documents[0];

  const allAnomalyFields = useMemo(
    () => mission.documents.flatMap((d) => d.inspectableFields).filter((f) => f.isAnomaly),
    [mission.documents]
  );

  const anomaliesFoundCount = allAnomalyFields.filter(
    (f) => resolvedFields[f.id]?.isCorrect
  ).length;

  const comparisonsSolvedCount = Object.values(solvedComparisons).filter((c) => c.isCorrect).length;
  const brokenEdges = mission.evidenceConnections.filter((e) => e.isBroken);
  const brokenEdgesFlaggedCount = brokenEdges.filter((e) => flaggedBrokenEdges[e.id]).length;
  const allDocsClassified =
    mission.documents.length > 0 &&
    mission.documents.every((d) => docBuckets[d.id] === d.correctBucket);

  const totalSteps =
    allAnomalyFields.length +
    mission.comparisonPairs.length +
    mission.decisions.length +
    (brokenEdges.length > 0 ? 1 : 0) +
    1;

  const completedSteps =
    anomaliesFoundCount +
    comparisonsSolvedCount +
    Object.keys(decisionChoices).length +
    (brokenEdges.length > 0 && brokenEdgesFlaggedCount === brokenEdges.length ? 1 : 0);

  const missionProgressPct = Math.min(
    98,
    Math.round((completedSteps / Math.max(1, totalSteps)) * 100)
  );

  const handleSelectDocument = (docId: string) => {
    soundFx.playClick();
    setSelectedDocId(docId);
    setActiveField(null);
    if (!openedDocIds.includes(docId)) {
      setOpenedDocIds((prev) => [...prev, docId]);
    }
  };

  const handleAnswerField = (field: InspectableField, optionId: string) => {
    if (resolvedFields[field.id]) return;
    const chosen = field.options.find((o) => o.id === optionId);
    if (!chosen) return;

    setResolvedFields((prev) => ({
      ...prev,
      [field.id]: { isCorrect: chosen.isCorrect, explanation: chosen.explanation },
    }));

    if (chosen.isCorrect) {
      soundFx.playStamp();
      triggerPositiveHit(field.xpReward, 'Evidencia sellada');
    } else {
      triggerShieldDamage(15, 'Dictamen impreciso');
    }
  };

  const handleAnswerComparison = (pairId: string, optionId: string) => {
    if (solvedComparisons[pairId]) return;
    const pair = mission.comparisonPairs.find((p) => p.id === pairId);
    const chosen = pair?.discrepancyOptions.find((o) => o.id === optionId);
    if (!pair || !chosen) return;

    setSolvedComparisons((prev) => ({
      ...prev,
      [pairId]: { isCorrect: chosen.isCorrect, detail: chosen.detail },
    }));

    if (chosen.isCorrect) {
      triggerPositiveHit(pair.xpReward, 'Cruce comprobado');
    } else {
      triggerShieldDamage(15, 'Cruce incorrecto');
    }
  };

  const handleAssignBucket = (docId: string, bucketId: ClassificationBucketId) => {
    soundFx.playClick();
    setDocBuckets((prev) => ({ ...prev, [docId]: bucketId }));
    setSelectedDocToAssign(null);
    setClassificationChecked(false);
  };

  const handleVerifyClassification = () => {
    setClassificationChecked(true);
    const correctCount = mission.documents.filter(
      (d) => docBuckets[d.id] === d.correctBucket
    ).length;
    if (correctCount === mission.documents.length) {
      if (premiados.current.has('clasificacion')) return;
      premiados.current.add('clasificacion');
      triggerPositiveHit(XP_CLASIFICACION, 'Archivo clasificado');
    } else {
      triggerShieldDamage(10, `${correctCount}/${mission.documents.length} correctos`);
    }
  };

  const handleToggleBrokenEdge = (edgeId: string) => {
    const edge = mission.evidenceConnections.find((e) => e.id === edgeId);
    if (!edge) return;
    const nextVal = !flaggedBrokenEdges[edgeId];
    setFlaggedBrokenEdges((prev) => ({ ...prev, [edgeId]: nextVal }));

    if (nextVal && edge.isBroken) {
      soundFx.playStamp();
      if (premiados.current.has(edgeId)) return;
      premiados.current.add(edgeId);
      triggerPositiveHit(XP_RUPTURA, 'Ruptura sellada');
    } else if (nextVal && !edge.isBroken) {
      triggerShieldDamage(10, 'Vínculo sí tenía sustento');
    }
  };

  const handleChooseDecision = (decisionId: string, optionId: string) => {
    if (decisionChoices[decisionId]) return;
    const decision = mission.decisions.find((d) => d.id === decisionId);
    const option = decision?.options.find((o) => o.id === optionId);
    if (!option) return;

    setDecisionChoices((prev) => ({ ...prev, [decisionId]: optionId }));
    if (option.isOptimal) {
      triggerPositiveHit(option.xpDelta, 'Decisión óptima');
    } else {
      triggerShieldDamage(20, 'Riesgo tributario asumido');
    }
  };

  const handleToggleDossierDoc = (docId: string) => {
    soundFx.playClick();
    setSelectedDossierDocs((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleFinishMission = () => {
    soundFx.playVictory();
    const durationSeconds = Math.max(30, Math.round((Date.now() - startTime) / 1000));
    const classificationsCorrect = mission.documents.filter(
      (d) => docBuckets[d.id] === d.correctBucket
    ).length;

    const decisionSummaries = mission.decisions.map((d) => {
      const chosenId = decisionChoices[d.id];
      const opt = d.options.find((o) => o.id === chosenId);
      return {
        title: d.contextTitle,
        chosenOption: opt ? opt.text : 'Sin respuesta registrada',
        isOptimal: Boolean(opt?.isOptimal),
        consequence: opt ? opt.consequence : 'No se emitió pronunciamiento en esta decisión.',
      };
    });

    const decisionsOptimal = decisionSummaries.filter((d) => d.isOptimal).length;

    const requiredDocs = mission.documents.filter((d) => d.isRequiredForDossier);
    const invalidDocsSelected = selectedDossierDocs.filter(
      (id) => !mission.documents.find((d) => d.id === id)?.isRequiredForDossier
    ).length;
    const requiredSelected = requiredDocs.filter((d) => selectedDossierDocs.includes(d.id)).length;
    const dossierScorePercent = Math.max(
      0,
      Math.round(
        ((requiredSelected - invalidDocsSelected * 0.5) / Math.max(1, requiredDocs.length)) * 100
      )
    );

    const components = [
      allAnomalyFields.length > 0 ? anomaliesFoundCount / allAnomalyFields.length : 1,
      mission.comparisonPairs.length > 0 ? comparisonsSolvedCount / mission.comparisonPairs.length : 1,
      mission.decisions.length > 0 ? decisionsOptimal / mission.decisions.length : 1,
      dossierScorePercent / 100,
    ];
    // Sin pisos artificiales: un expediente vacío no puede dar puntaje (antes daba 25 % y 140 XP como mínimo).
    const accuracyPercent = Math.min(100, Math.max(0, Math.round((components.reduce((a, b) => a + b, 0) / components.length) * 100)));

    const rankGrade: MissionRunResult['rankGrade'] =
      accuracyPercent >= 90 && fiscalIntegrity >= 85
        ? 'S'
        : accuracyPercent >= 75
        ? 'A'
        : accuracyPercent >= 55
        ? 'B'
        : 'C';

    // El bono del escudo fiscal premia no equivocarse, pero solo en proporción a lo que se resolvió.
    const shieldBonus = Math.round(fiscalIntegrity * 0.8 * (accuracyPercent / 100));
    const totalXp = Math.max(0, Math.round(mission.xpReward * (accuracyPercent / 100)) + sessionXp + shieldBonus);

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (anomaliesFoundCount === allAnomalyFields.length) {
      strengths.push('Identificaste el 100% de las inconsistencias documentales del expediente.');
    } else {
      const faltan = allAnomalyFields.length - anomaliesFoundCount;
      improvements.push(
        faltan === 1 ? 'Quedó 1 campo observado sin sellar.' : `Quedaron ${faltan} campos observados sin sellar.`
      );
    }

    if (decisionsOptimal === mission.decisions.length && mission.decisions.length > 0) {
      strengths.push('Mantuviste el Escudo Fiscal sólido aplicando criterio normativo y gradualidad.');
    } else {
      improvements.push('Refuerza la subsanación voluntaria frente a errores u omisiones tributarias.');
    }

    if (dossierScorePercent >= 80) {
      strengths.push('Conformaste un expediente de respuesta coherente con sustentos válidos.');
    } else {
      improvements.push('Evita incluir comprobantes sin bancarización como crédito fiscal válido.');
    }

    const newlyUnlockedBadges: string[] = [];
    if (mission.id === 'mision-01' && accuracyPercent >= 75) newlyUnlockedBadges.push('Experto en IGV');
    if (dossierScorePercent === 100) newlyUnlockedBadges.push('Maestro del expediente');
    if (decisionsOptimal === mission.decisions.length && mission.decisions.length > 0) {
      newlyUnlockedBadges.push('Auditor estratégico');
    }
    if (mission.id === 'mision-03' && accuracyPercent >= 70) {
      newlyUnlockedBadges.push('Especialista en inventarios');
    }

    onCompleteMission({
      missionId: mission.id,
      completedAt: new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      durationSeconds,
      xpEarned: totalXp,
      accuracyPercent,
      anomaliesFound: anomaliesFoundCount,
      anomaliesTotal: allAnomalyFields.length,
      comparisonsSolved: comparisonsSolvedCount,
      comparisonsTotal: mission.comparisonPairs.length,
      classificationsCorrect,
      classificationsTotal: mission.documents.length,
      brokenLinksFlagged: brokenEdgesFlaggedCount,
      brokenLinksTotal: brokenEdges.length,
      decisionsOptimal,
      decisionsTotal: mission.decisions.length,
      dossierScorePercent,
      errorsCount,
      strengths,
      improvements,
      developedCompetencies: mission.competencies,
      newlyUnlockedBadges,
      selectedDossierDocIds: selectedDossierDocs,
      rankGrade,
      integrityRemaining: fiscalIntegrity,
      maxCombo,
      decisionSummaries,
    });
  };

  const openAcademyTopic = (topicId?: string) => {
    if (!topicId) return;
    const found = ACADEMY_TOPICS.find((t) => t.id === topicId);
    if (found) setActiveAcademyTopic(found);
  };

  const activePair = mission.comparisonPairs[activePairIdx] || mission.comparisonPairs[0];
  const compDocA = activePair ? mission.documents.find((d) => d.id === activePair.docAId) : undefined;
  const compDocB = activePair ? mission.documents.find((d) => d.id === activePair.docBId) : undefined;
  const selectedEdge = mission.evidenceConnections.find((e) => e.id === selectedEdgeId);

  const timerMins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
  const timerSecs = (elapsedSeconds % 60).toString().padStart(2, '0');

  const shieldColor =
    fiscalIntegrity >= 70
      ? 'bg-[var(--c-teal)]'
      : fiscalIntegrity >= 40
      ? 'bg-[var(--c-oro)]'
      : 'bg-rose-500';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--c-hondo)] text-[var(--c-texto)]">
      {/* TACTICAL GAME HUD HEADER */}
      <header className="h-16 px-4 sm:px-6 border-b border-[var(--c-linea)] bg-[var(--c-panel2)] flex items-center justify-between gap-4 shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--c-panel)] hover:bg-[var(--c-elevado)] border border-[var(--c-linea)] text-xs font-medium text-[var(--c-texto)] transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-[var(--c-suave)] font-mono-tabular">
              <span className="text-[var(--c-teal)] font-semibold">{mission.dossierCode}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{mission.companyName}</span>
            </div>
            <h1 className="font-display font-bold text-sm sm:text-base text-[var(--c-texto)] truncate">
              {mission.title}
            </h1>
          </div>
        </div>

        {/* Center Tactical HUD Meters */}
        <div className="hidden lg:flex items-center gap-6 shrink-0">
          {/* Fiscal Integrity Shield */}
          <motion.div
            animate={shieldShake ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2.5 bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-lg px-3 py-1.5"
          >
            <Shield
              className={`w-4 h-4 ${
                fiscalIntegrity >= 70
                  ? 'text-[var(--c-teal)]'
                  : fiscalIntegrity >= 40
                  ? 'text-[var(--c-oro)]'
                  : 'text-rose-400'
              }`}
            />
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-[10px]">
                <span className="text-[var(--c-suave)]">Escudo Fiscal</span>
                <span className="font-mono-tabular font-bold text-[var(--c-texto)]">
                  {fiscalIntegrity}%
                </span>
              </div>
              <div className="w-24 h-1.5 bg-[var(--c-panel)] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${shieldColor}`}
                  style={{ width: `${fiscalIntegrity}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Combo Streak */}
          <div className="flex items-center gap-2 bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-lg px-3 py-1.5 text-xs">
            <Flame className={`w-4 h-4 ${combo > 0 ? 'text-[var(--c-oro)]' : 'text-[var(--c-tenue)]'}`} />
            <div>
              <p className="text-[10px] text-[var(--c-suave)] leading-none">Combo</p>
              <p className="font-mono-tabular font-bold text-[var(--c-oro)] leading-tight">
                x{Math.min(2.5, 1 + Math.max(0, combo - 1) * 0.25).toFixed(2).replace(/\.00$/, '')}
              </p>
            </div>
          </div>

          {/* Live Clock & XP */}
          <div className="flex items-center gap-4 text-xs font-mono-tabular">
            <span className="inline-flex items-center gap-1.5 text-[var(--c-suave)]">
              <Clock className="w-3.5 h-3.5 text-[var(--c-teal)]" />
              {timerMins}:{timerSecs}
            </span>
            <span className="font-bold text-[var(--c-oro)]">+{sessionXp} XP</span>
          </div>
        </div>

        {/* Right Audio & Submit */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-[var(--c-panel)] hover:bg-[var(--c-elevado)] border border-[var(--c-linea)] text-[var(--c-suave)] hover:text-[var(--c-texto)] transition-colors"
            title={soundEnabled ? 'Silenciar efectos' : 'Activar efectos de sonido'}
            aria-label="Alternar sonido"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[var(--c-teal)]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('decisions');
              // Lleva al alumno directo al botón de presentación final.
              setTimeout(() => {
                document.getElementById('final-submit')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 150);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--c-teal)] hover:bg-[var(--c-teal-hover)] text-[var(--c-sobre)] text-xs font-bold transition-colors whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Cerrar caso</span>
          </button>
        </div>
      </header>

      {/* FLOATING GAME CALLOUT */}
      <AnimatePresence>
        {callout && (
          <motion.div
            key={callout.id}
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl border shadow-2xl text-xs font-bold flex items-center gap-2 pointer-events-none ${
              callout.tone === 'good'
                ? 'bg-[var(--c-panel2)] border-[var(--c-teal)] text-[var(--c-teal)]'
                : 'bg-[#1F1218] border-rose-500 text-rose-300'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{callout.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Three-Pane Workstation */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* LEFT PANE: EXPEDIENTE */}
        <aside className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[var(--c-linea)] bg-[var(--c-panel2)]/60 p-4 sm:p-5 space-y-6 overflow-y-auto lg:max-h-[calc(100vh-4rem)]">
          <div className="space-y-2.5">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--c-suave)]">
              Expediente del Contribuyente
            </h2>
            <div className="bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-lg p-3.5 space-y-2 text-xs">
              <p className="font-semibold text-[var(--c-texto)]">{mission.companyName}</p>
              <div className="space-y-1 text-[var(--c-suave)]">
                <p>
                  RUC: <span className="font-mono-tabular text-[var(--c-texto)]">{mission.companyRuc}</span>
                </p>
                <p>
                  Procedimiento:{' '}
                  <span className="text-[var(--c-oro)] font-medium">{mission.procedureType}</span>
                </p>
                <p>
                  Tributo: <span className="text-[var(--c-texto)]">{mission.taxInvestigated}</span> ·{' '}
                  {mission.taxPeriod}
                </p>
              </div>
            </div>
          </div>

          {/* Document Tree */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--c-suave)]">
                Evidencias ({mission.documents.length})
              </h2>
              <span className="text-[11px] font-mono-tabular text-[var(--c-teal)]">
                {openedDocIds.length}/{mission.documents.length} vistas
              </span>
            </div>

            <div className="space-y-1.5">
              {mission.documents.map((doc) => {
                const isSelected = doc.id === currentDoc?.id;
                const isOpened = openedDocIds.includes(doc.id);
                const docAnomalies = doc.inspectableFields.filter((f) => f.isAnomaly);
                const unresolvedAnomalies = docAnomalies.filter(
                  (f) => !resolvedFields[f.id]?.isCorrect
                ).length;

                return (
                  <button
                    key={doc.id}
                    onClick={() => {
                      handleSelectDocument(doc.id);
                      if (activeTab !== 'viewer') setActiveTab('viewer');
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-[var(--c-elevado)] border-[var(--c-teal)]/70 text-[var(--c-texto)]'
                        : 'bg-[var(--c-panel)]/60 border-[var(--c-linea)] hover:border-[var(--c-linea-fuerte)] text-[var(--c-suave)] hover:text-[var(--c-texto)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tabular">
                      <span className={isSelected ? 'text-[var(--c-teal)] font-semibold' : ''}>
                        {doc.code}
                      </span>
                      {unresolvedAnomalies > 0 ? (
                        <span className="text-[var(--c-oro)] font-semibold">
                          {unresolvedAnomalies} pista(s)
                        </span>
                      ) : isOpened ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--c-teal)]" />
                      ) : null}
                    </div>
                    <p className="text-xs font-medium text-[var(--c-texto)] mt-0.5 truncate">
                      {doc.title}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {mission.timeline.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--c-suave)]">
                Línea de tiempo
              </h2>
              <div className="space-y-2.5">
                {mission.timeline.map((step) => (
                  <div key={step.id} className="flex items-start gap-2.5 text-xs">
                    <span
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        step.status === 'completado'
                          ? 'bg-[var(--c-teal)]'
                          : step.status === 'actual'
                          ? 'bg-[var(--c-oro)]'
                          : 'bg-[var(--c-elevado)]'
                      }`}
                    />
                    <div>
                      <p className="font-mono-tabular text-[11px] text-[var(--c-suave)]">{step.date}</p>
                      <p
                        className={
                          step.status === 'actual' ? 'text-[var(--c-texto)] font-semibold' : 'text-[var(--c-suave)]'
                        }
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* CENTER PANE: MESA DE INVESTIGACIÓN */}
        <main className="lg:col-span-6 p-4 sm:p-6 space-y-5 overflow-y-auto lg:max-h-[calc(100vh-4rem)]">
          {/* 5-Stage Tactical Quest Stepper */}
          <div className="grid grid-cols-5 gap-1.5 bg-[var(--c-panel2)] p-1.5 rounded-xl border border-[var(--c-linea)]">
            {[
              {
                id: 'viewer' as const,
                step: '1',
                label: 'Inspeccionar',
                icon: Eye,
                done: allAnomalyFields.length > 0 && anomaliesFoundCount === allAnomalyFields.length,
              },
              {
                id: 'compare' as const,
                step: '2',
                label: 'Cruzar',
                icon: Columns2,
                done:
                  mission.comparisonPairs.length > 0 &&
                  comparisonsSolvedCount === mission.comparisonPairs.length,
              },
              {
                id: 'classify' as const,
                step: '3',
                label: 'Clasificar',
                icon: FolderKanban,
                done: allDocsClassified,
              },
              {
                id: 'board' as const,
                step: '4',
                label: 'Tablero',
                icon: GitBranch,
                done: brokenEdges.length > 0 && brokenEdgesFlaggedCount === brokenEdges.length,
              },
              {
                id: 'decisions' as const,
                step: '5',
                label: 'Decidir',
                icon: FileCheck2,
                done:
                  mission.decisions.length > 0 &&
                  Object.keys(decisionChoices).length === mission.decisions.length,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab(tab.id);
                  }}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[var(--c-elevado)] text-[var(--c-teal)] ring-1 ring-[var(--c-teal)]/40'
                      : tab.done
                      ? 'bg-[var(--c-teal)]/10 text-[var(--c-teal)]'
                      : 'text-[var(--c-suave)] hover:text-[var(--c-texto)] hover:bg-[var(--c-panel)]'
                  }`}
                >
                  {tab.done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--c-teal)] shrink-0" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate">
                    {tab.step}. {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: VISOR DE DOCUMENTOS + INSPECCIÓN FORENSE */}
          {activeTab === 'viewer' && currentDoc && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setInspectionMode(!inspectionMode);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                      inspectionMode
                        ? 'bg-[var(--c-oro)]/20 text-[var(--c-oro)] border border-[var(--c-oro)]/40'
                        : 'bg-[var(--c-fondo)] text-[var(--c-suave)] border border-[var(--c-linea)]'
                    }`}
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>{inspectionMode ? 'Escáner Forense: Activo' : 'Activar Escáner'}</span>
                  </button>
                  <span className="text-[var(--c-suave)] hidden sm:inline">
                    Haz clic en los campos resaltados para dictaminar
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.85, Number((z - 0.1).toFixed(2))))}
                    className="p-1.5 rounded bg-[var(--c-fondo)] hover:bg-[var(--c-elevado)] text-[var(--c-suave)] hover:text-[var(--c-texto)]"
                    aria-label="Reducir zoom"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono-tabular text-[var(--c-suave)] w-11 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(1.2, Number((z + 0.1).toFixed(2))))}
                    className="p-1.5 rounded bg-[var(--c-fondo)] hover:bg-[var(--c-elevado)] text-[var(--c-suave)] hover:text-[var(--c-texto)]"
                    aria-label="Ampliar zoom"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {activeField && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16 }}
                    className="bg-[var(--c-panel)] border border-[var(--c-oro)]/60 rounded-xl p-5 space-y-4 shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--c-oro)]">
                          Sellar Dictamen Forense
                        </p>
                        <h3 className="font-display text-base font-bold text-[var(--c-texto)] mt-0.5">
                          {activeField.label}
                        </h3>
                        <p className="text-xs font-mono-tabular text-[var(--c-suave)] mt-1">
                          Dato registrado: {activeField.value}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveField(null)}
                        className="text-xs text-[var(--c-suave)] hover:text-[var(--c-texto)]"
                      >
                        Cerrar
                      </button>
                    </div>

                    {resolvedFields[activeField.id] ? (
                      <div
                        className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                          resolvedFields[activeField.id].isCorrect
                            ? 'bg-[var(--c-teal)]/15 border-[var(--c-teal)]/50 text-[var(--c-texto)]'
                            : 'bg-rose-500/15 border-rose-500/40 text-[var(--c-texto)]'
                        }`}
                      >
                        <p className="font-semibold">
                          {resolvedFields[activeField.id].isCorrect
                            ? 'Evidencia validada correctamente'
                            : 'Observación imprecisa (-15% Escudo Fiscal)'}
                        </p>
                        <p className="text-[var(--c-suave)] leading-relaxed">
                          {resolvedFields[activeField.id].explanation}
                        </p>
                        {activeField.academyTopicId && (
                          <button
                            onClick={() => openAcademyTopic(activeField.academyTopicId)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--c-teal)] hover:underline pt-1"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Ver base legal</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activeField.options.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleAnswerField(activeField, opt.id)}
                            className="w-full text-left p-3 rounded-lg bg-[var(--c-fondo)] hover:bg-[var(--c-elevado)] border border-[var(--c-linea)] hover:border-[var(--c-teal)]/60 text-xs text-[var(--c-texto)] transition-colors"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <DocumentPaper
                document={currentDoc}
                inspectionMode={inspectionMode}
                zoom={zoom}
                resolvedFieldIds={Object.keys(resolvedFields)}
                selectedFieldId={activeField?.id ?? null}
                onSelectField={(field) => {
                  soundFx.playClick();
                  setActiveField(field);
                }}
              />
            </div>
          )}

          {/* TAB 2: COMPARACIÓN DOCUMENTAL */}
          {activeTab === 'compare' && (
            <div className="space-y-5">
              <div className="bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[var(--c-texto)]">
                      Cruce Documental Simultáneo
                    </h2>
                    <p className="text-xs text-[var(--c-suave)]">
                      Detecta diferencias ocultas entre dos papeles clave para sumar Combo.
                    </p>
                  </div>
                  {mission.comparisonPairs.length > 1 && (
                    <div className="flex items-center gap-1 p-1 bg-[var(--c-fondo)] rounded-lg">
                      {mission.comparisonPairs.map((pair, idx) => (
                        <button
                          key={pair.id}
                          onClick={() => {
                            soundFx.playClick();
                            setActivePairIdx(idx);
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            activePairIdx === idx
                              ? 'bg-[var(--c-elevado)] text-[var(--c-teal)]'
                              : 'text-[var(--c-suave)] hover:text-[var(--c-texto)]'
                          }`}
                        >
                          Cruce {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {activePair && (
                  <div className="pt-3 border-t border-[var(--c-linea)] space-y-3">
                    <p className="text-sm font-semibold text-[var(--c-oro)]">{activePair.title}</p>
                    <p className="text-xs text-[var(--c-suave)]">{activePair.description}</p>

                    {solvedComparisons[activePair.id] ? (
                      <div
                        className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                          solvedComparisons[activePair.id].isCorrect
                            ? 'bg-[var(--c-teal)]/15 border-[var(--c-teal)]/50 text-[var(--c-texto)]'
                            : 'bg-rose-500/15 border-rose-500/40 text-[var(--c-texto)]'
                        }`}
                      >
                        <p className="font-semibold">
                          {solvedComparisons[activePair.id].isCorrect
                            ? 'Cruce verificado con éxito'
                            : 'Cruce erróneo (-15% Escudo Fiscal)'}
                        </p>
                        <p className="text-[var(--c-suave)]">{solvedComparisons[activePair.id].detail}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activePair.discrepancyOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleAnswerComparison(activePair.id, opt.id)}
                            className="w-full text-left p-3 rounded-lg bg-[var(--c-fondo)] hover:bg-[var(--c-elevado)] border border-[var(--c-linea)] hover:border-[var(--c-teal)]/50 text-xs text-[var(--c-texto)] transition-colors"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {compDocA && compDocB && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <DocumentPaper
                    document={compDocA}
                    inspectionMode={false}
                    zoom={0.9}
                    resolvedFieldIds={[]}
                    selectedFieldId={null}
                    onSelectField={() => {}}
                    compact
                  />
                  <DocumentPaper
                    document={compDocB}
                    inspectionMode={false}
                    zoom={0.9}
                    resolvedFieldIds={[]}
                    selectedFieldId={null}
                    onSelectField={() => {}}
                    compact
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CLASIFICACIÓN DRAG & DROP */}
          {activeTab === 'classify' && (
            <div className="space-y-5">
              <div className="bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-[var(--c-texto)]">
                    Clasificación Táctica de Evidencias
                  </h2>
                  <p className="text-xs text-[var(--c-suave)] mt-1">
                    Arrastra o asigna cada documento a su carpeta contable y valida para obtener bonificación.
                  </p>
                </div>
                <button
                  onClick={handleVerifyClassification}
                  className="px-4 py-2 rounded-lg bg-[var(--c-teal)] hover:bg-[var(--c-teal-hover)] text-[var(--c-sobre)] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  Validar archivo
                </button>
              </div>

              <div className="bg-[var(--c-panel)]/70 border border-[var(--c-linea)] rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-[var(--c-suave)]">
                  Bandeja de entrada ({mission.documents.filter((d) => !docBuckets[d.id]).length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {mission.documents
                    .filter((d) => !docBuckets[d.id])
                    .map((doc) => (
                      <button
                        key={doc.id}
                        draggable
                        onDragStart={() => setDraggedDocId(doc.id)}
                        onClick={() =>
                          setSelectedDocToAssign((prev) => (prev === doc.id ? null : doc.id))
                        }
                        className={`px-3 py-2 rounded-lg border text-left text-xs transition-all cursor-grab active:cursor-grabbing ${
                          selectedDocToAssign === doc.id
                            ? 'bg-[var(--c-teal)]/20 border-[var(--c-teal)] text-[var(--c-texto)]'
                            : 'bg-[var(--c-fondo)] border-[var(--c-linea)] hover:border-[var(--c-linea-fuerte)] text-[var(--c-texto)]'
                        }`}
                      >
                        <span className="font-mono-tabular text-[var(--c-teal)] mr-1.5">{doc.code}</span>
                        <span>{doc.title}</span>
                      </button>
                    ))}
                  {mission.documents.every((d) => docBuckets[d.id]) && (
                    <p className="text-xs text-[var(--c-teal)]">
                      Bandeja vacía. Presiona “Validar archivo” para sellar tu clasificación.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {BUCKETS.map((bucket) => {
                  const assignedDocs = mission.documents.filter(
                    (d) => docBuckets[d.id] === bucket.id
                  );
                  return (
                    <div
                      key={bucket.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedDocId) {
                          handleAssignBucket(draggedDocId, bucket.id);
                          setDraggedDocId(null);
                        }
                      }}
                      onClick={() => {
                        if (selectedDocToAssign) {
                          handleAssignBucket(selectedDocToAssign, bucket.id);
                        }
                      }}
                      className={`bg-[var(--c-panel)] border rounded-xl p-4 min-h-[160px] flex flex-col justify-between transition-colors ${
                        selectedDocToAssign
                          ? 'border-[var(--c-teal)]/60 cursor-pointer hover:bg-[var(--c-elevado)]/70'
                          : 'border-[var(--c-linea)]'
                      }`}
                    >
                      <div>
                        <h3 className="font-display text-sm font-bold text-[var(--c-texto)]">
                          {bucket.title}
                        </h3>
                        <p className="text-[11px] text-[var(--c-suave)] mb-3">{bucket.subtitle}</p>
                        <div className="space-y-2">
                          {assignedDocs.map((doc) => {
                            const isCorrect = doc.correctBucket === bucket.id;
                            return (
                              <div
                                key={doc.id}
                                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs ${
                                  classificationChecked
                                    ? isCorrect
                                      ? 'bg-[var(--c-teal)]/15 border-[var(--c-teal)]/50 text-[var(--c-texto)]'
                                      : 'bg-rose-500/15 border-rose-500/50 text-[var(--c-texto)]'
                                    : 'bg-[var(--c-fondo)] border-[var(--c-linea)] text-[var(--c-texto)]'
                                }`}
                              >
                                <span className="truncate">
                                  <span className="font-mono-tabular text-[var(--c-teal)] mr-1.5">
                                    {doc.code}
                                  </span>
                                  {doc.title}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDocBuckets((prev) => {
                                      const copy = { ...prev };
                                      delete copy[doc.id];
                                      return copy;
                                    });
                                    setClassificationChecked(false);
                                  }}
                                  className="text-[11px] text-[var(--c-suave)] hover:text-[var(--c-texto)] shrink-0"
                                >
                                  Quitar
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: TABLERO FORENSE */}
          {activeTab === 'board' && (
            <div className="space-y-5">
              <div className="bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl p-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-[var(--c-texto)]">
                    Tablero Forense de Conexiones
                  </h2>
                  <p className="text-xs text-[var(--c-suave)] mt-1">
                    Selecciona cada enlace para sellar las rupturas de la cadena probatoria ({brokenEdgesFlaggedCount}/{brokenEdges.length} detectadas).
                  </p>
                </div>
              </div>

              <div className="relative bg-[var(--c-panel2)] border border-[var(--c-linea)] rounded-xl h-[380px] overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 1px 1px, var(--c-tenue) 1px, transparent 0)',
                    backgroundSize: '24px 24px',
                  }}
                />

                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {mission.evidenceConnections.map((edge) => {
                    const fromNode = mission.evidenceNodes.find((n) => n.id === edge.fromId);
                    const toNode = mission.evidenceNodes.find((n) => n.id === edge.toId);
                    if (!fromNode || !toNode) return null;

                    const isFlagged = flaggedBrokenEdges[edge.id];
                    const isSelected = selectedEdgeId === edge.id;
                    const strokeColor = isFlagged
                      ? edge.isBroken
                        ? 'var(--c-teal)'
                        : '#F43F5E'
                      : isSelected
                      ? 'var(--c-oro)'
                      : 'var(--c-tenue)';

                    return (
                      <line
                        key={edge.id}
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        style={{ stroke: strokeColor }}
                        strokeWidth={isSelected ? '0.9' : '0.55'}
                        strokeDasharray={edge.isBroken ? '1.8 1.2' : undefined}
                      />
                    );
                  })}
                </svg>

                {mission.evidenceConnections.map((edge) => {
                  const fromNode = mission.evidenceNodes.find((n) => n.id === edge.fromId);
                  const toNode = mission.evidenceNodes.find((n) => n.id === edge.toId);
                  if (!fromNode || !toNode) return null;
                  const midX = (fromNode.x + toNode.x) / 2;
                  const midY = (fromNode.y + toNode.y) / 2;
                  const isFlagged = flaggedBrokenEdges[edge.id];

                  return (
                    <button
                      key={edge.id}
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedEdgeId(edge.id);
                      }}
                      style={{ left: `${midX}%`, top: `${midY}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded text-[10px] font-semibold border transition-all whitespace-nowrap z-20 shadow-lg shadow-black/40 ${
                        isFlagged
                          ? edge.isBroken
                            ? 'bg-[var(--c-teal)] text-[var(--c-sobre)] border-[var(--c-teal)]'
                            : 'bg-rose-500 text-white border-rose-400'
                          : selectedEdgeId === edge.id
                          ? 'bg-[var(--c-oro)] text-[var(--c-sobre)] border-[var(--c-oro)]'
                          : 'bg-[var(--c-fondo)] text-[var(--c-texto)] border-[var(--c-linea-fuerte)] hover:border-[var(--c-oro)]'
                      }`}
                    >
                      {edge.label}
                    </button>
                  );
                })}

                {mission.evidenceNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => {
                      if (node.linkedDocId) {
                        handleSelectDocument(node.linkedDocId);
                        setActiveTab('viewer');
                      }
                    }}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-36 p-2.5 rounded-lg border text-left transition-transform hover:scale-[1.03] z-10 ${
                      node.status === 'valido'
                        ? 'bg-[var(--c-panel)] border-[var(--c-teal)]/60'
                        : node.status === 'sospechoso'
                        ? 'bg-[var(--c-panel)] border-[var(--c-oro)]/70'
                        : 'bg-[var(--c-panel)] border-rose-500/70'
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-[var(--c-suave)]">
                      {node.category}
                    </p>
                    <p className="text-xs font-semibold text-[var(--c-texto)] truncate mt-0.5">
                      {node.label}
                    </p>
                    <p className="text-[11px] font-mono-tabular text-[var(--c-suave)] truncate">
                      {node.sublabel}
                    </p>
                  </button>
                ))}
              </div>

              {selectedEdge && (
                <div className="bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[var(--c-oro)]">
                      Enlace seleccionado: {selectedEdge.label}
                    </p>
                    <p className="text-xs text-[var(--c-suave)]">
                      {selectedEdge.issueDescription ||
                        'Evalúa si la cadena documental entre ambos nodos está completa o rota.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleBrokenEdge(selectedEdge.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      flaggedBrokenEdges[selectedEdge.id]
                        ? 'bg-[var(--c-elevado)] text-[var(--c-teal)] border border-[var(--c-teal)]/40'
                        : 'bg-[var(--c-oro)] hover:bg-[var(--c-oro)] text-[var(--c-sobre)]'
                    }`}
                  >
                    {flaggedBrokenEdges[selectedEdge.id]
                      ? 'Ruptura sellada'
                      : 'Sellar ruptura probatoria'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DIALOGUE DECISIONS + DOSSIER CLOSURE */}
          {activeTab === 'decisions' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-[var(--c-texto)]">
                    Escena de Interlocución y Decisiones
                  </h2>
                  <p className="text-xs text-[var(--c-suave)]">
                    Cada respuesta afecta directamente el Escudo Fiscal de la empresa y la resolución final.
                  </p>
                </div>

                {mission.decisions.map((decision) => {
                  const chosenId = decisionChoices[decision.id];
                  const chosenOption = decision.options.find((o) => o.id === chosenId);
                  const isSunat = decision.senderRole === 'Auditor SUNAT';
                  const portraitSrc = isSunat ? INSPECTOR_PORTRAIT : MANAGER_PORTRAIT;

                  return (
                    <div
                      key={decision.id}
                      className="bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl p-5 space-y-4"
                    >
                      {/* Character Dialogue Header */}
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-[var(--c-linea)] shrink-0 bg-[var(--c-fondo)]">
                          <ResilientImage
                            src={portraitSrc}
                            alt={decision.senderName}
                            className={`w-full h-full object-cover ${isSunat ? 'scale-110' : ''}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-[var(--c-oro)]">
                                {decision.senderRole} · {decision.senderName}
                              </p>
                              <h3 className="font-display text-base font-bold text-[var(--c-texto)] mt-0.5">
                                {decision.contextTitle}
                              </h3>
                            </div>
                            <button
                              onClick={() =>
                                setVisibleDecisionHint((prev) => ({
                                  ...prev,
                                  [decision.id]: !prev[decision.id],
                                }))
                              }
                              className="inline-flex items-center gap-1 text-xs text-[var(--c-teal)] hover:underline shrink-0"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Pista</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[var(--c-fondo)] p-4 rounded-xl border border-[var(--c-linea)] text-sm text-[var(--c-texto)]/95 leading-relaxed">
                        {decision.prompt}
                      </div>

                      {visibleDecisionHint[decision.id] && (
                        <p className="text-xs text-[var(--c-teal)] bg-[var(--c-teal)]/10 border border-[var(--c-teal)]/30 rounded-lg px-3 py-2">
                          {decision.hint}
                        </p>
                      )}

                      <div className="space-y-2">
                        {decision.options.map((opt) => {
                          const isSelected = chosenId === opt.id;
                          return (
                            <button
                              key={opt.id}
                              disabled={Boolean(chosenId)}
                              onClick={() => handleChooseDecision(decision.id, opt.id)}
                              className={`w-full text-left p-3.5 rounded-lg border text-xs transition-colors ${
                                isSelected
                                  ? opt.isOptimal
                                    ? 'bg-[var(--c-teal)]/15 border-[var(--c-teal)] text-[var(--c-texto)]'
                                    : 'bg-rose-500/15 border-rose-500 text-[var(--c-texto)]'
                                  : chosenId
                                  ? 'bg-[var(--c-fondo)]/50 border-[var(--c-linea)] text-[var(--c-suave)] opacity-60'
                                  : 'bg-[var(--c-fondo)] hover:bg-[var(--c-elevado)] border-[var(--c-linea)] hover:border-[var(--c-teal)]/50 text-[var(--c-texto)]'
                              }`}
                            >
                              {opt.text}
                            </button>
                          );
                        })}
                      </div>

                      {chosenOption && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="pt-3 border-t border-[var(--c-linea)] space-y-1 text-xs"
                        >
                          <p
                            className={`font-semibold ${
                              chosenOption.isOptimal ? 'text-[var(--c-teal)]' : 'text-rose-400'
                            }`}
                          >
                            Consecuencia: {chosenOption.taxImpact}
                          </p>
                          <p className="text-[var(--c-suave)] leading-relaxed">
                            {chosenOption.consequence}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dossier Builder */}
              <div className="bg-[var(--c-panel)] border border-[var(--c-teal)]/40 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="font-display text-base font-bold text-[var(--c-texto)]">
                    Armado del Expediente de Defensa
                  </h3>
                  <p className="text-xs text-[var(--c-suave)] mt-1">
                    Marca los sustentos válidos que remitirás en respuesta al requerimiento. Excluye comprobantes sin bancarización o de emisores en baja.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {mission.documents.map((doc) => {
                    const checked = selectedDossierDocs.includes(doc.id);
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => handleToggleDossierDoc(doc.id)}
                        className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                          checked
                            ? 'bg-[var(--c-teal)]/15 border-[var(--c-teal)]/60 text-[var(--c-texto)]'
                            : 'bg-[var(--c-fondo)] border-[var(--c-linea)] text-[var(--c-suave)] hover:text-[var(--c-texto)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          className="mt-0.5 accent-[var(--c-teal)]"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono-tabular text-[var(--c-teal)]">{doc.code}</p>
                          <p className="text-xs font-medium text-[var(--c-texto)] truncate">{doc.title}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[var(--c-linea)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-[var(--c-suave)]">
                    Progreso total: <strong className="text-[var(--c-teal)] font-mono-tabular">{missionProgressPct}%</strong> · Escudo:{' '}
                    <strong className="text-[var(--c-texto)] font-mono-tabular">{fiscalIntegrity}%</strong>
                  </div>
                  <button
                    id="final-submit"
                    onClick={handleFinishMission}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--c-teal)] hover:bg-[var(--c-teal-hover)] text-[var(--c-sobre)] text-sm font-bold transition-transform active:scale-[0.98] whitespace-nowrap"
                  >
                    <Send className="w-4 h-4" />
                    <span>Presentar Expediente Final</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT PANE: ASISTENTE + CALCULADORA */}
        <aside className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-[var(--c-linea)] bg-[var(--c-panel2)]/60 p-4 sm:p-5 space-y-5 overflow-y-auto lg:max-h-[calc(100vh-4rem)]">
          <div className="grid grid-cols-2 p-1 bg-[var(--c-fondo)] rounded-lg border border-[var(--c-linea)]">
            <button
              onClick={() => setAssistantTab('guide')}
              className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                assistantTab === 'guide'
                  ? 'bg-[var(--c-elevado)] text-[var(--c-teal)]'
                  : 'text-[var(--c-suave)] hover:text-[var(--c-texto)]'
              }`}
            >
              Bitácora
            </button>
            <button
              onClick={() => setAssistantTab('calculator')}
              className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                assistantTab === 'calculator'
                  ? 'bg-[var(--c-elevado)] text-[var(--c-oro)]'
                  : 'text-[var(--c-suave)] hover:text-[var(--c-texto)]'
              }`}
            >
              Calculadora
            </button>
          </div>

          {assistantTab === 'calculator' ? (
            <TaxCalculator suggestedReparo={mission.reparoTargetAmount} />
          ) : (
            <div className="space-y-5">
              <div className="bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-lg p-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--c-teal)]">
                  Misión Activa
                </p>
                <p className="text-xs text-[var(--c-texto)] leading-relaxed">{mission.objective}</p>
              </div>

              {/* Quest Progress Summary */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--c-suave)]">
                  Metas de Rango S
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[var(--c-suave)]">
                    <span>Hallazgos sellados</span>
                    <span className="font-mono-tabular text-[var(--c-texto)] font-semibold">
                      {anomaliesFoundCount}/{allAnomalyFields.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[var(--c-suave)]">
                    <span>Cruces verificados</span>
                    <span className="font-mono-tabular text-[var(--c-texto)] font-semibold">
                      {comparisonsSolvedCount}/{mission.comparisonPairs.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[var(--c-suave)]">
                    <span>Rupturas en tablero</span>
                    <span className="font-mono-tabular text-[var(--c-texto)] font-semibold">
                      {brokenEdgesFlaggedCount}/{brokenEdges.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[var(--c-suave)]">
                    <span>Decisiones tomadas</span>
                    <span className="font-mono-tabular text-[var(--c-texto)] font-semibold">
                      {Object.keys(decisionChoices).length}/{mission.decisions.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progressive Hints */}
              <div className="space-y-2.5 pt-3 border-t border-[var(--c-linea)]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--c-suave)] flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-[var(--c-oro)]" />
                    <span>Pistas</span>
                  </p>
                  {revealedHintsCount < mission.hints.length && (
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setRevealedHintsCount((c) => c + 1);
                      }}
                      className="text-xs font-medium text-[var(--c-teal)] hover:underline"
                    >
                      Desbloquear pista
                    </button>
                  )}
                </div>

                {revealedHintsCount === 0 ? (
                  <p className="text-xs text-[var(--c-suave)]">
                    Solicita una pista progresiva si necesitas orientación sin revelar la respuesta.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {mission.hints.slice(0, revealedHintsCount).map((hint) => (
                      <div
                        key={hint.id}
                        className="bg-[var(--c-panel)] border border-[var(--c-oro)]/30 rounded-lg p-3 space-y-1.5 text-xs"
                      >
                        <p className="font-semibold text-[var(--c-oro)]">{hint.stepLabel}</p>
                        <p className="text-[var(--c-suave)] leading-relaxed">{hint.text}</p>
                        {hint.academyTopicId && (
                          <button
                            onClick={() => openAcademyTopic(hint.academyTopicId)}
                            className="inline-flex items-center gap-1 text-[11px] text-[var(--c-teal)] hover:underline"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Ver fundamento legal</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Contextual Academy Modal */}
      {activeAcademyTopic && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[var(--c-teal)]">{activeAcademyTopic.category}</p>
                <h3 className="font-display text-lg font-bold text-[var(--c-texto)] mt-0.5">
                  {activeAcademyTopic.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveAcademyTopic(null)}
                className="text-xs text-[var(--c-suave)] hover:text-[var(--c-texto)]"
              >
                Cerrar
              </button>
            </div>
            <p className="text-xs font-mono-tabular text-[var(--c-oro)]">{activeAcademyTopic.legalBasis}</p>
            <p className="text-sm text-[var(--c-suave)] leading-relaxed">{activeAcademyTopic.summary}</p>
            <div className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-lg p-4 space-y-2 text-xs">
              <p className="font-semibold text-[var(--c-texto)]">Ejemplo práctico:</p>
              <p className="text-[var(--c-suave)]">{activeAcademyTopic.practicalExample.scenario}</p>
              <p className="text-[var(--c-teal)] font-medium">
                Resolución: {activeAcademyTopic.practicalExample.resolution}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
