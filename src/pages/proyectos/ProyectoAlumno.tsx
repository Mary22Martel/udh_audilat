import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CheckCircle2, Hourglass, RefreshCw, Send, Trophy, User, Users, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { JuegoPregunta, respuestaCompleta, respuestaInicial, semillaDe } from '../../components/preguntas/Preguntas';
import { BotonTema } from '../../components/shell/Shell';
import { CajaError, Cargando, Modal } from '../../components/ui';
import { api, mmss, type ProyectoAlumno as TProyecto } from '../../lib/api';
import type { Respuesta } from '../../lib/preguntas';
import { useSesion } from '../../lib/sesion';
import { soundFx } from '../../utils/soundFx';
import { PodioEquipos, Reloj, TableroEquipos, useCuentaRegresiva } from './Tablero';

const clave = (id: string) => `auditlab:proyecto:${id}`;

export function ProyectoAlumno() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useSesion();
  const [t, setT] = useState<TProyecto | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const ultimo = useRef('');
  const [error, setError] = useState<string | null>(null);
  const [resp, setResp] = useState<Record<string, Respuesta | null>>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(clave(id!)) ?? '{}');
    } catch {
      return {};
    }
  });
  const [idx, setIdx] = useState(0);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const estadoPrevio = useRef<string | null>(null);

  const cargar = useCallback(
    (aMano = false) => {
      if (aMano) setActualizando(true);
      return api
        .get<TProyecto>(`/api/alumno/proyectos/${id}`)
        .then((r) => {
          if (estadoPrevio.current && estadoPrevio.current !== r.estado) {
            if (r.estado === 'en_curso') soundFx.playStamp();
            if (r.estado === 'finalizado') soundFx.playVictory();
          }
          estadoPrevio.current = r.estado;
          // Solo se vuelve a dibujar si algo cambió (si no, las opciones «saltan» en cada actualización).
          const { ahora: _a, ...resto } = r as TProyecto & { ahora?: string };
          const huella = JSON.stringify(resto);
          if (huella !== ultimo.current) {
            ultimo.current = huella;
            setT(r);
          }
        })
        .catch((e) => setError(e.message))
        .finally(() => aMano && setTimeout(() => setActualizando(false), 400));
    },
    [id]
  );

  useEffect(() => {
    cargar();
    const iv = setInterval(() => cargar(), 2500);
    return () => clearInterval(iv);
  }, [cargar]);

  useEffect(() => {
    try {
      sessionStorage.setItem(clave(id!), JSON.stringify(resp));
    } catch {
      /* sin almacenamiento */
    }
  }, [resp, id]);

  const quedan = useCuentaRegresiva(t);
  // Cada alumno ve opciones y fichas en su propio orden (estable mientras dura la actividad).
  const semilla = (preguntaId: string) => semillaDe(`${usuario?.id ?? ''}:${id}:${preguntaId}`);

  // Al empezar, cada pregunta arranca con su respuesta inicial (en «ordenar» ya cuenta como respondida).
  useEffect(() => {
    if (!t?.preguntasJuego.length || t.estado !== 'en_curso') return;
    setResp((r) => {
      const n = { ...r };
      for (const p of t.preguntasJuego) if (!(p.id in n)) n[p.id] = respuestaInicial(p, semilla(p.id));
      return n;
    });
  }, [t?.preguntasJuego, t?.estado]);

  if (error) return <CajaError mensaje={error} onReintentar={() => navigate('/app/aulas')} />;
  if (!t) return <Cargando texto="Entrando a la sala…" />;

  const entregar = async () => {
    setEnviando(true);
    try {
      const r = await api.post<TProyecto>(`/api/alumno/proyectos/${id}/entregar`, {
        respuestas: t.preguntasJuego.map((p) => ({ preguntaId: p.id, respuesta: resp[p.id] ?? null })),
      });
      soundFx.playVictory();
      setT(r);
      setConfirmar(false);
      sessionStorage.removeItem(clave(id!));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const equipo = t.miEquipo;
  const individual = t.modo === 'individual';
  const Cabecera = (
    <header className="sticky top-0 z-20 bg-[var(--c-fondo)]/90 backdrop-blur border-b border-[var(--c-linea)]">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
        <button onClick={() => navigate('/app/aulas')} className="p-2 -ml-2 rounded-lg text-[var(--c-suave)] hover:text-[var(--c-texto)]" aria-label="Volver">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold truncate">{t.nombre}</p>
          <p className="text-[11px] text-[var(--c-suave)] truncate">{t.aula}</p>
        </div>
        {equipo && !individual && (
          <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-white" style={{ background: equipo.color }}>
            <Users className="w-4 h-4" /> {equipo.nombre}
          </span>
        )}
        {individual && (
          <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--c-teal)]/15 text-[var(--c-teal)]">
            <User className="w-4 h-4" /> Individual
          </span>
        )}
        <button
          onClick={() => cargar(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--c-linea-fuerte)] text-sm font-medium hover:border-[var(--c-teal)]"
          title="Trae lo último sin perder tus respuestas"
        >
          <RefreshCw className={`w-4 h-4 ${actualizando ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Actualizar</span>
        </button>
        <Reloj quedan={quedan} />
        <BotonTema />
      </div>
    </header>
  );

  // --- Sala de espera ---
  if (t.estado === 'sala' || t.estado === 'preparacion')
    return (
      <div className="min-h-screen bg-[var(--c-fondo)] text-[var(--c-texto)]">
        {Cabecera}
        <main className="max-w-2xl mx-auto px-4 py-12 text-center space-y-8">
          <motion.div animate={{ rotate: [0, 180, 180, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="mx-auto w-fit">
            <Hourglass className="w-14 h-14 text-[var(--c-oro)]" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-extrabold">Sala de espera</h1>
            <p className="text-[var(--c-suave)]">Tu docente dará inicio en cualquier momento. Esta pantalla cambia sola.</p>
          </div>
          {equipo && !individual && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-3xl p-6 text-white text-left" style={{ background: `linear-gradient(135deg, ${equipo.color}, ${equipo.color}bb)` }}>
              <p className="text-xs uppercase tracking-[0.2em] opacity-80">Tu equipo</p>
              <p className="font-display text-3xl font-black">{equipo.nombre}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {equipo.miembros.map((m) => (
                  <span key={m.id} className="px-3 py-1 rounded-full bg-white/20 text-sm">
                    {m.nombre}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
          <div className="text-left rounded-2xl bg-[var(--c-panel)] border border-[var(--c-linea)] p-5 space-y-2 text-sm">
            <p className="font-semibold">Cómo se juega</p>
            <p className="text-[var(--c-suave)]">• Hay {t.preguntas} preguntas y casos, y {t.duracionMin} minutos. Cuando se acaba el tiempo, la actividad se cierra y ya no se puede responder.</p>
            {individual ? (
              <p className="text-[var(--c-suave)]">• Respondes tú solo. Puedes ir y volver entre preguntas; tus respuestas se guardan mientras avanzas. Entregas una sola vez.</p>
            ) : (
              <p className="text-[var(--c-suave)]">• Pónganse de acuerdo: el equipo entrega una sola vez desde cualquier computadora de sus integrantes.</p>
            )}
            <p className="text-[var(--c-suave)]">• {individual ? 'Gana quien tiene más aciertos.' : 'Gana el equipo con más aciertos.'} Si empatan, el que entregó primero.</p>
          </div>
          {t.descripcion && <p className="text-sm text-[var(--c-suave)] italic">«{t.descripcion}»</p>}
        </main>
      </div>
    );

  // --- Jugando ---
  if (t.estado === 'en_curso' && !t.entrega && t.preguntasJuego.length) {
    const p = t.preguntasJuego[Math.min(idx, t.preguntasJuego.length - 1)];
    const respondidas = t.preguntasJuego.filter((x) => respuestaCompleta(x, resp[x.id] ?? null)).length;
    return (
      <div className="min-h-screen bg-[var(--c-fondo)] text-[var(--c-texto)] flex flex-col">
        {Cabecera}
        <div className="max-w-5xl w-full mx-auto px-4 pt-4 space-y-2">
          <p className="text-xs text-[var(--c-suave)]">
            Pregunta <strong className="text-[var(--c-texto)]">{Math.min(idx, t.preguntasJuego.length - 1) + 1}</strong> de {t.preguntasJuego.length} · las verdes ya están respondidas. Puedes saltar entre ellas.
          </p>
          <div className="flex flex-wrap gap-2">
            {t.preguntasJuego.map((x, i) => {
              const ok = respuestaCompleta(x, resp[x.id] ?? null);
              return (
                <button
                  key={x.id}
                  onClick={() => setIdx(i)}
                  className={`w-10 h-10 rounded-xl font-mono font-bold text-sm border-2 transition-colors ${
                    i === idx ? 'border-[var(--c-oro)] bg-[var(--c-oro)]/15' : ok ? 'border-[var(--c-teal)] bg-[var(--c-teal)]/15 text-[var(--c-teal)]' : 'border-[var(--c-linea-fuerte)]'
                  }`}
                  aria-label={`Pregunta ${i + 1}${ok ? ', respondida' : ''}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
              <JuegoPregunta p={p} semilla={semilla(p.id)} valor={resp[p.id] ?? null} onCambio={(r) => setResp((x) => ({ ...x, [p.id]: r }))} />
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="sticky bottom-0 bg-[var(--c-panel)] border-t border-[var(--c-linea)]">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <button disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="p-3 rounded-xl border border-[var(--c-linea-fuerte)] disabled:opacity-30" aria-label="Anterior">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button disabled={idx >= t.preguntasJuego.length - 1} onClick={() => setIdx(idx + 1)} className="p-3 rounded-xl border border-[var(--c-linea-fuerte)] disabled:opacity-30" aria-label="Siguiente">
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="flex-1 text-sm text-[var(--c-suave)] text-center">
              {respondidas}/{t.preguntasJuego.length} respondidas
            </p>
            <button onClick={() => setConfirmar(true)} className="px-5 py-3 rounded-xl bg-[var(--c-teal)] hover:bg-[var(--c-teal-hover)] text-[var(--c-sobre)] font-bold inline-flex items-center gap-2">
              <Send className="w-4 h-4" /> Entregar
            </button>
          </div>
        </footer>
        {confirmar && (
          <Modal titulo={individual ? '¿Entregar tus respuestas?' : '¿Entregar las respuestas del equipo?'} onCerrar={() => setConfirmar(false)}>
            <div className="space-y-4">
              <p className="text-sm">
                {individual ? 'Respondiste' : 'Respondieron'} <strong>{respondidas}</strong> de <strong>{t.preguntasJuego.length}</strong>.{' '}
                {individual ? 'Solo cuenta tu primera entrega' : 'Solo cuenta la primera entrega del equipo'} y el tiempo se detiene al entregar.
              </p>
              {respondidas < t.preguntasJuego.length && <p className="text-sm text-[var(--c-oro)]">Las preguntas sin responder cuentan como incorrectas.</p>}
              <div className="flex gap-3">
                <button onClick={() => setConfirmar(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--c-linea-fuerte)] font-medium">
                  Seguir revisando
                </button>
                <button disabled={enviando} onClick={entregar} className="flex-1 py-2.5 rounded-xl bg-[var(--c-teal)] text-[var(--c-sobre)] font-bold disabled:opacity-60">
                  {enviando ? 'Entregando…' : 'Entregar ahora'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // --- Entregado (esperando a los demás) o terminado ---
  const final = t.estado === 'finalizado';
  const miPuesto = t.equipos.find((e) => e.id === t.miEquipoId);
  return (
    <div className="min-h-screen bg-[var(--c-fondo)] text-[var(--c-texto)]">
      {Cabecera}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {final ? (
          <div className="text-center space-y-2">
            <Trophy className="w-12 h-12 mx-auto text-[var(--c-oro)]" />
            <h1 className="font-display text-3xl font-extrabold">{miPuesto?.puesto === 1 && miPuesto.entregado ? (individual ? '¡Ganaste!' : '¡Tu equipo ganó!') : 'Terminó la actividad'}</h1>
            {miPuesto && (
              <p className="text-[var(--c-suave)]">
                {individual ? 'Quedaste' : 'Tu equipo quedó'} en el puesto {miPuesto.puesto} de {t.equipos.length}.
              </p>
            )}
            <PodioEquipos equipos={t.equipos} />
          </div>
        ) : (
          <div className="text-center space-y-3">
            <motion.div initial={{ scale: 2, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: -6, opacity: 1 }} className="mx-auto w-fit px-6 py-2 border-4 border-emerald-500 text-emerald-500 rounded-2xl font-display font-black text-2xl tracking-widest">
              ENTREGADO
            </motion.div>
            {t.entrega && (
              <p className="text-[var(--c-suave)]">
                {individual ? 'Entregaste' : `${t.entrega.enviadoPor} entregó por el equipo`} en <strong className="font-mono text-[var(--c-texto)]">{mmss(t.entrega.segundos)}</strong> con{' '}
                <strong className="text-[var(--c-texto)]">
                  {t.entrega.aciertos}/{t.entrega.total}
                </strong>{' '}
                aciertos. {individual ? 'Los resultados y la solución aparecen cuando termine el tiempo.' : 'Esperando a los demás equipos…'}
              </p>
            )}
            {!t.entrega && <p className="text-[var(--c-suave)]">{individual ? 'No entregaste a tiempo: la actividad ya está cerrada.' : 'Tu equipo no entregó a tiempo.'}</p>}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="font-display font-bold text-lg">{final ? 'Clasificación final' : 'Clasificación en vivo'}</h2>
          <TableroEquipos t={t} />
        </section>

        {final && t.entrega?.detalle && (
          <section className="space-y-4">
            <h2 className="font-display font-bold text-lg">{individual ? 'Revisa tus respuestas' : 'Revisión de tu equipo'}</h2>
            {t.preguntasJuego.map((p, i) => {
              const d = t.entrega!.detalle!.find((x) => x.preguntaId === p.id);
              const r = t.entrega!.respuestas?.find((x) => x.preguntaId === p.id)?.respuesta ?? null;
              return (
                <div key={p.id} className="rounded-2xl bg-[var(--c-panel)] border border-[var(--c-linea)] p-5 space-y-4">
                  <p className={`inline-flex items-center gap-1.5 text-sm font-semibold ${d?.correcta ? 'text-emerald-500' : 'text-rose-400'}`}>
                    {d?.correcta ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} Pregunta {i + 1}: {d?.correcta ? 'correcta' : 'incorrecta'}
                  </p>
                  <JuegoPregunta p={p} semilla={semilla(p.id)} valor={r} onCambio={() => undefined} revelar />
                  <p className="text-sm text-[var(--c-suave)] border-t border-[var(--c-linea)] pt-3">{p.explicacion}</p>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
