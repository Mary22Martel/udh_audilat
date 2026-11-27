import { iniciales } from '../components/shell/Shell';
import { Encabezado, Pagina, Tarjeta } from '../components/ui';
import { NOMBRE_ROL } from '../lib/api';
import { useSesion } from '../lib/sesion';
import { CambiarClave } from './alumno/Perfil';

/** Cuenta del docente o del administrador: sus datos y cambio de contraseña. */
export function PerfilSimple() {
  const { usuario } = useSesion();
  return (
    <Pagina ancho="max-w-[880px]">
      <Encabezado antetitulo="Mi cuenta" titulo={usuario!.nombre} />
      <div className="grid md:grid-cols-2 gap-6">
        <Tarjeta className="p-6 space-y-4">
          <span className="w-16 h-16 rounded-2xl bg-[var(--c-oro)] text-[#1a1406] flex items-center justify-center font-display font-extrabold text-xl">{iniciales(usuario!.nombre)}</span>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[var(--c-suave)] text-xs">Correo</dt>
              <dd className="font-medium">{usuario!.correo}</dd>
            </div>
            <div>
              <dt className="text-[var(--c-suave)] text-xs">Rol</dt>
              <dd className="font-medium">{NOMBRE_ROL[usuario!.rol]}</dd>
            </div>
          </dl>
          <p className="text-xs text-[var(--c-suave)]">Para cambiar tu nombre o correo, pídelo al administrador.</p>
        </Tarjeta>
        <Tarjeta className="p-6" retraso={0.05}>
          <CambiarClave />
        </Tarjeta>
      </div>
    </Pagina>
  );
}
