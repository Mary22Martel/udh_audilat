import { ArrowRight, Crown, KeyRound, RefreshCw, School, Swords, Users } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TarjetaActividad } from '../../components/TarjetaActividad';
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
      cargar(); // si el aula ya tiene una actividad abierta, aparece al instante

    } catch (err) {
      setMsg({ ok: false, t: (err as Error).message });
    }
  };

  const vivos = (proyectos ?? []).filter((p) => p.estado === 'sala' || p.estado === 'en_curso');
  const otros = (proyectos ?? []).filter((p) => p.estado === 'finalizado');

  return (
    <Pagina>
      <Encabezado
        antetitulo="Mis aulas"
        titulo="Mis aulas y actividades"
        descripcion="Únete al aula de tu docente con el código que te dio. Aquí aparecen las actividades en vivo que abre tu docente."
        acciones={
          <button onClick={cargar} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--c-linea-fuerte)] text-sm font-semibold hover:border-[var(--c-teal)]">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        }
      />

      {vivos.map((p) => (
        <TarjetaActividad key={p.id} p={p} />
      ))}

      <div className="grid lg:grid-cols-12 gap-6">
        <Tarjeta className="lg:col-span-5 p-6 space-y-4 min-w-0">
          <h2 className="font-display font-bold flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[var(--c-teal)]" /> Unirme a un aula
          </h2>
          <form onSubmit={unirse} className="flex gap-2">
            <input
              className={`${estiloCampo} min-w-0 flex-1 font-mono uppercase tracking-widest text-center`}
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

        <Tarjeta className="lg:col-span-7 p-6 space-y-3 min-w-0" retraso={0.05}>
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
          <Swords className="w-5 h-5 text-[var(--c-oro)]" /> Actividades terminadas
        </h2>
        {proyectos && otros.length === 0 ? (
          <Tarjeta>
            <Vacio
              icono={Swords}
              titulo={vivos.length ? 'Todavía no terminas ninguna' : 'Aún no hay actividades'}
              texto="Cuando tu docente abra una actividad en vivo (individual o por equipos) aparecerá arriba con un botón para entrar. Al terminar, aquí verás tu resultado y la solución."
            />
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
                  {p.aula} · {p.modo === 'individual' ? 'individual' : p.miEquipo?.nombre}
                </p>
                {p.ganador && (
                  <p className="text-sm flex items-center gap-1.5">
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
