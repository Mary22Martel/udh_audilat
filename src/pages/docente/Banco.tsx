import { motion } from 'motion/react';
import { ArrowLeft, Copy, EyeOff, FileWarning, Filter, Pencil, Plus, RotateCcw, Search, Trash2, Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EditorPregunta, plantillaPregunta } from '../../components/preguntas/Editor';
import { BotonPrincipal, BotonSecundario, CajaError, Cargando, Encabezado, Modal, Pagina, Tarjeta, Vacio, colorNivel, estiloCampo } from '../../components/ui';
import { LECCIONES, MODULOS } from '../../data/academiaCurso';
import { api, type PreguntaBanco } from '../../lib/api';
import { NOMBRE_TIPO, type Pregunta, type TipoPregunta } from '../../lib/preguntas';
import { useSesion } from '../../lib/sesion';

const DESCRIPCION_TIPO: Record<TipoPregunta, string> = {
  documento: 'Usa una plantilla de factura, boleta, nota de crédito, guía o recibo. Cambia los datos y marca dónde está el error.',
  asiento: 'El alumno arma el asiento en el libro diario: elige cuentas y montos en el Debe o el Haber.',
  clasificar: 'El alumno ordena fichas en grupos (por ejemplo, deducible o no deducible).',
  calculo: 'El alumno escribe un número: IGV, base imponible, faltante…',
  opcion: 'Pregunta con varias opciones y una correcta.',
  vf: 'Una afirmación que el alumno marca como verdadera o falsa.',
  ordenar: 'El alumno arrastra los pasos de un procedimiento hasta ponerlos en orden.',
};

/** Selector de tipo al crear una pregunta. */
function ElegirTipo({ onElegir }: { onElegir: (t: TipoPregunta) => void }) {
  const orden: TipoPregunta[] = ['documento', 'asiento', 'clasificar', 'calculo', 'opcion', 'vf', 'ordenar'];
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {orden.map((t, i) => (
        <motion.button
          key={t}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          onClick={() => onElegir(t)}
          className={`text-left p-4 rounded-2xl border-2 hover:border-[var(--c-teal)] transition-colors ${i === 0 ? 'sm:col-span-2 border-[var(--c-oro)]/60 bg-[var(--c-oro)]/8' : 'border-[var(--c-linea)]'}`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--c-oro)]">{NOMBRE_TIPO[t].juego}</p>
          <p className="font-display font-bold mt-0.5">{NOMBRE_TIPO[t].nombre}</p>
          <p className="text-xs text-[var(--c-suave)] mt-1">{DESCRIPCION_TIPO[t]}</p>
        </motion.button>
      ))}
    </div>
  );
}

export function Banco() {
  const { usuario } = useSesion();
  const [params, setParams] = useSearchParams();
  const [preguntas, setPreguntas] = useState<PreguntaBanco[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [modulo, setModulo] = useState('');
  const [tipo, setTipo] = useState('');
  const [origen, setOrigen] = useState<'todas' | 'base' | 'docentes' | 'mias' | 'inactivas'>('todas');
  const [editando, setEditando] = useState<Pregunta | null>(null);
  const [eligiendo, setEligiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminar, setEliminar] = useState<PreguntaBanco | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = () => api.get<{ preguntas: PreguntaBanco[] }>('/api/preguntas').then((r) => setPreguntas(r.preguntas)).catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
  }, []);

  // Abrir directamente una pregunta (?editar=id), por ejemplo desde «Preguntas que más fallan».
  useEffect(() => {
    const id = params.get('editar');
    if (id && preguntas) {
      const p = preguntas.find((x) => x.id === id);
      if (p) setEditando(p);
      params.delete('editar');
      setParams(params, { replace: true });
    }
  }, [preguntas, params, setParams]);

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (preguntas ?? []).filter((p) => {
      const lec = LECCIONES.find((l) => l.id === p.leccionId);
      if (modulo && lec?.moduloId !== modulo) return false;
      if (tipo && p.tipo !== tipo) return false;
      if (origen === 'base' && p.autor) return false;
      if (origen === 'docentes' && !p.autor) return false;
      if (origen === 'mias' && p.autor !== usuario?.nombre) return false;
      if (origen === 'inactivas' ? p.activo !== false : p.activo === false) return false;
      return !t || p.enunciado.toLowerCase().includes(t);
    });
  }, [preguntas, q, modulo, tipo, origen, usuario]);

  const guardar = async (p: Pregunta) => {
    setGuardando(true);
    try {
      if (p.id === 'nueva') await api.post('/api/preguntas', p);
      else await api.put(`/api/preguntas/${p.id}`, p);
      setEditando(null);
      setAviso(p.id === 'nueva' ? 'Pregunta creada. Ya aparece en la Academia.' : 'Cambios guardados.');
      cargar();
    } catch (e) {
      setAviso((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  if (error) return <CajaError mensaje={error} onReintentar={cargar} />;
  if (!preguntas) return <Cargando />;

  if (editando)
    return (
      <Pagina ancho="max-w-[1400px]">
        <button onClick={() => setEditando(null)} className="inline-flex items-center gap-2 text-sm text-[var(--c-suave)] hover:text-[var(--c-texto)]">
          <ArrowLeft className="w-4 h-4" /> Volver al banco
        </button>
        <Encabezado antetitulo={editando.id === 'nueva' ? 'Nueva pregunta' : editando.autor ? `Creada por ${editando.autor}` : 'Pregunta base del sistema'} titulo={NOMBRE_TIPO[editando.tipo].nombre} />
        {editando.id !== 'nueva' && !editando.autor && (
          <p className="text-xs text-[var(--c-suave)] -mt-4">Los cambios se aplican para todos los alumnos. Siempre puedes volver a la versión original con «Restaurar».</p>
        )}
        <EditorPregunta key={editando.id} inicial={editando} onGuardar={guardar} onCancelar={() => setEditando(null)} guardando={guardando} />
      </Pagina>
    );

  const total = preguntas.filter((p) => p.activo !== false).length;
  const mias = preguntas.filter((p) => p.autor === usuario?.nombre).length;

  return (
    <Pagina>
      <Encabezado
        antetitulo="Academia"
        titulo="Banco de preguntas"
        descripcion={`${total} preguntas activas en ${LECCIONES.length} lecciones${mias ? ` · ${mias} creadas por ti` : ''}. Lo que edites aquí cambia lo que ven los alumnos en la Academia, y puedes usarlas en tus proyectos por equipos.`}
        acciones={
          <BotonPrincipal onClick={() => setEligiendo(true)}>
            <Plus className="w-4 h-4" /> Nueva pregunta
          </BotonPrincipal>
        }
      />

      {aviso && (
        <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-sm px-4 py-3 rounded-xl bg-[var(--c-teal)]/12 text-[var(--c-teal)]" onAnimationComplete={() => setTimeout(() => setAviso(null), 3500)}>
          {aviso}
        </motion.p>
      )}

      <Tarjeta className="p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
        <label className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--c-suave)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en los enunciados" className={`${estiloCampo} pl-9 py-2`} />
        </label>
        <select value={modulo} onChange={(e) => setModulo(e.target.value)} className={`${estiloCampo} py-2 lg:w-56`}>
          <option value="">Todos los módulos</option>
          {MODULOS.map((m) => (
            <option key={m.id} value={m.id}>
              M{m.numero} · {m.titulo}
            </option>
          ))}
        </select>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={`${estiloCampo} py-2 lg:w-52`}>
          <option value="">Todos los tipos</option>
          {(Object.keys(NOMBRE_TIPO) as TipoPregunta[]).map((t) => (
            <option key={t} value={t}>
              {NOMBRE_TIPO[t].nombre}
            </option>
          ))}
        </select>
        <select value={origen} onChange={(e) => setOrigen(e.target.value as typeof origen)} className={`${estiloCampo} py-2 lg:w-44`}>
          <option value="todas">Todas</option>
          <option value="base">Base del sistema</option>
          <option value="docentes">Creadas por docentes</option>
          <option value="mias">Creadas por mí</option>
          <option value="inactivas">Desactivadas</option>
        </select>
      </Tarjeta>

      {visibles.length === 0 ? (
        <Tarjeta>
          <Vacio icono={Filter} titulo="No hay preguntas con ese filtro" texto="Cambia los filtros o crea una pregunta nueva." />
        </Tarjeta>
      ) : (
        <div className="space-y-6">
          {MODULOS.map((m) => {
            const delModulo = visibles.filter((p) => LECCIONES.find((l) => l.id === p.leccionId)?.moduloId === m.id);
            if (!delModulo.length) return null;
            return (
              <section key={m.id} className="space-y-2">
                <h2 className="font-display font-bold text-sm text-[var(--c-suave)]">
                  Módulo {m.numero} · {m.titulo} <span className="font-mono font-normal">({delModulo.length})</span>
                </h2>
                <div className="grid gap-2">
                  {delModulo.map((p) => (
                    <div key={p.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-[var(--c-panel)] border border-[var(--c-linea)] ${p.activo === false ? 'opacity-55' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className={`px-2 py-0.5 rounded-md font-semibold ${p.tipo === 'documento' ? 'bg-[var(--c-oro)]/15 text-[var(--c-oro)]' : 'bg-[var(--c-teal)]/12 text-[var(--c-teal)]'}`}>
                            {p.tipo === 'documento' && <FileWarning className="inline w-3 h-3 mr-1 -mt-0.5" />}
                            {NOMBRE_TIPO[p.tipo].nombre}
                          </span>
                          <span className="text-[var(--c-suave)]">{LECCIONES.find((l) => l.id === p.leccionId)?.titulo}</span>
                          <span className="text-[var(--c-suave)]">· {p.autor ? `por ${p.autor}` : p.editada ? 'base, editada' : 'base'}</span>
                          {p.activo === false && <span className="text-rose-400 font-semibold">· desactivada</span>}
                        </div>
                        <p className="text-sm mt-1.5 line-clamp-2">{p.enunciado}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-right text-xs">
                          <span className="block font-mono font-bold" style={{ color: colorNivel(p.acierto) }}>
                            {p.acierto === null ? '—' : `${p.acierto} %`}
                          </span>
                          <span className="text-[var(--c-suave)]">{p.respondida} resp.</span>
                        </span>
                        <span className="flex">
                          <button onClick={() => setEditando(p)} className="p-2 rounded-lg hover:bg-[var(--c-elevado)]" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditando({ ...p, id: 'nueva', enunciado: `${p.enunciado} (copia)` })} className="p-2 rounded-lg hover:bg-[var(--c-elevado)]" title="Duplicar para hacer una variante">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              await api.post(`/api/preguntas/${p.id}/estado`, { activo: p.activo === false });
                              cargar();
                            }}
                            className="p-2 rounded-lg hover:bg-[var(--c-elevado)]"
                            title={p.activo === false ? 'Activar' : 'Desactivar (deja de salir en la Academia)'}
                          >
                            {p.activo === false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          {!p.autor && p.editada && (
                            <button
                              onClick={async () => {
                                await api.post(`/api/preguntas/${p.id}/restaurar`);
                                setAviso('Pregunta restaurada a su versión original.');
                                cargar();
                              }}
                              className="p-2 rounded-lg hover:bg-[var(--c-elevado)]"
                              title="Restaurar la versión original"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          {p.autor && (
                            <button onClick={() => setEliminar(p)} className="p-2 rounded-lg hover:bg-[var(--c-elevado)] text-rose-400" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {eligiendo && (
        <Modal titulo="¿Qué tipo de pregunta quieres crear?" onCerrar={() => setEligiendo(false)} ancho="max-w-2xl">
          <ElegirTipo
            onElegir={(t) => {
              setEligiendo(false);
              setEditando(plantillaPregunta(t, LECCIONES.find((l) => l.moduloId === (modulo || 'm1'))?.id));
            }}
          />
        </Modal>
      )}
      {eliminar && (
        <Modal titulo="Eliminar pregunta" onCerrar={() => setEliminar(null)}>
          <div className="space-y-4">
            <p className="text-sm">¿Eliminar «{eliminar.enunciado}»? Si solo quieres que no salga, mejor desactívala.</p>
            <div className="flex gap-3">
              <BotonSecundario className="flex-1" onClick={() => setEliminar(null)}>
                Cancelar
              </BotonSecundario>
              <button
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold"
                onClick={async () => {
                  await api.del(`/api/preguntas/${eliminar.id}`);
                  setEliminar(null);
                  cargar();
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Pagina>
  );
}
