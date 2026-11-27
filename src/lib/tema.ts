import { useSyncExternalStore } from 'react';

export type Tema = 'oscuro' | 'claro';
const CLAVE = 'auditlab:tema';

function leer(): Tema {
  try {
    const t = localStorage.getItem(CLAVE);
    if (t === 'claro' || t === 'oscuro') return t;
  } catch {
    /* navegador sin almacenamiento */
  }
  return 'oscuro';
}

let actual: Tema = leer();
const oyentes = new Set<() => void>();

/** Aplica el tema guardado al cargar la página (antes del primer dibujo). */
export function aplicarTema(t: Tema = actual) {
  actual = t;
  document.documentElement.dataset.tema = t;
  try {
    localStorage.setItem(CLAVE, t);
  } catch {
    /* sin almacenamiento */
  }
  oyentes.forEach((f) => f());
}

/** Modo Sala (oscuro) o Modo Día (claro). Un solo valor para toda la app; se recuerda en el navegador. */
export function useTema() {
  const tema = useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => actual
  );
  return { tema, alternar: () => aplicarTema(tema === 'oscuro' ? 'claro' : 'oscuro') };
}
