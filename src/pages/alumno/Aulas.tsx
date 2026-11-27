import { motion } from 'motion/react';
import { ArrowRight, Crown, KeyRound, Radio, School, Swords, Users } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Encabezado, Pagina, Tarjeta, Vacio, estiloCampo, fechaCorta } from '../../components/ui';
import { api, type AulaCorta, type ResumenProyecto } from '../../lib/api';
import { useAlumno } from './datos';

const ESTADO: Record<ResumenProyecto['estado'], { t: string; c: string }> = {
  preparacion: { t: 'En preparación', c: 'bg-[var(--c-elevado)]' },
  sala: { t: 'Sala abierta', c: 'bg-[var(--c-oro)] text-[#1a1406]' },
  en_curso: { t: 'EN VIVO', c: 'bg-rose-600 text-white' },
  finalizado: { t: 'Terminado', c: 'bg-[var(--c-elevado)] text-[var(--c-suave)]' },
};

export function Aulas() {
  const { estado, recargar } = useAlumno();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [proyectos, setProyectos] = useState<ResumenProyecto[] | null>(null);
  const aulas: AulaCorta[] = estado.aulas;

  const cargar = () => api.get<{ proyectos: ResumenProyecto[] }>('/api/alumno/proyectos').then((r) => setProyectos(r.proyectos)).catch(() => setProyectos([]));
  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, 8000);
    return () => clearInterval(iv);
  }, []);

  const unirse = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const r = await api.post<{ aula: { nombre: string; docente: string } }>('/api/alumno/aulas/unirse', { codigo });
      setMsg({ ok: true, t: `Listo: te uniste a «${r.aula.nombre}» (${r.aula.docente}).` });
      setCodigo('');
      recargar();
    } catch (err) {
      setMsg({ ok: false, t: (err as Error).message });
    }
  };

  const vivos = (proyectos ?? []).filter((p) => p.estado === 'sala' || p.estado === 'en_curso');
  const otros = (proyectos ?? []).filter((p) => p.estado === 'finalizado');

  return (
    <Pagina>
      <Encabezado antetitulo="Mis aulas" titulo="Aulas y competencias por equipos" descripcion="Únete al aula de tu docente con el código que te dio. Aquí aparecerán los retos por equipos." />

      {vivos.map((p) => (
        <motion.button
          key={p.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => navigate(`/app/proyectos/${p.id}`)}
          className="w-full text-left relative overflow-hidden rounded-3xl p-6 text-white bg-gradient-to-r from-[#0b1a26] to-[#163447] border border-[var(--c-oro)]/50"
        >
          <motion.span className="absolute inset-0 bg-[var(--c-oro)]/10" animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-rose-600 flex items-center justify-center shrink-0">
              <Radio className="w-7 h-7 animate-pulse" />
            </span>
            <span className="flex-1 min-w-0">
              <span className={`inline-block text-[10px] font-black tracking-wider px-2 py-0.5 rounded ${ESTADO[p.estado].c}`}>{ESTADO[p.estado].t}</span>
              <span className="block font-display text-2xl font-extrabold mt-1">{p.nombre}</span>
              <span className="block text-sm text-white/70">
                {p.aula} · {p.miEquipo && <strong style={{ color: p.miEquipo.color }}>{p.miEquipo.nombre}</strong>}
              </span>
            </span>
            <span className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#48a6a7] font-bold">
              {p.estado === 'en_curso' ? 'Jugar ahora' : 'Entrar a la sala'} <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </motion.button>
      ))}

      <div className="grid lg:grid-cols-12 gap-6">
        <Tarjeta className="lg:col-span-5 p-6 space-y-4">
          <h2 className="font-display font-bold flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[var(--c-teal)]" /> Unirme a un aula
          </h2>
          <form onSubmit={unirse} className="flex gap-2">
            <input
              className={`${estiloCampo} font-mono uppercase tracking-widest text-center`}
              placeholder="AUD-XXXX"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              aria-label="Código del aula"
              required
            />
            <button className="px-4 rounded-xl bg-[var(--c-teal)] text-[var(--c-sobre)] font-semibold text-sm shrink-0">Unirme</button>
          </form>
          {msg && <p className={`text-sm ${msg.ok ? 'text-[var(--c-teal)]' : 'text-rose-400'}`}>{msg.t}</p>}
          <p className="text-xs text-[var(--c-suave)]">Tu docente te da el código en clase. Puedes estar en varias aulas.</p>
        </Tarjeta>

        <Tarjeta className="lg:col-span-7 p-6 space-y-3" retraso={0.05}>
          <h2 className="font-display font-bold flex items-center gap-2">
            <School className="w-4 h-4 text-[var(--c-teal)]" /> Mis aulas
          </h2>
          {aulas.length === 0 ? (
            <p className="text-sm text-[var(--c-suave)]">Todavía no estás en ningún aula. Las misiones y la Academia funcionan igual sin aula.</p>
          ) : (
            aulas.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--c-fondo)] border border-[var(--c-linea)]">
                <span className="w-10 h-10 rounded-xl bg-[var(--c-teal)]/15 text-[var(--c-teal)] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold truncate">{a.nombre}</span>
                  <span className="block text-xs text-[var(--c-suave)]">{a.docente}</span>
                </span>
                <span className="font-mono text-xs text-[var(--c-suave)]">{a.codigo}</span>
              </div>
            ))
          )}
        </Tarjeta>
      </div>

      <section className="space-y-3">
        <h2 className="font-display font-bold text-lg flex items-center gap-2">
          <Swords className="w-5 h-5 text-[var(--c-oro)]" /> Retos por equipos
        </h2>
        {proyectos && proyectos.length === 0 ? (
          <Tarjeta>
            <Vacio icono={Swords} titulo="Aún no hay retos" texto="Cuando tu docente arme una competencia por equipos y te asigne a uno, aparecerá aquí." />
          </Tarjeta>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {otros.map((p) => (
              <Tarjeta key={p.id} className="p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded ${ESTADO[p.estado].c}`}>{ESTADO[p.estado].t}</span>
                  <span className="text-xs text-[var(--c-suave)]">{fechaCorta(p.inicio ?? p.creado)}</span>
                </div>
                <p className="font-display font-bold">{p.nombre}</p>
                <p className="text-xs text-[var(--c-suave)]">
                  {p.aula} · {p.miEquipo?.nombre}
                </p>
                {p.ganador && (
                  <p className="text-sm inline-flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-[var(--c-oro)]" /> Ganó <strong>{p.ganador}</strong>
                  </p>
                )}
                <button onClick={() => navigate(`/app/proyectos/${p.id}`)} className="text-sm font-semibold text-[var(--c-teal)] inline-flex items-center gap-1 hover:underline">
                  Ver resultados y revisión <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Tarjeta>
            ))}
          </div>
        )}
      </section>
    </Pagina>
  );
}
