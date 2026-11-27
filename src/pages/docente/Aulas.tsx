import { motion } from 'motion/react';
import { ArrowRight, Copy, Maximize2, Plus, School, Users } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BotonPrincipal, CajaError, Cargando, Encabezado, Modal, Pagina, Tarjeta, Vacio, estiloCampo } from '../../components/ui';
import { api, type AulaDocente } from '../../lib/api';
import { useSesion } from '../../lib/sesion';

/** Código del aula en grande, para proyectarlo en clase. */
export function CodigoProyectado({ aula, onCerrar }: { aula: AulaDocente; onCerrar: () => void }) {
  return (
    <div className="fixed inset-0 z-[95] bg-[#08121c] text-white flex flex-col items-center justify-center p-8 text-center" onClick={onCerrar}>
      <p className="text-sm uppercase tracking-[0.3em] text-[#7fd0d1]">Únete al aula en AUDIT LAB</p>
      <p className="font-display text-2xl sm:text-3xl font-bold mt-2">{aula.nombre}</p>
      <motion.p initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-mono font-black text-[18vw] sm:text-[12vw] leading-none tracking-wider text-[#f2b632] my-6">
        {aula.codigo}
      </motion.p>
      <p className="text-white/70 max-w-lg">Ingresa a AUDIT LAB → «Mis aulas» → escribe este código.</p>
      <p className="text-xs text-white/40 mt-8">Toca en cualquier lugar para cerrar</p>
    </div>
  );
}

export function TarjetaCodigo({ aula, onProyectar }: { aula: AulaDocente; onProyectar: () => void }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono font-black text-xl tracking-wider text-[var(--c-oro)]">{aula.codigo}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard?.writeText(aula.codigo).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1500);
          });
        }}
        className="p-1.5 rounded-lg text-[var(--c-suave)] hover:bg-[var(--c-elevado)]"
        title="Copiar código"
      >
        {copiado ? <span className="text-[10px] font-bold text-[var(--c-teal)]">¡Copiado!</span> : <Copy className="w-4 h-4" />}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onProyectar();
        }}
        className="p-1.5 rounded-lg text-[var(--c-suave)] hover:bg-[var(--c-elevado)]"
        title="Mostrar en grande para proyectar"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export function AulasDocente({ base = '/docente/aulas' }: { base?: string }) {
  const { usuario } = useSesion();
  const navigate = useNavigate();
  const [aulas, setAulas] = useState<AulaDocente[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nueva, setNueva] = useState(false);
  const [nombre, setNombre] = useState('');
  const [proyectar, setProyectar] = useState<AulaDocente | null>(null);
  const esAdmin = usuario?.rol === 'admin';

  const cargar = () => api.get<{ aulas: AulaDocente[] }>('/api/docente/aulas').then((r) => setAulas(r.aulas)).catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
  }, []);

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const r = await api.post<{ aula: AulaDocente }>('/api/docente/aulas', { nombre });
      setNueva(false);
      setNombre('');
      await cargar();
      setProyectar(r.aula);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (error) return <CajaError mensaje={error} onReintentar={() => { setError(null); cargar(); }} />;
  if (!aulas) return <Cargando />;
  const activas = aulas.filter((a) => !a.archivada);
  const archivadas = aulas.filter((a) => a.archivada);

  return (
    <Pagina>
      <Encabezado
        antetitulo={esAdmin ? 'Administración' : 'Mis aulas'}
        titulo={esAdmin ? 'Aulas de todos los docentes' : `Hola, ${usuario!.nombre.replace(/^(Mg\.|CPC|Dr\.|Dra\.|Lic\.)\s+/i, '').split(' ')[0]}`}
        descripcion={esAdmin ? 'Entra a cualquier aula para ver el avance de sus alumnos.' : 'Crea un aula, comparte su código y sigue cómo aprenden tus alumnos en la Academia.'}
        acciones={
          !esAdmin && (
            <BotonPrincipal onClick={() => setNueva(true)}>
              <Plus className="w-4 h-4" /> Nueva aula
            </BotonPrincipal>
          )
        }
      />

      {activas.length === 0 ? (
        <Tarjeta>
          <Vacio
            icono={School}
            titulo="Todavía no tienes aulas"
            texto="Crea tu primera aula. El sistema te dará un código para que tus alumnos se unan desde su cuenta."
            accion={!esAdmin && <BotonPrincipal onClick={() => setNueva(true)}>Crear mi primera aula</BotonPrincipal>}
          />
        </Tarjeta>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {activas.map((a, i) => (
            <motion.div
              key={a.id}
              role="link"
              tabIndex={0}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`${base}/${a.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`${base}/${a.id}`)}
              className="text-left rounded-3xl bg-[var(--c-panel)] border border-[var(--c-linea)] shadow-tema overflow-hidden cursor-pointer"
            >
              <div className="h-2 bg-gradient-to-r from-[var(--c-teal)] to-[var(--c-oro)]" />
              <div className="p-6 space-y-4">
                <div>
                  <p className="font-display text-lg font-bold leading-tight">{a.nombre}</p>
                  {esAdmin && <p className="text-xs text-[var(--c-suave)] mt-0.5">{a.docente}</p>}
                </div>
                <TarjetaCodigo aula={a} onProyectar={() => setProyectar(a)} />
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 text-[var(--c-suave)]">
                    <Users className="w-4 h-4" /> {a.alumnos} {a.alumnos === 1 ? 'alumno' : 'alumnos'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[var(--c-teal)]">
                    Ver avance <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {archivadas.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--c-suave)]">Aulas archivadas</h2>
          <div className="flex flex-wrap gap-2">
            {archivadas.map((a) => (
              <button key={a.id} onClick={() => navigate(`${base}/${a.id}`)} className="text-sm px-3 py-1.5 rounded-full border border-[var(--c-linea-fuerte)] text-[var(--c-suave)]">
                {a.nombre}
              </button>
            ))}
          </div>
        </section>
      )}

      {nueva && (
        <Modal titulo="Nueva aula" onCerrar={() => setNueva(false)}>
          <form onSubmit={crear} className="space-y-4">
            <input className={estiloCampo} autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Auditoría Tributaria – Sección A" required minLength={3} />
            <p className="text-xs text-[var(--c-suave)]">Al crearla verás el código en grande para proyectarlo en clase.</p>
            <BotonPrincipal className="w-full">Crear aula</BotonPrincipal>
          </form>
        </Modal>
      )}
      {proyectar && <CodigoProyectado aula={proyectar} onCerrar={() => setProyectar(null)} />}
    </Pagina>
  );
}
