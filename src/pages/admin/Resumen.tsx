import { motion } from 'motion/react';
import { Activity, AlertTriangle, ArrowRight, BookOpen, CheckCircle2, Clock, FileText, GraduationCap, Swords, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CajaError, Cargando, Cifra, Encabezado, Pagina, Tarjeta, colorNivel } from '../../components/ui';
import { api, type ResumenAdmin } from '../../lib/api';

function ActividadDoble({ datos }: { datos: ResumenAdmin['actividad'] }) {
  const max = Math.max(1, ...datos.map((d) => d.misiones + d.academia));
  return (
    <div>
      <div className="flex items-end gap-1.5 h-32">
        {datos.map((d, i) => (
          <div key={d.dia} className="flex-1 h-full flex flex-col justify-end group relative" title={`${d.academia} en Academia · ${d.misiones} en misiones`}>
            <motion.div className="w-full bg-[var(--c-oro)] rounded-t-sm" initial={{ height: 0 }} animate={{ height: `${(d.misiones / max) * 100}%` }} transition={{ delay: i * 0.02 }} />
            <motion.div className={`w-full bg-[var(--c-teal)] ${d.misiones ? '' : 'rounded-t-sm'}`} initial={{ height: 0 }} animate={{ height: `${Math.max(d.academia || d.misiones ? 0 : 3, (d.academia / max) * 100)}%` }} transition={{ delay: i * 0.02 }} style={{ opacity: d.academia || d.misiones ? 1 : 0.2 }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-[var(--c-suave)] mt-2 font-mono">
        <span>{new Date(datos[0].dia + 'T12:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>
        <span className="flex gap-3 font-sans">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[var(--c-teal)]" /> Academia</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[var(--c-oro)]" /> Misiones</span>
        </span>
        <span>Hoy</span>
      </div>
    </div>
  );
}

export function Resumen() {
  const [r, setR] = useState<ResumenAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cargar = () => api.get<ResumenAdmin>('/api/admin/resumen').then(setR).catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
  }, []);
  if (error) return <CajaError mensaje={error} onReintentar={cargar} />;
  if (!r) return <Cargando />;
  const activas = r.misiones.filter((m) => m.estado === 'activa');
  const enPrep = r.misiones.filter((m) => m.estado !== 'activa');
  const aulasActivas = r.aulas.filter((a) => !a.archivada);

  return (
    <Pagina>
      <Encabezado
        antetitulo="Administración"
        titulo="Resumen del laboratorio"
        descripcion="Cuentas, aulas, uso de la Academia y de las misiones."
        acciones={
          <Link to="/admin/usuarios" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--c-teal)] hover:bg-[var(--c-teal-hover)] text-[var(--c-sobre)] text-sm font-semibold">
            Gestionar usuarios <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Cifra etiqueta="Estudiantes" valor={r.usuarios.estudiante} icono={GraduationCap} detalle={r.usuarios.sinAula ? `${r.usuarios.sinAula} sin aula` : 'Todos en un aula'} />
        <Cifra etiqueta="Docentes y aulas" valor={`${r.usuarios.docente} · ${aulasActivas.length}`} icono={Users} tono="texto" detalle="docentes · aulas activas" retraso={0.05} />
        <Cifra etiqueta="Ingresaron esta semana" valor={r.usuarios.activosSemana} icono={Activity} tono="oro" retraso={0.1} />
        <Cifra etiqueta="Respuestas en la Academia" valor={r.academia.respuestas.toLocaleString('es-PE')} icono={BookOpen} retraso={0.15} detalle={r.academia.precision !== null ? `${r.academia.precision} % de aciertos` : undefined} />
      </div>

      {r.usuarios.sinAula > 0 && (
        <Tarjeta className="p-4 flex items-center gap-3 border-[var(--c-oro)]/40">
          <AlertTriangle className="w-5 h-5 text-[var(--c-oro)] shrink-0" />
          <p className="text-sm flex-1">
            {r.usuarios.sinAula} {r.usuarios.sinAula === 1 ? 'estudiante no está' : 'estudiantes no están'} en ningún aula. Pueden usar la Academia y las misiones, pero su docente no los verá hasta que se unan con el código.
          </p>
          <Link to="/admin/usuarios?rol=estudiante&aula=ninguna" className="text-sm font-semibold text-[var(--c-teal)] hover:underline whitespace-nowrap">
            Ver quiénes
          </Link>
        </Tarjeta>
      )}

      <Tarjeta className="overflow-hidden" retraso={0.1}>
        <div className="px-6 pt-6 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h3 className="font-display font-bold">Avance por aula</h3>
            <p className="text-xs text-[var(--c-suave)] mt-1">Cada docente ve solo sus aulas; aquí ves todas juntas para comparar.</p>
          </div>
          <Link to="/admin/aulas" className="text-xs font-semibold text-[var(--c-teal)] hover:underline">Ver todas</Link>
        </div>
        {aulasActivas.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-[var(--c-suave)]">Todavía no hay aulas. Los docentes las crean desde su panel.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--c-suave)] border-y border-[var(--c-linea)]">
                  <th className="px-6 py-3 font-semibold">Aula</th>
                  <th className="px-4 py-3 font-semibold">Docente</th>
                  <th className="px-3 py-3 font-semibold text-center">Alumnos</th>
                  <th className="px-3 py-3 font-semibold text-center">Activos 7 días</th>
                  <th className="px-3 py-3 font-semibold text-right">Aciertos Academia</th>
                  <th className="px-3 py-3 font-semibold text-right">Lecciones prom.</th>
                  <th className="px-3 py-3 font-semibold text-right">Misiones prom.</th>
                  <th className="px-3 py-3 font-semibold text-center">Preguntas propias</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--c-linea)]">
                {aulasActivas.slice(0, 10).map((a) => (
                  <tr key={a.id}>
                    <td className="px-6 py-3 font-medium">{a.nombre}</td>
                    <td className="px-4 py-3 text-[var(--c-suave)]">{a.docente}</td>
                    <td className="px-3 py-3 text-center font-mono">{a.alumnos}</td>
                    <td className="px-3 py-3 text-center font-mono">
                      {a.activosSemana}/{a.alumnos}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold" style={{ color: colorNivel(a.precision) }}>
                      {a.precision === null ? '—' : `${a.precision} %`}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{a.leccionesPromedio} / 12</td>
                    <td className="px-3 py-3 text-right font-mono">{a.misionesPromedio}</td>
                    <td className="px-3 py-3 text-center font-mono">{a.preguntasDocente}</td>
                    <td className="px-6 py-3 text-right">
                      <Link to={`/admin/aulas/${a.id}`} className="text-xs font-semibold text-[var(--c-teal)] hover:underline whitespace-nowrap">
                        Ver avance
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      <div className="grid lg:grid-cols-12 gap-6">
        <Tarjeta className="lg:col-span-7 p-6 space-y-4" retraso={0.12}>
          <div>
            <h3 className="font-display font-bold">Academia en todo el sistema</h3>
            <p className="text-xs text-[var(--c-suave)] mt-1">
              Respuestas correctas de todos los alumnos en cada módulo · {r.academia.leccionesPromedio} lecciones completadas por alumno en promedio.
            </p>
          </div>
          <div className="space-y-3.5">
            {r.academia.dominio.map((d, i) => (
              <div key={d.moduloId}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>
                    <span className="font-mono text-[11px] text-[var(--c-teal)] mr-2">M{d.numero}</span>
                    <span className="font-medium">{d.titulo}</span>
                  </span>
                  <span className="text-xs font-mono shrink-0" style={{ color: colorNivel(d.precision) }}>
                    {d.precision === null ? 'sin datos' : `${d.precision} %`} · {d.completaron} lo terminaron
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-[var(--c-hondo)] overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: colorNivel(d.precision) }} initial={{ width: 0 }} animate={{ width: `${d.precision ?? 0}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} />
                </div>
              </div>
            ))}
          </div>
        </Tarjeta>
        <Tarjeta className="lg:col-span-5 p-6 space-y-4" retraso={0.15}>
          <h3 className="font-display font-bold">Uso de los últimos 14 días</h3>
          <ActividadDoble datos={r.actividad} />
          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <div className="rounded-xl bg-[var(--c-fondo)] p-2">
              <p className="font-mono font-bold">{r.academia.intentos}</p>
              <p className="text-[10px] text-[var(--c-suave)]">intentos Academia</p>
            </div>
            <div className="rounded-xl bg-[var(--c-fondo)] p-2">
              <p className="font-mono font-bold">{r.intentosMisiones}</p>
              <p className="text-[10px] text-[var(--c-suave)]">misiones jugadas</p>
            </div>
            <div className="rounded-xl bg-[var(--c-fondo)] p-2">
              <p className="font-mono font-bold">{r.proyectos.finalizados}</p>
              <p className="text-[10px] text-[var(--c-suave)]">retos por equipos</p>
            </div>
          </div>
          {r.academia.porDocente.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-xs font-semibold text-[var(--c-suave)]">Preguntas propias de los docentes (solo para sus aulas)</p>
              {r.academia.porDocente.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-xl bg-[var(--c-fondo)]">
                  <span>{d.nombre}</span>
                  <span className="font-mono font-bold">{d.n}</span>
                </div>
              ))}
            </div>
          )}
        </Tarjeta>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <Tarjeta className="lg:col-span-7 p-6 space-y-4" retraso={0.2}>
          <div>
            <h3 className="font-display font-bold">Estado del sistema</h3>
            <p className="text-xs text-[var(--c-suave)] mt-1">Qué partes ya están en uso y cuáles siguen en desarrollo.</p>
          </div>
          <div className="space-y-2.5">
            {[
              { ok: true, t: 'Cuentas, aulas con código y acceso por rol', d: 'Administrador, docente y estudiante con progreso guardado en el servidor.' },
              { ok: true, t: `Academia: ${r.academia.preguntas} preguntas activas`, d: `6 módulos y 12 lecciones · ${r.academia.preguntasDocentes} preguntas de docentes, que solo ven los alumnos de sus aulas.` },
              { ok: true, t: `Proyectos por equipos (${r.proyectos.total})`, d: 'Retos en vivo con preguntas y casos de comprobantes.' },
              { ok: true, t: `Misiones activas (${activas.length})`, d: activas.map((m) => `${m.numero.replace(/misi[oó]n\s*/i, 'M')} (${m.resolvieron})`).join(' · ') + ' — práctica libre' },
              { ok: false, t: `Misiones en preparación (${enPrep.length})`, d: enPrep.map((m) => m.titulo).join(' · ') },
            ].map((x, i) => (
              <motion.div key={x.t} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.05 }} className="flex gap-3 p-3 rounded-xl bg-[var(--c-fondo)]">
                {x.ok ? <CheckCircle2 className="w-5 h-5 text-[var(--c-teal)] shrink-0" /> : <Clock className="w-5 h-5 text-[var(--c-oro)] shrink-0" />}
                <span>
                  <span className="block text-sm font-semibold">{x.t}</span>
                  <span className="block text-xs text-[var(--c-suave)] mt-0.5">{x.d}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </Tarjeta>
        <Tarjeta className="lg:col-span-5 p-6 space-y-3" retraso={0.25}>
          <h3 className="font-display font-bold">Accesos rápidos</h3>
          {[
            { to: '/admin/aulas', i: Users, t: 'Ver el avance de cada aula' },
            { to: '/admin/preguntas', i: FileText, t: 'Banco de preguntas de la Academia' },
            { to: '/admin/proyectos', i: Swords, t: 'Proyectos por equipos de todos los docentes' },
            { to: '/admin/misiones', i: GraduationCap, t: 'Clasificación general de misiones' },
          ].map((x) => (
            <Link key={x.to} to={x.to} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--c-fondo)] border border-[var(--c-linea)] hover:border-[var(--c-teal)]/50">
              <x.i className="w-5 h-5 text-[var(--c-teal)]" />
              <span className="flex-1 text-sm font-medium">{x.t}</span>
              <ArrowRight className="w-4 h-4 text-[var(--c-suave)]" />
            </Link>
          ))}
        </Tarjeta>
      </div>
    </Pagina>
  );
}
