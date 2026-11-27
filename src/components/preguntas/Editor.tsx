import { ArrowDown, ArrowUp, Calculator, CheckCircle2, Eye, Plus, RotateCcw, Trash2, XCircle } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { CUENTAS_PCGE, LECCIONES, MODULOS } from '../../data/academiaCurso';
import {
  calificar,
  CAMPOS_COMPROBANTE,
  CAMPOS_ITEM,
  NOMBRE_COMPROBANTE,
  NOMBRE_TIPO,
  plantillaComprobante,
  tieneItems,
  totalesCorrectos,
  validarPregunta,
  type Comprobante as TComprobante,
  type Pregunta,
  type Respuesta,
  type TipoComprobante,
  type TipoPregunta,
} from '../../lib/preguntas';
import { BotonPrincipal, BotonSecundario, estiloCampo } from '../ui';
import { Comprobante } from './Comprobante';
import { JuegoPregunta, respuestaInicial } from './Preguntas';

/** Pregunta nueva de cada tipo, ya con un ejemplo para que el docente solo cambie los datos. */
export function plantillaPregunta(tipo: TipoPregunta, leccionId = LECCIONES[0].id): Pregunta {
  const base = { id: 'nueva', leccionId, enunciado: '', explicacion: '' };
  switch (tipo) {
    case 'opcion':
      return { ...base, tipo, opciones: ['', '', '', ''], correcta: 0 };
    case 'vf':
      return { ...base, tipo, correcta: true };
    case 'calculo':
      return { ...base, tipo, respuesta: 0, unidad: 'S/' };
    case 'clasificar':
      return { ...base, tipo, grupos: ['Grupo A', 'Grupo B'], items: [{ texto: '', grupo: 0 }, { texto: '', grupo: 1 }] };
    case 'asiento':
      return {
        ...base,
        tipo,
        enunciado: 'Compras mercadería al crédito por S/ 10,000 más IGV. Registra la compra.',
        cuentas: CUENTAS_PCGE.filter((c) => ['10', '20', '40111', '42', '60', '70'].includes(c.codigo)),
        lineas: [
          { codigo: '60', debe: 10000 },
          { codigo: '40111', debe: 1800 },
          { codigo: '42', haber: 11800 },
        ],
      };
    case 'documento':
      return { ...base, tipo, enunciado: 'Revisa este comprobante y marca el dato que está mal.', documento: plantillaComprobante('factura'), errores: [] };
    case 'ordenar':
      return { ...base, tipo, pasos: ['', '', ''] };
  }
}

const Etiqueta = ({ children, ayuda }: { children: ReactNode; ayuda?: string }) => (
  <span className="block mb-1.5">
    <span className="text-sm font-medium">{children}</span>
    {ayuda && <span className="block text-[11px] text-[var(--c-suave)]">{ayuda}</span>}
  </span>
);
const BotonIcono = ({ onClick, children, titulo, disabled }: { onClick: () => void; children: ReactNode; titulo: string; disabled?: boolean }) => (
  <button type="button" onClick={onClick} disabled={disabled} title={titulo} aria-label={titulo} className="p-2 rounded-lg text-[var(--c-suave)] hover:text-[var(--c-texto)] hover:bg-[var(--c-elevado)] disabled:opacity-30">
    {children}
  </button>
);

function EditorComprobante({ c, errores, onCambio }: { c: TComprobante; errores: string[]; onCambio: (c: TComprobante, errores: string[]) => void }) {
  const campos = CAMPOS_COMPROBANTE[c.tipo];
  const marcar = (k: string) => onCambio(c, errores.includes(k) ? errores.filter((x) => x !== k) : [...errores, k]);
  const setCampo = (k: string, v: string) => onCambio({ ...c, campos: { ...c.campos, [k]: v } }, errores);
  const setItem = (i: number, k: string, v: string) => onCambio({ ...c, items: c.items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) }, errores);
  const correctos = totalesCorrectos(c);

  return (
    <div className="space-y-4">
      <div>
        <Etiqueta ayuda="Elige el tipo de documento. El sistema carga un ejemplo que puedes cambiar.">Plantilla</Etiqueta>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(NOMBRE_COMPROBANTE) as TipoComprobante[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onCambio(plantillaComprobante(t), [])}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${c.tipo === t ? 'border-[var(--c-teal)] bg-[var(--c-teal)]/15 text-[var(--c-teal)]' : 'border-[var(--c-linea-fuerte)]'}`}
            >
              {NOMBRE_COMPROBANTE[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-[var(--c-oro)]/10 border border-[var(--c-oro)]/30 p-3 text-xs">
        <strong>Cómo planto el error:</strong> cambia un dato para que quede mal (por ejemplo, un IGV mal calculado o un RUC con 10 dígitos) y márcalo con la casilla <em>Es el error</em>. También puedes tocarlo en la vista previa.
      </div>

      <div className="space-y-2">
        {campos.map((f) => (
          <div key={f.clave} className="grid grid-cols-[1fr_auto] sm:grid-cols-[180px_1fr_auto] gap-2 items-center">
            <span className="text-xs text-[var(--c-suave)] col-span-2 sm:col-span-1">{f.etiqueta}</span>
            <input className={`${estiloCampo} py-2 ${errores.includes(f.clave) ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`} value={c.campos[f.clave] ?? ''} onChange={(e) => setCampo(f.clave, e.target.value)} />
            <label className={`flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap cursor-pointer ${errores.includes(f.clave) ? 'text-rose-400' : 'text-[var(--c-suave)]'}`}>
              <input type="checkbox" checked={errores.includes(f.clave)} onChange={() => marcar(f.clave)} className="accent-rose-500" /> Es el error
            </label>
          </div>
        ))}
      </div>

      {tieneItems(c.tipo) && (
        <div className="space-y-2">
          <Etiqueta>Líneas de detalle</Etiqueta>
          {c.items.map((it, i) => (
            <div key={i} className="rounded-xl border border-[var(--c-linea)] p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--c-suave)]">Línea {i + 1}</span>
                <BotonIcono titulo="Quitar línea" disabled={c.items.length <= 1} onClick={() => onCambio({ ...c, items: c.items.filter((_, j) => j !== i) }, errores.filter((e) => !e.startsWith(`item${i}.`)))}>
                  <Trash2 className="w-3.5 h-3.5" />
                </BotonIcono>
              </div>
              <div className="grid grid-cols-[70px_1fr_100px] gap-2">
                {CAMPOS_ITEM.map((f) => {
                  const k = `item${i}.${f.clave}`;
                  return (
                    <div key={f.clave} className="space-y-1">
                      <input className={`${estiloCampo} py-1.5 text-xs ${errores.includes(k) ? 'border-rose-500' : ''}`} value={it[f.clave]} onChange={(e) => setItem(i, f.clave, e.target.value)} placeholder={f.etiqueta} aria-label={`${f.etiqueta} de la línea ${i + 1}`} />
                      <label className={`flex items-center gap-1 text-[10px] cursor-pointer ${errores.includes(k) ? 'text-rose-400 font-semibold' : 'text-[var(--c-suave)]'}`}>
                        <input type="checkbox" checked={errores.includes(k)} onChange={() => marcar(k)} className="accent-rose-500" /> error
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <BotonSecundario type="button" onClick={() => onCambio({ ...c, items: [...c.items, { descripcion: '', cantidad: '1', valorUnitario: '0.00' }] }, errores)} className="w-full">
            <Plus className="w-4 h-4" /> Agregar línea
          </BotonSecundario>
        </div>
      )}

      {Object.keys(correctos).length > 0 && (
        <div className="rounded-xl border border-[var(--c-linea)] p-3 space-y-2">
          <p className="text-xs text-[var(--c-suave)]">
            Totales correctos según las líneas:{' '}
            {Object.entries(correctos).map(([k, v]) => (
              <span key={k} className="font-mono mr-2">
                {campos.find((f) => f.clave === k)?.etiqueta}: {v}
              </span>
            ))}
          </p>
          <BotonSecundario type="button" onClick={() => onCambio({ ...c, campos: { ...c.campos, ...correctos } }, errores)}>
            <Calculator className="w-4 h-4" /> Poner los totales correctos
          </BotonSecundario>
        </div>
      )}
    </div>
  );
}

export function EditorPregunta({ inicial, onGuardar, onCancelar, guardando }: { inicial: Pregunta; onGuardar: (p: Pregunta) => void; onCancelar: () => void; guardando?: boolean }) {
  const [p, setP] = useState<Pregunta>(inicial);
  const [prueba, setPrueba] = useState<Respuesta | null>(respuestaInicial(inicial));
  const [probado, setProbado] = useState<boolean | null>(null);
  const error = validarPregunta(p);
  const set = (cambios: Partial<Pregunta>) => {
    setP((x) => ({ ...x, ...cambios }) as Pregunta);
    setProbado(null);
  };
  const vista = useMemo(() => p, [p]);

  const editorTipo = () => {
    switch (p.tipo) {
      case 'opcion':
        return (
          <div className="space-y-2">
            <Etiqueta ayuda="Marca con el círculo la opción correcta.">Opciones</Etiqueta>
            {p.opciones.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correcta" checked={p.correcta === i} onChange={() => set({ correcta: i })} className="accent-emerald-500 w-4 h-4" aria-label={`Opción ${i + 1} es la correcta`} />
                <input className={`${estiloCampo} py-2 ${p.correcta === i ? 'border-emerald-500' : ''}`} value={o} onChange={(e) => set({ opciones: p.opciones.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={`Opción ${i + 1}`} />
                <BotonIcono titulo="Quitar opción" disabled={p.opciones.length <= 2} onClick={() => set({ opciones: p.opciones.filter((_, j) => j !== i), correcta: p.correcta > i ? p.correcta - 1 : p.correcta === i ? 0 : p.correcta })}>
                  <Trash2 className="w-4 h-4" />
                </BotonIcono>
              </div>
            ))}
            {p.opciones.length < 6 && (
              <BotonSecundario type="button" onClick={() => set({ opciones: [...p.opciones, ''] })}>
                <Plus className="w-4 h-4" /> Agregar opción
              </BotonSecundario>
            )}
          </div>
        );
      case 'vf':
        return (
          <div>
            <Etiqueta>La afirmación es…</Etiqueta>
            <div className="grid grid-cols-2 gap-2">
              {[true, false].map((v) => (
                <button key={String(v)} type="button" onClick={() => set({ correcta: v })} className={`py-3 rounded-xl border-2 font-bold ${p.correcta === v ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-[var(--c-linea-fuerte)]'}`}>
                  {v ? 'Verdadera' : 'Falsa'}
                </button>
              ))}
            </div>
          </div>
        );
      case 'calculo':
        return (
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="sm:col-span-2">
              <Etiqueta>Respuesta correcta</Etiqueta>
              <input className={`${estiloCampo} font-mono`} inputMode="decimal" value={Number.isFinite(p.respuesta) ? String(p.respuesta) : ''} onChange={(e) => set({ respuesta: Number(e.target.value.replace(/,/g, '')) })} />
            </label>
            <label>
              <Etiqueta>Unidad</Etiqueta>
              <select className={estiloCampo} value={p.unidad ?? ''} onChange={(e) => set({ unidad: e.target.value || undefined })}>
                <option value="S/">S/ (soles)</option>
                <option value="unid.">unidades</option>
                <option value="%">%</option>
                <option value="">sin unidad</option>
              </select>
            </label>
            <label className="sm:col-span-3">
              <Etiqueta ayuda="Cuánto puede variar la respuesta y aún contar como correcta (por redondeo).">Tolerancia</Etiqueta>
              <input className={`${estiloCampo} font-mono max-w-[160px]`} inputMode="decimal" value={p.tolerancia ?? 0.01} onChange={(e) => set({ tolerancia: Number(e.target.value) || 0 })} />
            </label>
          </div>
        );
      case 'clasificar':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Etiqueta ayuda="De 2 a 4 grupos.">Grupos</Etiqueta>
              {p.grupos.map((g, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${estiloCampo} py-2`} value={g} onChange={(e) => set({ grupos: p.grupos.map((x, j) => (j === i ? e.target.value : x)) })} />
                  <BotonIcono titulo="Quitar grupo" disabled={p.grupos.length <= 2} onClick={() => set({ grupos: p.grupos.filter((_, j) => j !== i), items: p.items.map((it) => ({ ...it, grupo: it.grupo === i ? 0 : it.grupo > i ? it.grupo - 1 : it.grupo })) })}>
                    <Trash2 className="w-4 h-4" />
                  </BotonIcono>
                </div>
              ))}
              {p.grupos.length < 4 && (
                <BotonSecundario type="button" onClick={() => set({ grupos: [...p.grupos, `Grupo ${String.fromCharCode(65 + p.grupos.length)}`] })}>
                  <Plus className="w-4 h-4" /> Agregar grupo
                </BotonSecundario>
              )}
            </div>
            <div className="space-y-2">
              <Etiqueta>Fichas y el grupo correcto de cada una</Etiqueta>
              {p.items.map((it, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${estiloCampo} py-2`} value={it.texto} placeholder="Texto de la ficha" onChange={(e) => set({ items: p.items.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)) })} />
                  <select className={`${estiloCampo} py-2 max-w-[160px]`} value={it.grupo} onChange={(e) => set({ items: p.items.map((x, j) => (j === i ? { ...x, grupo: Number(e.target.value) } : x)) })}>
                    {p.grupos.map((g, gi) => (
                      <option key={gi} value={gi}>
                        {g || `Grupo ${gi + 1}`}
                      </option>
                    ))}
                  </select>
                  <BotonIcono titulo="Quitar ficha" disabled={p.items.length <= 2} onClick={() => set({ items: p.items.filter((_, j) => j !== i) })}>
                    <Trash2 className="w-4 h-4" />
                  </BotonIcono>
                </div>
              ))}
              <BotonSecundario type="button" onClick={() => set({ items: [...p.items, { texto: '', grupo: 0 }] })}>
                <Plus className="w-4 h-4" /> Agregar ficha
              </BotonSecundario>
            </div>
          </div>
        );
      case 'asiento': {
        const d = p.lineas.reduce((s, l) => s + (l.debe ?? 0), 0);
        const h = p.lineas.reduce((s, l) => s + (l.haber ?? 0), 0);
        return (
          <div className="space-y-4">
            <div>
              <Etiqueta ayuda="Las cuentas que el alumno podrá elegir. Incluye algunas que no van, para que piense.">Cuentas disponibles</Etiqueta>
              <div className="flex flex-wrap gap-1.5">
                {CUENTAS_PCGE.map((c) => {
                  const on = p.cuentas.some((x) => x.codigo === c.codigo);
                  return (
                    <button
                      key={c.codigo}
                      type="button"
                      onClick={() => set({ cuentas: on ? p.cuentas.filter((x) => x.codigo !== c.codigo) : [...p.cuentas, c].sort((a, b) => a.codigo.localeCompare(b.codigo)) })}
                      className={`text-[11px] px-2 py-1 rounded-md border ${on ? 'border-[var(--c-teal)] bg-[var(--c-teal)]/15 text-[var(--c-teal)]' : 'border-[var(--c-linea-fuerte)] text-[var(--c-suave)]'}`}
                    >
                      {c.codigo} {c.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Etiqueta ayuda="El asiento correcto. Debe cuadrar.">Asiento solución</Etiqueta>
              {p.lineas.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_96px_110px_auto] gap-2">
                  <select className={`${estiloCampo} py-2`} value={l.codigo} onChange={(e) => set({ lineas: p.lineas.map((x, j) => (j === i ? { ...x, codigo: e.target.value } : x)) })}>
                    <option value="">Cuenta…</option>
                    {p.cuentas.map((c) => (
                      <option key={c.codigo} value={c.codigo}>
                        {c.codigo} · {c.nombre}
                      </option>
                    ))}
                  </select>
                  <select
                    className={`${estiloCampo} py-2`}
                    value={l.haber !== undefined ? 'haber' : 'debe'}
                    onChange={(e) => {
                      const m = l.debe ?? l.haber ?? 0;
                      set({ lineas: p.lineas.map((x, j) => (j === i ? { codigo: x.codigo, ...(e.target.value === 'debe' ? { debe: m } : { haber: m }) } : x)) });
                    }}
                  >
                    <option value="debe">Debe</option>
                    <option value="haber">Haber</option>
                  </select>
                  <input
                    className={`${estiloCampo} py-2 font-mono text-right`}
                    inputMode="decimal"
                    value={l.debe ?? l.haber ?? ''}
                    onChange={(e) => {
                      const m = Number(e.target.value.replace(/,/g, '')) || 0;
                      set({ lineas: p.lineas.map((x, j) => (j === i ? { codigo: x.codigo, ...(x.haber !== undefined ? { haber: m } : { debe: m }) } : x)) });
                    }}
                  />
                  <BotonIcono titulo="Quitar línea" disabled={p.lineas.length <= 2} onClick={() => set({ lineas: p.lineas.filter((_, j) => j !== i) })}>
                    <Trash2 className="w-4 h-4" />
                  </BotonIcono>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3">
                <BotonSecundario type="button" onClick={() => set({ lineas: [...p.lineas, { codigo: '', debe: 0 }] })}>
                  <Plus className="w-4 h-4" /> Agregar línea
                </BotonSecundario>
                <span className={`text-xs font-mono ${Math.abs(d - h) < 0.005 ? 'text-emerald-500' : 'text-rose-400'}`}>
                  Debe {d.toFixed(2)} · Haber {h.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        );
      }
      case 'documento':
        return <EditorComprobante c={p.documento} errores={p.errores} onCambio={(documento, errores) => set({ documento, errores })} />;
      case 'ordenar':
        return (
          <div className="space-y-2">
            <Etiqueta ayuda="Escríbelos en el orden correcto. El alumno los verá mezclados.">Pasos en orden</Etiqueta>
            {p.pasos.map((x, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[var(--c-elevado)] text-xs font-mono font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <input className={`${estiloCampo} py-2`} value={x} onChange={(e) => set({ pasos: p.pasos.map((y, j) => (j === i ? e.target.value : y)) })} />
                <BotonIcono titulo="Subir" disabled={i === 0} onClick={() => set({ pasos: p.pasos.map((y, j) => (j === i - 1 ? p.pasos[i] : j === i ? p.pasos[i - 1] : y)) })}>
                  <ArrowUp className="w-4 h-4" />
                </BotonIcono>
                <BotonIcono titulo="Bajar" disabled={i === p.pasos.length - 1} onClick={() => set({ pasos: p.pasos.map((y, j) => (j === i + 1 ? p.pasos[i] : j === i ? p.pasos[i + 1] : y)) })}>
                  <ArrowDown className="w-4 h-4" />
                </BotonIcono>
                <BotonIcono titulo="Quitar" disabled={p.pasos.length <= 3} onClick={() => set({ pasos: p.pasos.filter((_, j) => j !== i) })}>
                  <Trash2 className="w-4 h-4" />
                </BotonIcono>
              </div>
            ))}
            <BotonSecundario type="button" onClick={() => set({ pasos: [...p.pasos, ''] })}>
              <Plus className="w-4 h-4" /> Agregar paso
            </BotonSecundario>
          </div>
        );
    }
  };

  return (
    <div className="grid xl:grid-cols-2 gap-6">
      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <label>
            <Etiqueta>Lección</Etiqueta>
            <select className={estiloCampo} value={p.leccionId} onChange={(e) => set({ leccionId: e.target.value })}>
              {MODULOS.map((m) => (
                <optgroup key={m.id} label={`Módulo ${m.numero} · ${m.titulo}`}>
                  {m.lecciones.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.titulo}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            <Etiqueta>Tipo de juego</Etiqueta>
            <select
              className={estiloCampo}
              value={p.tipo}
              onChange={(e) => {
                const n = plantillaPregunta(e.target.value as TipoPregunta, p.leccionId);
                setP({ ...n, id: p.id, enunciado: p.enunciado || n.enunciado, explicacion: p.explicacion });
                setPrueba(respuestaInicial(n));
                setProbado(null);
              }}
            >
              {(Object.keys(NOMBRE_TIPO) as TipoPregunta[]).map((t) => (
                <option key={t} value={t}>
                  {NOMBRE_TIPO[t].nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <Etiqueta>Enunciado</Etiqueta>
          <textarea className={`${estiloCampo} min-h-[80px]`} value={p.enunciado} onChange={(e) => set({ enunciado: e.target.value })} placeholder="Escribe la pregunta o la situación del caso." />
        </label>
        {editorTipo()}
        <label className="block">
          <Etiqueta ayuda="Se muestra después de responder. Explica por qué es así: es lo que más enseña.">Explicación</Etiqueta>
          <textarea className={`${estiloCampo} min-h-[80px]`} value={p.explicacion} onChange={(e) => set({ explicacion: e.target.value })} />
        </label>
      </div>

      <div className="space-y-3 xl:sticky xl:top-20 self-start">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Eye className="w-4 h-4 text-[var(--c-teal)]" /> Vista previa: así la verá el alumno
        </p>
        <div className="rounded-2xl border border-dashed border-[var(--c-linea-fuerte)] p-4 bg-[var(--c-fondo)] space-y-4">
          {p.tipo === 'documento' ? (
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--c-oro)]">{NOMBRE_TIPO.documento.juego}</p>
              <p className="font-display text-lg font-bold">{p.enunciado || 'Enunciado…'}</p>
              <p className="text-xs text-[var(--c-suave)]">Toca un dato en la vista previa para marcarlo (o desmarcarlo) como error.</p>
              <Comprobante c={p.documento} modo="errores" marcados={p.errores} onCampo={(k) => set({ errores: p.errores.includes(k) ? p.errores.filter((x) => x !== k) : [...p.errores, k] })} compacto />
            </div>
          ) : (
            <>
              <JuegoPregunta key={JSON.stringify(vista)} p={vista} valor={prueba} onCambio={(r) => { setPrueba(r); setProbado(null); }} revelar={probado !== null} />
              <div className="flex items-center gap-3">
                {probado === null ? (
                  <BotonSecundario type="button" onClick={() => setProbado(calificar(p, prueba))} disabled={!prueba || !!error}>
                    Probar mi respuesta
                  </BotonSecundario>
                ) : (
                  <>
                    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${probado ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {probado ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} {probado ? 'Correcta' : 'Incorrecta'}
                    </span>
                    <BotonSecundario type="button" onClick={() => { setProbado(null); setPrueba(respuestaInicial(p)); }}>
                      <RotateCcw className="w-4 h-4" /> Probar otra vez
                    </BotonSecundario>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        {error && <p className="text-sm text-[var(--c-oro)]">Falta: {error}</p>}
        <div className="flex gap-3 pt-2">
          <BotonSecundario type="button" className="flex-1" onClick={onCancelar}>
            Cancelar
          </BotonSecundario>
          <BotonPrincipal type="button" className="flex-1" disabled={!!error || guardando} onClick={() => onGuardar(p)}>
            {guardando ? 'Guardando…' : 'Guardar pregunta'}
          </BotonPrincipal>
        </div>
      </div>
    </div>
  );
}
