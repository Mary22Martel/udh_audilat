import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Boxes, Landmark, Lock, Percent, Play, Receipt, RotateCcw, Scale, Star, Timer, Trophy, type LucideIcon, School } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CajaError, Cargando, Pagina, Tarjeta, colorNivel } from '../../components/ui';
import { LECCIONES, MODULOS, type Modulo } from '../../data/academiaCurso';
import { INITIAL_MISSIONS } from '../../data/missionsData';
import { api, type ProgresoAcademia } from '../../lib/api';

export const ICONO_MODULO: Record<Modulo['icono'], LucideIcon> = { receipt: Receipt, percent: Percent, book: BookOpen, boxes: Boxes, scale: Scale, landmark: Landmark };

function Estrellas({ n, tam = 'w-4 h-4' }: { n: number; tam?: string }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star key={i} className={`${tam} ${i <= n ? 'text-[var(--c-oro)] fill-[var(--c-oro)]' : 'text-[var(--c-tenue)]'}`} />
      ))}
    </span>
  );
}

export function Ruta() {
  const navigate = useNavigate();
  const [p, setP] = useState<ProgresoAcademia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cargar = () => api.get<ProgresoAcademia>('/api/academia').then(setP).catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
  }, []);
  if (error) return <CajaError mensaje={error} onReintentar={cargar} />;
  if (!p) return <Cargando texto="Abriendo tu ruta de certificación…" />;

  const completas = LECCIONES.filter((l) => p.lecciones[l.id]?.completada).length;
  const estrellas = LECCIONES.reduce((s, l) => s + (p.lecciones[l.id]?.estrellas ?? 0), 0);
  const avance = Math.round((completas / LECCIONES.length) * 100);
  const siguiente = LECCIONES.find((l) => p.lecciones[l.id]?.desbloqueada && !p.lecciones[l.id]?.completada);

  return (
    <Pagina>
      {/* Cabecera */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-[var(--h-fondo)] text-[var(--h-texto)] p-6 sm:p-8">
        <div className="absolute inset-0 opacity-[0.07] bg-[repeating-linear-gradient(0deg,transparent,transparent_23px,var(--h-linea)_23px,var(--h-linea)_24px)]" />
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-[#48a6a7]/20 blur-3xl" />
        <div className="relative grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--h-acento)]">Academia · Ruta de certificación</p>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight">Certifícate como auditor junior</h1>
            <p className="text-[var(--h-suave)] max-w-lg">Seis módulos de contabilidad y tributación. Cada lección es una prueba de campo: si te equivocas tres veces, el expediente queda observado.</p>
            {siguiente && (
              <button
                onClick={() => navigate(`/app/academia/leccion/${siguiente.id}`)}
                className="mt-2 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#48a6a7] hover:bg-[#3d9495] text-white font-semibold transition-colors"
              >
                <Play className="w-4 h-4 fill-white" /> Continuar: {siguiente.titulo}
              </button>
            )}
          </div>
          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            {[
              { v: `${avance} %`, t: 'certificación', s: `${completas}/${LECCIONES.length} lecciones` },
              { v: estrellas, t: 'estrellas', s: `de ${LECCIONES.length * 3}` },
              { v: p.xp.toLocaleString('es-PE'), t: 'XP Academia', s: p.precision !== null ? `${p.precision} % aciertos` : 'sin respuestas' },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl bg-[var(--h-vidrio)] border border-[var(--h-borde)] p-4 text-center">
                <p className="font-display text-2xl font-extrabold text-[var(--h-oro)]">{x.v}</p>
                <p className="text-[11px] uppercase tracking-wider text-[var(--h-tenue)] mt-0.5">{x.t}</p>
                <p className="text-[10px] text-[var(--h-tenue)] mt-1">{x.s}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative mt-6 h-2 rounded-full bg-[var(--h-borde)] overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-[#48a6a7] to-[#f2b632]" initial={{ width: 0 }} animate={{ width: `${avance}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
        </div>
      </motion.div>

      {p.preguntasDeTuDocente > 0 && (
        <Tarjeta className="p-4 flex items-center gap-3 border-[var(--c-teal)]/40">
          <School className="w-5 h-5 text-[var(--c-teal)] shrink-0" />
          <p className="text-sm">
            Tu docente agregó <strong>{p.preguntasDeTuDocente} {p.preguntasDeTuDocente === 1 ? 'pregunta' : 'preguntas'}</strong> a tus lecciones. Las verás marcadas como «Pregunta de tu docente».
          </p>
        </Tarjeta>
      )}

      {/* Modos de juego */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Tarjeta className="p-5 flex items-center gap-4 overflow-hidden relative">
          <span className="w-14 h-14 rounded-2xl bg-[var(--c-oro)]/15 text-[var(--c-oro)] flex items-center justify-center shrink-0">
            <Timer className="w-7 h-7" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold">Contrarreloj · {p.segundosContrarreloj} s</p>
            <p className="text-xs text-[var(--c-suave)]">Responde todo lo que puedas de las lecciones que ya abriste. Tu récord: <strong className="text-[var(--c-oro)] font-mono">{p.recordContrarreloj}</strong></p>
          </div>
          <button onClick={() => navigate('/app/academia/contrarreloj')} className="px-4 py-2.5 rounded-xl bg-[var(--c-oro)] text-[#1a1406] text-sm font-bold">
            Jugar
          </button>
        </Tarjeta>
        <Tarjeta className="p-5 flex items-center gap-4" retraso={0.05}>
          <span className="w-14 h-14 rounded-2xl bg-rose-500/12 text-rose-400 flex items-center justify-center shrink-0">
            <RotateCcw className="w-7 h-7" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold">Repaso de observados</p>
            <p className="text-xs text-[var(--c-suave)]">
              {p.observadas ? `Tienes ${p.observadas} ${p.observadas === 1 ? 'pregunta' : 'preguntas'} que fallaste. Corrígelas para limpiar tu expediente.` : 'No tienes preguntas pendientes. ¡Expediente limpio!'}
            </p>
          </div>
          <button
            disabled={!p.observadas}
            onClick={() => navigate('/app/academia/repaso')}
            className="px-4 py-2.5 rounded-xl bg-[var(--c-elevado)] text-sm font-bold disabled:opacity-40"
          >
            Repasar
          </button>
        </Tarjeta>
      </div>

      {/* Módulos */}
      <div className="space-y-5">
        {MODULOS.map((m, mi) => {
          const Icono = ICONO_MODULO[m.icono];
          const hechas = m.lecciones.filter((l) => p.lecciones[l.id]?.completada).length;
          const abierto = p.lecciones[m.lecciones[0].id]?.desbloqueada;
          const prec = p.modulos[m.id]?.precision ?? null;
          const mision = INITIAL_MISSIONS.find((x) => x.id === m.mision);
          return (
            <motion.section
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: mi * 0.03 }}
              className={`rounded-3xl border ${abierto ? 'border-[var(--c-linea)] bg-[var(--c-panel)] shadow-tema' : 'border-dashed border-[var(--c-linea-fuerte)] bg-[var(--c-panel2)]'} overflow-hidden`}
            >
              <div className="grid lg:grid-cols-12">
                <div className="lg:col-span-4 p-6 flex gap-4 border-b lg:border-b-0 lg:border-r border-[var(--c-linea)]">
                  <span
                    className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      hechas === m.lecciones.length ? 'bg-[var(--c-oro)] text-[#1a1406]' : abierto ? 'bg-[var(--c-teal)]/15 text-[var(--c-teal)]' : 'bg-[var(--c-hondo)] text-[var(--c-tenue)]'
                    }`}
                  >
                    {abierto ? <Icono className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                    <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[var(--c-fondo)] text-[var(--c-texto)] border border-[var(--c-linea-fuerte)] text-[11px] font-black flex items-center justify-center">{m.numero}</span>
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold leading-tight">{m.titulo}</h2>
                    <p className="text-xs text-[var(--c-suave)] mt-1">{m.descripcion}</p>
                    <p className="text-[11px] mt-2 font-mono">
                      <span className="text-[var(--c-suave)]">{hechas}/{m.lecciones.length} lecciones</span>
                      {prec !== null && (
                        <span style={{ color: colorNivel(prec) }}> · {prec} % aciertos</span>
                      )}
                    </p>
                    {mision && hechas === m.lecciones.length && (
                      <Link to={`/app/casos/${mision.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--c-teal)] mt-2 hover:underline">
                        <Trophy className="w-3.5 h-3.5" /> Aplícalo en {mision.number} <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
                <div className="lg:col-span-8 p-4 sm:p-5 grid sm:grid-cols-2 gap-3">
                  {m.lecciones.map((l) => {
                    const e = p.lecciones[l.id];
                    const bloqueada = !e?.desbloqueada;
                    const actual = e?.desbloqueada && !e.completada;
                    return (
                      <motion.button
                        key={l.id}
                        whileHover={bloqueada ? undefined : { y: -3 }}
                        disabled={bloqueada || !e.preguntas}
                        onClick={() => navigate(`/app/academia/leccion/${l.id}`)}
                        className={`relative text-left rounded-2xl p-4 border-2 transition-colors ${
                          bloqueada
                            ? 'border-transparent bg-[var(--c-hondo)]/60 opacity-60 cursor-not-allowed'
                            : actual
                              ? 'border-[var(--c-oro)] bg-[var(--c-oro)]/8'
                              : 'border-[var(--c-linea)] bg-[var(--c-fondo)] hover:border-[var(--c-teal)]/60'
                        }`}
                      >
                        {actual && <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-[var(--c-oro)] text-[#1a1406] text-[10px] font-black uppercase tracking-wider">Siguiente</span>}
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold leading-tight">{l.titulo}</p>
                          {bloqueada ? <Lock className="w-4 h-4 text-[var(--c-tenue)] shrink-0" /> : <Estrellas n={e.estrellas} />}
                        </div>
                        <p className="text-xs text-[var(--c-suave)] mt-1">{l.descripcion}</p>
                        <p className="text-[11px] text-[var(--c-suave)] mt-3 font-mono">
                          {e?.preguntas ?? 0} preguntas
                          {e?.deTuDocente ? <span className="text-[var(--c-teal)] font-semibold"> · {e.deTuDocente} de tu docente</span> : null}
                          {e?.completada ? ` · mejor ${e.mejorXp} XP` : e?.intentos ? ` · ${e.intentos} ${e.intentos === 1 ? 'intento' : 'intentos'}` : ''}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.section>
          );
        })}
      </div>

      <Tarjeta className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-[var(--c-suave)]">¿Buscas la teoría? Revisa las fichas normativas con la base legal de cada tema.</p>
        <Link to="/app/academia/fichas" className="text-sm font-semibold text-[var(--c-teal)] inline-flex items-center gap-1 hover:underline">
          Ver fichas normativas <ArrowRight className="w-4 h-4" />
        </Link>
      </Tarjeta>
    </Pagina>
  );
}

export { Estrellas };
