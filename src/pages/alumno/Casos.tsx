import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, BookOpen, CheckCircle2, Clock, Lock, Mail, RotateCcw, Trophy } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { MissionDetail } from '../../components/MissionDetail';
import { ResilientImage } from '../../components/ResilientImage';
import { Cargando, Encabezado, Pagina, Tarjeta } from '../../components/ui';
import { ACADEMY_TOPICS } from '../../data/academyData';
import { comunicacionesDe, perfilAlumno } from '../../lib/misiones';
import { MISIONES_POR_TEMA } from '../../lib/reglas';
import { useSesion } from '../../lib/sesion';
import type { Mission, MissionRunResult } from '../../types/audit';
import { useAlumno } from './datos';

const AuditRoom = lazy(() => import('../../components/AuditRoom').then((m) => ({ default: m.AuditRoom })));
const MissionBriefingIntro = lazy(() => import('../../components/MissionBriefingIntro').then((m) => ({ default: m.MissionBriefingIntro })));
const MissionResults = lazy(() => import('../../components/MissionResults').then((m) => ({ default: m.MissionResults })));

type Filtro = 'todos' | 'pendientes' | 'resueltos';

export function TarjetaCaso({ m, mejor, onAbrir, i }: { m: Mission; mejor?: { xp: number; precision: number; rango: string }; onAbrir: () => void; i: number }) {
  const bloqueada = m.status === 'bloqueado';
  const hecha = m.status === 'completado';
  const esquela = comunicacionesDe(m.id)[0];
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay: i * 0.04 }}
      onClick={onAbrir}
      disabled={bloqueada}
      className={`group text-left bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-2xl overflow-hidden shadow-tema flex flex-col transition-all ${
        bloqueada ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-1 hover:border-[var(--c-teal)]/50 hover:shadow-xl'
      }`}
    >
      <div className="relative h-36 overflow-hidden">
        <ResilientImage
          src={m.heroImage}
          alt=""
          className={`w-full h-full object-cover transition-transform duration-500 ${bloqueada ? 'grayscale' : 'group-hover:scale-105'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute top-3 left-3 text-[11px] font-mono-tabular font-semibold px-2 py-1 rounded-md bg-black/50 text-white backdrop-blur">
          {m.number} · {m.dossierCode}
        </span>
        <span
          className={`absolute top-3 right-3 text-[11px] font-semibold px-2 py-1 rounded-md backdrop-blur ${
            hecha ? 'bg-[#48a6a7] text-white' : bloqueada ? 'bg-black/50 text-white/80' : 'bg-[#f2b632] text-[#1a1406]'
          }`}
        >
          {hecha ? `Resuelto · ${mejor?.rango ?? ''}` : bloqueada ? 'En preparación' : 'Por resolver'}
        </span>
        <p className="absolute bottom-3 left-3 right-3 text-white text-xs font-medium truncate">{m.companyName}</p>
      </div>
      <div className="p-5 flex-1 flex flex-col gap-3">
        <h3 className="font-display font-bold text-lg leading-tight text-[var(--c-texto)]">{m.title}</h3>
        {esquela && !bloqueada && (
          <p className="text-xs text-[var(--c-suave)] flex items-start gap-2">
            <Mail className="w-3.5 h-3.5 text-[var(--c-oro)] shrink-0 mt-0.5" />
            <span className="line-clamp-2">{esquela.subject}</span>
          </p>
        )}
        {bloqueada && <p className="text-xs text-[var(--c-suave)] flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Caso en preparación por el equipo docente.</p>}
        <div className="mt-auto pt-3 border-t border-[var(--c-linea)] flex items-center justify-between text-xs text-[var(--c-suave)]">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {m.estimatedMinutes} min · {m.difficulty}
          </span>
          {hecha ? (
            <span className="font-mono-tabular font-semibold text-[var(--c-oro)]">{mejor?.xp} XP · {mejor?.precision} %</span>
          ) : (
            !bloqueada && <span className="font-mono-tabular font-semibold text-[var(--c-oro)]">hasta +{m.xpReward} XP</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export function CasosLista() {
  const { estado, misiones } = useAlumno();
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const visibles = misiones.filter((m) =>
    filtro === 'todos' ? true : filtro === 'resueltos' ? m.status === 'completado' : m.status === 'disponible'
  );
  const cuenta = { todos: misiones.length, pendientes: misiones.filter((m) => m.status === 'disponible').length, resueltos: estado.completadas.length };

  return (
    <Pagina>
      <Encabezado
        antetitulo="Mis casos"
        titulo="Expedientes de fiscalización"
        descripcion="Cada caso empieza con una comunicación de SUNAT o de la gerencia. Ábrelo, revisa la evidencia y presenta tu expediente."
      />
      <div className="flex items-center gap-1 p-1 bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl w-fit">
        {(['todos', 'pendientes', 'resueltos'] as Filtro[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === f ? 'text-[var(--c-texto)]' : 'text-[var(--c-suave)] hover:text-[var(--c-texto)]'}`}
          >
            {filtro === f && <motion.span layoutId="filtro-casos" className="absolute inset-0 rounded-lg bg-[var(--c-elevado)]" />}
            <span className="relative">
              {{ todos: 'Todos', pendientes: 'Por resolver', resueltos: 'Resueltos' }[f]} <span className="font-mono-tabular text-xs text-[var(--c-suave)]">{cuenta[f]}</span>
            </span>
          </button>
        ))}
      </div>
      <motion.div layout className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {visibles.map((m, i) => (
            <TarjetaCaso key={m.id} m={m} i={i} mejor={estado.mejores[m.id]} onAbrir={() => navigate(`/app/casos/${m.id}`)} />
          ))}
        </AnimatePresence>
      </motion.div>
      {visibles.length === 0 && <p className="text-sm text-[var(--c-suave)]">No hay casos en esta lista.</p>}
    </Pagina>
  );
}

/** Esquela de SUNAT y mensajes de la gerencia con los que empieza el caso. */
export function ComunicacionesCaso({ misionId }: { misionId: string }) {
  const comunicaciones = comunicacionesDe(misionId);
  if (!comunicaciones.length) return null;
  return (
    <section className="space-y-3">
      <h3 className="font-display font-bold flex items-center gap-2">
        <Mail className="w-4 h-4 text-[var(--c-oro)]" /> Cómo llegó este caso
      </h3>
      <div className="grid lg:grid-cols-2 gap-4">
        {comunicaciones.map((c, i) => {
          const sunat = c.sender.startsWith('SUNAT');
          return (
            <motion.article
              key={c.id}
              initial={{ opacity: 0, y: 10, rotate: sunat ? -0.4 : 0.4 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.08 * i }}
              className={
                sunat
                  ? 'relative bg-[#fbfaf6] text-slate-800 rounded-xl p-5 border border-slate-200 shadow-lg'
                  : 'bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl p-5 shadow-tema'
              }
            >
              {sunat && <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl bg-gradient-to-r from-[#c8102e] via-[#c8102e] to-[#1f3a68]" />}
              <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className={`font-semibold uppercase tracking-wider ${sunat ? 'text-[#c8102e]' : 'text-[var(--c-oro)]'}`}>
                  {sunat ? 'Buzón SOL · ' : ''}
                  {c.sender}
                </span>
                {c.dueDateLabel && (
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${sunat ? 'bg-rose-50 text-rose-700' : 'bg-[var(--c-oro)]/15 text-[var(--c-oro)]'}`}>
                    {c.dueDateLabel}
                  </span>
                )}
              </div>
              <h4 className={`font-display font-bold mt-2 ${sunat ? 'text-slate-900' : 'text-[var(--c-texto)]'}`}>{c.subject}</h4>
              <p className={`text-sm leading-relaxed mt-2 ${sunat ? 'text-slate-700' : 'text-[var(--c-suave)]'}`}>{c.fullMessage}</p>
              {sunat && <p className="text-[10px] text-slate-400 mt-3 italic">Documento simulado con fines educativos. Sin conexión real con SUNAT.</p>}
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

export function TemasDelCaso({ misionId, base }: { misionId: string; base: string }) {
  const temas = ACADEMY_TOPICS.filter((t) => (MISIONES_POR_TEMA[t.id] ?? []).includes(misionId));
  if (!temas.length) return null;
  return (
    <Tarjeta className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <span className="w-10 h-10 rounded-xl bg-[var(--c-teal)]/12 text-[var(--c-teal)] flex items-center justify-center shrink-0">
        <BookOpen className="w-5 h-5" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--c-texto)]">Antes de entrar, repasa en la Academia</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {temas.map((t) => (
            <Link key={t.id} to={`${base}?tema=${t.id}`} className="text-xs px-3 py-1.5 rounded-full border border-[var(--c-linea-fuerte)] hover:border-[var(--c-teal)] hover:text-[var(--c-teal)] transition-colors">
              {t.title}
            </Link>
          ))}
        </div>
      </div>
    </Tarjeta>
  );
}

export function CasoDetalle() {
  const { id } = useParams();
  const { misiones, estado } = useAlumno();
  const navigate = useNavigate();
  const mision = misiones.find((m) => m.id === id);
  if (!mision || mision.status === 'bloqueado') return <Navigate to="/app/casos" replace />;
  const mejor = estado.mejores[mision.id];
  const intentos = estado.resultados.filter((r) => r.missionId === mision.id).length;

  return (
    <MissionDetail
      mission={mision}
      onBack={() => navigate('/app/casos')}
      onStartAudit={() => navigate(`/app/casos/${mision.id}/sala`)}
      startLabel={mejor ? 'Repetir y mejorar mi marca' : 'Iniciar sala de auditoría'}
      extra={
        <div className="space-y-6">
          {mejor && (
            <Tarjeta className="p-5 flex flex-wrap items-center gap-x-8 gap-y-3">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--c-teal)]">
                <Trophy className="w-4 h-4" /> Tu mejor marca
              </span>
              <span className="text-sm">
                Rango <strong className="font-display text-[var(--c-oro)]">{mejor.rango}</strong>
              </span>
              <span className="text-sm font-mono-tabular">{mejor.xp} XP</span>
              <span className="text-sm font-mono-tabular">{mejor.precision} % de precisión</span>
              <span className="text-xs text-[var(--c-suave)] inline-flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> {intentos} {intentos === 1 ? 'intento' : 'intentos'}. Repetir solo suma XP si superas tu marca.
              </span>
            </Tarjeta>
          )}
          <ComunicacionesCaso misionId={mision.id} />
          <TemasDelCaso misionId={mision.id} base="/app/academia" />
        </div>
      }
    />
  );
}

export function SalaAlumno() {
  const { id } = useParams();
  const { misiones, registrar } = useAlumno();
  const navigate = useNavigate();
  const [intro, setIntro] = useState(true);
  const [pendiente, setPendiente] = useState<MissionRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const mision = misiones.find((m) => m.id === id);
  if (!mision || mision.status === 'bloqueado') return <Navigate to="/app/casos" replace />;

  const enviar = async (r: MissionRunResult) => {
    setPendiente(r);
    setEnviando(true);
    setError(null);
    try {
      await registrar(r);
      navigate(`/app/casos/${mision.id}/resultado`, { replace: true });
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Suspense fallback={<Cargando texto="Preparando la sala de auditoría…" />}>
      {intro ? (
        <MissionBriefingIntro mission={mision} onStartGameplay={() => setIntro(false)} onCancel={() => navigate(`/app/casos/${mision.id}`)} />
      ) : (
        <AuditRoom key={mision.id} mission={mision} onExit={() => navigate(`/app/casos/${mision.id}`)} onCompleteMission={enviar} />
      )}
      {(enviando || error) && pendiente && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
            {enviando ? (
              <>
                <div className="w-10 h-10 mx-auto rounded-full border-2 border-[var(--c-teal)]/25 border-t-[var(--c-teal)] animate-spin" />
                <p className="text-sm text-[var(--c-texto)]">Presentando tu expediente…</p>
              </>
            ) : (
              <>
                <AlertTriangle className="w-8 h-8 mx-auto text-rose-400" />
                <p className="text-sm text-[var(--c-texto)]">No se pudo guardar tu resultado: {error}</p>
                <p className="text-xs text-[var(--c-suave)]">Tu trabajo sigue aquí. Revisa tu conexión y vuelve a intentarlo.</p>
                <button onClick={() => enviar(pendiente)} className="w-full py-2.5 rounded-xl bg-[var(--c-teal)] text-[var(--c-sobre)] text-sm font-semibold">
                  Reintentar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Suspense>
  );
}

export function ResultadoAlumno() {
  const { id } = useParams();
  const { ultimo, misiones, estado } = useAlumno();
  const { usuario } = useSesion();
  const navigate = useNavigate();
  const mision = misiones.find((m) => m.id === id);
  if (!mision || !ultimo || ultimo.resultado.missionId !== mision.id) return <Navigate to={`/app/casos/${id}`} replace />;

  return (
    <Suspense fallback={<Cargando />}>
      {ultimo.registro.insigniasNuevas.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1100px] mx-auto px-4 sm:px-8 pt-8 -mb-4">
          <div className="rounded-xl bg-[var(--c-oro)]/12 border border-[var(--c-oro)]/40 px-4 py-3 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[var(--c-oro)]" />
            <span>
              ¡Ganaste {ultimo.registro.insigniasNuevas.length === 1 ? 'una insignia nueva' : `${ultimo.registro.insigniasNuevas.length} insignias nuevas`}! Mírala en{' '}
              <Link to="/app/perfil" className="font-semibold underline">tu perfil</Link>.
            </span>
          </div>
        </motion.div>
      )}
      <MissionResults
        mission={mision}
        result={ultimo.resultado}
        student={perfilAlumno(usuario!, estado)}
        registro={ultimo.registro}
        onReturnToOperations={() => navigate('/app/casos')}
        onReplayMission={() => navigate(`/app/casos/${mision.id}/sala`)}
      />
    </Suspense>
  );
}
