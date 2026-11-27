import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { CAMPOS_COMPROBANTE, NOMBRE_COMPROBANTE, tieneItems, type Comprobante as TComprobante } from '../../lib/preguntas';

/**
 * Comprobante en papel. Modos:
 *  - ver: solo lectura.
 *  - marcar: el alumno toca los datos que cree que están mal.
 *  - revelar: muestra qué marcó y cuáles eran los errores.
 *  - errores: el docente toca los datos para marcarlos como «el error».
 */
export type ModoComprobante = 'ver' | 'marcar' | 'revelar' | 'errores';

interface Props {
  c: TComprobante;
  modo?: ModoComprobante;
  marcados?: string[];
  errores?: string[];
  onCampo?: (clave: string) => void;
  compacto?: boolean;
}

const num = (s: string) => Number(String(s).replace(/[^\d.-]/g, '')) || 0;

export function Comprobante({ c, modo = 'ver', marcados = [], errores = [], onCampo, compacto = false }: Props) {
  const campos = CAMPOS_COMPROBANTE[c.tipo];
  const tiene = (k: string) => campos.some((f) => f.clave === k);
  const interactivo = modo === 'marcar' || modo === 'errores';

  /** Envuelve un dato para poder tocarlo y mostrar su sello. */
  const D = ({ k, children, className = '' }: { k: string; children: ReactNode; className?: string }) => {
    const marcado = marcados.includes(k);
    const esError = errores.includes(k);
    let estilo = '';
    let sello: ReactNode = null;
    if (modo === 'marcar' || modo === 'errores') {
      estilo = marcado
        ? 'bg-rose-100 ring-2 ring-rose-500 text-rose-950'
        : 'hover:bg-amber-100 hover:ring-1 hover:ring-amber-500 cursor-pointer';
      if (marcado)
        sello = (
          <motion.span
            initial={{ scale: 1.8, opacity: 0, rotate: -18 }}
            animate={{ scale: 1, opacity: 1, rotate: -8 }}
            className="absolute -top-3 -right-2 px-1.5 py-[1px] rounded border-2 border-rose-600 text-rose-700 bg-white/90 text-[9px] font-black tracking-wider pointer-events-none"
          >
            {modo === 'errores' ? 'ERROR' : 'OBSERVADO'}
          </motion.span>
        );
    } else if (modo === 'revelar') {
      if (esError && marcado) {
        estilo = 'bg-emerald-100 ring-2 ring-emerald-600';
        sello = <span className="absolute -top-3 -right-2 px-1.5 rounded border-2 border-emerald-700 text-emerald-800 bg-white text-[9px] font-black">✓ DETECTADO</span>;
      } else if (esError) {
        estilo = 'bg-amber-100 ring-2 ring-amber-500';
        sello = <span className="absolute -top-3 -right-2 px-1.5 rounded border-2 border-amber-600 text-amber-700 bg-white text-[9px] font-black">ERA EL ERROR</span>;
      } else if (marcado) {
        estilo = 'bg-rose-50 ring-1 ring-rose-400 line-through decoration-rose-500';
        sello = <span className="absolute -top-3 -right-2 px-1.5 rounded border border-rose-500 text-rose-600 bg-white text-[9px] font-bold">NO ERA</span>;
      }
    }
    const contenido = (
      <span className={`relative inline-block rounded px-1 -mx-1 transition-colors ${estilo} ${className}`}>
        {children || <span className="text-slate-300">—</span>}
        {sello}
      </span>
    );
    return interactivo ? (
      <button type="button" onClick={() => onCampo?.(k)} className="text-left align-baseline" title="Tocar para marcar">
        {contenido}
      </button>
    ) : (
      contenido
    );
  };

  const v = (k: string) => c.campos[k] ?? '';
  const esNC = c.tipo === 'nota_credito';
  const acento = esNC ? 'text-rose-800 border-rose-700' : c.tipo === 'guia_remision' ? 'text-emerald-900 border-emerald-800' : 'text-[#0f2a3d] border-[#0f2a3d]';

  return (
    <div className={`bg-[#fffdf8] text-slate-800 rounded-xl shadow-xl border border-slate-200 font-sans ${compacto ? 'p-4 text-[11px]' : 'p-5 sm:p-6 text-[13px]'}`}>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="space-y-0.5 min-w-0">
          <p className="font-bold text-slate-900 text-[1.1em]">
            <D k="emisorRazon">{v('emisorRazon')}</D>
          </p>
          {tiene('emisorDireccion') && (
            <p className="text-slate-500">
              <D k="emisorDireccion">{v('emisorDireccion')}</D>
            </p>
          )}
          <p className="text-slate-500">
            Fecha: <D k="fecha">{v('fecha')}</D>
          </p>
        </div>
        <div className={`shrink-0 border-2 rounded-lg px-4 py-2 text-center ${acento}`}>
          <p className="font-mono font-bold">
            RUC <D k="emisorRuc">{v('emisorRuc')}</D>
          </p>
          <p className="font-black uppercase tracking-wide text-[0.95em] mt-0.5">{NOMBRE_COMPROBANTE[c.tipo]}</p>
          <p className="font-mono font-bold mt-0.5">
            <D k="serie">{v('serie')}</D>
          </p>
        </div>
      </div>

      {/* Cliente / datos del traslado */}
      <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 border-y border-dashed border-slate-300 py-3">
        {campos
          .filter((f) => f.zona === 'cliente')
          .map((f) => (
            <p key={f.clave} className="min-w-0">
              <span className="text-slate-500">{f.etiqueta}: </span>
              <D k={f.clave} className="font-medium text-slate-900">
                {v(f.clave)}
              </D>
            </p>
          ))}
      </div>

      {/* Detalle */}
      {tieneItems(c.tipo) && (
        <table className="w-full mt-3">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-300 text-[0.85em] uppercase tracking-wide">
              <th className="py-1.5 pr-2 font-semibold w-14">Cant.</th>
              <th className="py-1.5 pr-2 font-semibold">Descripción</th>
              {c.tipo !== 'guia_remision' && <th className="py-1.5 pr-2 font-semibold text-right">V. unit.</th>}
              {c.tipo !== 'guia_remision' && <th className="py-1.5 font-semibold text-right">Importe</th>}
            </tr>
          </thead>
          <tbody>
            {c.items.map((it, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-1.5 pr-2 font-mono">
                  <D k={`item${i}.cantidad`}>{it.cantidad}</D>
                </td>
                <td className="py-1.5 pr-2">
                  <D k={`item${i}.descripcion`}>{it.descripcion}</D>
                </td>
                {c.tipo !== 'guia_remision' && (
                  <td className="py-1.5 pr-2 text-right font-mono">
                    <D k={`item${i}.valorUnitario`}>{it.valorUnitario}</D>
                  </td>
                )}
                {c.tipo !== 'guia_remision' && <td className="py-1.5 text-right font-mono text-slate-600">{(num(it.cantidad) * num(it.valorUnitario)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Totales */}
      {campos.some((f) => f.zona === 'totales') && (
        <div className="mt-3 flex justify-end">
          <div className="w-full sm:w-64 space-y-1">
            {campos
              .filter((f) => f.zona === 'totales')
              .map((f, i, arr) => (
                <p key={f.clave} className={`flex justify-between gap-3 ${i === arr.length - 1 ? 'font-bold text-slate-900 border-t border-slate-300 pt-1' : ''}`}>
                  <span className="text-slate-500">{f.etiqueta}</span>
                  <D k={f.clave} className="font-mono whitespace-nowrap">
                    {v(f.clave)}
                  </D>
                </p>
              ))}
          </div>
        </div>
      )}

      {campos
        .filter((f) => f.zona === 'pie')
        .map((f) => (
          <p key={f.clave} className="mt-3 text-slate-600">
            <span className="text-slate-500">{f.etiqueta}: </span>
            <D k={f.clave}>{v(f.clave)}</D>
          </p>
        ))}

      <p className="mt-4 text-[0.75em] text-slate-400 text-center">Representación impresa simulada con fines educativos</p>
    </div>
  );
}
