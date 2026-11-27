import { AnimatePresence, motion } from 'motion/react';
import { Award, Bell, CheckCheck, FileText, LogOut, Menu, Moon, School, Sparkles, Sun, Swords, TrendingUp, X, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { NOMBRE_ROL, type Aviso } from '../../lib/api';
import { useSesion } from '../../lib/sesion';
import { useTema } from '../../lib/tema';

export interface ItemMenu {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: string | number;
}

export function Logo({ compacto = false }: { compacto?: boolean }) {
  const { tema } = useTema();
  return (
    <div className="flex items-center gap-3">
      <img
        src={tema === 'oscuro' ? '/marca/udh-logo-blanco.webp' : '/marca/udh-logo-oscuro.webp'}
        alt="Universidad de Huánuco"
        className={compacto ? 'h-7 w-auto' : 'h-9 w-auto'}
      />
      <span className="h-8 w-px bg-[var(--c-linea-fuerte)]" aria-hidden="true" />
      <span className="font-display font-extrabold tracking-tight text-[var(--c-texto)] leading-none">
        AUDIT
        <br />
        <span className="text-[var(--c-teal)]">LAB</span>
      </span>
    </div>
  );
}

export function iniciales(nombre: string) {
  return nombre
    .replace(/^(Mg\.|CPC|Dr\.|Dra\.|Lic\.)\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function BotonTema({ className = '' }: { className?: string }) {
  const { tema, alternar } = useTema();
  return (
    <button
      onClick={alternar}
      className={`p-2 rounded-lg text-[var(--c-suave)] hover:text-[var(--c-texto)] hover:bg-[var(--c-elevado)] transition-colors ${className}`}
      aria-label={tema === 'oscuro' ? 'Cambiar a modo día' : 'Cambiar a modo sala'}
      title={tema === 'oscuro' ? 'Modo día' : 'Modo sala'}
    >
      {tema === 'oscuro' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
    </button>
  );
}

const ICONO_AVISO: Record<Aviso['tipo'], LucideIcon> = {
  bienvenida: Sparkles,
  logro: Award,
  nivel: TrendingUp,
  resultado: FileText,
  sistema: Bell,
  aula: School,
  proyecto: Swords,
};

function hace(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}

function Campanita({ avisos, onLeer, onAbrir }: { avisos: Aviso[]; onLeer: (id?: string) => void; onAbrir: (enlace: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sinLeer = avisos.filter((a) => !a.leido).length;

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto((v) => !v)}
        className="relative p-2 rounded-lg text-[var(--c-suave)] hover:text-[var(--c-texto)] hover:bg-[var(--c-elevado)] transition-colors"
        aria-label={`Avisos${sinLeer ? ` (${sinLeer} sin leer)` : ''}`}
      >
        <Bell className="w-[18px] h-[18px]" />
        {sinLeer > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-[var(--c-oro)] text-[var(--c-sobre)] text-[10px] font-bold flex items-center justify-center">
            {sinLeer}
          </span>
        )}
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[min(360px,calc(100vw-2rem))] bg-[var(--c-panel)] border border-[var(--c-linea)] rounded-xl shadow-2xl shadow-black/30 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--c-linea)]">
              <p className="font-display font-semibold text-sm text-[var(--c-texto)]">Avisos</p>
              {sinLeer > 0 && (
                <button onClick={() => onLeer()} className="text-xs text-[var(--c-teal)] hover:underline inline-flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Marcar todo como leído
                </button>
              )}
            </div>
            <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--c-linea)]">
              {avisos.length === 0 && <p className="px-4 py-8 text-center text-sm text-[var(--c-suave)]">No tienes avisos todavía.</p>}
              {avisos.map((a) => {
                const Icono = ICONO_AVISO[a.tipo];
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      if (!a.leido) onLeer(a.id);
                      if (a.enlace) {
                        onAbrir(a.enlace);
                        setAbierto(false);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-[var(--c-elevado)]/50 transition-colors ${a.leido ? 'opacity-70' : ''}`}
                  >
                    <span
                      className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        a.tipo === 'logro' || a.tipo === 'nivel' ? 'bg-[var(--c-oro)]/15 text-[var(--c-oro)]' : 'bg-[var(--c-teal)]/15 text-[var(--c-teal)]'
                      }`}
                    >
                      <Icono className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-[var(--c-texto)] leading-snug">{a.titulo}</span>
                        {!a.leido && <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--c-oro)] shrink-0" aria-label="sin leer" />}
                      </span>
                      <span className="block text-xs text-[var(--c-suave)] mt-0.5 leading-relaxed">{a.texto}</span>
                      <span className="block text-[11px] text-[var(--c-tenue)] mt-1">{hace(a.creado)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Shell({
  menu,
  children,
  avisos,
  onLeerAvisos,
  onAbrir,
  acento = 'teal',
}: {
  menu: ItemMenu[];
  children: ReactNode;
  avisos?: Aviso[];
  onLeerAvisos?: (id?: string) => void;
  onAbrir?: (enlace: string) => void;
  acento?: 'teal' | 'oro';
}) {
  const { usuario, salir } = useSesion();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [movil, setMovil] = useState(false);

  useEffect(() => setMovil(false), [pathname]);

  const colorActivo = acento === 'oro' ? 'text-[var(--c-oro)]' : 'text-[var(--c-teal)]';

  const lateral = (
    <div className="flex flex-col h-full w-[256px] bg-[var(--c-panel2)] border-r border-[var(--c-linea)]">
      <div className="px-5 pt-6 pb-5 flex items-start justify-between">
        <Logo />
        <button onClick={() => setMovil(false)} className="lg:hidden p-1.5 text-[var(--c-suave)]" aria-label="Cerrar menú">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="px-5 -mt-1 mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--c-suave)]">
        Laboratorio de auditoría tributaria
      </p>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto" aria-label="Menú principal">
        {menu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? `bg-[var(--c-panel)] ${colorActivo} shadow-tema` : 'text-[var(--c-suave)] hover:text-[var(--c-texto)] hover:bg-[var(--c-panel)]/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="menu-activo"
                    className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r ${acento === 'oro' ? 'bg-[var(--c-oro)]' : 'bg-[var(--c-teal)]'}`}
                  />
                )}
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge !== 0 && (
                  <span className={`text-[11px] font-mono-tabular font-semibold ${typeof item.badge === 'string' ? 'text-rose-400 animate-pulse' : 'text-[var(--c-oro)]'}`}>{item.badge}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {usuario && (
        <div className="p-3 border-t border-[var(--c-linea)]">
          <div className="flex items-center gap-3 px-2 py-2">
            <span
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                acento === 'oro' ? 'bg-[var(--c-oro)]/20 text-[var(--c-oro)]' : 'bg-[var(--c-teal)]/20 text-[var(--c-teal)]'
              }`}
            >
              {iniciales(usuario.nombre)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--c-texto)] truncate">{usuario.nombre}</span>
              <span className="block text-[11px] text-[var(--c-suave)]">{NOMBRE_ROL[usuario.rol]}</span>
            </span>
            <button
              onClick={async () => {
                await salir();
                navigate('/ingresar');
              }}
              className="p-2 rounded-lg text-[var(--c-suave)] hover:text-rose-400 hover:bg-[var(--c-elevado)] transition-colors"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--c-fondo)] text-[var(--c-texto)]">
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen">{lateral}</aside>
      <AnimatePresence>
        {movil && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60" onClick={() => setMovil(false)} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }} className="relative z-10 h-full">
              {lateral}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between gap-3 px-4 sm:px-8 bg-[var(--c-fondo)]/85 backdrop-blur border-b border-[var(--c-linea)]">
          <div className="flex items-center gap-3">
            <button onClick={() => setMovil(true)} className="lg:hidden p-2 -ml-2 text-[var(--c-suave)]" aria-label="Abrir menú">
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden">
              <Logo compacto />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <BotonTema />
            {avisos && onLeerAvisos && onAbrir && <Campanita avisos={avisos} onLeer={onLeerAvisos} onAbrir={onAbrir} />}
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
