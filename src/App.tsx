import { BarChart3, BookOpen, Compass, FileQuestion, FolderOpen, GraduationCap, Home, School, Swords, Trophy, User, Users } from 'lucide-react';
import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { AcademyView } from './components/AcademyView';
import { Shell, type ItemMenu } from './components/shell/Shell';
import { Cargando, Pagina, Tarjeta } from './components/ui';
import { api, RUTA_INICIO, type ResumenProyecto, type Rol } from './lib/api';
import { useSesion } from './lib/sesion';
import { DatosAlumnoProvider, useAlumno } from './pages/alumno/datos';
import { Ingresar } from './pages/Ingresar';
import { Portada } from './pages/Portada';

// Cada pantalla se descarga solo cuando se usa.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const perezoso = <M, K extends keyof M>(f: () => Promise<M>, k: K) => lazy(() => f().then((m) => ({ default: m[k] as M[K] & ComponentType<any> })));
const Inicio = perezoso(() => import('./pages/alumno/Inicio'), 'Inicio');
const CasosLista = perezoso(() => import('./pages/alumno/Casos'), 'CasosLista');
const CasoDetalle = perezoso(() => import('./pages/alumno/Casos'), 'CasoDetalle');
const SalaAlumno = perezoso(() => import('./pages/alumno/Casos'), 'SalaAlumno');
const ResultadoAlumno = perezoso(() => import('./pages/alumno/Casos'), 'ResultadoAlumno');
const Perfil = perezoso(() => import('./pages/alumno/Perfil'), 'Perfil');
const AulasAlumno = perezoso(() => import('./pages/alumno/Aulas'), 'Aulas');
const Ruta = perezoso(() => import('./pages/academia/Ruta'), 'Ruta');
const Juego = perezoso(() => import('./pages/academia/Juego'), 'Juego');
const ProyectoAlumno = perezoso(() => import('./pages/proyectos/ProyectoAlumno'), 'ProyectoAlumno');
const Clasificacion = perezoso(() => import('./pages/Clasificacion'), 'Clasificacion');
const AulasDocente = perezoso(() => import('./pages/docente/Aulas'), 'AulasDocente');
const Aula = perezoso(() => import('./pages/docente/Aula'), 'Aula');
const AlumnoDetalle = perezoso(() => import('./pages/docente/AlumnoDetalle'), 'AlumnoDetalle');
const Banco = perezoso(() => import('./pages/docente/Banco'), 'Banco');
const ProyectosDocente = perezoso(() => import('./pages/docente/Proyectos'), 'ProyectosDocente');
const EditorProyecto = perezoso(() => import('./pages/docente/Proyectos'), 'EditorProyecto');
const ControlProyecto = perezoso(() => import('./pages/docente/Proyectos'), 'ControlProyecto');
const CatalogoCasos = perezoso(() => import('./pages/CasosCatalogo'), 'CatalogoCasos');
const DetalleCatalogo = perezoso(() => import('./pages/CasosCatalogo'), 'DetalleCatalogo');
const SalaPrueba = perezoso(() => import('./pages/CasosCatalogo'), 'SalaPrueba');
const ResultadoPrueba = perezoso(() => import('./pages/CasosCatalogo'), 'ResultadoPrueba');
const Resumen = perezoso(() => import('./pages/admin/Resumen'), 'Resumen');
const Usuarios = perezoso(() => import('./pages/admin/Usuarios'), 'Usuarios');
const PerfilSimple = perezoso(() => import('./pages/PerfilSimple'), 'PerfilSimple');

/** Solo deja pasar al rol indicado; si no hay sesión, manda al login. */
function Requiere({ rol, children }: { rol: Rol; children: ReactNode }) {
  const { usuario, cargando } = useSesion();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/ingresar" replace />;
  if (usuario.rol !== rol) return <Navigate to={RUTA_INICIO[usuario.rol]} replace />;
  return <>{children}</>;
}

const Carga = ({ children }: { children: ReactNode }) => <Suspense fallback={<Cargando />}>{children}</Suspense>;

/** Fichas normativas (la teoría), con el tema elegido en la dirección (?tema=…). */
function Fichas({ casos, completadas }: { casos: string; completadas?: string[] }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  return <AcademyView initialTopicId={params.get('tema')} completedMissionIds={completadas} onPracticeMission={(id) => navigate(`${casos}/${id}`)} />;
}

/** Misiones vistas por docente y admin: solo la clasificación general y el catálogo. */
function MisionesGeneral({ base }: { base: string }) {
  return (
    <div>
      <Clasificacion tipo="misiones" titulo="Misiones · clasificación general" descripcion="Las misiones son práctica libre para cualquier estudiante. Aquí ves quién va adelante en todo AUDIT LAB." />
      <Pagina ancho="max-w-[980px]">
        <Tarjeta className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between -mt-8">
          <p className="text-sm text-[var(--c-suave)]">¿Quieres ver los casos como los ven los alumnos? Puedes jugarlos en modo prueba.</p>
          <Link to={`${base}/casos`} className="text-sm font-semibold text-[var(--c-teal)] hover:underline whitespace-nowrap">
            Ver catálogo de misiones →
          </Link>
        </Tarjeta>
      </Pagina>
    </div>
  );
}

// --- Estudiante -------------------------------------------------------------------------------------------------

function LayoutAlumno() {
  const { estado, misiones, leerAvisos } = useAlumno();
  const navigate = useNavigate();
  const [vivos, setVivos] = useState(0);
  useEffect(() => {
    const f = () =>
      api
        .get<{ proyectos: ResumenProyecto[] }>('/api/alumno/proyectos')
        .then((r) => setVivos(r.proyectos.filter((p) => p.estado === 'sala' || p.estado === 'en_curso').length))
        .catch(() => undefined);
    f();
    const iv = setInterval(f, 15000);
    return () => clearInterval(iv);
  }, []);
  const menu: ItemMenu[] = [
    { to: '/app', label: 'Inicio', icon: Home, end: true },
    { to: '/app/academia', label: 'Academia', icon: GraduationCap },
    { to: '/app/casos', label: 'Misiones', icon: FolderOpen, badge: misiones.filter((m) => m.status === 'disponible').length },
    { to: '/app/aulas', label: 'Mis aulas', icon: School, badge: vivos ? '● EN VIVO' : undefined },
    { to: '/app/clasificacion', label: 'Clasificación', icon: Trophy },
    { to: '/app/perfil', label: 'Perfil', icon: User },
  ];
  return (
    <Shell menu={menu} avisos={estado.avisos} onLeerAvisos={leerAvisos} onAbrir={(enlace) => navigate(enlace)}>
      <Carga>
        <Outlet />
      </Carga>
    </Shell>
  );
}

function FichasAlumno() {
  const { estado } = useAlumno();
  return <Fichas casos="/app/casos" completadas={estado.completadas} />;
}

// --- Docente y administración -----------------------------------------------------------------------------------

function LayoutDocente() {
  const menu: ItemMenu[] = [
    { to: '/docente/aulas', label: 'Mis aulas', icon: School },
    { to: '/docente/preguntas', label: 'Banco de preguntas', icon: FileQuestion },
    { to: '/docente/proyectos', label: 'Proyectos por equipos', icon: Swords },
    { to: '/docente/misiones', label: 'Misiones', icon: Compass },
    { to: '/docente/academia', label: 'Fichas normativas', icon: BookOpen },
    { to: '/docente/perfil', label: 'Mi cuenta', icon: User },
  ];
  return (
    <Shell menu={menu} acento="oro">
      <Carga>
        <Outlet />
      </Carga>
    </Shell>
  );
}

function LayoutAdmin() {
  const menu: ItemMenu[] = [
    { to: '/admin', label: 'Resumen', icon: BarChart3, end: true },
    { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
    { to: '/admin/aulas', label: 'Aulas', icon: School },
    { to: '/admin/preguntas', label: 'Banco de preguntas', icon: FileQuestion },
    { to: '/admin/proyectos', label: 'Proyectos', icon: Swords },
    { to: '/admin/misiones', label: 'Misiones', icon: Compass },
    { to: '/admin/perfil', label: 'Mi cuenta', icon: User },
  ];
  return (
    <Shell menu={menu}>
      <Carga>
        <Outlet />
      </Carga>
    </Shell>
  );
}

/** Rutas comunes de docente y admin (cambia solo el prefijo). */
function rutasGestion(base: '/docente' | '/admin') {
  return (
    <>
      <Route path="aulas" element={<AulasDocente base={`${base}/aulas`} />} />
      <Route path="aulas/:id" element={<Aula base={base} />} />
      <Route path="alumnos/:id" element={<AlumnoDetalle />} />
      <Route path="preguntas" element={<Banco />} />
      <Route path="proyectos" element={<ProyectosDocente base={base} />} />
      <Route path="proyectos/nuevo" element={<EditorProyecto base={base} />} />
      <Route path="proyectos/:id" element={<ControlProyecto base={base} />} />
      <Route path="proyectos/:id/editar" element={<EditorProyecto base={base} />} />
      <Route path="misiones" element={<MisionesGeneral base={base} />} />
      <Route path="casos" element={<CatalogoCasos base={`${base}/casos`} />} />
      <Route path="casos/:id" element={<DetalleCatalogo base={`${base}/casos`} academia={`${base}/academia`} />} />
      <Route path="casos/:id/resultado" element={<ResultadoPrueba base={`${base}/casos`} />} />
      <Route path="academia" element={<Fichas casos={`${base}/casos`} />} />
      <Route path="perfil" element={<PerfilSimple />} />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Portada />} />
      <Route path="/ingresar" element={<Ingresar />} />

      <Route
        path="/app"
        element={
          <Requiere rol="estudiante">
            <DatosAlumnoProvider>
              <Outlet />
            </DatosAlumnoProvider>
          </Requiere>
        }
      >
        {/* Pantallas de juego a pantalla completa, sin menú. */}
        <Route path="casos/:id/sala" element={<Carga><SalaAlumno /></Carga>} />
        <Route path="academia/leccion/:id" element={<Carga><Juego modo="leccion" /></Carga>} />
        <Route path="academia/repaso" element={<Carga><Juego modo="repaso" /></Carga>} />
        <Route path="academia/contrarreloj" element={<Carga><Juego modo="contrarreloj" /></Carga>} />
        <Route path="proyectos/:id" element={<Carga><ProyectoAlumno /></Carga>} />
        <Route element={<LayoutAlumno />}>
          <Route index element={<Inicio />} />
          <Route path="academia" element={<Ruta />} />
          <Route path="academia/fichas" element={<FichasAlumno />} />
          <Route path="casos" element={<CasosLista />} />
          <Route path="casos/:id" element={<CasoDetalle />} />
          <Route path="casos/:id/resultado" element={<ResultadoAlumno />} />
          <Route path="aulas" element={<AulasAlumno />} />
          <Route path="clasificacion" element={<Clasificacion tipo="academia" pestanas />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
      </Route>

      <Route path="/docente" element={<Requiere rol="docente"><Outlet /></Requiere>}>
        <Route path="casos/:id/prueba" element={<Carga><SalaPrueba base="/docente/casos" /></Carga>} />
        <Route element={<LayoutDocente />}>
          <Route index element={<Navigate to="/docente/aulas" replace />} />
          {rutasGestion('/docente')}
        </Route>
      </Route>

      <Route path="/admin" element={<Requiere rol="admin"><Outlet /></Requiere>}>
        <Route path="casos/:id/prueba" element={<Carga><SalaPrueba base="/admin/casos" /></Carga>} />
        <Route element={<LayoutAdmin />}>
          <Route index element={<Resumen />} />
          <Route path="usuarios" element={<Usuarios />} />
          {rutasGestion('/admin')}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
