import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Check, Flame, GraduationCap, Lock, Mail, Play, Radio, ShieldCheck, Star, TrendingUp, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ResilientImage } from '../../components/ResilientImage';
import { BarrasCompetencias, Cifra, Pagina, Tarjeta } from '../../components/ui';
import { ACADEMY_TOPICS } from '../../data/academyData';
import { LECCIONES, MODULOS } from '../../data/academiaCurso';
import { api, type Clasificacion, type ProgresoAcademia, type ResumenProyecto } from '../../lib/api';
import { comunicacionesDe, siguienteMision } from '../../lib/misiones';
import { COMPETENCIAS, REPASO_POR_COMPETENCIA, type CompetenciaId } from '../../lib/reglas';
import { useSesion } from '../../lib/sesion';
import { useAlumno } from './datos';

function saludo() {
  const h = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Lima' }));
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

/** Anillo de progreso hacia el siguiente nivel. */
function Anillo({ pct }: { pct: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--c-hondo)" strokeWidth="9" />
      <motion.circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--c-teal)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - pct / 100) }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
      />
    </svg>
  );
}

export function Inicio() {
  const { usuario } = useSesion();
  const { estado, misiones } = useAlumno();
  const navigate = useNavigate();
  const [clasif, setClasif] = useState<Clasificacion | null>(null);
  const [academia, setAcademia] = useState<ProgresoAcademia | null>(null);
  const [vivos, setVivos] = useState<ResumenProyecto[]>([]);

  useEffect(() => {
    api.get<Clasificacion>('/api/clasificacion?tipo=academia').then(setClasif).catch(() => setClasif({ tipo: 'academia', aula: null, puestos: [] }));
    api.get<ProgresoAcademia>('/api/academia').then(setAcademia).catch(() => undefined);
    api
      .get<{ proyectos: ResumenProyecto[] }>('/api/alumno/proyectos')
      .then((r) => setVivos(r.proyectos.filter((p) => p.estado === 'sala' || p.estado === 'en_curso')))
      .catch(() => undefined);
  }, [estado.xp]);
  const puestos = clasif?.puestos ?? null;
  const leccionesHechas = academia ? LECCIONES.filter((l) => academia.lecciones[l.id]?.completada).length : 0;
  const sigLeccion = academia ? LECCIONES.find((l) => academia.lecciones[l.id]?.desbloqueada && !academia.lecciones[l.id]?.completada) : undefined;
  const moduloSig = sigLeccion ? MODULOS.find((m) => m.id === sigLeccion.moduloId) : undefined;

  const proxima = siguienteMision(misiones, estado);
  const esquela = proxima ? comunicacionesDe(proxima.id).find((c) => c.sender.startsWith('SUNAT')) ?? comunicacionesDe(proxima.id)[0] : undefined;
  const { nivel, siguienteNivel } = estado;
  const pct = siguienteNivel ? Math.min(100, Math.round(((estado.xp - nivel.minXp) / (siguienteNivel.minXp - nivel.minXp)) * 100)) : 100;
  const activas = misiones.filter((m) => m.status !== 'bloqueado');
  const nombre = usuario!.nombre.split(' ')[0];
  const yo = puestos?.find((p) => p.esYo);

  // La competencia más baja sugiere qué repasar.
  const evaluadas = COMPETENCIAS.filter((c) => estado.competencias[c.id] !== null);
  const masBaja = [...evaluadas].sort((a, b) => estado.competencias[a.id]! - estado.competencias[b.id]!)[0];
  const temaSugerido = masBaja ? ACADEMY_TOPICS.find((t) => t.id === REPASO_POR_COMPETENCIA[masBaja.id as CompetenciaId][0]) : undefined;

  return (
    <Pagina>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--c-teal)] mb-2">Centro de operaciones</p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            {saludo()}, {nombre}.
          </h1>
          <p className="text-[var(--c-suave)] mt-1">
            {leccionesHechas === 0
              ? 'Empieza por la Academia: aprende lo básico y luego ponlo a prueba en las misiones.'
              : `Llevas ${leccionesHechas} de ${LECCIONES.length} lecciones en la Academia y ${estado.completadas.length} de ${activas.length} misiones.`}
          </p>
        </div>
        {estado.aulas[0] && <p className="text-xs text-[var(--c-suave)]">{estado.aulas[0].nombre} · {estado.aulas[0].docente}</p>}
      </motion.div>

      {vivos.map((p) => (
        <motion.button
          key={p.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => navigate(`/app/proyectos/${p.id}`)}
          className="w-full text-left flex items-center gap-4 rounded-2xl p-4 bg-rose-600 text-white shadow-lg shadow-rose-600/30"
        >
          <Radio className="w-6 h-6 animate-pulse shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-black tracking-wider">{p.estado === 'en_curso' ? 'COMPETENCIA EN VIVO' : 'SALA ABIERTA'}</span>
            <span className="block font-display font-bold truncate">{p.nombre} · {p.miEquipo?.nombre}</span>
          </span>
          <span className="font-bold inline-flex items-center gap-1">Entrar <ArrowRight className="w-4 h-4" /></span>
        </motion.button>
      ))}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-[#0b1a26] text-white p-6 sm:p-7 flex flex-col md:flex-row md:items-center gap-5">
        <div className="absolute -right-16 -top-20 w-72 h-72 rounded-full bg-[#48a6a7]/20 blur-3xl" />
        <span className="relative w-14 h-14 rounded-2xl bg-[#48a6a7] flex items-center justify-center shrink-0">
          <GraduationCap className="w-7 h-7" />
        </span>
        <div className="relative flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7fd0d1]">Academia · ruta de certificación</p>
          <p className="font-display text-xl sm:text-2xl font-extrabold mt-1">
            {sigLeccion ? `Sigue con «${sigLeccion.titulo}»` : leccionesHechas ? '¡Completaste todas las lecciones!' : 'Empieza tu certificación'}
          </p>
          <p className="text-sm text-white/65">
            {moduloSig ? `Módulo ${moduloSig.numero}: ${moduloSig.titulo}` : 'Repite lecciones para conseguir 3 estrellas.'} · {leccionesHechas}/{LECCIONES.length} lecciones
          </p>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden max-w-md">
            <motion.div className="h-full bg-gradient-to-r from-[#48a6a7] to-[#f2b632]" initial={{ width: 0 }} animate={{ width: `${(leccionesHechas / LECCIONES.length) * 100}%` }} transition={{ duration: 0.9 }} />
          </div>
        </div>
        <button
          onClick={() => navigate(sigLeccion ? `/app/academia/leccion/${sigLeccion.id}` : '/app/academia')}
          className="relative shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#f2b632] text-[#1a1406] font-bold hover:brightness-105"
        >
          <Play className="w-4 h-4 fill-current" /> {sigLeccion ? 'Jugar lección' : 'Ver la ruta'}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Siguiente caso */}
        {proxima && (
          <Tarjeta className="lg:col-span-8 overflow-hidden relative min-h-[300px] flex">
            <ResilientImage src={proxima.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#08121c] via-[#08121c]/85 to-[#08121c]/30" />
            <div className="relative p-6 sm:p-8 flex flex-col justify-between gap-6 text-white w-full">
              <div className="space-y-3 max-w-xl">
                <p className="text-xs font-mono-tabular text-[#f2b632]">
                  Misión libre · {proxima.status === 'completado' ? 'mejora tu marca' : 'tu siguiente caso'} · {proxima.number} · {proxima.dossierCode}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">{proxima.title}</h2>
                <p className="text-sm text-white/75">
                  {proxima.companyName} · {proxima.taxInvestigated}
                </p>
              </div>
              {esquela && (
                <div className="max-w-xl rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4 flex gap-3">
                  <Mail className="w-5 h-5 text-[#f2b632] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-white/70">
                      {esquela.sender} {esquela.dueDateLabel && <span className="text-[#f2b632]">· {esquela.dueDateLabel}</span>}
                    </p>
                    <p className="text-sm font-semibold mt-0.5">{esquela.subject}</p>
                    <p className="text-xs text-white/70 mt-1 line-clamp-2">{esquela.preview}</p>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate(`/app/casos/${proxima.id}`)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#48a6a7] hover:bg-[#3d9495] text-white text-sm font-semibold transition-colors"
                >
                  Abrir expediente <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-white/70">
                  {proxima.difficulty} · {proxima.estimatedMinutes} min · <span className="text-[#f2b632] font-semibold">hasta +{proxima.xpReward} XP</span>
                </span>
              </div>
            </div>
          </Tarjeta>
        )}

        {/* Rango */}
        <Tarjeta className="lg:col-span-4 p-6 flex flex-col items-center text-center justify-center gap-3" retraso={0.05}>
          <p className="text-xs text-[var(--c-suave)]">Tu rango</p>
          <div className="relative">
            <Anillo pct={pct} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-extrabold">{nivel.level}</span>
              <span className="text-[10px] uppercase tracking-wider text-[var(--c-suave)]">nivel</span>
            </div>
          </div>
          <p className="font-display text-lg font-bold">{nivel.title}</p>
          <p className="text-xs text-[var(--c-suave)]">
            {siguienteNivel ? (
              <>
                Te faltan <strong className="text-[var(--c-oro)] font-mono-tabular">{(siguienteNivel.minXp - estado.xp).toLocaleString('es-PE')} XP</strong> para{' '}
                {siguienteNivel.title}
              </>
            ) : (
              'Llegaste al rango máximo.'
            )}
          </p>
        </Tarjeta>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Cifra etiqueta="Experiencia total" valor={`${estado.xp.toLocaleString('es-PE')} XP`} icono={TrendingUp} tono="oro" detalle={`${estado.xpAcademia.toLocaleString('es-PE')} de la Academia`} />
        <Cifra etiqueta="Lecciones de la Academia" valor={`${leccionesHechas} / ${LECCIONES.length}`} icono={Star} detalle={academia?.precision != null ? `${academia.precision} % de aciertos` : 'Aún sin responder'} retraso={0.05} />
        <Cifra etiqueta="Misiones resueltas" valor={`${estado.completadas.length} / ${activas.length}`} icono={ShieldCheck} tono="texto" detalle={`${estado.xpMisiones.toLocaleString('es-PE')} XP en misiones`} retraso={0.1} />
        <Cifra etiqueta="Racha" valor={`${estado.racha} ${estado.racha === 1 ? 'día' : 'días'}`} icono={Flame} tono="oro" detalle="Días seguidos practicando" retraso={0.15} />
      </div>

      {/* Ruta de casos */}
      <Tarjeta className="p-6" retraso={0.1}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold">Misiones · práctica libre</h3>
          <Link to="/app/casos" className="text-xs font-medium text-[var(--c-teal)] hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="relative overflow-x-auto pb-2">
          <div className="flex items-start min-w-[640px]">
            {misiones.map((m, i) => {
              const hecha = m.status === 'completado';
              const bloqueada = m.status === 'bloqueado';
              const actual = m.id === proxima?.id && !hecha;
              const mejor = estado.mejores[m.id];
              return (
                <div key={m.id} className="flex-1 flex flex-col items-center relative">
                  {i > 0 && (
                    <div className={`absolute top-6 right-1/2 w-full h-[3px] -z-0 ${misiones[i - 1].status === 'completado' ? 'bg-[var(--c-teal)]' : 'bg-[var(--c-elevado)]'}`} />
                  )}
                  <button
                    disabled={bloqueada}
                    onClick={() => navigate(`/app/casos/${m.id}`)}
                    className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center font-display font-extrabold text-sm transition-transform enabled:hover:scale-110 ${
                      hecha
                        ? 'bg-[var(--c-teal)] text-[var(--c-sobre)]'
                        : actual
                          ? 'bg-[var(--c-panel)] border-[3px] border-[var(--c-oro)] text-[var(--c-oro)]'
                          : bloqueada
                            ? 'bg-[var(--c-hondo)] text-[var(--c-tenue)] cursor-not-allowed'
                            : 'bg-[var(--c-panel)] border-2 border-[var(--c-linea-fuerte)] text-[var(--c-texto)]'
                    }`}
                    aria-label={`${m.number}: ${m.title}`}
                  >
                    {actual && <span className="absolute inset-0 rounded-full border-2 border-[var(--c-oro)] animate-ping opacity-40" />}
                    {hecha ? mejor?.rango ?? <Check className="w-5 h-5" /> : bloqueada ? <Lock className="w-4 h-4" /> : m.number.replace(/\D/g, '')}
                  </button>
                  <p className={`mt-2 text-[11px] font-medium text-center px-1 leading-tight ${bloqueada ? 'text-[var(--c-tenue)]' : 'text-[var(--c-texto)]'}`}>{m.title}</p>
                  <p className="text-[10px] font-mono-tabular text-[var(--c-suave)] mt-0.5">
                    {hecha ? `${mejor?.xp} XP` : bloqueada ? 'Pronto' : actual ? 'Siguiente' : m.difficulty}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Tarjeta>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Tarjeta className="lg:col-span-7 p-6 space-y-5" retraso={0.15}>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold">Tus competencias en las misiones</h3>
            <span className="text-xs text-[var(--c-suave)]">Promedio de tus intentos</span>
          </div>
          {estado.intentos === 0 ? (
            <p className="text-sm text-[var(--c-suave)]">Cuando termines tu primera misión verás aquí qué tan bien te va en cada fase de la auditoría.</p>
          ) : (
            <BarrasCompetencias valores={estado.competencias} compacto />
          )}
          {temaSugerido && masBaja && estado.competencias[masBaja.id]! < 80 && (
            <Link
              to={`/app/academia/fichas?tema=${temaSugerido.id}`}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--c-oro)]/10 border border-[var(--c-oro)]/30 hover:border-[var(--c-oro)]/60 transition-colors"
            >
              <BookOpen className="w-5 h-5 text-[var(--c-oro)] shrink-0" />
              <span className="text-sm flex-1">
                Para mejorar en <strong>{masBaja.nombre.toLowerCase()}</strong>, repasa la ficha <strong>«{temaSugerido.title}»</strong>.
              </span>
              <ArrowRight className="w-4 h-4 text-[var(--c-oro)]" />
            </Link>
          )}
        </Tarjeta>

        <Tarjeta className="lg:col-span-5 p-6 space-y-4" retraso={0.2}>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[var(--c-oro)]" /> {clasif?.aula ? 'Academia · tu aula' : 'Clasificación'}
            </h3>
            <Link to="/app/clasificacion" className="text-xs font-medium text-[var(--c-teal)] hover:underline">
              Ver podio
            </Link>
          </div>
          {puestos === null ? (
            <div className="h-32 animate-pulse rounded-xl bg-[var(--c-hondo)]" />
          ) : !clasif?.aula ? (
            <p className="text-sm text-[var(--c-suave)]">
              Únete al aula de tu docente en <Link to="/app/aulas" className="text-[var(--c-teal)] font-semibold hover:underline">Mis aulas</Link> para competir con tus compañeros.
            </p>
          ) : (
            <div className="space-y-2">
              {puestos.slice(0, 3).map((p) => (
                <div key={p.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${p.esYo ? 'bg-[var(--c-teal)]/12' : ''}`}>
                  <span className="text-lg w-6 text-center">{['🥇', '🥈', '🥉'][p.puesto - 1]}</span>
                  <span className="flex-1 text-sm font-medium truncate">{p.nombre}</span>
                  <span className="text-xs font-mono-tabular font-semibold text-[var(--c-oro)]">{p.xp.toLocaleString('es-PE')} XP</span>
                </div>
              ))}
              {yo && yo.puesto > 3 && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--c-teal)]/12 border-t border-[var(--c-linea)]">
                  <span className="w-6 text-center text-sm font-mono-tabular font-bold text-[var(--c-teal)]">#{yo.puesto}</span>
                  <span className="flex-1 text-sm font-medium truncate">Tú</span>
                  <span className="text-xs font-mono-tabular font-semibold text-[var(--c-oro)]">{yo.xp.toLocaleString('es-PE')} XP</span>
                </div>
              )}
              {yo && (
                <p className="text-[11px] text-[var(--c-suave)] pt-1">
                  {yo.puesto === 1
                    ? 'Vas primero. ¡Defiende tu puesto!'
                    : `Te faltan ${(puestos[yo.puesto - 2].xp - yo.xp + 1).toLocaleString('es-PE')} XP para pasar al puesto ${yo.puesto - 1}.`}
                </p>
              )}
            </div>
          )}
        </Tarjeta>
      </div>
    </Pagina>
  );
}
