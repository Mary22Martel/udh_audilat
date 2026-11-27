import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Clock, Crown, Loader2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { mmss, type EquipoTablero, type Tablero as TTablero } from '../../lib/api';

/** Segundos que faltan, sincronizado con el reloj del servidor. */
export function useCuentaRegresiva(t: Pick<TTablero, 'fin' | 'ahora' | 'estado'> | null) {
  const [quedan, setQuedan] = useState<number | null>(null);
  useEffect(() => {
    if (!t?.fin || t.estado !== 'en_curso') {
      setQuedan(null);
      return;
    }
    const desfase = new Date(t.ahora).getTime() - Date.now();
    const f = () => setQuedan(Math.max(0, Math.round((new Date(t.fin!).getTime() - (Date.now() + desfase)) / 1000)));
    f();
    const id = setInterval(f, 500);
    return () => clearInterval(id);
  }, [t?.fin, t?.ahora, t?.estado]);
  return quedan;
}

export function Reloj({ quedan, grande = false }: { quedan: number | null; grande?: boolean }) {
  if (quedan === null) return null;
  const urgente = quedan <= 60;
  return (
    <span className={`inline-flex items-center gap-2 font-mono font-black ${grande ? 'text-5xl sm:text-6xl' : 'text-lg'} ${urgente ? 'text-rose-400' : 'text-[var(--c-oro)]'}`}>
      <Clock className={grande ? 'w-10 h-10' : 'w-5 h-5'} />
      <motion.span key={urgente ? quedan : 'x'} initial={urgente ? { scale: 1.15 } : false} animate={{ scale: 1 }}>
        {mmss(quedan)}
      </motion.span>
    </span>
  );
}

function FilaEquipo({ e, total, grande, mio, final, individual, enCurso }: { e: EquipoTablero; total: number; grande: boolean; mio: boolean; final: boolean; individual?: boolean; enCurso?: boolean }) {
  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`relative overflow-hidden rounded-2xl border-2 ${mio ? 'border-[var(--c-texto)]' : 'border-transparent'} bg-[var(--c-panel)] shadow-tema`}
    >
      <motion.div
        className="absolute inset-y-0 left-0 opacity-20"
        style={{ background: e.color }}
        initial={{ width: 0 }}
        animate={{ width: e.entregado ? `${Math.max(6, (e.aciertos / Math.max(1, total)) * 100)}%` : '4%' }}
        transition={{ duration: 0.8 }}
      />
      <div className={`relative flex items-center gap-4 ${grande ? 'px-6 py-5' : 'px-4 py-3'}`}>
        <span className={`font-display font-black ${grande ? 'text-4xl w-12' : 'text-xl w-8'} text-center`} style={{ color: e.color }}>
          {final && e.puesto === 1 ? <Crown className={`${grande ? 'w-10 h-10' : 'w-6 h-6'} mx-auto`} fill={e.color} /> : e.puesto}
        </span>
        <span className="flex-1 min-w-0">
          <span className={`block font-display font-bold truncate ${grande ? 'text-2xl' : ''}`}>
            {e.nombre} {mio && <span className="text-xs font-sans font-semibold text-[var(--c-suave)]">{individual ? '(tú)' : '(tu equipo)'}</span>}
          </span>
          {!individual && (
            <span className={`block text-[var(--c-suave)] truncate ${grande ? 'text-sm' : 'text-xs'}`}>
              <Users className="inline w-3 h-3 mr-1" />
              {e.miembros.map((m) => m.nombre.split(' ')[0]).join(', ')}
            </span>
          )}
        </span>
        <span className="text-right shrink-0">
          {e.entregado ? (
            <>
              <span className={`block font-mono font-black ${grande ? 'text-3xl' : 'text-lg'}`}>
                {e.aciertos}
                <span className="text-[var(--c-suave)] text-[0.6em]">/{e.total}</span>
              </span>
              <span className={`inline-flex items-center gap-1 text-emerald-500 font-semibold ${grande ? 'text-sm' : 'text-[11px]'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> {mmss(e.segundos ?? 0)}
              </span>
            </>
          ) : final ? (
            <span className="text-xs text-[var(--c-suave)]">No entregó</span>
          ) : !enCurso ? (
            <span className={`text-[var(--c-suave)] ${grande ? 'text-base' : 'text-xs'}`}>En la sala</span>
          ) : (
            <span className={`inline-flex items-center gap-1.5 text-[var(--c-suave)] ${grande ? 'text-base' : 'text-xs'}`}>
              <Loader2 className="w-4 h-4 animate-spin" /> Resolviendo…
            </span>
          )}
        </span>
      </div>
    </motion.div>
  );
}

/** Lista de equipos ordenada en vivo; con `grande` se ve bien en el proyector. */
export function TableroEquipos({ t, grande = false }: { t: TTablero; grande?: boolean }) {
  const total = t.preguntas;
  const final = t.estado === 'finalizado';
  return (
    <div className="space-y-3">
      <AnimatePresence>
        {t.equipos.map((e) => (
          <FilaEquipo key={e.id} e={e} total={total} grande={grande} mio={e.id === t.miEquipoId} final={final} individual={t.modo === 'individual'} enCurso={t.estado === 'en_curso'} />
        ))}
      </AnimatePresence>
      {t.equipos.length === 0 && <p className="text-sm text-[var(--c-suave)]">Todavía no hay participantes. Los alumnos del aula entran al abrir la sala.</p>}
      <p className={`text-[var(--c-suave)] ${grande ? 'text-sm' : 'text-xs'}`}>
        {t.modo === 'individual' ? 'Gana quien tiene más aciertos. Si empatan, gana quien entregó primero.' : 'Gana el equipo con más aciertos. Si empatan, gana el que entregó primero.'}
      </p>
    </div>
  );
}

/** Podio de equipos al terminar. */
export function PodioEquipos({ equipos }: { equipos: EquipoTablero[] }) {
  const top = equipos.filter((e) => e.entregado).slice(0, 3);
  const orden = [top[1], top[0], top[2]].filter(Boolean) as EquipoTablero[];
  const alto: Record<number, string> = { 1: 'h-44', 2: 'h-32', 3: 'h-24' };
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-5 pt-6">
      {orden.map((e, i) => (
        <motion.div key={e.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: [0.3, 0.6, 0][i] ?? 0, type: 'spring' }} className="flex-1 max-w-[220px] text-center">
          {e.puesto === 1 && (
            <motion.div animate={{ rotate: [0, -8, 8, 0], y: [0, -6, 0] }} transition={{ duration: 2.2, repeat: Infinity }}>
              <Crown className="w-10 h-10 mx-auto mb-1" style={{ color: e.color }} fill={e.color} />
            </motion.div>
          )}
          <p className="font-display font-bold text-lg leading-tight">{e.nombre}</p>
          <p className="text-xs text-[var(--c-suave)] mb-2">
            {e.aciertos}/{e.total} · {mmss(e.segundos ?? 0)}
          </p>
          <div className={`${alto[e.puesto]} rounded-t-2xl flex items-start justify-center pt-3 font-display font-black text-5xl text-white`} style={{ background: `linear-gradient(to bottom, ${e.color}, ${e.color}aa)` }}>
            {e.puesto}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
