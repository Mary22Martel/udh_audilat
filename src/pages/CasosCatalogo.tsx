import { FlaskConical } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { MissionDetail } from '../components/MissionDetail';
import { Cargando, Encabezado, Pagina, Tarjeta } from '../components/ui';
import { misionesDelAlumno } from '../lib/misiones';
import { useSesion } from '../lib/sesion';
import type { MissionRunResult } from '../types/audit';
import { ComunicacionesCaso, TarjetaCaso, TemasDelCaso } from './alumno/Casos';

const AuditRoom = lazy(() => import('../components/AuditRoom').then((m) => ({ default: m.AuditRoom })));
const MissionBriefingIntro = lazy(() => import('../components/MissionBriefingIntro').then((m) => ({ default: m.MissionBriefingIntro })));
const MissionResults = lazy(() => import('../components/MissionResults').then((m) => ({ default: m.MissionResults })));

/** Todas las misiones con su estado general (sin progreso de alumno). */
const misiones = () => misionesDelAlumno(null);

export function CatalogoCasos({ base }: { base: string }) {
  const navigate = useNavigate();
  return (
    <Pagina>
      <Encabezado
        antetitulo="Casos"
        titulo="Catálogo de casos"
        descripcion="Revisa cada expediente tal como lo ven tus alumnos. Puedes jugarlo en modo prueba: tu intento no se guarda ni cuenta para la clasificación."
      />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {misiones().map((m, i) => (
          <TarjetaCaso key={m.id} m={m} i={i} onAbrir={() => navigate(`${base}/${m.id}`)} />
        ))}
      </div>
      <Tarjeta className="p-5 text-sm text-[var(--c-suave)]">
        El creador de casos para docentes queda para la siguiente etapa. Por ahora los casos se editan en <code className="font-mono text-[var(--c-texto)]">src/data/missionsData.ts</code>.
      </Tarjeta>
    </Pagina>
  );
}

export function DetalleCatalogo({ base, academia }: { base: string; academia: string }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const m = misiones().find((x) => x.id === id);
  if (!m || m.status === 'bloqueado') return <Navigate to={base} replace />;
  return (
    <MissionDetail
      mission={m}
      onBack={() => navigate(base)}
      backLabel="Volver al catálogo"
      startLabel="Probar el caso"
      onStartAudit={() => navigate(`${base}/${m.id}/prueba`)}
      extra={
        <div className="space-y-6">
          <Tarjeta className="p-4 flex items-center gap-3 text-sm border-[var(--c-oro)]/40">
            <FlaskConical className="w-5 h-5 text-[var(--c-oro)]" />
            Modo prueba: puedes jugar el caso completo para conocerlo. Tu intento no se guarda.
          </Tarjeta>
          <ComunicacionesCaso misionId={m.id} />
          <TemasDelCaso misionId={m.id} base={academia} />
        </div>
      }
    />
  );
}

export function SalaPrueba({ base }: { base: string }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [intro, setIntro] = useState(true);
  const m = misiones().find((x) => x.id === id);
  if (!m || m.status === 'bloqueado') return <Navigate to={base} replace />;
  return (
    <Suspense fallback={<Cargando texto="Preparando la sala de auditoría…" />}>
      {intro ? (
        <MissionBriefingIntro mission={m} onStartGameplay={() => setIntro(false)} onCancel={() => navigate(`${base}/${m.id}`)} />
      ) : (
        <AuditRoom
          mission={m}
          onExit={() => navigate(`${base}/${m.id}`)}
          onCompleteMission={(resultado) => navigate(`${base}/${m.id}/resultado`, { state: { resultado }, replace: true })}
        />
      )}
    </Suspense>
  );
}

export function ResultadoPrueba({ base }: { base: string }) {
  const { id } = useParams();
  const { usuario } = useSesion();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { resultado?: MissionRunResult } | null };
  const m = misiones().find((x) => x.id === id);
  if (!m || !state?.resultado) return <Navigate to={`${base}/${id}`} replace />;
  return (
    <Suspense fallback={<Cargando />}>
      <MissionResults
        mission={m}
        result={state.resultado}
        student={{ name: usuario!.nombre, code: '', faculty: '', semester: '', xp: 0, streakDays: 0, completedMissionsCount: 0, casesReviewedCount: 0 }}
        returnLabel="Volver al catálogo"
        onReturnToOperations={() => navigate(base)}
        onReplayMission={() => navigate(`${base}/${m.id}/prueba`)}
      />
    </Suspense>
  );
}
