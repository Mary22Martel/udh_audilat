import { motion, Reorder } from 'motion/react';
import { Check, GripVertical, Scale, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { mezclar, NOMBRE_TIPO, type LineaAsiento, type Pregunta, type Respuesta } from '../../lib/preguntas';
import { Comprobante } from './Comprobante';

/**
 * Un minijuego por tipo de pregunta. Son controlados: reciben la respuesta actual (`valor`) y avisan cada cambio.
 * Con `revelar` muestran la solución (solo cuando la pregunta trae sus respuestas).
 */
interface PropsJuego<T extends Pregunta['tipo']> {
  p: Extract<Pregunta, { tipo: T }>;
  valor: Extract<Respuesta, { tipo: T }> | null;
  onCambio: (r: Extract<Respuesta, { tipo: T }> | null) => void;
  revelar?: boolean;
  bloqueado?: boolean;
}

const LETRAS = 'ABCDEFGH';
const num = (s: string) => {
  const n = Number(String(s).replace(/,/g, '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : NaN;
};

function Opcion({ p, valor, onCambio, revelar, bloqueado }: PropsJuego<'opcion'>) {
  return (
    <div className="grid gap-2.5">
      {p.opciones.map((o, i) => {
        const elegida = valor?.indice === i;
        const correcta = revelar && i === p.correcta;
        const mal = revelar && elegida && i !== p.correcta;
        return (
          <motion.button
            key={i}
            type="button"
            whileTap={{ scale: 0.98 }}
            disabled={bloqueado || revelar}
            onClick={() => onCambio({ tipo: 'opcion', indice: i })}
            className={`flex items-center gap-3 text-left px-4 py-3.5 rounded-xl border-2 transition-colors ${
              correcta
                ? 'border-emerald-500 bg-emerald-500/12'
                : mal
                  ? 'border-rose-500 bg-rose-500/10'
                  : elegida
                    ? 'border-[var(--c-teal)] bg-[var(--c-teal)]/12'
                    : 'border-[var(--c-linea-fuerte)] hover:border-[var(--c-teal)]/60 bg-[var(--c-panel)]'
            }`}
          >
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm shrink-0 ${
                correcta ? 'bg-emerald-500 text-white' : mal ? 'bg-rose-500 text-white' : elegida ? 'bg-[var(--c-teal)] text-[var(--c-sobre)]' : 'bg-[var(--c-elevado)]'
              }`}
            >
              {correcta ? <Check className="w-4 h-4" /> : mal ? <X className="w-4 h-4" /> : LETRAS[i]}
            </span>
            <span className="text-[15px]">{o}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function VerdaderoFalso({ p, valor, onCambio, revelar, bloqueado }: PropsJuego<'vf'>) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[true, false].map((v) => {
        const elegida = valor?.valor === v;
        const correcta = revelar && p.correcta === v;
        const mal = revelar && elegida && p.correcta !== v;
        return (
          <motion.button
            key={String(v)}
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={bloqueado || revelar}
            onClick={() => onCambio({ tipo: 'vf', valor: v })}
            className={`relative py-8 rounded-2xl border-2 font-display font-black text-xl tracking-wide transition-colors ${
              correcta
                ? 'border-emerald-500 bg-emerald-500/12 text-emerald-500'
                : mal
                  ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                  : elegida
                    ? v
                      ? 'border-[var(--c-teal)] bg-[var(--c-teal)]/15 text-[var(--c-teal)]'
                      : 'border-[var(--c-oro)] bg-[var(--c-oro)]/15 text-[var(--c-oro)]'
                    : 'border-[var(--c-linea-fuerte)] bg-[var(--c-panel)] text-[var(--c-suave)] hover:text-[var(--c-texto)]'
            }`}
          >
            {v ? 'VERDADERO' : 'FALSO'}
            <span className="block text-[11px] font-sans font-semibold tracking-normal mt-1 opacity-70">{v ? 'Procede' : 'No procede'}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function Calculo({ p, valor, onCambio, revelar, bloqueado }: PropsJuego<'calculo'>) {
  const [texto, setTexto] = useState(valor ? String(valor.valor) : '');
  const unidad = p.unidad ?? '';
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3 max-w-sm mx-auto px-4 py-3 rounded-2xl border-2 border-[var(--c-linea-fuerte)] focus-within:border-[var(--c-teal)] bg-[var(--c-panel)]">
        {unidad === 'S/' && <span className="font-display font-bold text-xl text-[var(--c-suave)]">S/</span>}
        <input
          inputMode="decimal"
          autoFocus
          disabled={bloqueado || revelar}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            const n = num(e.target.value);
            onCambio(e.target.value.trim() && Number.isFinite(n) ? { tipo: 'calculo', valor: n } : null);
          }}
          placeholder="0.00"
          className="flex-1 min-w-0 bg-transparent font-mono text-2xl font-bold text-center focus:outline-none"
          aria-label="Tu respuesta"
        />
        {unidad && unidad !== 'S/' && <span className="font-semibold text-[var(--c-suave)]">{unidad}</span>}
      </label>
      {revelar && (
        <p className="text-center text-sm">
          Respuesta correcta: <strong className="font-mono text-emerald-500">{unidad === 'S/' ? 'S/ ' : ''}{p.respuesta.toLocaleString('en-US', { maximumFractionDigits: 2 })}{unidad && unidad !== 'S/' ? ` ${unidad}` : ''}</strong>
        </p>
      )}
    </div>
  );
}

const COLOR_GRUPO = ['#48a6a7', '#f2b632', '#e4572e', '#8e7dbe', '#3fa34d', '#2d7dd2'];

function Clasificar({ p, valor, onCambio, revelar, bloqueado }: PropsJuego<'clasificar'>) {
  const grupos = valor?.grupos ?? p.items.map(() => -1);
  const [elegido, setElegido] = useState<number | null>(null);
  const asignar = (item: number, grupo: number) => {
    const g = [...grupos];
    g[item] = grupo;
    onCambio(g.every((x) => x >= 0) ? { tipo: 'clasificar', grupos: g } : { tipo: 'clasificar', grupos: g });
    setElegido(null);
  };
  const sueltos = p.items.map((it, i) => ({ ...it, i })).filter((x) => grupos[x.i] < 0);

  const Ficha = ({ i, texto }: { i: number; texto: string }) => {
    const ok = revelar ? grupos[i] === p.items[i].grupo : null;
    return (
      <motion.button
        layout
        layoutId={`ficha-${p.id}-${i}`}
        type="button"
        disabled={bloqueado || revelar}
        onClick={() => (grupos[i] >= 0 ? asignar(i, -1) : setElegido(elegido === i ? null : i))}
        className={`text-left text-sm px-3 py-2 rounded-lg border-2 shadow-sm ${
          ok === true
            ? 'border-emerald-500 bg-emerald-500/10'
            : ok === false
              ? 'border-rose-500 bg-rose-500/10'
              : elegido === i
                ? 'border-[var(--c-oro)] bg-[var(--c-oro)]/15 ring-2 ring-[var(--c-oro)]/30'
                : 'border-[var(--c-linea-fuerte)] bg-[var(--c-panel)] hover:border-[var(--c-teal)]'
        }`}
      >
        {texto}
        {ok === false && <span className="block text-[11px] text-emerald-500 mt-0.5">→ {p.grupos[p.items[i].grupo]}</span>}
      </motion.button>
    );
  };

  return (
    <div className="space-y-4">
      {sueltos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--c-suave)]">{elegido === null ? 'Toca una ficha y luego el grupo donde va.' : 'Ahora toca el grupo.'}</p>
          <div className="flex flex-wrap gap-2">
            {sueltos.map((x) => (
              <Ficha key={x.i} i={x.i} texto={x.texto} />
            ))}
          </div>
        </div>
      )}
      <div className={`grid gap-3 ${p.grupos.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {p.grupos.map((g, gi) => (
          <button
            key={gi}
            type="button"
            disabled={bloqueado || revelar || elegido === null}
            onClick={() => elegido !== null && asignar(elegido, gi)}
            className={`text-left rounded-2xl border-2 border-dashed p-3 min-h-28 transition-colors ${elegido !== null ? 'hover:bg-[var(--c-elevado)]/50 cursor-pointer' : ''}`}
            style={{ borderColor: `${COLOR_GRUPO[gi % COLOR_GRUPO.length]}88` }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: COLOR_GRUPO[gi % COLOR_GRUPO.length] }}>
              {g}
            </p>
            <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
              {p.items.map((it, i) => (grupos[i] === gi ? <Ficha key={i} i={i} texto={it.texto} /> : null))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Asiento({ p, valor, onCambio, revelar, bloqueado }: PropsJuego<'asiento'>) {
  const filas = p.lineas.length;
  const [lineas, setLineas] = useState<{ codigo: string; debe: string; haber: string }[]>(() =>
    valor ? valor.lineas.map((l) => ({ codigo: l.codigo, debe: l.debe ? String(l.debe) : '', haber: l.haber ? String(l.haber) : '' })) : Array.from({ length: filas }, () => ({ codigo: '', debe: '', haber: '' }))
  );
  const cambiar = (i: number, campo: 'codigo' | 'debe' | 'haber', v: string) => {
    const nuevas = lineas.map((l, k) => (k === i ? { ...l, [campo]: v, ...(campo === 'debe' && v ? { haber: '' } : campo === 'haber' && v ? { debe: '' } : {}) } : l));
    setLineas(nuevas);
    const listas = nuevas.every((l) => l.codigo && (num(l.debe) > 0 || num(l.haber) > 0));
    onCambio(
      listas
        ? {
            tipo: 'asiento',
            lineas: nuevas.map((l): LineaAsiento => ({ codigo: l.codigo, ...(num(l.debe) > 0 ? { debe: num(l.debe) } : {}), ...(num(l.haber) > 0 ? { haber: num(l.haber) } : {}) })),
          }
        : null
    );
  };
  const tDebe = lineas.reduce((s, l) => s + (num(l.debe) || 0), 0);
  const tHaber = lineas.reduce((s, l) => s + (num(l.haber) || 0), 0);
  const cuadra = tDebe > 0 && Math.abs(tDebe - tHaber) < 0.005;
  const campo = 'w-full bg-[var(--c-fondo)] border border-[var(--c-linea-fuerte)] rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[var(--c-teal)] disabled:opacity-70';

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[var(--c-linea)] overflow-hidden bg-[var(--c-panel)]">
        <div className="grid grid-cols-[1fr_96px_96px] sm:grid-cols-[1fr_120px_120px] gap-2 px-3 py-2 bg-[var(--c-hondo)] text-[11px] font-bold uppercase tracking-wider text-[var(--c-suave)]">
          <span>Cuenta</span>
          <span className="text-right">Debe</span>
          <span className="text-right">Haber</span>
        </div>
        {lineas.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_96px_96px] sm:grid-cols-[1fr_120px_120px] gap-2 px-3 py-2 border-t border-[var(--c-linea)]">
            <select className={campo} value={l.codigo} disabled={bloqueado || revelar} onChange={(e) => cambiar(i, 'codigo', e.target.value)} aria-label={`Cuenta de la línea ${i + 1}`}>
              <option value="">Elige la cuenta…</option>
              {p.cuentas.map((c) => (
                <option key={c.codigo} value={c.codigo}>
                  {c.codigo} · {c.nombre}
                </option>
              ))}
            </select>
            <input className={`${campo} text-right font-mono`} inputMode="decimal" placeholder="—" value={l.debe} disabled={bloqueado || revelar} onChange={(e) => cambiar(i, 'debe', e.target.value)} aria-label={`Debe de la línea ${i + 1}`} />
            <input className={`${campo} text-right font-mono`} inputMode="decimal" placeholder="—" value={l.haber} disabled={bloqueado || revelar} onChange={(e) => cambiar(i, 'haber', e.target.value)} aria-label={`Haber de la línea ${i + 1}`} />
          </div>
        ))}
        <div className="grid grid-cols-[1fr_96px_96px] sm:grid-cols-[1fr_120px_120px] gap-2 px-3 py-2.5 border-t-2 border-[var(--c-linea-fuerte)] font-mono text-sm font-bold">
          <span className={`font-sans text-xs flex items-center gap-1.5 ${cuadra ? 'text-emerald-500' : 'text-[var(--c-suave)]'}`}>
            <Scale className="w-4 h-4" /> {cuadra ? 'El asiento cuadra' : tDebe || tHaber ? 'Todavía no cuadra' : 'Totales'}
          </span>
          <span className="text-right">{tDebe.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          <span className="text-right">{tHaber.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      {revelar && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm">
          <p className="font-semibold text-emerald-500 mb-1.5">Asiento correcto</p>
          {p.lineas.map((l, i) => (
            <p key={i} className="font-mono text-xs flex justify-between gap-2">
              <span className={l.haber ? 'pl-6' : ''}>
                {l.codigo} {p.cuentas.find((c) => c.codigo === l.codigo)?.nombre}
              </span>
              <span>{l.debe ? `Debe ${l.debe.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : `Haber ${l.haber!.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function Documento({ p, valor, onCambio, revelar, bloqueado }: PropsJuego<'documento'>) {
  const marcados = valor?.marcados ?? [];
  return (
    <div className="space-y-2">
      {!revelar && (
        <p className="text-xs text-[var(--c-suave)]">
          Toca el dato que está mal para sellarlo como <strong className="text-rose-400">OBSERVADO</strong>. Tócalo otra vez para quitar el sello. Marcados: <strong className="font-mono">{marcados.length}</strong>
        </p>
      )}
      <Comprobante
        c={p.documento}
        modo={revelar ? 'revelar' : bloqueado ? 'ver' : 'marcar'}
        marcados={marcados}
        errores={revelar ? p.errores : []}
        onCampo={(k) => {
          const nuevos = marcados.includes(k) ? marcados.filter((x) => x !== k) : [...marcados, k];
          onCambio(nuevos.length ? { tipo: 'documento', marcados: nuevos } : null);
        }}
      />
    </div>
  );
}

function Ordenar({ p, valor, onCambio, revelar, bloqueado }: PropsJuego<'ordenar'>) {
  // En la Academia la pregunta trae el orden correcto: se mezcla para mostrarla (con semilla, para que no cambie).
  const inicial = useMemo(() => {
    let m = mezclar(p.pasos, p.id.length * 31 + p.pasos.length);
    if (m.join('|') === p.pasos.join('|')) m = [...p.pasos].reverse();
    return m;
  }, [p.id, p.pasos]);
  const orden = valor?.orden ?? inicial;
  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--c-suave)]">Arrastra los pasos para ponerlos en orden (del primero al último).</p>
      <Reorder.Group axis="y" values={orden} onReorder={(o) => !bloqueado && !revelar && onCambio({ tipo: 'ordenar', orden: o })} className="space-y-2">
        {orden.map((paso, i) => {
          const ok = revelar ? p.pasos[i] === paso : null;
          return (
            <Reorder.Item
              key={paso}
              value={paso}
              dragListener={!bloqueado && !revelar}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl border-2 bg-[var(--c-panel)] select-none ${
                ok === true ? 'border-emerald-500' : ok === false ? 'border-rose-500' : 'border-[var(--c-linea-fuerte)] cursor-grab active:cursor-grabbing active:shadow-xl'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-[var(--c-elevado)] flex items-center justify-center font-mono text-xs font-bold shrink-0">{i + 1}</span>
              <span className="flex-1 text-sm">{paso}</span>
              {ok === false && <span className="text-[11px] text-emerald-500">va en el {p.pasos.indexOf(paso) + 1}</span>}
              {!revelar && <GripVertical className="w-4 h-4 text-[var(--c-tenue)]" />}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
}

/** Respuesta inicial: en «ordenar» el orden mostrado ya es una respuesta válida. */
export function respuestaInicial(p: Pregunta): Respuesta | null {
  if (p.tipo !== 'ordenar') return null;
  let m = mezclar(p.pasos, p.id.length * 31 + p.pasos.length);
  if (m.join('|') === p.pasos.join('|')) m = [...p.pasos].reverse();
  return { tipo: 'ordenar', orden: m };
}

export function JuegoPregunta({ p, valor, onCambio, revelar, bloqueado }: { p: Pregunta; valor: Respuesta | null; onCambio: (r: Respuesta | null) => void; revelar?: boolean; bloqueado?: boolean }) {
  const comunes = { revelar, bloqueado, onCambio: onCambio as never, valor: valor as never };
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--c-oro)]">{NOMBRE_TIPO[p.tipo].juego}</p>
        <h2 className="font-display text-xl sm:text-2xl font-bold leading-snug mt-1.5">{p.enunciado}</h2>
      </div>
      {p.tipo === 'opcion' && <Opcion p={p} {...comunes} />}
      {p.tipo === 'vf' && <VerdaderoFalso p={p} {...comunes} />}
      {p.tipo === 'calculo' && <Calculo key={p.id} p={p} {...comunes} />}
      {p.tipo === 'clasificar' && <Clasificar p={p} {...comunes} />}
      {p.tipo === 'asiento' && <Asiento key={p.id} p={p} {...comunes} />}
      {p.tipo === 'documento' && <Documento p={p} {...comunes} />}
      {p.tipo === 'ordenar' && <Ordenar p={p} {...comunes} />}
    </div>
  );
}

/** ¿La respuesta está completa como para verificarla? */
export function respuestaCompleta(p: Pregunta, r: Respuesta | null): boolean {
  if (!r) return false;
  if (r.tipo === 'clasificar') return r.grupos.length === (p as Extract<Pregunta, { tipo: 'clasificar' }>).items.length && r.grupos.every((g) => g >= 0);
  return true;
}
