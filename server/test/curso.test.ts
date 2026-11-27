import { test, expect } from 'vitest';
import { PREGUNTAS_BASE, LECCIONES } from '../../src/data/academiaCurso';
import { validarPregunta, calificar, valorCampo, totalesCorrectos, plantillaComprobante } from '../../src/lib/preguntas';
test('preguntas base válidas', () => {
  const ids = new Set();
  for (const p of PREGUNTAS_BASE) {
    expect(validarPregunta(p), p.id).toBeNull();
    expect(ids.has(p.id)).toBe(false); ids.add(p.id);
    expect(LECCIONES.some(l => l.id === p.leccionId), p.id).toBe(true);
    if (p.tipo === 'documento') for (const e of p.errores) expect(valorCampo(p.documento, e), p.id+e).not.toBe('');
  }
  for (const l of LECCIONES) console.log(l.id, PREGUNTAS_BASE.filter(p=>p.leccionId===l.id).length);


});
