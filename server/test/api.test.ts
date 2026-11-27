import { beforeEach, describe, expect, it } from 'vitest';
import { LECCIONES } from '../../src/data/academiaCurso';
import { crearApp } from '../app';
import { AuditLab } from '../db';
import { respuestaCorrecta, respuestaIncorrecta, simularIntento } from '../simular';

let lab: AuditLab;
let app: ReturnType<typeof crearApp>;
let reloj: Date | null = null;

/** Cliente con su propia cookie de sesión. */
async function cliente(correo: string, clave: string) {
  const r = await app.inject({ method: 'POST', url: '/api/ingresar', payload: { correo, clave } });
  expect(r.statusCode, r.body).toBe(200);
  const cookie = String(r.headers['set-cookie']).split(';')[0];
  return (method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', url: string, payload?: object) => app.inject({ method, url, payload, headers: { cookie } });
}

beforeEach(() => {
  reloj = null;
  lab = new AuditLab({ ruta: ':memory:', ahora: () => reloj ?? new Date() });
  app = crearApp(lab);
  lab.fijarAdmin('admin@udh.edu.pe', 'clave-admin-1');
});

/** Docente con su aula y dos alumnos unidos con el código. */
async function preparar() {
  lab.crearUsuario({ rol: 'docente', nombre: 'Rosa Albornoz', correo: 'rosa@udh.edu.pe', clave: 'docente-123' });
  lab.crearUsuario({ rol: 'estudiante', nombre: 'Valeria Mendoza', correo: 'vale@udh.edu.pe', clave: 'alumno-123' });
  lab.crearUsuario({ rol: 'estudiante', nombre: 'Diego Santamaría', correo: 'diego@udh.edu.pe', clave: 'alumno-123' });
  lab.crearUsuario({ rol: 'estudiante', nombre: 'Otro Alumno', correo: 'otro@udh.edu.pe', clave: 'alumno-123' });
  const docente = await cliente('rosa@udh.edu.pe', 'docente-123');
  const vale = await cliente('vale@udh.edu.pe', 'alumno-123');
  const diego = await cliente('diego@udh.edu.pe', 'alumno-123');
  const otro = await cliente('otro@udh.edu.pe', 'alumno-123');
  const { aula } = (await docente('POST', '/api/docente/aulas', { nombre: 'Auditoría – Sección A' })).json();
  expect(aula.codigo).toMatch(/^AUD-[A-Z2-9]{4}$/);
  expect((await vale('POST', '/api/alumno/aulas/unirse', { codigo: aula.codigo.toLowerCase().replace('-', '') })).statusCode).toBe(200);
  expect((await diego('POST', '/api/alumno/aulas/unirse', { codigo: aula.codigo })).statusCode).toBe(200);
  const id = (correo: string) => (lab.db.prepare('SELECT id FROM usuarios WHERE correo = ?').get(correo) as { id: string }).id;
  return { docente, vale, diego, otro, aula, ids: { vale: id('vale@udh.edu.pe'), diego: id('diego@udh.edu.pe'), otro: id('otro@udh.edu.pe') } };
}

/** Juega una lección respondiendo bien las primeras `buenas` preguntas. */
async function jugar(c: Awaited<ReturnType<typeof cliente>>, leccionId: string, buenas = 99) {
  const { preguntas } = (await c('GET', `/api/academia/lecciones/${leccionId}`)).json();
  const respuestas = preguntas.map((p: never, i: number) => ({ preguntaId: (p as { id: string }).id, respuesta: i < buenas ? respuestaCorrecta(p) : respuestaIncorrecta(p) }));
  return (await c('POST', `/api/academia/lecciones/${leccionId}`, { respuestas, segundos: 90 })).json();
}

describe('sesión y roles', () => {
  it('rechaza una contraseña incorrecta y protege las rutas', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/ingresar', payload: { correo: 'admin@udh.edu.pe', clave: 'mala-clave' } })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/api/yo' })).statusCode).toBe(401);
  });

  it('cada rol solo entra a lo suyo', async () => {
    const { docente, vale } = await preparar();
    expect((await docente('GET', '/api/admin/usuarios')).statusCode).toBe(403);
    expect((await docente('GET', '/api/academia')).statusCode).toBe(403);
    expect((await vale('GET', '/api/preguntas')).statusCode).toBe(403);
    expect((await vale('GET', '/api/yo')).json().usuario.aulas[0].nombre).toBe('Auditoría – Sección A');
  });

  it('el admin crea cuentas en lote y las agrega a un aula', async () => {
    const { aula } = await preparar();
    const admin = await cliente('admin@udh.edu.pe', 'clave-admin-1');
    const r = (await admin('POST', '/api/admin/usuarios/lote', { rol: 'estudiante', aulaId: aula.id, texto: 'Ana Pérez, ana@udh.edu.pe, 2024110001\nsin correo' })).json();
    expect(r.creados).toHaveLength(1);
    expect(r.errores[0].linea).toBe(2);
    expect(lab.aulas.aula(aula.id)!.alumnos).toBe(3);
  });
});

describe('aulas', () => {
  it('rechaza códigos inválidos o repetidos y el docente solo ve sus aulas', async () => {
    const { vale, aula, docente, ids } = await preparar();
    expect((await vale('POST', '/api/alumno/aulas/unirse', { codigo: 'AUD-XXXX' })).statusCode).toBe(404);
    expect((await vale('POST', '/api/alumno/aulas/unirse', { codigo: aula.codigo })).statusCode).toBe(400);
    lab.crearUsuario({ rol: 'docente', nombre: 'Otro Docente', correo: 'otro.doc@udh.edu.pe', clave: 'docente-123' });
    const otroDoc = await cliente('otro.doc@udh.edu.pe', 'docente-123');
    expect((await otroDoc('GET', `/api/docente/aulas/${aula.id}`)).statusCode).toBe(403);
    expect((await otroDoc('GET', `/api/docente/alumnos/${ids.vale}`)).statusCode).toBe(403);
    expect((await docente('GET', `/api/docente/alumnos/${ids.vale}`)).statusCode).toBe(200);
  });

  it('migra el docente asignado del modelo anterior a un aula', () => {
    const d = lab.crearUsuario({ rol: 'docente', nombre: 'Doc Antiguo', correo: 'antiguo@udh.edu.pe', clave: 'docente-123' }).usuario;
    const a = lab.crearUsuario({ rol: 'estudiante', nombre: 'Alumno Antiguo', correo: 'al@udh.edu.pe', clave: 'alumno-123' }).usuario;
    lab.db.prepare('UPDATE usuarios SET docente_id = ? WHERE id = ?').run(d.id, a.id);
    // Al volver a abrir la base, se crea el aula y se une al alumno.
    const nuevo = Object.create(AuditLab.prototype) as AuditLab;
    void nuevo;
    const aulas = new (lab.aulas.constructor as new (l: AuditLab) => typeof lab.aulas)(lab);
    expect(aulas.deDocente(d.id)).toHaveLength(1);
    expect(aulas.delAlumno(a.id)[0].nombre).toBe('Aula de Doc Antiguo');
  });
});

describe('academia', () => {
  it('desbloquea lecciones en orden, da estrellas y XP del mejor intento', async () => {
    const { vale } = await preparar();
    expect((await vale('GET', `/api/academia/lecciones/${LECCIONES[1].id}`)).statusCode).toBe(403);
    const r1 = await jugar(vale, LECCIONES[0].id, 99);
    expect(r1.completada).toBe(true);
    expect(r1.estrellas).toBe(3);
    expect(r1.xpGanado).toBe(r1.xp);
    expect(r1.siguiente).toBe(LECCIONES[1].id);
    const r2 = await jugar(vale, LECCIONES[0].id, 99);
    expect(r2.xpGanado).toBe(0);
    expect((await vale('GET', `/api/academia/lecciones/${LECCIONES[1].id}`)).statusCode).toBe(200);
    const prog = (await vale('GET', '/api/academia')).json();
    expect(prog.lecciones[LECCIONES[0].id].estrellas).toBe(3);
    expect((await vale('GET', '/api/alumno/estado')).json().insignias.map((i: { id: string }) => i.id)).toContain('badge-sin-observaciones');
  });

  it('con 3 errores la lección no se aprueba y las falladas pasan a repaso', async () => {
    const { vale } = await preparar();
    const r = await jugar(vale, LECCIONES[0].id, 0);
    expect(r.completada).toBe(false);
    expect(r.xp).toBe(0);
    const { preguntas } = (await vale('GET', '/api/academia/repaso')).json();
    expect(preguntas.length).toBe(r.total);
    const rep = (await vale('POST', '/api/academia/repaso', { respuestas: preguntas.map((p: never) => ({ preguntaId: (p as { id: string }).id, respuesta: respuestaCorrecta(p) })) })).json();
    expect(rep.pendientes).toBe(0);
  });

  it('el docente edita el banco y ve el seguimiento de su aula', async () => {
    const { vale, docente, aula } = await preparar();
    const nueva = {
      leccionId: LECCIONES[0].id,
      tipo: 'vf',
      enunciado: 'La boleta permite usar crédito fiscal.',
      explicacion: 'No, la boleta es para consumidores finales.',
      correcta: false,
    };
    const { pregunta } = (await docente('POST', '/api/preguntas', nueva)).json();
    expect(pregunta.autor).toBe('Rosa Albornoz');
    expect((await docente('POST', '/api/preguntas', { ...nueva, enunciado: '' })).statusCode).toBe(400);
    const editada = (await docente('PUT', '/api/preguntas/b-m1-02', { ...nueva, leccionId: LECCIONES[0].id, enunciado: 'Editada', correcta: true })).json().pregunta;
    expect(editada.editada).toBe(true);
    expect((await docente('POST', '/api/preguntas/b-m1-02/restaurar')).json().pregunta.editada).toBe(false);
    expect((await docente('DELETE', '/api/preguntas/b-m1-01')).statusCode).toBe(400);

    await jugar(vale, LECCIONES[0].id, 2);
    const seg = (await docente('GET', `/api/docente/aulas/${aula.id}`)).json();
    expect(seg.alumnos).toHaveLength(2);
    expect(seg.alumnos.find((a: { nombre: string }) => a.nombre === 'Valeria Mendoza').precision).not.toBeNull();
    expect(seg.dominio[0].respuestas).toBeGreaterThan(0);
  });

  it('la clasificación de la Academia es por aula y la de misiones es general', async () => {
    const { vale, diego, otro } = await preparar();
    await jugar(diego, LECCIONES[0].id);
    await otro('POST', '/api/alumno/resultados', { resultado: simularIntento('mision-01', 1, () => 0.1) });
    const ac = (await vale('GET', '/api/clasificacion?tipo=academia')).json();
    expect(ac.puestos.map((p: { nombre: string }) => p.nombre)).toEqual(['Diego Santamaría', 'Valeria Mendoza']);
    const mi = (await vale('GET', '/api/clasificacion?tipo=misiones')).json();
    expect(mi.puestos[0].nombre).toBe('Otro Alumno');
    expect(mi.puestos).toHaveLength(3);
  });
});

describe('proyectos por equipos', () => {
  async function proyecto() {
    const p = await preparar();
    const datos = {
      aulaId: p.aula.id,
      nombre: 'Reto IGV',
      duracionMin: 10,
      preguntas: ['b-m1-06', 'b-m2-01', 'b-m3-06'],
      equipos: [
        { nombre: 'Turquesa', miembros: [p.ids.vale] },
        { nombre: 'Ámbar', miembros: [p.ids.diego] },
      ],
    };
    expect((await p.docente('POST', '/api/docente/proyectos', { ...datos, equipos: [{ nombre: 'X', miembros: [p.ids.otro] }, datos.equipos[0]] })).statusCode).toBe(400);
    const creado = (await p.docente('POST', '/api/docente/proyectos', datos)).json();
    return { ...p, proyectoId: creado.id as string };
  }

  it('oculta las respuestas mientras se juega y gana el que acierta más; si empatan, el más rápido', async () => {
    const { docente, vale, diego, proyectoId } = await proyecto();
    expect((await vale('POST', `/api/alumno/proyectos/${proyectoId}/entregar`, { respuestas: [] })).statusCode).toBe(400);
    await docente('POST', `/api/docente/proyectos/${proyectoId}/accion`, { accion: 'abrir' });
    expect((await vale('GET', `/api/alumno/proyectos/${proyectoId}`)).json().preguntasJuego).toHaveLength(0);
    const t0 = new Date();
    reloj = t0;
    await docente('POST', `/api/docente/proyectos/${proyectoId}/accion`, { accion: 'iniciar' });
    const juego = (await vale('GET', `/api/alumno/proyectos/${proyectoId}`)).json();
    expect(juego.preguntasJuego).toHaveLength(3);
    const doc = juego.preguntasJuego.find((p: { tipo: string }) => p.tipo === 'documento');
    expect(doc.errores).toEqual([]);
    expect(doc.explicacion).toBe('');

    const preguntas = lab.proyectos.detalleDocente(lab.usuario(lab.aulas.aula(juego.aulaId)!.docenteId)!, proyectoId).preguntasCompletas;
    const todas = preguntas.map((p) => ({ preguntaId: p.id, respuesta: respuestaCorrecta(p) }));
    reloj = new Date(t0.getTime() + 300_000);
    const e1 = (await diego('POST', `/api/alumno/proyectos/${proyectoId}/entregar`, { respuestas: todas })).json();
    expect(e1.entrega.aciertos).toBe(3);
    expect(e1.entrega.segundos).toBe(300);
    expect((await diego('POST', `/api/alumno/proyectos/${proyectoId}/entregar`, { respuestas: todas })).statusCode).toBe(409);
    reloj = new Date(t0.getTime() + 200_000);
    await vale('POST', `/api/alumno/proyectos/${proyectoId}/entregar`, { respuestas: todas });
    const tablero = (await docente('GET', `/api/proyectos/${proyectoId}/tablero`)).json();
    expect(tablero.estado).toBe('finalizado');
    expect(tablero.equipos.map((e: { nombre: string }) => e.nombre)).toEqual(['Turquesa', 'Ámbar']);
    const final = (await vale('GET', `/api/alumno/proyectos/${proyectoId}`)).json();
    expect(final.entrega.detalle).toHaveLength(3);
    expect(final.preguntasJuego[0].explicacion).not.toBe('');
  });

  it('se cierra solo cuando se acaba el tiempo', async () => {
    const { docente, vale, proyectoId } = await proyecto();
    const t0 = new Date();
    reloj = t0;
    await docente('POST', `/api/docente/proyectos/${proyectoId}/accion`, { accion: 'iniciar' });
    reloj = new Date(t0.getTime() + 11 * 60_000);
    expect((await vale('GET', `/api/proyectos/${proyectoId}/tablero`)).json().estado).toBe('finalizado');
    expect((await vale('POST', `/api/alumno/proyectos/${proyectoId}/entregar`, { respuestas: [] })).statusCode).toBe(400);
  });
});
