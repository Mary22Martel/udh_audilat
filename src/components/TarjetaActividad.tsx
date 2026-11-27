import { motion } from 'motion/react';
import { ArrowRight, Clock, ClipboardList, ListChecks, School, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mmss, type ResumenProyecto } from '../lib/api';

type Actividad = ResumenProyecto & { miEquipo?: { nombre: string; color: string } | null };

/** Segundos que le quedan a una actividad en curso (se actualiza cada segundo). */
function useQuedan(p: Actividad): number | null {
  const fin = p.estado === 'en_curso' && p.inicio ? new Date(p.inicio).getTime() + p.duracionMin * 60_000 : null;
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (!fin) return;
    const iv = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [fin]);
  return fin ? Math.max(0, Math.round((fin - ahora) / 1000)) : null;
}

const conMayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * Tarjeta de una actividad abierta (sala de espera o en vivo) para el alumno.
 * «compacta» para el inicio; completa para «Mis aulas».
 */
export function TarjetaActividad({ p, compacta = false }: { p: Actividad; compacta?: boolean }) {
  const navigate = useNavigate();
  const quedan = useQuedan(p);
  const enVivo = p.estado === 'en_curso';
  const individual = p.modo === 'individual';
  const acento = enVivo ? 'var(--c-vivo)' : 'var(--c-teal)';
  const sobreAcento = enVivo ? 'var(--c-sobre-vivo)' : 'var(--c-sobre)';
  const preguntas = `${p.preguntas} ${p.preguntas === 1 ? 'pregunta' : 'preguntas'}`;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/app/proyectos/${p.id}`)}
      className="group w-full text-left relative overflow-hidden rounded-3xl bg-[var(--c-panel)] border border-[var(--c-linea)] hover:border-[var(--c-teal)] shadow-tema transition-colors"
    >
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: acento }} />
      <span className="pointer-events-none absolute -right-24 -top-28 w-80 h-80 rounded-full blur-3xl opacity-[0.12]" style={{ background: acento }} />

      <div className={`relative flex flex-col md:flex-row md:items-center gap-4 md:gap-6 ${compacta ? 'p-4 pl-6' : 'p-5 sm:p-6 pl-7 sm:pl-8'}`}>
        <span
          className={`relative ${compacta ? 'w-12 h-12' : 'w-14 h-14'} rounded-2xl flex items-center justify-center shrink-0`}
          style={{ background: `color-mix(in srgb, ${acento} 14%, transparent)`, color: acento }}
        >
          <ClipboardList className={compacta ? 'w-6 h-6' : 'w-7 h-7'} />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: acento }} />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-[var(--c-panel)]" style={{ background: acento }} />
          </span>
        </span>

        <span className="flex-1 min-w-0">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded-md"
              style={{ background: `color-mix(in srgb, ${acento} 14%, transparent)`, color: acento }}
            >
              {enVivo ? 'En vivo' : 'Sala abierta'}
            </span>
            <span className="text-xs text-[var(--c-suave)]">
              {enVivo ? (
                <>
                  Se cierra en <strong className="font-mono text-[var(--c-texto)]">{mmss(quedan ?? 0)}</strong>
                </>
              ) : (
                'Tu docente va a iniciar en un momento'
              )}
            </span>
          </span>
          <span className={`block font-display font-extrabold tracking-tight truncate ${compacta ? 'text-lg mt-1' : 'text-xl sm:text-2xl mt-1.5'}`}>{conMayuscula(p.nombre)}</span>

          {compacta ? (
            <span className="block text-sm text-[var(--c-suave)] truncate">
              {p.aula} · {preguntas} · {individual ? 'individual' : p.miEquipo?.nombre}
            </span>
          ) : (
            <span className="flex flex-wrap gap-2 mt-3">
              {[
                { i: School, t: p.aula },
                { i: ListChecks, t: preguntas },
                { i: Clock, t: `${p.duracionMin} min` },
              ].map((c) => (
                <span key={c.t} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-[var(--c-fondo)] border border-[var(--c-linea)] text-[var(--c-suave)]">
                  <c.i className="w-3.5 h-3.5" /> {c.t}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-[var(--c-fondo)] border border-[var(--c-linea)] text-[var(--c-suave)]">
                {individual ? (
                  <>
                    <User className="w-3.5 h-3.5" /> Individual
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5" />
                    <span className="w-2 h-2 rounded-full" style={{ background: p.miEquipo?.color }} /> {p.miEquipo?.nombre ?? 'Por equipos'}
                  </>
                )}
              </span>
            </span>
          )}
        </span>

        <span
          className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold shrink-0 transition-transform group-hover:translate-x-0.5 ${compacta ? 'px-4 py-2.5 text-sm' : 'px-5 py-3'}`}
          style={{ background: acento, color: sobreAcento }}
        >
          {enVivo ? 'Responder ahora' : 'Entrar a la sala'} <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </motion.button>
  );
}
