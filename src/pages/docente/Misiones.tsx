import { motion } from 'motion/react';
import { Compass, FolderOpen, School } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CajaError, Cargando, Encabezado, Pagina, Tarjeta, Vacio, colorNivel, estiloCampo } from '../../components/ui';
import { api, type MisionGrupo } from '../../lib/api';
import { Clasificacion } from '../Clasificacion';

/** Cómo les va a los alumnos de un aula en cada misión. */
export function TablaMisiones({ misiones }: { misiones: MisionGrupo[] }) {
  if (!misiones.length) return <Vacio icono={Compass} titulo="Sin misiones activas" texto="Cuando haya misiones activas, aquí verás cómo les va a tus alumnos." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--c-suave)] border-b border-[var(--c-linea)]">
            <th className="px-5 py-3 font-semibold">Misión</th>
            <th className="px-3 py-3 font-semibold">La resolvieron</th>
            <th className="px-3 py-3 font-semibold text-right">Precisión</th>
            <th className="px-3 py-3 font-semibold text-right">Hallazgos</th>
            <th className="px-3 py-3 font-semibold text-right">XP prom.</th>
            <th className="px-5 py-3 font-semibold text-right">Tiempo prom.</th>
          </tr>
        </thead>
        <tbody>
          {misiones.map((m, i) => {
            const pct = m.alumnos ? Math.round((m.resolvieron / m.alumnos) * 100) : 0;
            return (
              <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="border-b border-[var(--c-linea)] last:border-0">
                <td className="px-5 py-3">
                  <p className="font-semibold">{m.titulo}</p>
                  <p className="text-[11px] text-[var(--c-suave)]">
                    {m.numero.replace(/misi[oó]n\s*/i, 'Misión ')} · {m.empresa}
                  </p>
                </td>
                <td className="px-3 py-3 min-w-44">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-[var(--c-hondo)] overflow-hidden">
                      <motion.div className="h-full rounded-full bg-[var(--c-teal)]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: i * 0.05 }} />
                    </div>
                    <span className="font-mono text-xs whitespace-nowrap">
                      {m.resolvieron}/{m.alumnos}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-mono font-bold" style={{ color: colorNivel(m.precision) }}>
                  {m.precision === null ? '—' : `${m.precision} %`}
                </td>
                <td className="px-3 py-3 text-right font-mono" style={{ color: colorNivel(m.hallazgos) }}>
                  {m.hallazgos === null ? '—' : `${m.hallazgos} %`}
                </td>
                <td className="px-3 py-3 text-right font-mono">{m.xpPromedio ?? '—'}</td>
                <td className="px-5 py-3 text-right font-mono">{m.minutos === null ? '—' : `${m.minutos} min`}</td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface RespuestaMisiones {
  aulas: { id: string; nombre: string; alumnos: number; archivada: boolean }[];
  aula: { id: string; nombre: string } | null;
  misiones: MisionGrupo[];
}

/** Misiones vistas por el docente: solo sus alumnos, aula por aula. */
export function MisionesDocente({ base }: { base: string }) {
  const [aula, setAula] = useState<string | null>(null);
  const [datos, setDatos] = useState<RespuestaMisiones | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cargar = () => {
    setDatos(null);
    api
      .get<RespuestaMisiones>(`/api/docente/misiones${aula ? `?aula=${aula}` : ''}`)
      .then(setDatos)
      .catch((e) => setError(e.message));
  };
  useEffect(cargar, [aula]);

  if (error) return <CajaError mensaje={error} onReintentar={cargar} />;
  if (!datos) return <Cargando />;

  return (
    <Pagina>
      <Encabezado
        antetitulo="Misiones"
        titulo="Misiones de mis alumnos"
        descripcion="Las misiones son práctica libre: cada alumno las juega cuando quiere. Aquí ves cómo les va a los alumnos de tus aulas."
        acciones={
          <Link to={`${base}/casos`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--c-linea-fuerte)] text-sm font-semibold hover:border-[var(--c-teal)]">
            <FolderOpen className="w-4 h-4" /> Ver y probar las misiones
          </Link>
        }
      />
      {!datos.aula ? (
        <Tarjeta>
          <Vacio icono={School} titulo="Aún no tienes aulas" texto="Crea un aula y comparte su código: cuando tus alumnos se unan, verás aquí sus misiones." />
        </Tarjeta>
      ) : (
        <>
          {datos.aulas.length > 1 && (
            <Tarjeta className="p-4 flex items-center gap-3">
              <School className="w-4 h-4 text-[var(--c-teal)]" />
              <select value={datos.aula.id} onChange={(e) => setAula(e.target.value)} className={`${estiloCampo} py-2 sm:w-96`}>
                {datos.aulas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} ({a.alumnos} alumnos){a.archivada ? ' · archivada' : ''}
                  </option>
                ))}
              </select>
            </Tarjeta>
          )}
          <Tarjeta className="overflow-hidden">
            <TablaMisiones misiones={datos.misiones} />
          </Tarjeta>
          <Clasificacion key={datos.aula.id} tipo="misiones" aulaId={datos.aula.id} incrustada />
        </>
      )}
    </Pagina>
  );
}
