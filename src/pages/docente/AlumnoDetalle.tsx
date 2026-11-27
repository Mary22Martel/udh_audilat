import { ArrowLeft, BookOpen, Flame, GraduationCap, Lock, Mail, RotateCcw, ShieldCheck, Star, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { iniciales } from '../../components/shell/Shell';
import { CajaError, Cargando, Cifra, Pagina, Tarjeta, colorNivel, fechaCorta, haceCuanto } from '../../components/ui';
import { LECCIONES, MODULOS } from '../../data/academiaCurso';
import { INITIAL_MISSIONS } from '../../data/missionsData';
import { api, type DetalleAlumno } from '../../lib/api';
import { insigniasDelAlumno } from '../../lib/misiones';
import { MISIONES_ACTIVAS } from '../../lib/reglas';
import type { EstadoAlumno } from '../../lib/api';
import { Insignias } from '../alumno/Perfil';

export function AlumnoDetalle({ volver = -1 as unknown as string }: { volver?: string }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [d, setD] = useState<DetalleAlumno | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.get<DetalleAlumno>(`/api/docente/alumnos/${id}`).then(setD).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <CajaError mensaje={error} />;
  if (!d) return <Cargando />;
  const prog = d.academia.progreso;
  const hechas = LECCIONES.filter((l) => prog.lecciones[l.id]?.completada).length;

  return (
    <Pagina>
      <button onClick={() => (typeof volver === 'string' ? navigate(volver) : navigate(-1))} className="inline-flex items-center gap-2 text-sm text-[var(--c-suave)] hover:text-[var(--c-texto)]">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <Tarjeta className="p-6 flex flex-col sm:flex-row gap-5 sm:items-center">
        <span className="w-16 h-16 rounded-2xl bg-[var(--c-teal)] text-[var(--c-sobre)] flex items-center justify-center font-display font-extrabold text-xl shrink-0">{iniciales(d.alumno.nombre)}</span>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-extrabold">{d.alumno.nombre}</h1>
          <p className="text-sm text-[var(--c-suave)] flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> {d.alumno.correo}
            </span>
            {d.alumno.codigo && <span>Código {d.alumno.codigo}</span>}
            <span>Último ingreso: {haceCuanto(d.alumno.ultimoAcceso).toLowerCase()}</span>
          </p>
          <p className="text-xs text-[var(--c-suave)] mt-1">Aulas: {d.alumno.aulas.map((a) => a.nombre).join(' · ') || '—'}</p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full bg-[var(--c-teal)]/12 text-[var(--c-teal)] font-semibold self-start sm:self-center">{d.nivel.title}</span>
      </Tarjeta>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Cifra etiqueta="Lecciones de la Academia" valor={`${hechas} / ${LECCIONES.length}`} icono={GraduationCap} detalle={`${prog.xp} XP en la Academia`} />
        <Cifra etiqueta="Aciertos en la Academia" valor={prog.precision === null ? '—' : `${prog.precision} %`} icono={BookOpen} tono="oro" retraso={0.05} />
        <Cifra etiqueta="Misiones resueltas" valor={`${d.misiones.casos} / ${MISIONES_ACTIVAS.length}`} icono={ShieldCheck} tono="texto" retraso={0.1} detalle={`${d.misiones.xp} XP en misiones`} />
        <Cifra etiqueta="Racha" valor={`${d.racha} días`} icono={Flame} retraso={0.15} />
      </div>

      <Tarjeta className="p-6 space-y-5">
        <div>
          <h3 className="font-display font-bold">Avance en la Academia</h3>
          <p className="text-xs text-[var(--c-suave)] mt-1">Estrellas, intentos y aciertos de cada lección.</p>
        </div>
        <div className="space-y-4">
          {MODULOS.map((m) => {
            const prec = prog.modulos[m.id]?.precision ?? null;
            return (
              <div key={m.id} className="grid sm:grid-cols-12 gap-3 items-start">
                <div className="sm:col-span-4">
                  <p className="text-sm font-semibold">
                    <span className="font-mono text-[11px] text-[var(--c-teal)] mr-1.5">M{m.numero}</span>
                    {m.titulo}
                  </p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: colorNivel(prec) }}>
                    {prec === null ? 'sin respuestas' : `${prec} % aciertos`}
                  </p>
                </div>
                <div className="sm:col-span-8 grid sm:grid-cols-2 gap-2">
                  {m.lecciones.map((l) => {
                    const e = prog.lecciones[l.id];
                    return (
                      <div key={l.id} className={`rounded-xl border p-3 text-xs ${e?.completada ? 'border-[var(--c-teal)]/40 bg-[var(--c-teal)]/5' : 'border-[var(--c-linea)] bg-[var(--c-fondo)]'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm truncate">{l.titulo}</span>
                          {!e?.desbloqueada ? (
                            <Lock className="w-3.5 h-3.5 text-[var(--c-tenue)]" />
                          ) : (
                            <span className="inline-flex">
                              {[1, 2, 3].map((i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i <= (e?.estrellas ?? 0) ? 'text-[var(--c-oro)] fill-[var(--c-oro)]' : 'text-[var(--c-tenue)]'}`} />
                              ))}
                            </span>
                          )}
                        </div>
                        <p className="text-[var(--c-suave)] mt-1">
                          {e?.intentos ? `${e.intentos} ${e.intentos === 1 ? 'intento' : 'intentos'}` : 'Sin intentos'}
                          {e?.precision !== null && e?.precision !== undefined && <span style={{ color: colorNivel(e.precision) }}> · {e.precision} %</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Tarjeta>

      <div className="grid lg:grid-cols-12 gap-6">
        <Tarjeta className="lg:col-span-6 p-6 space-y-3">
          <h3 className="font-display font-bold flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-400" /> Preguntas que tiene observadas
          </h3>
          {d.academia.observadas.length === 0 ? (
            <p className="text-sm text-[var(--c-teal)]">No tiene preguntas pendientes de corregir.</p>
          ) : (
            <ul className="space-y-2">
              {d.academia.observadas.slice(0, 8).map((q) => (
                <li key={q.id} className="text-sm p-3 rounded-xl bg-[var(--c-fondo)] border border-[var(--c-linea)]">
                  {q.enunciado}
                  <span className="block text-[11px] text-[var(--c-suave)] mt-0.5">{LECCIONES.find((l) => l.id === q.leccionId)?.titulo}</span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
        <Tarjeta className="lg:col-span-6 p-6 space-y-3" retraso={0.05}>
          <h3 className="font-display font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--c-teal)]" /> Misiones (práctica libre)
          </h3>
          <div className="divide-y divide-[var(--c-linea)]">
            {INITIAL_MISSIONS.filter((m) => (MISIONES_ACTIVAS as readonly string[]).includes(m.id)).map((m) => {
              const b = d.misiones.mejores[m.id];
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="truncate">
                    <span className="font-mono text-[11px] text-[var(--c-teal)] mr-1.5">{m.number.replace(/misi[oó]n\s*/i, 'M')}</span>
                    {m.title}
                  </span>
                  <span className="text-xs font-mono shrink-0">{b ? `Rango ${b.rango} · ${b.precision} %` : <span className="text-[var(--c-tenue)]">sin intentar</span>}</span>
                </div>
              );
            })}
          </div>
          {d.misiones.ultima && <p className="text-[11px] text-[var(--c-suave)]">Última misión: {fechaCorta(d.misiones.ultima)}</p>}
        </Tarjeta>
      </div>

      <section className="space-y-3">
        <h3 className="font-display text-lg font-bold">Insignias</h3>
        <Insignias insignias={insigniasDelAlumno({ insignias: d.insignias } as EstadoAlumno)} />
      </section>
    </Pagina>
  );
}
