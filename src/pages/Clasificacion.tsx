import { motion } from 'motion/react';
import { Crown, Medal, Target, Trophy, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { iniciales } from '../components/shell/Shell';
import { CajaError, Cargando, Encabezado, Pagina, Tarjeta, Vacio } from '../components/ui';
import { api, type Clasificacion as TClasificacion, type Puesto } from '../lib/api';
import { useSesion } from '../lib/sesion';

const SINGULAR: Record<string, string> = { lecciones: 'lección', casos: 'caso' };
const cuenta = (n: number, e: string) => `${n} ${n === 1 ? SINGULAR[e] ?? e : e}`;

const PODIO = {
  1: { alto: 'h-44 sm:h-52', color: '#f2b632', brillo: 'from-[#f2b632]/40', etiqueta: '1.er puesto', orden: 'order-2', retraso: 0.45 },
  2: { alto: 'h-32 sm:h-40', color: '#b8c4cc', brillo: 'from-[#b8c4cc]/35', etiqueta: '2.º puesto', orden: 'order-1', retraso: 0.25 },
  3: { alto: 'h-24 sm:h-28', color: '#cd8a52', brillo: 'from-[#cd8a52]/35', etiqueta: '3.er puesto', orden: 'order-3', retraso: 0.05 },
} as const;

function Pedestal({ p, etiqueta }: { p: Puesto; etiqueta: string }) {
  const cfg = PODIO[p.puesto as 1 | 2 | 3];
  const primero = p.puesto === 1;
  return (
    <div className={`flex-1 max-w-[220px] flex flex-col items-center ${cfg.orden}`}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: cfg.retraso + 0.35, type: 'spring', stiffness: 220, damping: 16 }}
        className="flex flex-col items-center text-center mb-3 px-1"
      >
        {primero && (
          <motion.span animate={{ y: [0, -4, 0], rotate: [0, -6, 6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
            <Crown className="w-8 h-8 mb-1" style={{ color: cfg.color }} fill={cfg.color} />
          </motion.span>
        )}
        <span
          className={`relative rounded-full flex items-center justify-center font-display font-extrabold text-[#0f1b26] ${primero ? 'w-20 h-20 text-2xl' : 'w-16 h-16 text-lg'}`}
          style={{ background: cfg.color, boxShadow: `0 0 0 4px var(--c-fondo), 0 0 0 6px ${cfg.color}55, 0 10px 30px -6px ${cfg.color}` }}
        >
          {iniciales(p.nombre)}
          {p.esYo && <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[var(--c-teal)] text-[var(--c-sobre)] text-[10px] font-bold">TÚ</span>}
        </span>
        <p className={`mt-3 font-semibold text-[var(--c-texto)] leading-tight ${primero ? 'text-base' : 'text-sm'}`}>{p.nombre}</p>
        <p className="text-[11px] text-[var(--c-suave)]">{p.nivel}</p>
        <p className="mt-1 font-mono-tabular font-bold text-[var(--c-oro)] text-sm">{p.xp.toLocaleString('es-PE')} XP</p>
        <p className="text-[10px] text-[var(--c-suave)] font-mono-tabular">
          {cuenta(p.misiones, etiqueta)} · {p.precision ?? '—'} %
        </p>
      </motion.div>
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: 'auto' }}
        transition={{ delay: cfg.retraso, duration: 0.55, ease: [0.2, 0.9, 0.3, 1.2] }}
        className="w-full overflow-hidden"
      >
        <div
          className={`relative w-full ${cfg.alto} rounded-t-2xl bg-gradient-to-b ${cfg.brillo} to-[var(--c-panel)] border border-b-0 flex flex-col items-center pt-4`}
          style={{ borderColor: `${cfg.color}66` }}
        >
          <span className="font-display font-black text-5xl sm:text-6xl" style={{ color: cfg.color }}>
            {p.puesto}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-suave)] mt-1">{cfg.etiqueta}</span>
        </div>
      </motion.div>
    </div>
  );
}

export function Podio({ puestos, etiqueta = 'casos' }: { puestos: Puesto[]; etiqueta?: string }) {
  const top = puestos.slice(0, 3);
  return (
    <div className="relative">
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(ellipse_at_bottom,var(--c-teal)_0%,transparent_70%)] opacity-15 pointer-events-none" />
      <div className="relative flex items-end justify-center gap-2 sm:gap-4 pt-4">
        {top.map((p) => (
          <Pedestal key={p.id} p={p} etiqueta={etiqueta} />
        ))}
      </div>
      <div className="h-3 rounded-b-xl bg-[var(--c-elevado)]" />
    </div>
  );
}

export function ListaPuestos({ puestos, desde = 4, etiqueta = 'casos' }: { puestos: Puesto[]; desde?: number; etiqueta?: string }) {
  const lider = puestos[0]?.xp || 1;
  const resto = puestos.filter((p) => p.puesto >= desde);
  if (!resto.length) return null;
  return (
    <div className="divide-y divide-[var(--c-linea)]">
      {resto.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 + i * 0.05 }}
          className={`flex items-center gap-4 px-4 sm:px-6 py-3.5 ${p.esYo ? 'bg-[var(--c-teal)]/10' : ''}`}
        >
          <span className="w-8 text-center font-mono-tabular font-bold text-[var(--c-suave)]">{p.puesto}</span>
          <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${p.esYo ? 'bg-[var(--c-teal)] text-[var(--c-sobre)]' : 'bg-[var(--c-elevado)] text-[var(--c-texto)]'}`}>
            {iniciales(p.nombre)}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold truncate">
              {p.nombre} {p.esYo && <span className="text-[var(--c-teal)] text-xs">(tú)</span>}
            </span>
            <span className="block text-[11px] text-[var(--c-suave)]">
              {p.nivel} · {cuenta(p.misiones, etiqueta)} · {p.precision === null ? 'sin intentos' : `${p.precision} % precisión`}
            </span>
            <span className="block mt-1.5 h-1.5 rounded-full bg-[var(--c-hondo)] overflow-hidden max-w-[280px]">
              <motion.span
                className="block h-full rounded-full bg-[var(--c-teal)]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((p.xp / lider) * 100)}%` }}
                transition={{ delay: 1 + i * 0.05, duration: 0.6 }}
              />
            </span>
          </span>
          <span className="font-mono-tabular font-bold text-sm text-[var(--c-oro)] shrink-0">{p.xp.toLocaleString('es-PE')} XP</span>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Clasificación con podio.
 *  - academia: compañeros de un aula (lo que mide el aprendizaje).
 *  - misiones: todos los estudiantes (las misiones son práctica libre).
 */
export function Clasificacion({
  tipo,
  aulaId,
  titulo,
  descripcion,
  incrustada = false,
  pestanas = false,
}: {
  tipo: 'academia' | 'misiones';
  aulaId?: string;
  titulo?: string;
  descripcion?: string;
  incrustada?: boolean;
  /** Muestra el cambio entre Academia y Misiones (vista del alumno). */
  pestanas?: boolean;
}) {
  const { usuario } = useSesion();
  const [vista, setVista] = useState<'academia' | 'misiones'>(tipo);
  const [aula, setAula] = useState<string | undefined>(aulaId);
  const [datos, setDatos] = useState<TClasificacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = () => {
    setDatos(null);
    api
      // Misiones: general para el alumno; por aula solo si quien mira es el docente (aulaId fijo).
      .get<TClasificacion>(`/api/clasificacion?tipo=${vista}${(vista === 'academia' ? aula : aulaId) ? `&aula=${vista === 'academia' ? aula : aulaId}` : ''}`)
      .then(setDatos)
      .catch((e) => setError(e.message));
  };
  useEffect(cargar, [vista, aula]);

  const aulas = usuario?.aulas ?? [];
  const cabecera = (
    <>
      {!incrustada && (
        <Encabezado
          antetitulo="Clasificación"
          titulo={titulo ?? (vista === 'academia' ? 'Clasificación de tu aula' : 'Clasificación general de misiones')}
          descripcion={
            descripcion ??
            (vista === 'academia'
              ? 'Cuenta el XP de la Academia: el mejor intento de cada lección.'
              : 'Todos los estudiantes de AUDIT LAB. Cuenta el mejor intento de cada misión.')
          }
        />
      )}
      {pestanas && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 p-1 bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl">
            {(['academia', 'misiones'] as const).map((v) => (
              <button key={v} onClick={() => setVista(v)} className={`relative px-4 py-2 rounded-lg text-sm font-medium ${vista === v ? 'text-[var(--c-texto)]' : 'text-[var(--c-suave)]'}`}>
                {vista === v && <motion.span layoutId="vista-clasif" className="absolute inset-0 rounded-lg bg-[var(--c-elevado)]" />}
                <span className="relative">{v === 'academia' ? 'Academia · mi aula' : 'Misiones · general'}</span>
              </button>
            ))}
          </div>
          {vista === 'academia' && aulas.length > 1 && (
            <select value={aula ?? aulas[0].id} onChange={(e) => setAula(e.target.value)} className="px-3 py-2 rounded-xl bg-[var(--c-panel)] border border-[var(--c-linea)] text-sm">
              {aulas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </>
  );

  const contenido = () => {
    if (error) return <CajaError mensaje={error} onReintentar={cargar} />;
    if (!datos) return <Cargando />;
    if (vista === 'academia' && !datos.aula)
      return (
        <Tarjeta>
          <Vacio icono={Users} titulo="Aún no estás en un aula" texto="Únete al aula de tu docente desde «Mis aulas» para competir con tus compañeros. Mientras tanto, mira la clasificación general de misiones." />
        </Tarjeta>
      );
    const puestos = datos.puestos;
    const yo = puestos.find((p) => p.esYo);
    if (!puestos.some((p) => p.xp > 0))
      return (
        <Tarjeta>
          <Vacio icono={Trophy} titulo="Todavía no hay puntajes" texto="Cuando alguien sume XP, aparecerá aquí el podio." />
        </Tarjeta>
      );
    return (
      <>
        {datos.aula && vista === 'academia' && !incrustada && <p className="text-sm text-[var(--c-suave)] -mt-4">Aula: {datos.aula.nombre}</p>}
        <Tarjeta className="px-4 sm:px-10 pt-6 overflow-hidden">
          <Podio puestos={puestos} etiqueta={vista === 'academia' ? 'lecciones' : 'casos'} />
        </Tarjeta>
        <div className="grid sm:grid-cols-3 gap-4">
          <Tarjeta className="p-4 flex items-center gap-3" retraso={0.6}>
            <Users className="w-5 h-5 text-[var(--c-teal)]" />
            <span className="text-sm">
              <strong className="font-mono">{puestos.length}</strong> en la clasificación
            </span>
          </Tarjeta>
          {yo && (
            <Tarjeta className="p-4 flex items-center gap-3" retraso={0.65}>
              <Medal className="w-5 h-5 text-[var(--c-oro)]" />
              <span className="text-sm">
                Tu puesto: <strong className="font-mono">#{yo.puesto}</strong>
              </span>
            </Tarjeta>
          )}
          {yo && yo.puesto > 1 && (
            <Tarjeta className="p-4 flex items-center gap-3" retraso={0.7}>
              <Target className="w-5 h-5 text-[var(--c-teal)]" />
              <span className="text-sm">
                A <strong className="font-mono">{(puestos[yo.puesto - 2].xp - yo.xp + 1).toLocaleString('es-PE')} XP</strong> del puesto {yo.puesto - 1}
              </span>
            </Tarjeta>
          )}
        </div>
        {puestos.length > 3 && (
          <Tarjeta className="overflow-hidden" retraso={0.8}>
            <ListaPuestos puestos={puestos} etiqueta={vista === 'academia' ? 'lecciones' : 'casos'} />
          </Tarjeta>
        )}
      </>
    );
  };

  if (incrustada)
    return (
      <div className="space-y-6">
        {cabecera}
        {contenido()}
      </div>
    );
  return (
    <Pagina ancho="max-w-[980px]">
      {cabecera}
      {contenido()}
    </Pagina>
  );
}
