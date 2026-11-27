import type React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { COMPETENCIAS, UMBRAL_REFORZAR, type CompetenciaId } from '../lib/reglas';
import type { Competencias } from '../lib/api';

export function Pagina({ children, ancho = 'max-w-[1240px]' }: { children: ReactNode; ancho?: string }) {
  return <div className={`${ancho} mx-auto px-4 sm:px-8 py-8 space-y-8`}>{children}</div>;
}

export function Encabezado({ antetitulo, titulo, descripcion, acciones }: { antetitulo?: string; titulo: ReactNode; descripcion?: ReactNode; acciones?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col md:flex-row md:items-end justify-between gap-4"
    >
      <div className="min-w-0">
        {antetitulo && <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--c-teal)] mb-2">{antetitulo}</p>}
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--c-texto)]">{titulo}</h1>
        {descripcion && <p className="text-sm sm:text-base text-[var(--c-suave)] mt-1.5 max-w-2xl">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2 shrink-0">{acciones}</div>}
    </motion.div>
  );
}

export function Tarjeta({ children, className = '', retraso = 0 }: { children: ReactNode; className?: string; retraso?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: retraso }}
      className={`bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-2xl shadow-tema ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function Cifra({ etiqueta, valor, detalle, icono: Icono, tono = 'teal', retraso = 0 }: { etiqueta: string; valor: ReactNode; detalle?: ReactNode; icono: LucideIcon; tono?: 'teal' | 'oro' | 'texto'; retraso?: number }) {
  const color = tono === 'oro' ? 'text-[var(--c-oro)]' : tono === 'teal' ? 'text-[var(--c-teal)]' : 'text-[var(--c-texto)]';
  return (
    <Tarjeta className="p-5" retraso={retraso}>
      <div className="flex items-center justify-between text-xs text-[var(--c-suave)]">
        <span>{etiqueta}</span>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tono === 'oro' ? 'bg-[var(--c-oro)]/12' : 'bg-[var(--c-teal)]/12'}`}>
          <Icono className={`w-4 h-4 ${tono === 'oro' ? 'text-[var(--c-oro)]' : 'text-[var(--c-teal)]'}`} />
        </span>
      </div>
      <p className={`font-display text-2xl font-extrabold mt-2 font-mono-tabular ${color}`}>{valor}</p>
      {detalle && <p className="text-[11px] text-[var(--c-suave)] mt-1">{detalle}</p>}
    </Tarjeta>
  );
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3" role="status">
      <div className="w-9 h-9 rounded-full border-2 border-[var(--c-teal)]/25 border-t-[var(--c-teal)] animate-spin" />
      <p className="text-sm text-[var(--c-suave)]">{texto}</p>
    </div>
  );
}

export function CajaError({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <div className="max-w-lg mx-auto my-16 bg-[var(--c-panel)] border border-rose-500/30 rounded-2xl p-6 text-center space-y-3">
      <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
      <p className="text-sm text-[var(--c-texto)]">{mensaje}</p>
      {onReintentar && (
        <button onClick={onReintentar} className="px-4 py-2 rounded-lg bg-[var(--c-elevado)] text-sm font-medium text-[var(--c-texto)]">
          Reintentar
        </button>
      )}
    </div>
  );
}

export function Vacio({ icono: Icono, titulo, texto, accion }: { icono: LucideIcon; titulo: string; texto: string; accion?: ReactNode }) {
  return (
    <div className="text-center py-12 px-6 space-y-3">
      <span className="w-12 h-12 mx-auto rounded-2xl bg-[var(--c-teal)]/12 text-[var(--c-teal)] flex items-center justify-center">
        <Icono className="w-6 h-6" />
      </span>
      <p className="font-display font-semibold text-[var(--c-texto)]">{titulo}</p>
      <p className="text-sm text-[var(--c-suave)] max-w-sm mx-auto">{texto}</p>
      {accion}
    </div>
  );
}

/** Color según qué tan bien va una competencia. */
export function colorNivel(v: number | null) {
  if (v === null) return 'var(--c-tenue)';
  if (v >= 80) return 'var(--c-teal)';
  if (v >= UMBRAL_REFORZAR) return 'var(--c-oro)';
  return '#f43f5e';
}

export function BarrasCompetencias({ valores, compacto = false }: { valores: Competencias; compacto?: boolean }) {
  return (
    <div className={compacto ? 'space-y-2.5' : 'space-y-4'}>
      {COMPETENCIAS.map((c, i) => {
        const v = valores[c.id as CompetenciaId];
        return (
          <div key={c.id}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-[var(--c-texto)] font-medium">
                {c.nombre}
                {!compacto && <span className="text-[var(--c-suave)] font-normal text-xs"> · fase {c.fase}</span>}
              </span>
              <span className="font-mono-tabular text-xs font-semibold" style={{ color: colorNivel(v) }}>
                {v === null ? '—' : `${v} %`}
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-[var(--c-hondo)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: colorNivel(v) }}
                initial={{ width: 0 }}
                animate={{ width: `${v ?? 0}%` }}
                transition={{ duration: 0.7, delay: 0.05 * i, ease: 'easeOut' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Barras de actividad de los últimos días. */
export function Actividad({ datos }: { datos: { dia: string; intentos: number }[] }) {
  const max = Math.max(1, ...datos.map((d) => d.intentos));
  return (
    <div>
      <div className="flex items-end gap-1.5 h-28">
        {datos.map((d, i) => (
          <div key={d.dia} className="flex-1 flex flex-col items-center justify-end h-full group relative">
            <span className="absolute -top-5 text-[10px] font-mono-tabular text-[var(--c-suave)] opacity-0 group-hover:opacity-100 transition-opacity">{d.intentos}</span>
            <motion.div
              className="w-full rounded-t-md bg-[var(--c-teal)]"
              style={{ opacity: d.intentos ? 1 : 0.2 }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, (d.intentos / max) * 100)}%` }}
              transition={{ duration: 0.5, delay: i * 0.02 }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-[var(--c-suave)] mt-2 font-mono-tabular">
        <span>{new Date(datos[0].dia + 'T12:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>
        <span>Hoy</span>
      </div>
    </div>
  );
}

export function fechaCorta(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', timeZone: 'America/Lima' });
}

export function haceCuanto(iso: string | null) {
  if (!iso) return 'Nunca';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'Hoy';
  if (d === 1) return 'Ayer';
  return `Hace ${d} días`;
}

export function Modal({ titulo, children, onCerrar, ancho = 'max-w-lg' }: { titulo: string; children: ReactNode; onCerrar: () => void; ancho?: string }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={titulo}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCerrar} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className={`relative w-full ${ancho} max-h-[90vh] overflow-y-auto bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-2xl shadow-2xl`}
      >
        <div className="sticky top-0 bg-[var(--c-panel)] flex items-center justify-between px-6 py-4 border-b border-[var(--c-linea)]">
          <h2 className="font-display font-bold text-lg">{titulo}</h2>
          <button onClick={onCerrar} className="p-1.5 rounded-lg text-[var(--c-suave)] hover:bg-[var(--c-elevado)]" aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
}

export const estiloCampo =
  'w-full px-3.5 py-2.5 rounded-xl bg-[var(--c-fondo)] border border-[var(--c-linea-fuerte)] text-sm text-[var(--c-texto)] focus:outline-none focus:border-[var(--c-teal)] focus:ring-2 focus:ring-[var(--c-teal)]/25';

export function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: ReactNode; ayuda?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--c-texto)]">{etiqueta}</span>
      <span className="block mt-1.5">{children}</span>
      {ayuda && <span className="block text-[11px] text-[var(--c-suave)] mt-1">{ayuda}</span>}
    </label>
  );
}

export function BotonPrincipal({ children, className = '', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--c-teal)] hover:bg-[var(--c-teal-hover)] text-[var(--c-sobre)] text-sm font-semibold transition-colors disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function BotonSecundario({ children, className = '', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--c-linea-fuerte)] hover:bg-[var(--c-elevado)] text-[var(--c-texto)] text-sm font-medium transition-colors disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}
