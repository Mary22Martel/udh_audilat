import { motion } from 'motion/react';
import { Activity, AlertTriangle, ArrowLeft, BookOpen, ChevronDown, ChevronUp, Crown, GraduationCap, Pencil, Plus, Search, Swords, Target, Trophy, UserMinus, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { iniciales } from '../../components/shell/Shell';
import { Actividad, BotonPrincipal, BotonSecundario, CajaError, Cargando, Cifra, Modal, Pagina, Tarjeta, Vacio, colorNivel, estiloCampo, fechaCorta, haceCuanto } from '../../components/ui';
import { LECCIONES, MODULOS } from '../../data/academiaCurso';
import { api, type AlumnoSeguimiento, type SeguimientoAula } from '../../lib/api';
import { NOMBRE_TIPO, type TipoPregunta } from '../../lib/preguntas';
import { useSesion } from '../../lib/sesion';
import { Clasificacion } from '../Clasificacion';
import { CodigoProyectado, TarjetaCodigo } from './Aulas';

type Pestana = 'avance' | 'alumnos' | 'clasificacion' | 'proyectos';
type Orden = 'nombre' | 'xp' | 'precision' | 'lecciones' | 'ultimaActividad';

function TablaAvance({ alumnos, base }: { alumnos: AlumnoSeguimiento[]; base: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [orden, setOrden] = useState<{ por: Orden; desc: boolean }>({ por: 'lecciones', desc: true });
  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return alumnos
      .filter((a) => !t || a.nombre.toLowerCase().includes(t) || (a.codigo ?? '').includes(t))
      .sort((x, y) => {
        const vx = x[orden.por] ?? (orden.por === 'nombre' ? '' : -1);
        const vy = y[orden.por] ?? (orden.por === 'nombre' ? '' : -1);
        const r = typeof vx === 'string' ? String(vx).localeCompare(String(vy)) : (vx as number) - (vy as number);
        return orden.desc ? -r : r;
      });
  }, [alumnos, q, orden]);

  const Th = ({ por, children, cls = '' }: { por: Orden; children: string; cls?: string }) => (
    <th className={`px-3 py-3 font-semibold ${cls}`}>
      <button onClick={() => setOrden((o) => ({ por, desc: o.por === por ? !o.desc : por !== 'nombre' }))} className={`inline-flex items-center gap-1 ${orden.por === por ? 'text-[var(--c-teal)]' : ''}`}>
        {children}
        {orden.por === por && (orden.desc ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
      </button>
    </th>
  );

  if (!alumnos.length) return <Vacio icono={Users} titulo="Aún no hay alumnos" texto="Comparte el código del aula para que tus alumnos se unan desde «Mis aulas»." />;
  return (
    <div>
      <div className="p-4 border-b border-[var(--c-linea)]">
        <label className="relative block max-w-xs">
          <Search className="w-4 h-4 text-[var(--c-suave)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar alumno" className={`${estiloCampo} pl-9 py-2`} />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--c-suave)] border-b border-[var(--c-linea)]">
              <Th por="nombre" cls="pl-4">Alumno</Th>
              <th className="px-3 py-3 font-semibold">Dominio por módulo</th>
              <Th por="lecciones">Lecciones</Th>
              <Th por="precision" cls="text-right">Aciertos</Th>
              <Th por="xp" cls="text-right">XP Academia</Th>
              <th className="px-3 py-3 font-semibold text-right">Misiones</th>
              <Th por="ultimaActividad" cls="text-right pr-4">Última práctica</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--c-linea)]">
            {filas.map((a) => {
              const inactivo = !a.ultimaActividad || Date.now() - new Date(a.ultimaActividad).getTime() > 7 * 86400000;
              return (
                <tr key={a.id} onClick={() => navigate(`${base}/${a.id}`)} className={`cursor-pointer hover:bg-[var(--c-elevado)]/40 ${a.activo ? '' : 'opacity-50'}`}>
                  <td className="pl-4 pr-3 py-3">
                    <span className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full bg-[var(--c-elevado)] flex items-center justify-center text-xs font-bold shrink-0">{iniciales(a.nombre)}</span>
                      <span className="min-w-0">
                        <span className="block font-semibold truncate">{a.nombre}</span>
                        <span className="block text-[11px] text-[var(--c-suave)]">{a.codigo ?? a.correo}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex gap-1">
                      {MODULOS.map((m) => (
                        <span
                          key={m.id}
                          title={`Módulo ${m.numero} · ${m.titulo}: ${a.modulos[m.id] ?? '—'}${a.modulos[m.id] !== null ? ' %' : ''}`}
                          className="w-6 h-6 rounded-md text-[9px] font-black flex items-center justify-center text-white"
                          style={{ background: a.modulos[m.id] === null ? 'var(--c-hondo)' : colorNivel(a.modulos[m.id]) }}
                        >
                          {m.numero}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-mono text-xs">
                      {a.lecciones}/{a.totalLecciones}
                    </span>
                    <span className="block mt-1 h-1.5 w-20 rounded-full bg-[var(--c-hondo)] overflow-hidden">
                      <span className="block h-full bg-[var(--c-teal)]" style={{ width: `${(a.lecciones / a.totalLecciones) * 100}%` }} />
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono" style={{ color: colorNivel(a.precision) }}>
                    {a.precision === null ? '—' : `${a.precision} %`}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[var(--c-oro)]">{a.xp.toLocaleString('es-PE')}</td>
                  <td className="px-3 py-3 text-right text-xs text-[var(--c-suave)] whitespace-nowrap">
                    {a.misiones.casos} {a.misiones.casos === 1 ? 'caso' : 'casos'} · {a.misiones.xp.toLocaleString('es-PE')} XP
                  </td>
                  <td className={`pl-3 pr-4 py-3 text-right text-xs whitespace-nowrap ${inactivo ? 'text-rose-400' : 'text-[var(--c-suave)]'}`}>{haceCuanto(a.ultimaActividad)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-3 text-[11px] text-[var(--c-suave)] border-t border-[var(--c-linea)] flex flex-wrap gap-x-4 gap-y-1">
        <span>Cuadros: porcentaje de aciertos en cada módulo de la Academia.</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded" style={{ background: colorNivel(90) }} /> 80 % o más</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded" style={{ background: colorNivel(70) }} /> 60–79 %</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded" style={{ background: colorNivel(10) }} /> menos de 60 %</span>
      </p>
    </div>
  );
}

export function Aula({ base = '/docente' }: { base?: string }) {
  const { id } = useParams();
  const { usuario } = useSesion();
  const navigate = useNavigate();
  const [s, setS] = useState<SeguimientoAula | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pestana, setPestana] = useState<Pestana>('avance');
  const [proyectar, setProyectar] = useState(false);
  const [editar, setEditar] = useState(false);
  const [nombre, setNombre] = useState('');
  const [quitar, setQuitar] = useState<AlumnoSeguimiento | null>(null);

  const cargar = () => api.get<SeguimientoAula>(`/api/docente/aulas/${id}`).then(setS).catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
  }, [id]);

  if (error) return <CajaError mensaje={error} onReintentar={() => { setError(null); cargar(); }} />;
  if (!s) return <Cargando texto="Revisando el avance del aula…" />;

  const atencion = s.alumnos.filter((a) => a.activo && (a.lecciones === 0 || (a.precision ?? 100) < 60 || !a.ultimaActividad || Date.now() - new Date(a.ultimaActividad).getTime() > 7 * 86400000));
  const activosSemana = s.alumnos.filter((a) => a.ultimaActividad && Date.now() - new Date(a.ultimaActividad).getTime() <= 7 * 86400000).length;
  const esDueno = usuario?.rol === 'admin' || s.aula.docenteId === usuario?.id;

  const PESTANAS: { id: Pestana; t: string; i: typeof Users }[] = [
    { id: 'avance', t: 'Avance en la Academia', i: GraduationCap },
    { id: 'alumnos', t: `Alumnos (${s.alumnos.length})`, i: Users },
    { id: 'clasificacion', t: 'Clasificación', i: Trophy },
    { id: 'proyectos', t: `Proyectos (${s.proyectos.length})`, i: Swords },
  ];

  return (
    <Pagina>
      <button onClick={() => navigate(`${base}/aulas`)} className="inline-flex items-center gap-2 text-sm text-[var(--c-suave)] hover:text-[var(--c-texto)]">
        <ArrowLeft className="w-4 h-4" /> Mis aulas
      </button>

      <Tarjeta className="p-6 flex flex-col md:flex-row md:items-center gap-5 justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--c-teal)]">{s.aula.archivada ? 'Aula archivada' : 'Aula'} · {s.aula.docente}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold mt-1 flex items-center gap-2">
            {s.aula.nombre}
            {esDueno && (
              <button onClick={() => { setNombre(s.aula.nombre); setEditar(true); }} className="p-1.5 rounded-lg text-[var(--c-suave)] hover:bg-[var(--c-elevado)]" title="Editar aula">
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </h1>
        </div>
        <div className="shrink-0 rounded-2xl bg-[var(--c-fondo)] border border-[var(--c-linea)] px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--c-suave)]">Código para unirse</p>
          <TarjetaCodigo aula={s.aula} onProyectar={() => setProyectar(true)} />
        </div>
      </Tarjeta>

      <div className="flex gap-1 p-1 bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl w-full overflow-x-auto">
        {PESTANAS.map((p) => (
          <button key={p.id} onClick={() => setPestana(p.id)} className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${pestana === p.id ? 'text-[var(--c-texto)]' : 'text-[var(--c-suave)]'}`}>
            {pestana === p.id && <motion.span layoutId="pestana-aula" className="absolute inset-0 rounded-lg bg-[var(--c-elevado)]" />}
            <p.i className="relative w-4 h-4" />
            <span className="relative">{p.t}</span>
          </button>
        ))}
      </div>

      {pestana === 'avance' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Cifra etiqueta="Alumnos" valor={s.alumnos.length} icono={Users} detalle={`${s.alumnos.filter((a) => a.lecciones === 0).length} sin empezar la Academia`} />
            <Cifra etiqueta="Practicaron esta semana" valor={`${activosSemana} / ${s.alumnos.length}`} icono={Activity} tono="texto" retraso={0.05} />
            <Cifra etiqueta="Aciertos promedio" valor={s.precision === null ? '—' : `${s.precision} %`} icono={Target} tono="oro" retraso={0.1} detalle="En todas las preguntas de la Academia" />
            <Cifra etiqueta="Lecciones por alumno" valor={`${s.leccionesPromedio} / ${s.totalLecciones}`} icono={BookOpen} retraso={0.15} detalle="Promedio de lecciones completadas" />
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            <Tarjeta className="lg:col-span-6 p-6 space-y-4">
              <div>
                <h3 className="font-display font-bold">Dominio por módulo</h3>
                <p className="text-xs text-[var(--c-suave)] mt-1">Porcentaje de respuestas correctas del aula en cada módulo.</p>
              </div>
              <div className="space-y-4">
                {s.dominio.map((d, i) => (
                  <div key={d.moduloId}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span>
                        <span className="font-mono text-[11px] text-[var(--c-teal)] mr-2">M{d.numero}</span>
                        <span className="font-medium">{d.titulo}</span>
                      </span>
                      <span className="text-xs font-mono shrink-0" style={{ color: colorNivel(d.precision) }}>
                        {d.precision === null ? 'sin datos' : `${d.precision} %`} · {d.completaron}/{s.alumnos.length} lo terminaron
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 rounded-full bg-[var(--c-hondo)] overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: colorNivel(d.precision) }} initial={{ width: 0 }} animate={{ width: `${d.precision ?? 0}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} />
                    </div>
                  </div>
                ))}
              </div>
            </Tarjeta>

            <Tarjeta className="lg:col-span-6 p-6 space-y-4" retraso={0.05}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold">Preguntas que más fallan</h3>
                  <p className="text-xs text-[var(--c-suave)] mt-1">Buenas candidatas para repasar en clase. Toca una para revisarla o editarla.</p>
                </div>
              </div>
              {s.masFalladas.length === 0 ? (
                <p className="text-sm text-[var(--c-suave)]">Aún no hay suficientes respuestas.</p>
              ) : (
                <div className="space-y-2">
                  {s.masFalladas.map((q) => (
                    <Link key={q.id} to={`${base}/preguntas?editar=${q.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--c-fondo)] border border-[var(--c-linea)] hover:border-[var(--c-teal)]/50">
                      <span className="w-12 text-center font-mono font-black text-sm shrink-0" style={{ color: colorNivel(q.acierto) }}>
                        {q.acierto} %
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm line-clamp-2">{q.enunciado}</span>
                        <span className="block text-[11px] text-[var(--c-suave)] mt-0.5">
                          {NOMBRE_TIPO[q.tipo as TipoPregunta]?.nombre} · {LECCIONES.find((l) => l.id === q.leccionId)?.titulo} · {q.respuestas} respuestas
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </Tarjeta>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            <Tarjeta className="lg:col-span-5 p-6 space-y-4" retraso={0.1}>
              <h3 className="font-display font-bold">Práctica en la Academia · últimos 14 días</h3>
              <Actividad datos={s.actividad} />
            </Tarjeta>
            <Tarjeta className={`lg:col-span-7 p-6 space-y-3 ${atencion.length ? 'border-[var(--c-oro)]/40' : ''}`} retraso={0.15}>
              <h3 className="font-display font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--c-oro)]" /> Alumnos que necesitan atención
              </h3>
              {atencion.length === 0 ? (
                <p className="text-sm text-[var(--c-teal)]">Todos están practicando y con buen nivel.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {atencion.map((a) => (
                    <Link key={a.id} to={`${base}/alumnos/${a.id}`} className="text-xs px-3 py-1.5 rounded-full border border-[var(--c-linea-fuerte)] hover:border-[var(--c-oro)]">
                      {a.nombre} <span className="text-[var(--c-suave)]">· {a.lecciones === 0 ? 'sin empezar' : (a.precision ?? 100) < 60 ? `${a.precision} % aciertos` : 'inactivo'}</span>
                    </Link>
                  ))}
                </div>
              )}
            </Tarjeta>
          </div>

          <Tarjeta className="overflow-hidden" retraso={0.2}>
            <TablaAvance alumnos={s.alumnos} base={`${base}/alumnos`} />
          </Tarjeta>
        </>
      )}

      {pestana === 'alumnos' && (
        <Tarjeta className="overflow-hidden">
          {s.alumnos.length === 0 ? (
            <Vacio icono={Users} titulo="Aún no hay alumnos" texto="Proyecta el código del aula para que se unan." accion={<BotonPrincipal onClick={() => setProyectar(true)}>Mostrar código</BotonPrincipal>} />
          ) : (
            <div className="divide-y divide-[var(--c-linea)]">
              {s.alumnos.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-9 h-9 rounded-full bg-[var(--c-elevado)] flex items-center justify-center text-xs font-bold">{iniciales(a.nombre)}</span>
                  <Link to={`${base}/alumnos/${a.id}`} className="flex-1 min-w-0 hover:underline">
                    <span className="block font-semibold truncate">{a.nombre}</span>
                    <span className="block text-[11px] text-[var(--c-suave)]">
                      {a.correo} · último ingreso {haceCuanto(a.ultimoAcceso).toLowerCase()}
                    </span>
                  </Link>
                  {esDueno && (
                    <button onClick={() => setQuitar(a)} className="p-2 rounded-lg text-[var(--c-suave)] hover:text-rose-400 hover:bg-[var(--c-elevado)]" title="Quitar del aula">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Tarjeta>
      )}

      {pestana === 'clasificacion' && <Clasificacion tipo="academia" aulaId={s.aula.id} incrustada />}

      {pestana === 'proyectos' && (
        <div className="space-y-4">
          {esDueno && usuario?.rol === 'docente' && (
            <BotonPrincipal onClick={() => navigate(`${base}/proyectos/nuevo?aula=${s.aula.id}`)}>
              <Plus className="w-4 h-4" /> Nuevo proyecto por equipos
            </BotonPrincipal>
          )}
          {s.proyectos.length === 0 ? (
            <Tarjeta>
              <Vacio icono={Swords} titulo="Sin proyectos todavía" texto="Arma un reto con preguntas y casos de comprobantes, forma equipos y juéguenlo en vivo." />
            </Tarjeta>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {s.proyectos.map((p) => (
                <Link key={p.id} to={`${base}/proyectos/${p.id}`} className="rounded-2xl bg-[var(--c-panel)] border border-[var(--c-linea)] p-5 hover:border-[var(--c-teal)]/50 space-y-1">
                  <p className="text-[11px] uppercase tracking-wider text-[var(--c-suave)]">{{ preparacion: 'En preparación', sala: 'Sala abierta', en_curso: 'En vivo', finalizado: 'Terminado' }[p.estado]} · {fechaCorta(p.inicio ?? p.creado)}</p>
                  <p className="font-display font-bold">{p.nombre}</p>
                  <p className="text-xs text-[var(--c-suave)]">
                    {p.preguntas} preguntas · {p.equipos} equipos · {p.duracionMin} min
                  </p>
                  {p.ganador && (
                    <p className="text-sm inline-flex items-center gap-1.5 pt-1">
                      <Crown className="w-4 h-4 text-[var(--c-oro)]" /> Ganó {p.ganador}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {proyectar && <CodigoProyectado aula={s.aula} onCerrar={() => setProyectar(false)} />}
      {editar && (
        <Modal titulo="Editar aula" onCerrar={() => setEditar(false)}>
          <div className="space-y-4">
            <input className={estiloCampo} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <BotonPrincipal
              className="w-full"
              onClick={async () => {
                await api.patch(`/api/docente/aulas/${s.aula.id}`, { nombre });
                setEditar(false);
                cargar();
              }}
            >
              Guardar nombre
            </BotonPrincipal>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--c-linea)]">
              <BotonSecundario
                onClick={async () => {
                  await api.patch(`/api/docente/aulas/${s.aula.id}`, { nuevoCodigo: true });
                  setEditar(false);
                  cargar();
                }}
              >
                Generar nuevo código
              </BotonSecundario>
              <BotonSecundario
                onClick={async () => {
                  await api.patch(`/api/docente/aulas/${s.aula.id}`, { archivada: !s.aula.archivada });
                  setEditar(false);
                  cargar();
                }}
              >
                {s.aula.archivada ? 'Reabrir aula' : 'Archivar aula'}
              </BotonSecundario>
            </div>
            <p className="text-xs text-[var(--c-suave)]">Un código nuevo invalida el anterior (los alumnos ya unidos siguen en el aula). Archivar cierra el aula a nuevos ingresos.</p>
          </div>
        </Modal>
      )}
      {quitar && (
        <Modal titulo="Quitar del aula" onCerrar={() => setQuitar(null)}>
          <div className="space-y-4">
            <p className="text-sm">
              ¿Quitar a <strong>{quitar.nombre}</strong> de «{s.aula.nombre}»? Su progreso en la Academia y las misiones se conserva; solo deja de aparecer en esta aula.
            </p>
            <div className="flex gap-3">
              <BotonSecundario className="flex-1" onClick={() => setQuitar(null)}>
                Cancelar
              </BotonSecundario>
              <button
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold"
                onClick={async () => {
                  await api.del(`/api/docente/aulas/${s.aula.id}/alumnos/${quitar.id}`);
                  setQuitar(null);
                  cargar();
                }}
              >
                Quitar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Pagina>
  );
}
