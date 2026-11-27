import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type Perfil } from './api';

interface Sesion {
  usuario: Perfil | null;
  cargando: boolean;
  ingresar: (correo: string, clave: string) => Promise<Perfil>;
  salir: () => Promise<void>;
}

const Ctx = createContext<Sesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .get<{ usuario: Perfil }>('/api/yo')
      .then((r) => setUsuario(r.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
    // Si el servidor dice que la sesión venció, volvemos al login.
    const vencida = () => setUsuario(null);
    window.addEventListener('auditlab:sesion-vencida', vencida);
    return () => window.removeEventListener('auditlab:sesion-vencida', vencida);
  }, []);

  const ingresar = useCallback(async (correo: string, clave: string) => {
    const r = await api.post<{ usuario: Perfil }>('/api/ingresar', { correo, clave });
    setUsuario(r.usuario);
    return r.usuario;
  }, []);

  const salir = useCallback(async () => {
    await api.post('/api/salir').catch(() => undefined);
    setUsuario(null);
  }, []);

  return <Ctx.Provider value={{ usuario, cargando, ingresar, salir }}>{children}</Ctx.Provider>;
}

export function useSesion() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSesion fuera de SesionProvider');
  return s;
}
