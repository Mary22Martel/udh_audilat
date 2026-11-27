export type MissionStatus = 'disponible' | 'en_progreso' | 'completado' | 'bloqueado';

export type MissionDifficulty = 'Básico' | 'Intermedio' | 'Avanzado' | 'Experto';

export type DocumentKind =
  | 'carta_sunat'
  | 'factura'
  | 'nota_credito'
  | 'registro_compras'
  | 'registro_ventas'
  | 'estado_bancario'
  | 'pdt_621'
  | 'guia_remision'
  | 'kardex'
  | 'contrato';

export type ClassificationBucketId =
  | 'comprobantes'
  | 'sustentos_pago'
  | 'registros_contables'
  | 'evidencias_operacion';

export interface AnomalyReasonOption {
  id: string;
  label: string;
  isCorrect: boolean;
  explanation: string;
}

export interface InspectableField {
  id: string;
  label: string;
  value: string;
  isAnomaly: boolean;
  xpReward: number;
  academyTopicId?: string;
  options: AnomalyReasonOption[];
}

export interface AuditDocumentRow {
  id: string;
  cells: string[];
  inspectableFieldId?: string;
  highlightHint?: string;
}

export interface AuditDocument {
  id: string;
  code: string;
  title: string;
  kind: DocumentKind;
  date: string;
  issuer: string;
  issuerRuc?: string;
  summary: string;
  correctBucket: ClassificationBucketId;
  isRequiredForDossier: boolean;
  dossierNote?: string;
  structuredMeta: { label: string; value: string; fieldId?: string }[];
  lineItems?: {
    headers: string[];
    rows: AuditDocumentRow[];
  };
  totals?: { label: string; value: string; fieldId?: string; emphasis?: boolean }[];
  narrativeBody?: string[];
  inspectableFields: InspectableField[];
}

export interface DocumentComparisonPair {
  id: string;
  title: string;
  description: string;
  docAId: string;
  docBId: string;
  discrepancyOptions: {
    id: string;
    label: string;
    detail: string;
    isCorrect: boolean;
  }[];
  xpReward: number;
}

export interface EvidenceNode {
  id: string;
  label: string;
  category: 'factura' | 'proveedor' | 'pago' | 'registro' | 'declaracion';
  sublabel: string;
  x: number; // percentage 0..100
  y: number; // percentage 0..100
  linkedDocId?: string;
  status: 'valido' | 'sospechoso' | 'sin_sustento';
}

export interface EvidenceConnection {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  isBroken: boolean;
  issueDescription?: string;
}

export interface NarrativeDecisionOption {
  id: string;
  text: string;
  consequence: string;
  isOptimal: boolean;
  xpDelta: number;
  taxImpact: string;
}

export interface NarrativeDecision {
  id: string;
  senderRole: 'Gerente General' | 'Auditor SUNAT' | 'Asistente Contable';
  senderName: string;
  contextTitle: string;
  prompt: string;
  hint: string;
  options: NarrativeDecisionOption[];
}

export interface MissionTimelineStep {
  id: string;
  date: string;
  title: string;
  status: 'completado' | 'actual' | 'pendiente';
}

export interface MissionHint {
  id: string;
  stepLabel: string;
  text: string;
  academyTopicId?: string;
}

export interface Mission {
  id: string;
  number: string;
  dossierCode: string;
  title: string;
  subtitle: string;
  companyName: string;
  companyRuc: string;
  economicActivity: string;
  procedureType: string;
  taxInvestigated: string;
  taxPeriod: string;
  difficulty: MissionDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  status: MissionStatus;
  unlockRequirementText?: string;
  heroImage: string;
  situation: string;
  objective: string;
  competencies: string[];
  pendingRequirements: string[];
  timeline: MissionTimelineStep[];
  documents: AuditDocument[];
  comparisonPairs: DocumentComparisonPair[];
  evidenceNodes: EvidenceNode[];
  evidenceConnections: EvidenceConnection[];
  decisions: NarrativeDecision[];
  hints: MissionHint[];
  deadlineDaysLeft: number;
  reparoTargetAmount: number;
  isCustomByTeacher?: boolean;
}

export interface NarrativeNotification {
  id: string;
  missionId: string;
  sender: 'SUNAT – Mesa de Partes Virtual' | 'Gerencia General' | 'Coordinación de Auditoría UDH';
  subject: string;
  preview: string;
  fullMessage: string;
  date: string;
  priority: 'critica' | 'normal' | 'informativa';
  read: boolean;
  dueDateLabel?: string;
}

export interface AcademyTopic {
  id: string;
  category: 'Tributos e IGV' | 'Fiscalización SUNAT' | 'Sustento Documental' | 'Impuesto a la Renta';
  title: string;
  summary: string;
  legalBasis: string;
  requirements: string[];
  practicalExample: {
    scenario: string;
    resolution: string;
  };
  auditTip: string;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  criteria: string;
  unlocked: boolean;
  unlockedAt?: string;
  iconKey: 'search' | 'shield' | 'folder' | 'boxes' | 'compass' | 'book' | 'zap' | 'award';
}

export interface MissionRunResult {
  missionId: string;
  completedAt: string;
  durationSeconds: number;
  xpEarned: number;
  accuracyPercent: number;
  anomaliesFound: number;
  anomaliesTotal: number;
  comparisonsSolved: number;
  comparisonsTotal: number;
  classificationsCorrect: number;
  classificationsTotal: number;
  brokenLinksFlagged: number;
  brokenLinksTotal: number;
  decisionsOptimal: number;
  decisionsTotal: number;
  dossierScorePercent: number;
  errorsCount: number;
  strengths: string[];
  improvements: string[];
  developedCompetencies: string[];
  newlyUnlockedBadges: string[];
  selectedDossierDocIds: string[];
  rankGrade: 'S' | 'A' | 'B' | 'C';
  integrityRemaining: number;
  maxCombo: number;
  decisionSummaries: {
    title: string;
    chosenOption: string;
    isOptimal: boolean;
    consequence: string;
  }[];
}

export interface StudentProfile {
  name: string;
  code: string;
  faculty: string;
  semester: string;
  xp: number;
  streakDays: number;
  completedMissionsCount: number;
  casesReviewedCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  code: string;
  levelTitle: string;
  xp: number;
  accuracy: number;
  missionsCompleted: number;
  isCurrentUser?: boolean;
}
