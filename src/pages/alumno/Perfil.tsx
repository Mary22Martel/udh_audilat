import { motion } from 'motion/react';
import { Award, BookOpen, Boxes, Check, Compass, FolderOpen, KeyRound, Lock, Search, Shield, Zap, type LucideIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { iniciales } from '../../components/shell/Shell';
import { Encabezado, Pagina, Tarjeta, Vacio, fechaCorta } from '../../components/ui';
import { INITIAL_MISSIONS } from '../../data/missionsData';
import { api } from '../../lib/api';
import { insigniasDelAlumno } from '../../lib/misiones';
import { mejorPorMision } from '../../lib/reglas';
import { useSesion } from '../../lib/sesion';
import type { BadgeItem } from '../../types/audit';
import { useAlumno } from './datos';

const ICONOS: Record<BadgeItem['iconKey'], LucideIcon> = { search: Search, shield: Shield, folder: FolderOpen, boxes: Boxes, compass: Compass, book: BookOpen, zap: Zap, award: Award };

export function Insignias({ insignias }: { insignias: BadgeItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {insignias.map((b, i) => {
        const Icono = ICONOS[b.iconKey];
        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * i, type: 'spring', stiffness: 260, damping: 18 }}
            className={`relative rounded-2xl p-4 text-center border ${
              b.unlocked ? 'bg-gradient-to-b from-[var(--c-oro)]/15 to-[var(--c-panel)] border-[var(--c-oro)]/40' : 'bg-[var(--c-panel)] border-[var(--c-linea)]'
            }`}
            title={b.criteria}
          >
            <span
              className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center rotate-45 ${
                b.unlocked ? 'bg-[var(--c-oro)] text-[#1a1406] shadow-lg shadow-[var(--c-oro)]/30' : 'bg-[var(--c-hondo)] text-[var(--c-tenue)]'
              }`}
            >
              <span className="-rotate-45">{b.unlocked ? <Icono className="w-6 h-6" /> : <Lock className="w-5 h-5" />}</span>
            </span>
            <p className={`mt-4 text-sm font-semibold leading-tight ${b.unlocked ? 'text-[var(--c-texto)]' : 'text-[var(--c-suave)]'}`}>{b.name}</p>
            <p className="text-[11px] text-[var(--c-suave)] mt-1.5 leading-snug">{b.unlocked ? `Ganada el ${b.unlockedAt}` : b.criteria}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

export function Historial({ resultados }: { resultados: { id: string; missionId: string; fechaIso: string; rankGrade: string; accuracyPercent: number; xpEarned: number; durationSeconds: number }[] }) {
  const mejores = new Set([...mejorPorMision(resultados as never).values()].map((r) => (r as unknown as { id: string }).id));
  if (!resultados.length) return <Vacio icono={FolderOpen} titulo="Sin intentos todavía" texto="Aquí aparecerá cada expediente que presentes." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--c-suave)] border-b border-[var(--c-linea)]">
            <th className="px-5 py-3 font-semibold">Fecha</th>
            <th className="px-5 py-3 font-semibold">Caso</th>
            <th className="px-5 py-3 font-semibold text-center">Rango</th>
            <th className="px-5 py-3 font-semibold text-right">Precisión</th>
            <th className="px-5 py-3 font-semibold text-right">Tiempo</th>
            <th className="px-5 py-3 font-semibold text-right">XP del intento</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--c-linea)]">
          {resultados.map((r) => {
            const m = INITIAL_MISSIONS.find((x) => x.id === r.missionId);
            const marca = mejores.has(r.id);
            return (
              <tr key={r.id} className="hover:bg-[var(--c-elevado)]/30">
                <td className="px-5 py-3 text-[var(--c-suave)] whitespace-nowrap font-mono-tabular text-xs">{fechaCorta(r.fechaIso)}</td>
                <td className="px-5 py-3">
                  <span className="text-[11px] font-mono-tabular text-[var(--c-teal)]">{m?.number}</span>
                  <span className="block font-medium">{m?.title}</span>
                </td>
                <td className="px-5 py-3 text-center font-display font-extrabold text-[var(--c-oro)]">{r.rankGrade}</td>
                <td className="px-5 py-3 text-right font-mono-tabular">{r.accuracyPercent} %</td>
                <td className="px-5 py-3 text-right font-mono-tabular text-[var(--c-suave)]">{Math.round(r.durationSeconds / 60)} min</td>
                <td className="px-5 py-3 text-right font-mono-tabular whitespace-nowrap">
                  {r.xpEarned}
                  {marca && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[var(--c-teal)]/15 text-[var(--c-teal)] font-sans font-semibold">MARCA</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CambiarClave() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (nueva !== repetir) return setMsg({ ok: false, texto: 'Las contraseñas nuevas no coinciden.' });
    setEnviando(true);
    try {
      await api.post('/api/clave', { actual, nueva });
      setMsg({ ok: true, texto: 'Contraseña actualizada.' });
      setActual('');
      setNueva('');
      setRepetir('');
    } catch (err) {
      setMsg({ ok: false, texto: (err as Error).message });
    } finally {
      setEnviando(false);
    }
  };

  const campo = 'w-full px-3.5 py-2.5 rounded-xl bg-[var(--c-fondo)] border border-[var(--c-linea-fuerte)] text-sm focus:outline-none focus:border-[var(--c-teal)] focus:ring-2 focus:ring-[var(--c-teal)]/25';
  return (
    <form onSubmit={enviar} className="space-y-3">
      <h3 className="font-display font-bold flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-[var(--c-teal)]" /> Cambiar contraseña
      </h3>
      <input type="password" autoComplete="current-password" placeholder="Contraseña actual" value={actual} onChange={(e) => setActual(e.target.value)} className={campo} required />
      <input type="password" autoComplete="new-password" placeholder="Nueva contraseña (8 o más caracteres)" value={nueva} onChange={(e) => setNueva(e.target.value)} className={campo} minLength={8} required />
      <input type="password" autoComplete="new-password" placeholder="Repite la nueva contraseña" value={repetir} onChange={(e) => setRepetir(e.target.value)} className={campo} minLength={8} required />
      {msg && <p className={`text-sm ${msg.ok ? 'text-[var(--c-teal)]' : 'text-rose-400'}`}>{msg.ok && <Check className="inline w-4 h-4 mr-1" />}{msg.texto}</p>}
      <button disabled={enviando} className="w-full py-2.5 rounded-xl bg-[var(--c-teal)] hover:bg-[var(--c-teal-hover)] text-[var(--c-sobre)] text-sm font-semibold disabled:opacity-60">
        {enviando ? 'Guardando…' : 'Guardar nueva contraseña'}
      </button>
    </form>
  );
}

export function Perfil() {
  const { usuario } = useSesion();
  const { estado } = useAlumno();
  const insignias = insigniasDelAlumno(estado);
  const ganadas = insignias.filter((b) => b.unlocked).length;

  return (
    <Pagina>
      <Encabezado antetitulo="Perfil" titulo="Tu expediente personal" />
      <div className="grid lg:grid-cols-12 gap-6">
        <Tarjeta className="lg:col-span-8 p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <span className="w-20 h-20 rounded-2xl bg-[var(--c-teal)] text-[var(--c-sobre)] flex items-center justify-center font-display font-extrabold text-2xl shrink-0">
            {iniciales(usuario!.nombre)}
          </span>
          <div className="flex-1 min-w-0 space-y-1">
            <h2 className="font-display text-xl font-bold">{usuario!.nombre}</h2>
            <p className="text-sm text-[var(--c-suave)]">
              {usuario!.correo}
              {usuario!.codigo && <> · Código {usuario!.codigo}</>}
            </p>
            <p className="text-sm text-[var(--c-suave)]">Escuela Profesional de Contabilidad · {estado.aulas.length ? estado.aulas.map((a) => a.nombre).join(' · ') : 'Sin aula (únete desde «Mis aulas»)'}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--c-teal)]/12 text-[var(--c-teal)] font-semibold">{estado.nivel.title}</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--c-oro)]/12 text-[var(--c-oro)] font-semibold font-mono-tabular">{estado.xp.toLocaleString('es-PE')} XP</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--c-elevado)] font-semibold">{estado.completadas.length} casos resueltos</span>
            </div>
          </div>
        </Tarjeta>
        <Tarjeta className="lg:col-span-4 p-6" retraso={0.05}>
          <CambiarClave />
        </Tarjeta>
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-lg font-bold">Insignias</h3>
          <span className="text-sm text-[var(--c-suave)] font-mono-tabular">
            {ganadas} / {insignias.length}
          </span>
        </div>
        <Insignias insignias={insignias} />
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-lg font-bold">Historial de expedientes</h3>
        <Tarjeta className="overflow-hidden">
          <Historial resultados={estado.resultados} />
        </Tarjeta>
      </section>
    </Pagina>
  );
}
