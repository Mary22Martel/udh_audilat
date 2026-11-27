import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Flame, RotateCcw, Shield, ShieldOff, Star, Timer, X, Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { JuegoPregunta, respuestaCompleta, respuestaInicial, semillaDe } from '../../components/preguntas/Preguntas';
import { BotonTema } from '../../components/shell/Shell';
import { CajaError, Cargando } from '../../components/ui';
import { LECCIONES } from '../../data/academiaCurso';
import { api, type ResultadoLeccion, type RespuestaEnviada } from '../../lib/api';
import { calificar, type Pregunta, type Respuesta } from '../../lib/preguntas';
import { soundFx } from '../../utils/soundFx';

type Modo = 'leccion' | 'repaso' | 'contrarreloj';

/** Sello que cae sobre la tarjeta al verificar. */
function Sello({ ok }: { ok: boolean }) {
  return (
    <motion.div
      initial={{ scale: 2.4, opacity: 0, rotate: ok ? -24 : 24 }}
      animate={{ scale: 1, opacity: 1, rotate: ok ? -10 : 8 }}
      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
      className={`px-4 py-1.5 border-[3px] rounded-lg font-display font-black text-xl tracking-[0.15em] ${ok ? 'border-emerald-500 text-emerald-500' : 'border-rose-500 text-rose-500'}`}
      style={{ maskImage: 'radial-gradient(circle at 30% 40%, #000 60%, rgba(0,0,0,.75) 100%)' }}
    >
      {ok ? 'CONFORME' : 'OBSERVADO'}
    </motion.div>
  );
}

function Barra({ total, actual, resultados }: { total: number; actual: number; resultados: boolean[] }) {
  return (
    <div className="flex gap-1.5 flex-1">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="h-2.5 flex-1 rounded-full overflow-hidden bg-[var(--c-elevado)]">
          <motion.span
            className={`block h-full ${i < resultados.length ? (resultados[i] ? 'bg-emerald-500' : 'bg-rose-500') : i === actual ? 'bg-[var(--c-teal)]/50' : ''}`}
            initial={{ width: 0 }}
            animate={{ width: i < resultados.length || i === actual ? '100%' : 0 }}
          />
        </span>
      ))}
    </div>
  );
}

const DICTAMEN = ['Expediente observado', 'Aprobado con observaciones', 'Conforme con observaciones menores', 'Sin observaciones'];

function Final({
  modo,
  r,
  onRepetir,
  onSalir,
  onSiguiente,
}: {
  modo: Modo;
  r: { aciertos: number; total: number; estrellas?: number; completada?: boolean; xpGanado?: number; xp?: number; marcaAnterior?: number | null; record?: number; nuevoRecord?: boolean; pendientes?: number };
  onRepetir: () => void;
  onSalir: () => void;
  onSiguiente?: () => void;
}) {
  useEffect(() => {
    if (modo !== 'leccion' || r.completada) soundFx.playVictory();
    else soundFx.playError();
  }, [modo, r.completada]);
  const titulo =
    modo === 'leccion' ? DICTAMEN[r.completada ? (r.estrellas ?? 1) : 0] : modo === 'contrarreloj' ? (r.nuevoRecord ? '¡Nuevo récord!' : 'Tiempo') : r.pendientes ? 'Repaso registrado' : '¡Expediente limpio!';
  const ok = modo !== 'leccion' || r.completada;
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center space-y-6">
        <motion.div
          initial={{ scale: 3, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: -6, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }}
          className={`mx-auto w-fit px-6 py-3 border-4 rounded-2xl font-display font-black text-2xl tracking-wider ${ok ? 'border-emerald-500 text-emerald-500' : 'border-rose-500 text-rose-500'}`}
        >
          {titulo.toUpperCase()}
        </motion.div>
        {modo === 'leccion' && (
          <div className="flex justify-center gap-3">
            {[1, 2, 3].map((i) => (
              <motion.span key={i} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.5 + i * 0.18, type: 'spring', stiffness: 300, damping: 12 }}>
                <Star className={`w-14 h-14 ${i <= (r.estrellas ?? 0) ? 'text-[var(--c-oro)] fill-[var(--c-oro)] drop-shadow-[0_0_14px_rgba(242,182,50,.5)]' : 'text-[var(--c-tenue)]'}`} />
              </motion.span>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[var(--c-panel)] border border-[var(--c-linea)] p-4">
            <p className="text-xs text-[var(--c-suave)]">Aciertos</p>
            <p className="font-display text-3xl font-extrabold font-mono">
              {r.aciertos}
              <span className="text-lg text-[var(--c-suave)]">/{r.total}</span>
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--c-panel)] border border-[var(--c-linea)] p-4">
            {modo === 'leccion' && (
              <>
                <p className="text-xs text-[var(--c-suave)]">XP sumado</p>
                <p className="font-display text-3xl font-extrabold font-mono text-[var(--c-oro)]">+{r.xpGanado ?? 0}</p>
              </>
            )}
            {modo === 'contrarreloj' && (
              <>
                <p className="text-xs text-[var(--c-suave)]">Tu récord</p>
                <p className="font-display text-3xl font-extrabold font-mono text-[var(--c-oro)]">{r.record}</p>
              </>
            )}
            {modo === 'repaso' && (
              <>
                <p className="text-xs text-[var(--c-suave)]">Pendientes</p>
                <p className="font-display text-3xl font-extrabold font-mono text-[var(--c-oro)]">{r.pendientes}</p>
              </>
            )}
          </div>
        </div>
        {modo === 'leccion' && (
          <p className="text-sm text-[var(--c-suave)]">
            {!r.completada
              ? 'Te quedaste sin escudos. Revisa las explicaciones y vuelve a intentarlo.'
              : r.marcaAnterior !== null && r.marcaAnterior !== undefined
                ? r.xpGanado
                  ? `Superaste tu marca anterior (${r.marcaAnterior} XP).`
                  : `Tu marca en esta lección sigue siendo ${r.marcaAnterior} XP; solo suma si la superas.`
                : `Ganaste ${r.xp} XP en esta lección.`}
          </p>
        )}
        <div className="flex flex-col gap-2.5">
          {onSiguiente && (
            <button onClick={onSiguiente} className="w-full py-3.5 rounded-xl bg-[var(--c-teal)] hover:bg-[var(--c-teal-hover)] text-[var(--c-sobre)] font-bold inline-flex items-center justify-center gap-2">
              Siguiente lección <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button onClick={onRepetir} className="w-full py-3 rounded-xl border border-[var(--c-linea-fuerte)] font-semibold inline-flex items-center justify-center gap-2 hover:bg-[var(--c-elevado)]">
            <RotateCcw className="w-4 h-4" /> {modo === 'contrarreloj' ? 'Jugar otra vez' : 'Repetir'}
          </button>
          <button onClick={onSalir} className="text-sm text-[var(--c-suave)] hover:text-[var(--c-texto)] py-2">
            Volver a la ruta
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function Juego({ modo }: { modo: Modo }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ronda, setRonda] = useState(0);
  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null);
  const [vidasMax, setVidasMax] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [valor, setValor] = useState<Respuesta | null>(null);
  const [fase, setFase] = useState<'responder' | 'revisar'>('responder');
  const [resultados, setResultados] = useState<boolean[]>([]);
  const [enviadas, setEnviadas] = useState<RespuestaEnviada[]>([]);
  const [combo, setCombo] = useState(0);
  const [final, setFinal] = useState<Parameters<typeof Final>[0]['r'] | null>(null);
  const [siguiente, setSiguiente] = useState<string | null>(null);
  const [restante, setRestante] = useState(60);
  const inicio = useRef(Date.now());
  const enviando = useRef(false);
  // Cada intento muestra opciones, fichas y pasos en otro orden (las preguntas ya llegan mezcladas del servidor).
  const semillaIntento = useRef(1);
  const semilla = (q: Pregunta) => semillaDe(`${semillaIntento.current}:${q.id}`);
  const leccion = LECCIONES.find((l) => l.id === id);

  // Cargar preguntas
  useEffect(() => {
    setPreguntas(null);
    setError(null);
    setIdx(0);
    setResultados([]);
    setEnviadas([]);
    setCombo(0);
    setFinal(null);
    setFase('responder');
    enviando.current = false;
    const url = modo === 'leccion' ? `/api/academia/lecciones/${id}` : `/api/academia/${modo}`;
    api
      .get<{ preguntas: Pregunta[]; vidas?: number; segundos?: number }>(url)
      .then((r) => {
        if (!r.preguntas.length) throw new Error(modo === 'repaso' ? 'No tienes preguntas para repasar.' : 'Aún no hay preguntas disponibles. Completa una lección primero.');
        semillaIntento.current = Math.floor(Math.random() * 1e9) + 1;
        setPreguntas(r.preguntas);
        setVidasMax(r.vidas ?? 3);
        setRestante(r.segundos ?? 60);
        setValor(respuestaInicial(r.preguntas[0], semilla(r.preguntas[0])));
        inicio.current = Date.now();
      })
      .catch((e) => setError(e.message));
  }, [modo, id, ronda]);

  const terminar = useCallback(
    async (respuestas: RespuestaEnviada[]) => {
      if (enviando.current) return;
      enviando.current = true;
      try {
        const segundos = Math.round((Date.now() - inicio.current) / 1000);
        if (modo === 'leccion') {
          const r = await api.post<ResultadoLeccion>(`/api/academia/lecciones/${id}`, { respuestas, segundos });
          setSiguiente(r.siguiente);
          setFinal(r);
        } else if (modo === 'contrarreloj') {
          setFinal(await api.post(`/api/academia/contrarreloj`, { respuestas }));
        } else {
          setFinal(await api.post(`/api/academia/repaso`, { respuestas }));
        }
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [modo, id]
  );

  // Reloj del contrarreloj
  useEffect(() => {
    if (modo !== 'contrarreloj' || !preguntas || final) return;
    const t = setInterval(() => {
      const quedan = Math.max(0, 60 - Math.floor((Date.now() - inicio.current) / 1000));
      setRestante(quedan);
      if (quedan === 0) {
        clearInterval(t);
        setEnviadas((e) => {
          terminar(e);
          return e;
        });
      }
    }, 250);
    return () => clearInterval(t);
  }, [modo, preguntas, final, terminar]);

  if (error) return <CajaError mensaje={error} onReintentar={() => navigate('/app/academia')} />;
  if (!preguntas) return <Cargando texto="Preparando la prueba de campo…" />;

  const p = preguntas[idx];
  const errores = resultados.filter((r) => !r).length;
  const vidas = modo === 'leccion' ? vidasMax - errores : null;

  const verificar = (r: Respuesta | null = valor) => {
    if (!respuestaCompleta(p, r)) return;
    const ok = calificar(p, r);
    const nuevas = [...enviadas, { preguntaId: p.id, respuesta: r }];
    setEnviadas(nuevas);
    setResultados((x) => [...x, ok]);
    setCombo((c) => (ok ? c + 1 : 0));
    if (ok) soundFx.playStamp();
    else soundFx.playError();
    if (modo === 'contrarreloj') {
      // Sin pausa: un destello y a la siguiente.
      if (idx + 1 >= preguntas.length) terminar(nuevas);
      else {
        setIdx(idx + 1);
        setValor(respuestaInicial(preguntas[idx + 1], semilla(preguntas[idx + 1])));
      }
      return;
    }
    setFase('revisar');
  };

  const continuar = () => {
    const sinVidas = modo === 'leccion' && vidasMax - resultados.filter((r) => !r).length <= 0;
    if (sinVidas || idx + 1 >= preguntas.length) {
      terminar(enviadas);
      return;
    }
    setIdx(idx + 1);
    setValor(respuestaInicial(preguntas[idx + 1], semilla(preguntas[idx + 1])));
    setFase('responder');
    window.scrollTo({ top: 0 });
  };

  if (final)
    return (
      <div className="min-h-screen bg-[var(--c-fondo)] text-[var(--c-texto)]">
        <Final
          modo={modo}
          r={final}
          onRepetir={() => setRonda((x) => x + 1)}
          onSalir={() => navigate('/app/academia')}
          onSiguiente={siguiente ? () => navigate(`/app/academia/leccion/${siguiente}`) : undefined}
        />
      </div>
    );

  const ultimo = resultados[resultados.length - 1];
  const rapida = modo === 'contrarreloj' && (p.tipo === 'vf' || p.tipo === 'opcion');

  return (
    <div className="min-h-screen bg-[var(--c-fondo)] text-[var(--c-texto)] flex flex-col">
      {/* Barra superior */}
      <header className="sticky top-0 z-20 bg-[var(--c-fondo)]/90 backdrop-blur border-b border-[var(--c-linea)]">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/app/academia')} className="p-2 -ml-2 rounded-lg text-[var(--c-suave)] hover:text-[var(--c-texto)]" aria-label="Salir">
            <X className="w-5 h-5" />
          </button>
          {modo === 'contrarreloj' ? (
            <div className="flex-1 flex items-center gap-3">
              <Timer className={`w-5 h-5 ${restante <= 10 ? 'text-rose-400 animate-pulse' : 'text-[var(--c-oro)]'}`} />
              <div className="flex-1 h-2.5 rounded-full bg-[var(--c-elevado)] overflow-hidden">
                <div className={`h-full transition-all duration-300 ${restante <= 10 ? 'bg-rose-500' : 'bg-[var(--c-oro)]'}`} style={{ width: `${(restante / 60) * 100}%` }} />
              </div>
              <span className="font-mono font-bold w-10 text-right">{restante}s</span>
            </div>
          ) : (
            <Barra total={preguntas.length} actual={idx} resultados={resultados} />
          )}
          {vidas !== null && (
            <div className="flex gap-1" aria-label={`${vidas} escudos`}>
              {Array.from({ length: vidasMax }, (_, i) =>
                i < vidas ? (
                  <Shield key={i} className="w-5 h-5 text-[var(--c-teal)] fill-[var(--c-teal)]/30" />
                ) : (
                  <motion.span key={i} initial={{ scale: 1.6 }} animate={{ scale: 1 }}>
                    <ShieldOff className="w-5 h-5 text-[var(--c-tenue)]" />
                  </motion.span>
                )
              )}
            </div>
          )}
          {modo === 'contrarreloj' && (
            <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-500">
              <Zap className="w-4 h-4" /> {resultados.filter(Boolean).length}
            </span>
          )}
          <AnimatePresence>
            {combo >= 2 && (
              <motion.span key={combo} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-1 text-[var(--c-oro)] font-black text-sm">
                <Flame className="w-4 h-4 fill-[var(--c-oro)]" />×{combo}
              </motion.span>
            )}
          </AnimatePresence>
          <BotonTema className="hidden sm:inline-flex" />
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:py-10">
        {modo !== 'contrarreloj' && (
          <p className="text-xs text-[var(--c-suave)] mb-4">
            {modo === 'leccion' ? leccion?.titulo : 'Repaso de observados'} · Pregunta {idx + 1} de {preguntas.length}
          </p>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={p.id + idx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.22 }}
            className="relative"
          >
            {modo === 'contrarreloj' && ultimo !== undefined && (
              <motion.div key={resultados.length} initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }} className={`fixed inset-0 pointer-events-none ${ultimo ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`} />
            )}
            <JuegoPregunta
              p={p}
              semilla={semilla(p)}
              valor={valor}
              revelar={fase === 'revisar'}
              onCambio={(r) => {
                setValor(r);
                if (rapida && r) verificar(r);
              }}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Barra inferior: verificar / revisión */}
      {!rapida && (
        <footer
          className={`sticky bottom-0 border-t transition-colors ${
            fase === 'revisar' ? (ultimo ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-rose-500/10 border-rose-500/40') : 'bg-[var(--c-panel)] border-[var(--c-linea)]'
          } backdrop-blur`}
        >
          <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            {fase === 'revisar' ? (
              <>
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <Sello ok={!!ultimo} />
                  <p className="text-sm leading-relaxed">{p.explicacion}</p>
                </div>
                <button
                  autoFocus
                  onClick={continuar}
                  className={`shrink-0 px-8 py-3.5 rounded-xl font-bold text-white ${ultimo ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}
                >
                  Continuar
                </button>
              </>
            ) : (
              <>
                <p className="flex-1 text-xs text-[var(--c-suave)] hidden sm:block">
                  {modo === 'leccion' ? `Te quedan ${vidas} ${vidas === 1 ? 'escudo' : 'escudos'}. Cada error descuenta uno.` : 'Sin escudos: aquí solo practicas.'}
                </p>
                <button
                  disabled={!respuestaCompleta(p, valor)}
                  onClick={() => verificar()}
                  className="px-10 py-3.5 rounded-xl bg-[var(--c-teal)] hover:bg-[var(--c-teal-hover)] text-[var(--c-sobre)] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {modo === 'contrarreloj' ? 'Responder' : 'Verificar'}
                </button>
              </>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
