import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CajaError, Cargando } from '../../components/ui';
import { api, type Aviso, type EstadoAlumno, type Registro } from '../../lib/api';
import { misionesDelAlumno } from '../../lib/misiones';
import type { Mission, MissionRunResult } from '../../types/audit';

interface DatosAlumno {
  estado: EstadoAlumno;
  misiones: Mission[];
  recargar: () => Promise<void>;
  registrar: (r: MissionRunResult) => Promise<Registro>;
  leerAvisos: (id?: string) => void;
  /** Último intento presentado, para mostrar la pantalla de resultados. */
  ultimo: { resultado: MissionRunResult; registro: Registro } | null;
}

const Ctx = createContext<DatosAlumno | null>(null);

export function DatosAlumnoProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoAlumno | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ultimo, setUltimo] = useState<DatosAlumno['ultimo']>(null);

  const recargar = useCallback(async () => {
    try {
      setError(null);
      setEstado(await api.get<EstadoAlumno>('/api/alumno/estado'));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const registrar = useCallback(async (resultado: MissionRunResult) => {
    const registro = await api.post<Registro>('/api/alumno/resultados', { resultado });
    setEstado(registro.estado);
    setUltimo({ resultado, registro });
    return registro;
  }, []);

  const leerAvisos = useCallback((id?: string) => {
    // Se marca al instante en pantalla y luego se guarda.
    setEstado((e) => (e ? { ...e, avisos: e.avisos.map((a) => (!id || a.id === id ? { ...a, leido: true } : a)) } : e));
    api.post<{ avisos: Aviso[] }>('/api/avisos/leer', { id }).catch(() => undefined);
  }, []);

  const misiones = useMemo(() => misionesDelAlumno(estado), [estado]);

  if (error && !estado) return <CajaError mensaje={error} onReintentar={recargar} />;
  if (!estado) return <Cargando texto="Abriendo tu expediente…" />;
  return <Ctx.Provider value={{ estado, misiones, recargar, registrar, leerAvisos, ultimo }}>{children}</Ctx.Provider>;
}

export function useAlumno() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAlumno fuera de DatosAlumnoProvider');
  return c;
}
