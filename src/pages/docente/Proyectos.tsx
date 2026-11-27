import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, Crown, DoorOpen, FileWarning, Flag, Maximize2, Minimize2, Pencil, Play, Plus, RotateCcw, Search, Shuffle, Swords, Trash2, User, Users, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { EditorPregunta, plantillaPregunta } from '../../components/preguntas/Editor';
import { BotonPrincipal, BotonSecundario, CajaError, Cargando, Encabezado, Modal, Pagina, Tarjeta, Vacio, estiloCampo, fechaCorta } from '../../components/ui';
import { LECCIONES, MODULOS } from '../../data/academiaCurso';
import { api, type AulaDocente, type DetalleProyectoDocente, type PreguntaBanco, type ResumenProyecto, type SeguimientoAula, type Tablero } from '../../lib/api';
import { mezclar, NOMBRE_TIPO, type Pregunta, type TipoPregunta } from '../../lib/preguntas';
import { useSesion } from '../../lib/sesion';
import { soundFx } from '../../utils/soundFx';
import { PodioEquipos, Reloj, TableroEquipos, useCuentaRegresiva } from '../proyectos/Tablero';

const COLORES = ['#48a6a7', '#f2b632', '#e4572e', '#8e7dbe', '#3fa34d', '#2d7dd2', '#d1495b', '#6c757d'];
const NOMBRES = ['Equipo Turquesa', 'Equipo Ámbar', 'Equipo Coral', 'Equipo Lavanda', 'Equipo Esmeralda', 'Equipo Zafiro', 'Equipo Granate', 'Equipo Grafito'];
export const ESTADO_PROYECTO: Record<ResumenProyecto['estado'], { t: string; c: string }> = {
  preparacion: { t: 'En preparación', c: 'bg-[var(--c-elevado)] text-[var(--c-suave)]' },
  sala: { t: 'Sala abierta', c: 'bg-[var(--c-oro)] text-[#1a1406]' },
  en_curso: { t: 'EN VIVO', c: 'bg-rose-600 text-white' },
  finalizado: { t: 'Terminado', c: 'bg-[var(--c-teal)]/15 text-[var(--c-teal)]' },
};

// --- Lista ------------------------------------------------------------------------------------------------------

export function ProyectosDocente({ base = '/docente' }: { base?: string }) {
  const navigate = useNavigate();
  const { usuario } = useSesion();
  const [ps, setPs] = useState<ResumenProyecto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.get<{ proyectos: ResumenProyecto[] }>('/api/docente/proyectos').then((r) => setPs(r.proyectos)).catch((e) => setError(e.message));
  }, []);
  if (error) return <CajaError mensaje={error} />;
  if (!ps) return <Cargando />;
  return (
    <Pagina>
      <Encabezado
        antetitulo="Actividades en vivo"
        titulo="Actividades del aula"
        descripcion="Arma una actividad con preguntas y casos de comprobantes, elige cuánto dura y juéguenla en clase: cada alumno solo (como un Kahoot) o por equipos. Al acabarse el tiempo se cierra sola."
        acciones={
          usuario?.rol === 'docente' && (
            <BotonPrincipal onClick={() => navigate(`${base}/proyectos/nuevo`)}>
              <Plus className="w-4 h-4" /> Nueva actividad
            </BotonPrincipal>
          )
        }
      />
      {ps.length === 0 ? (
        <Tarjeta>
          <Vacio icono={Swords} titulo="Aún no tienes actividades" texto="Crea la primera: elige preguntas del banco (las tuyas o las del sistema) o crea casos con facturas y notas de crédito con errores escondidos." />
        </Tarjeta>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {ps.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`${base}/proyectos/${p.id}`)}
              className="text-left rounded-3xl bg-[var(--c-panel)] border border-[var(--c-linea)] shadow-tema p-6 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded ${ESTADO_PROYECTO[p.estado].c}`}>{ESTADO_PROYECTO[p.estado].t}</span>
                <span className="text-xs text-[var(--c-suave)]">{fechaCorta(p.inicio ?? p.creado)}</span>
              </div>
              <p className="font-display text-lg font-bold leading-tight">{p.nombre}</p>
              <p className="text-xs text-[var(--c-suave)]">{p.aula}{usuario?.rol === 'admin' ? ` · ${p.docente}` : ''}</p>
              <p className="text-xs text-[var(--c-suave)]">
                {p.modo === 'individual' ? 'Individual' : `${p.equipos} equipos`} · {p.preguntas} preguntas · {p.duracionMin} min
              </p>
              {p.ganador && (
                <p className="text-sm inline-flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-[var(--c-oro)]" /> Ganó <strong>{p.ganador}</strong>
                </p>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </Pagina>
  );
}

// --- Editor -----------------------------------------------------------------------------------------------------

interface EquipoForm {
  nombre: string;
  color: string;
  miembros: string[];
}

function repartir(alumnos: string[], n: number): EquipoForm[] {
  const m = mezclar(alumnos);
  return Array.from({ length: n }, (_, i) => ({ nombre: NOMBRES[i % NOMBRES.length], color: COLORES[i % COLORES.length], miembros: m.filter((_, k) => k % n === i) }));
}

export function EditorProyecto({ base = '/docente' }: { base?: string }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [aulas, setAulas] = useState<AulaDocente[] | null>(null);
  const [banco, setBanco] = useState<PreguntaBanco[] | null>(null);
  const [alumnos, setAlumnos] = useState<{ id: string; nombre: string }[]>([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [aulaId, setAulaId] = useState(params.get('aula') ?? '');
  const [duracion, setDuracion] = useState(15);
  const [modo, setModo] = useState<'individual' | 'equipos'>((params.get('modo') as 'individual' | 'equipos') ?? 'individual');
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [equipos, setEquipos] = useState<EquipoForm[]>([]);
  const [q, setQ] = useState('');
  const [modulo, setModulo] = useState('');
  const [tipo, setTipo] = useState('');
  const [creando, setCreando] = useState<Pregunta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const cargado = useRef(false);

  useEffect(() => {
    Promise.all([api.get<{ aulas: AulaDocente[] }>('/api/docente/aulas'), api.get<{ preguntas: PreguntaBanco[] }>('/api/preguntas')])
      .then(async ([a, b]) => {
        setAulas(a.aulas.filter((x) => !x.archivada));
        setBanco(b.preguntas.filter((p) => p.activo !== false));
        if (id && !cargado.current) {
          cargado.current = true;
          const d = await api.get<DetalleProyectoDocente>(`/api/docente/proyectos/${id}`);
          setNombre(d.nombre);
          setDescripcion(d.descripcion);
          setAulaId(d.aulaId);
          setDuracion(d.duracionMin);
          setModo(d.modo ?? 'equipos');
          setElegidas(d.preguntaIds);
          setEquipos(d.listaEquipos.map((e) => ({ nombre: e.nombre, color: e.color, miembros: e.miembros.map((m) => m.id) })));
        } else if (!aulaId && a.aulas[0]) setAulaId(a.aulas[0].id);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!aulaId) return;
    api.get<SeguimientoAula>(`/api/docente/aulas/${aulaId}`).then((s) => {
      const lista = s.alumnos.filter((a) => a.activo).map((a) => ({ id: a.id, nombre: a.nombre }));
      setAlumnos(lista);
      setEquipos((eqs) => {
        const ids = new Set(lista.map((a) => a.id));
        const limpios = eqs.map((e) => ({ ...e, miembros: e.miembros.filter((m) => ids.has(m)) }));
        return limpios.some((e) => e.miembros.length) ? limpios : repartir(lista.map((a) => a.id), Math.min(3, Math.max(2, Math.ceil(lista.length / 3))));
      });
    });
  }, [aulaId]);

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (banco ?? []).filter((p) => {
      const lec = LECCIONES.find((l) => l.id === p.leccionId);
      return (!modulo || lec?.moduloId === modulo) && (!tipo || p.tipo === tipo) && (!t || p.enunciado.toLowerCase().includes(t));
    });
  }, [banco, q, modulo, tipo]);

  if (error && !aulas) return <CajaError mensaje={error} />;
  if (!aulas || !banco) return <Cargando />;
  if (!aulas.length)
    return (
      <Pagina>
        <Tarjeta>
          <Vacio icono={Users} titulo="Primero crea un aula" texto="Las actividades se juegan con los alumnos de un aula." accion={<BotonPrincipal onClick={() => navigate(`${base}/aulas`)}>Ir a mis aulas</BotonPrincipal>} />
        </Tarjeta>
      </Pagina>
    );

  const sinEquipo = alumnos.filter((a) => !equipos.some((e) => e.miembros.includes(a.id)));
  const moverA = (alumno: string, destino: number) => setEquipos((eqs) => eqs.map((e, i) => ({ ...e, miembros: i === destino ? [...e.miembros.filter((m) => m !== alumno), alumno] : e.miembros.filter((m) => m !== alumno) })));

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const datos = { aulaId, nombre, descripcion, duracionMin: duracion, modo, preguntas: elegidas, equipos: modo === 'equipos' ? equipos.filter((e) => e.miembros.length) : [] };
      const r = id ? await api.put<{ id: string }>(`/api/docente/proyectos/${id}`, datos) : await api.post<{ id: string }>('/api/docente/proyectos', datos);
      navigate(`${base}/proyectos/${r.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  if (creando)
    return (
      <Pagina ancho="max-w-[1400px]">
        <button onClick={() => setCreando(null)} className="inline-flex items-center gap-2 text-sm text-[var(--c-suave)] hover:text-[var(--c-texto)]">
          <ArrowLeft className="w-4 h-4" /> Volver al proyecto
        </button>
        <Encabezado
          antetitulo="Nueva pregunta para la actividad"
          titulo={NOMBRE_TIPO[creando.tipo].nombre}
          descripcion="Se guarda en tu banco de preguntas para esta aula (también la verán tus alumnos en su lección de la Academia) y se agrega a la actividad."
        />
        <EditorPregunta
          inicial={creando}
          onCancelar={() => setCreando(null)}
          onGuardar={async (p) => {
            try {
              const r = await api.post<{ pregunta: PreguntaBanco }>('/api/preguntas', { ...p, aulaId });
              setBanco((b) => [...(b ?? []), { ...r.pregunta, respondida: 0, acierto: null, editable: true }]);
              setElegidas((e) => [...e, r.pregunta.id]);
              setCreando(null);
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        />
      </Pagina>
    );

  const PASOS = ['Datos y tiempo', 'Preguntas y casos', modo === 'individual' ? 'Participantes' : 'Equipos'];
  return (
    <Pagina>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-[var(--c-suave)] hover:text-[var(--c-texto)]">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>
      <Encabezado antetitulo={id ? 'Editar actividad' : 'Nueva actividad en vivo'} titulo={nombre || 'Actividad sin nombre'} />

      <div className="flex items-center gap-2">
        {PASOS.map((t, i) => (
          <button key={t} onClick={() => setPaso(i + 1)} className="flex items-center gap-2 group">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${paso === i + 1 ? 'bg-[var(--c-teal)] text-[var(--c-sobre)]' : paso > i + 1 ? 'bg-[var(--c-teal)]/20 text-[var(--c-teal)]' : 'bg-[var(--c-elevado)] text-[var(--c-suave)]'}`}>
              {paso > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
            </span>
            <span className={`text-sm font-medium hidden sm:inline ${paso === i + 1 ? '' : 'text-[var(--c-suave)]'}`}>{t}</span>
            {i < PASOS.length - 1 && <span className="w-8 h-px bg-[var(--c-linea-fuerte)] mx-1" />}
          </button>
        ))}
      </div>

      {paso === 1 && (
        <Tarjeta className="p-6 space-y-4 max-w-2xl">
          <div>
            <span className="text-sm font-medium">¿Cómo se juega?</span>
            <div className="grid sm:grid-cols-2 gap-3 mt-1.5">
              {(
                [
                  { m: 'individual', i: User, t: 'Individual', d: 'Cada alumno responde solo, como un Kahoot. Ideal para una práctica o evaluación corta.' },
                  { m: 'equipos', i: Users, t: 'Por equipos', d: 'Formas equipos y cada equipo entrega una vez. Ideal para competir en clase.' },
                ] as const
              ).map((o) => (
                <button
                  key={o.m}
                  type="button"
                  onClick={() => setModo(o.m)}
                  className={`text-left p-4 rounded-2xl border-2 transition-colors ${modo === o.m ? 'border-[var(--c-teal)] bg-[var(--c-teal)]/8' : 'border-[var(--c-linea)] hover:border-[var(--c-linea-fuerte)]'}`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <o.i className="w-4 h-4 text-[var(--c-teal)]" /> {o.t}
                  </span>
                  <span className="block text-xs text-[var(--c-suave)] mt-1">{o.d}</span>
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-medium">Nombre de la actividad</span>
            <input className={`${estiloCampo} mt-1.5`} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={modo === 'individual' ? 'Práctica de hoy: comprobantes' : 'Reto relámpago: comprobantes e IGV'} autoFocus />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Indicaciones para {modo === 'individual' ? 'los alumnos' : 'los equipos'} (opcional)</span>
            <textarea className={`${estiloCampo} mt-1.5 min-h-[80px]`} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Encuentren los errores en los comprobantes…" />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium">Aula</span>
              <select className={`${estiloCampo} mt-1.5`} value={aulaId} onChange={(e) => setAulaId(e.target.value)}>
                {aulas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} ({a.alumnos})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Duración: {duracion} minutos</span>
              <input type="range" min={3} max={90} value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} className="w-full mt-3 accent-[var(--c-teal)]" />
              <span className="block text-[11px] text-[var(--c-suave)]">Empieza a correr cuando pulses «Iniciar». Al terminar, la actividad se cierra y ya no se puede responder.</span>
            </label>
          </div>
          <BotonPrincipal onClick={() => setPaso(2)} disabled={nombre.trim().length < 3}>
            Siguiente: preguntas y casos
          </BotonPrincipal>
        </Tarjeta>
      )}

      {paso === 2 && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap gap-2">
              <BotonPrincipal onClick={() => setCreando({ ...plantillaPregunta('documento'), leccionId: 'm1-l2' })}>
                <FileWarning className="w-4 h-4" /> Crear caso con comprobante
              </BotonPrincipal>
              <select className={`${estiloCampo} w-auto py-2`} value="" onChange={(e) => e.target.value && setCreando(plantillaPregunta(e.target.value as TipoPregunta))}>
                <option value="">+ Crear otra pregunta…</option>
                {(Object.keys(NOMBRE_TIPO) as TipoPregunta[])
                  .filter((t) => t !== 'documento')
                  .map((t) => (
                    <option key={t} value={t}>
                      {NOMBRE_TIPO[t].nombre}
                    </option>
                  ))}
              </select>
            </div>
            <Tarjeta className="p-3 flex flex-col sm:flex-row gap-2">
              <label className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--c-suave)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en el banco" className={`${estiloCampo} pl-9 py-2`} />
              </label>
              <select value={modulo} onChange={(e) => setModulo(e.target.value)} className={`${estiloCampo} py-2 sm:w-44`}>
                <option value="">Todos los módulos</option>
                {MODULOS.map((m) => (
                  <option key={m.id} value={m.id}>
                    M{m.numero} · {m.titulo}
                  </option>
                ))}
              </select>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={`${estiloCampo} py-2 sm:w-44`}>
                <option value="">Todos los tipos</option>
                {(Object.keys(NOMBRE_TIPO) as TipoPregunta[]).map((t) => (
                  <option key={t} value={t}>
                    {NOMBRE_TIPO[t].nombre}
                  </option>
                ))}
              </select>
            </Tarjeta>
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {visibles.map((p) => {
                const on = elegidas.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => setElegidas((e) => (on ? e.filter((x) => x !== p.id) : [...e, p.id]))}
                    className={`w-full text-left flex gap-3 p-3 rounded-xl border-2 transition-colors ${on ? 'border-[var(--c-teal)] bg-[var(--c-teal)]/8' : 'border-[var(--c-linea)] bg-[var(--c-panel)] hover:border-[var(--c-linea-fuerte)]'}`}
                  >
                    <span className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 ${on ? 'bg-[var(--c-teal)] border-[var(--c-teal)] text-[var(--c-sobre)]' : 'border-[var(--c-linea-fuerte)]'}`}>{on && <Check className="w-3.5 h-3.5" />}</span>
                    <span className="min-w-0">
                      <span className={`text-[10px] font-semibold ${p.tipo === 'documento' ? 'text-[var(--c-oro)]' : 'text-[var(--c-teal)]'}`}>
                        {NOMBRE_TIPO[p.tipo].nombre}
                        {p.alcance === 'aula' && <span className="ml-2 px-1.5 py-px rounded bg-[var(--c-oro)]/15 text-[var(--c-oro)]">Tuya</span>}
                      </span>
                      <span className="block text-sm line-clamp-2">{p.enunciado}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="lg:col-span-5">
            <Tarjeta className="p-5 space-y-3 lg:sticky lg:top-20">
              <p className="font-display font-bold">En la actividad ({elegidas.length})</p>
              {elegidas.length === 0 ? (
                <p className="text-sm text-[var(--c-suave)]">Elige preguntas de la lista (las tuyas aparecen marcadas) o crea una nueva aquí mismo.</p>
              ) : (
                <ol className="space-y-2">
                  {elegidas.map((eid, i) => {
                    const p = banco.find((x) => x.id === eid);
                    return (
                      <li key={eid} className="flex items-start gap-2 text-sm">
                        <span className="font-mono text-xs text-[var(--c-suave)] w-5 pt-0.5">{i + 1}.</span>
                        <span className="flex-1 line-clamp-2">{p?.enunciado ?? '(pregunta eliminada)'}</span>
                        <button onClick={() => setElegidas((e) => e.filter((x) => x !== eid))} className="p-1 text-[var(--c-suave)] hover:text-rose-400" aria-label="Quitar">
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
              <p className="text-xs text-[var(--c-suave)]">Recomendado: entre 5 y 10, con al menos un caso con comprobante. Duración actual: {duracion} min.</p>
              <BotonPrincipal className="w-full" disabled={!elegidas.length} onClick={() => setPaso(3)}>
                Siguiente: {modo === 'individual' ? 'participantes' : 'equipos'}
              </BotonPrincipal>
            </Tarjeta>
          </div>
        </div>
      )}

      {paso === 3 && modo === 'individual' && (
        <div className="space-y-4 max-w-3xl">
          <Tarjeta className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-11 h-11 rounded-xl bg-[var(--c-teal)]/12 text-[var(--c-teal)] flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </span>
              <div>
                <p className="font-semibold">Participan todos los alumnos del aula, cada uno por su cuenta</p>
                <p className="text-sm text-[var(--c-suave)]">Los que se unan después (aunque ya haya empezado) entran solos con su propio puesto, mientras no se acabe el tiempo.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {alumnos.map((a) => (
                <span key={a.id} className="px-3 py-1 rounded-full bg-[var(--c-elevado)] text-sm">
                  {a.nombre}
                </span>
              ))}
              {alumnos.length === 0 && <p className="text-sm text-[var(--c-oro)]">Aún no hay alumnos en el aula. Puedes crear la actividad igual y compartir el código antes de iniciarla.</p>}
            </div>
          </Tarjeta>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex gap-3">
            <BotonSecundario onClick={() => setPaso(2)}>Atrás</BotonSecundario>
            <BotonPrincipal disabled={guardando} onClick={guardar}>
              {guardando ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear actividad'}
            </BotonPrincipal>
          </div>
        </div>
      )}

      {paso === 3 && modo === 'equipos' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--c-suave)]">Si un alumno se une al aula después, entra solo al equipo con menos integrantes.</p>
          <Tarjeta className="p-4 flex flex-wrap items-center gap-3">
            <span className="text-sm">
              {alumnos.length} alumnos en el aula · repartir en
            </span>
            {[2, 3, 4, 5, 6].map((n) => (
              <button key={n} onClick={() => setEquipos(repartir(alumnos.map((a) => a.id), n))} className={`w-9 h-9 rounded-lg font-bold text-sm ${equipos.length === n ? 'bg-[var(--c-teal)] text-[var(--c-sobre)]' : 'bg-[var(--c-elevado)]'}`}>
                {n}
              </button>
            ))}
            <span className="text-sm">equipos</span>
            <BotonSecundario onClick={() => setEquipos(repartir(alumnos.map((a) => a.id), equipos.length || 2))}>
              <Shuffle className="w-4 h-4" /> Mezclar al azar
            </BotonSecundario>
          </Tarjeta>
          {alumnos.length < 2 && <p className="text-sm text-[var(--c-oro)]">El aula necesita al menos 2 alumnos para formar equipos.</p>}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {equipos.map((e, i) => (
              <div key={i} className="rounded-2xl border-2 overflow-hidden bg-[var(--c-panel)]" style={{ borderColor: e.color }}>
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: `${e.color}22` }}>
                  <span className="w-4 h-4 rounded-full shrink-0" style={{ background: e.color }} />
                  <input value={e.nombre} onChange={(ev) => setEquipos((eqs) => eqs.map((x, k) => (k === i ? { ...x, nombre: ev.target.value } : x)))} className="flex-1 bg-transparent font-display font-bold focus:outline-none" aria-label="Nombre del equipo" />
                  <span className="text-xs text-[var(--c-suave)]">{e.miembros.length}</span>
                </div>
                <div className="p-3 space-y-1.5 min-h-24">
                  {e.miembros.map((m) => (
                    <div key={m} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">{alumnos.find((a) => a.id === m)?.nombre}</span>
                      <select value={i} onChange={(ev) => moverA(m, Number(ev.target.value))} className="text-xs bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-md px-1 py-0.5" aria-label="Cambiar de equipo">
                        {equipos.map((x, k) => (
                          <option key={k} value={k}>
                            {x.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {e.miembros.length === 0 && <p className="text-xs text-[var(--c-suave)]">Sin integrantes</p>}
                </div>
              </div>
            ))}
          </div>
          {sinEquipo.length > 0 && (
            <Tarjeta className="p-4 space-y-2">
              <p className="text-sm font-semibold">Sin equipo ({sinEquipo.length})</p>
              <div className="flex flex-wrap gap-2">
                {sinEquipo.map((a) => (
                  <select key={a.id} value="" onChange={(ev) => moverA(a.id, Number(ev.target.value))} className="text-xs bg-[var(--c-fondo)] border border-[var(--c-linea-fuerte)] rounded-full px-3 py-1.5">
                    <option value="">{a.nombre} → elegir equipo</option>
                    {equipos.map((x, k) => (
                      <option key={k} value={k}>
                        {x.nombre}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </Tarjeta>
          )}
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex gap-3">
            <BotonSecundario onClick={() => setPaso(2)}>Atrás</BotonSecundario>
            <BotonPrincipal disabled={guardando || equipos.filter((e) => e.miembros.length).length < 2} onClick={guardar}>
              {guardando ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear actividad'}
            </BotonPrincipal>
          </div>
        </div>
      )}
    </Pagina>
  );
}

// --- Control en vivo --------------------------------------------------------------------------------------------

export function ControlProyecto({ base = '/docente' }: { base?: string }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [t, setT] = useState<Tablero | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proyector, setProyector] = useState(false);
  const [confirmar, setConfirmar] = useState<'finalizar' | 'reiniciar' | 'eliminar' | null>(null);
  const previo = useRef<number>(0);

  const cargar = useCallback(() => {
    api
      .get<Tablero>(`/api/proyectos/${id}/tablero`)
      .then((r) => {
        const entregas = r.equipos.filter((e) => e.entregado).length;
        if (entregas > previo.current && previo.current >= 0) soundFx.playStamp();
        previo.current = entregas;
        setT(r);
      })
      .catch((e) => setError(e.message));
  }, [id]);
  useEffect(() => {
    previo.current = -1;
    cargar();
    const iv = setInterval(cargar, 2000);
    return () => clearInterval(iv);
  }, [cargar]);
  const quedan = useCuentaRegresiva(t);

  if (error) return <CajaError mensaje={error} onReintentar={() => { setError(null); cargar(); }} />;
  if (!t) return <Cargando />;

  const accion = async (a: string) => {
    try {
      setT(await api.post<Tablero>(`/api/docente/proyectos/${id}/accion`, { accion: a }));
      if (a === 'iniciar') soundFx.playVictory();
    } catch (e) {
      setError((e as Error).message);
    }
    setConfirmar(null);
  };
  const entregas = t.equipos.filter((e) => e.entregado).length;

  const vistaProyector = (
    <div className="fixed inset-0 z-[95] bg-[var(--c-fondo)] text-[var(--c-texto)] overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--c-teal)]">AUDIT LAB · {t.aula}</p>
            <h1 className="font-display text-3xl sm:text-5xl font-black">{t.nombre}</h1>
          </div>
          <div className="flex items-center gap-4">
            {t.estado === 'en_curso' && <Reloj quedan={quedan} grande />}
            <button onClick={() => setProyector(false)} className="p-3 rounded-xl bg-[var(--c-elevado)]" aria-label="Salir del modo proyector">
              <Minimize2 className="w-6 h-6" />
            </button>
          </div>
        </div>
        {t.estado === 'sala' || t.estado === 'preparacion' ? (
          <div className="text-center py-10 space-y-6">
            <p className="text-2xl text-[var(--c-suave)]">Entren a AUDIT LAB → «Mis aulas» → «Entrar a la sala»</p>
            {t.modo === 'individual' && <p className="text-xl">{t.equipos.length} alumnos en la sala</p>}
            <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left ${t.modo === 'individual' ? 'hidden' : ''}`}>
              {t.equipos.map((e) => (
                <div key={e.id} className="rounded-3xl p-6 text-white" style={{ background: e.color }}>
                  <p className="font-display text-2xl font-black">{e.nombre}</p>
                  <p className="mt-2 text-white/85">{e.miembros.map((m) => m.nombre.split(' ')[0]).join(' · ')}</p>
                </div>
              ))}
            </div>
          </div>
        ) : t.estado === 'finalizado' ? (
          <div className="space-y-6">
            <PodioEquipos equipos={t.equipos} />
            <TableroEquipos t={t} grande />
          </div>
        ) : (
          <TableroEquipos t={t} grande />
        )}
      </div>
    </div>
  );

  return (
    <Pagina>
      <button onClick={() => navigate(`${base}/proyectos`)} className="inline-flex items-center gap-2 text-sm text-[var(--c-suave)] hover:text-[var(--c-texto)]">
        <ArrowLeft className="w-4 h-4" /> Actividades
      </button>

      <Tarjeta className="p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="min-w-0">
            <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded ${ESTADO_PROYECTO[t.estado].c}`}>{ESTADO_PROYECTO[t.estado].t}</span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold mt-2">{t.nombre}</h1>
            <p className="text-sm text-[var(--c-suave)] mt-1">
              {t.aula} · {t.modo === 'individual' ? `Individual · ${t.equipos.length} participantes` : `${t.equipos.length} equipos`} · {t.preguntas} preguntas · {t.duracionMin} min
            </p>
          </div>
          <div className="flex items-center gap-3">
            {t.estado === 'en_curso' && <Reloj quedan={quedan} />}
            <BotonSecundario onClick={() => setProyector(true)}>
              <Maximize2 className="w-4 h-4" /> Modo proyector
            </BotonSecundario>
          </div>
        </div>

        {/* Pasos del proyecto */}
        <div className="grid sm:grid-cols-4 gap-2">
          {[
            { e: 'preparacion', t: '1. Preparar', d: t.modo === 'individual' ? 'Revisa las preguntas.' : 'Revisa preguntas y equipos.' },
            { e: 'sala', t: '2. Abrir sala', d: t.modo === 'individual' ? 'Los alumnos entran y esperan.' : 'Los equipos entran y esperan.' },
            { e: 'en_curso', t: '3. Jugar', d: 'Corre el tiempo para todos.' },
            { e: 'finalizado', t: '4. Resultados', d: 'Podio y revisión.' },
          ].map((s) => {
            const orden = ['preparacion', 'sala', 'en_curso', 'finalizado'];
            const hecho = orden.indexOf(t.estado) > orden.indexOf(s.e);
            const actual = t.estado === s.e;
            return (
              <div key={s.e} className={`rounded-xl p-3 border ${actual ? 'border-[var(--c-teal)] bg-[var(--c-teal)]/8' : 'border-[var(--c-linea)]'} ${hecho ? 'opacity-60' : ''}`}>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  {hecho && <Check className="w-4 h-4 text-[var(--c-teal)]" />}
                  {s.t}
                </p>
                <p className="text-[11px] text-[var(--c-suave)]">{s.d}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {t.estado === 'preparacion' && (
            <>
              <BotonPrincipal onClick={() => accion('abrir')}>
                <DoorOpen className="w-4 h-4" /> Abrir sala de espera
              </BotonPrincipal>
              <BotonSecundario onClick={() => navigate(`${base}/proyectos/${id}/editar`)}>
                <Pencil className="w-4 h-4" /> Editar
              </BotonSecundario>
            </>
          )}
          {t.estado === 'sala' && (
            <BotonPrincipal onClick={() => accion('iniciar')}>
              <Play className="w-4 h-4" /> ¡Iniciar ahora!
            </BotonPrincipal>
          )}
          {t.estado === 'en_curso' && (
            <BotonSecundario onClick={() => setConfirmar('finalizar')}>
              <Flag className="w-4 h-4" /> Finalizar antes de tiempo
            </BotonSecundario>
          )}
          {t.estado === 'finalizado' && (
            <BotonSecundario onClick={() => setConfirmar('reiniciar')}>
              <RotateCcw className="w-4 h-4" /> Jugar otra vez (borra resultados)
            </BotonSecundario>
          )}
          {t.estado !== 'en_curso' && (
            <BotonSecundario onClick={() => setConfirmar('eliminar')} className="text-rose-400">
              <Trash2 className="w-4 h-4" /> Eliminar
            </BotonSecundario>
          )}
        </div>
        {t.estado === 'sala' && (
          <p className="text-sm text-[var(--c-oro)]">
            {t.modo === 'individual'
              ? `La sala está abierta: ${t.equipos.length} alumnos esperando. Los que entren ahora también aparecen. Cuando estén listos, pulsa «Iniciar».`
              : 'La sala está abierta: los alumnos ven su equipo y esperan. Cuando estén listos, pulsa «Iniciar».'}
          </p>
        )}
        {t.estado === 'en_curso' && (
          <p className="text-sm text-[var(--c-suave)]">
            {t.modo === 'individual'
              ? `${entregas} de ${t.equipos.length} alumnos entregaron. La actividad se cierra sola cuando se acaba el tiempo; puedes finalizarla antes.`
              : `${entregas} de ${t.equipos.length} equipos entregaron. El reto termina solo cuando entregan todos o se acaba el tiempo.`}
          </p>
        )}
      </Tarjeta>

      {t.estado === 'finalizado' && (
        <Tarjeta className="p-6">
          <PodioEquipos equipos={t.equipos} />
        </Tarjeta>
      )}

      <section className="space-y-3">
        <h2 className="font-display font-bold text-lg">
          {t.estado === 'en_curso' ? 'Clasificación en vivo' : t.estado === 'finalizado' ? 'Clasificación final' : t.modo === 'individual' ? 'Participantes' : 'Equipos'}
        </h2>
        <TableroEquipos t={t} />
      </section>

      <AnimatePresence>{proyector && vistaProyector}</AnimatePresence>
      {confirmar && (
        <Modal titulo={{ finalizar: 'Finalizar la actividad', reiniciar: 'Jugar otra vez', eliminar: 'Eliminar actividad' }[confirmar]} onCerrar={() => setConfirmar(null)}>
          <div className="space-y-4">
            <p className="text-sm">
              {confirmar === 'finalizar' && 'El tiempo termina ahora. Quien no entregó queda sin puntaje.'}
              {confirmar === 'reiniciar' && 'Se borran las entregas y la actividad vuelve a preparación, con las mismas preguntas.'}
              {confirmar === 'eliminar' && 'Se elimina la actividad y sus resultados. No se puede deshacer.'}
            </p>
            <div className="flex gap-3">
              <BotonSecundario className="flex-1" onClick={() => setConfirmar(null)}>
                Cancelar
              </BotonSecundario>
              <button
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold ${confirmar === 'eliminar' ? 'bg-rose-600' : 'bg-[var(--c-teal)]'}`}
                onClick={async () => {
                  if (confirmar === 'eliminar') {
                    await api.del(`/api/docente/proyectos/${id}`);
                    navigate(`${base}/proyectos`);
                  } else accion(confirmar);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Pagina>
  );
}

