/**
 * API de AUDIT LAB. Cada ruta comprueba la sesión y el rol antes de responder.
 *   /api/ingresar, /api/registro, /api/salir, /api/yo, /api/clave → todos (registro: solo crea estudiantes)
 *   /api/alumno/*, /api/academia/*, /api/avisos/*                → estudiante
 *   /api/docente/*, /api/preguntas/*                             → docente (y admin)
 *   /api/proyectos/:id/tablero, /api/clasificacion               → según acceso
 *   /api/admin/*                                                 → admin
 */
import cookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { existsSync } from 'node:fs';
import { AuditLab, ErrorApp, type Rol, type Usuario } from './db';

const COOKIE = 'auditlab_sesion';

declare module 'fastify' {
  interface FastifyRequest {
    usuario: Usuario | null;
  }
}

type Cuerpo = Record<string, unknown>;

export interface OpcionesApp {
  cookieSegura?: boolean;
  carpetaWeb?: string;
  logger?: boolean;
  /** ¿Los alumnos pueden crear su cuenta desde el login? (por defecto, sí) */
  registroAbierto?: boolean;
  /** Dominio de correo exigido en el registro (por defecto «udh.edu.pe»; null = cualquiera). */
  dominioRegistro?: string | null;
}

export function crearApp(lab: AuditLab, opciones: OpcionesApp = {}) {
  const registroAbierto = opciones.registroAbierto ?? true;
  const dominioRegistro = opciones.dominioRegistro === undefined ? 'udh.edu.pe' : opciones.dominioRegistro;
  // Freno simple contra registros masivos: hasta 10 cuentas por hora desde la misma IP.
  const registrosPorIp = new Map<string, number[]>();
  const app = Fastify({ logger: opciones.logger ?? false, disableRequestLogging: true, bodyLimit: 2_000_000 });
  app.register(cookie);
  app.decorateRequest('usuario', null);

  app.addHook('onRequest', async (req) => {
    if (req.url.startsWith('/api/')) req.usuario = lab.usuarioDeSesion(req.cookies?.[COOKIE]);
  });

  app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
    if (err instanceof ErrorApp) return reply.status(err.status).send({ error: err.message });
    if (err.statusCode && err.statusCode < 500) return reply.status(err.statusCode).send({ error: err.message });
    app.log.error(err);
    return reply.status(500).send({ error: 'Ocurrió un error en el servidor. Intenta de nuevo.' });
  });

  /** Exige sesión y, si se indica, uno de los roles. */
  const exigir =
    (...roles: Rol[]) =>
    async (req: FastifyRequest, reply: FastifyReply) => {
      if (!req.usuario) return reply.status(401).send({ error: 'Tu sesión terminó. Vuelve a ingresar.' });
      if (roles.length && !roles.includes(req.usuario.rol)) return reply.status(403).send({ error: 'No tienes permiso para ver esta sección.' });
    };
  const cuerpo = (req: FastifyRequest) => (req.body ?? {}) as Cuerpo;
  const param = (req: FastifyRequest, k = 'id') => (req.params as Record<string, string>)[k];

  const perfil = (u: Usuario) => ({ id: u.id, rol: u.rol, nombre: u.nombre, correo: u.correo, codigo: u.codigo, aulas: u.rol === 'estudiante' ? lab.aulas.delAlumno(u.id) : [] });

  // --- Sesión ---------------------------------------------------------------------------------------------------

  app.post('/api/ingresar', async (req, reply) => {
    const { correo, clave } = cuerpo(req) as { correo?: string; clave?: string };
    const { token, usuario } = lab.ingresar(correo ?? '', clave ?? '');
    reply.setCookie(COOKIE, token, { path: '/', httpOnly: true, sameSite: 'lax', secure: !!opciones.cookieSegura, maxAge: 7 * 86400 });
    return { usuario: perfil(usuario) };
  });

  app.get('/api/registro', async () => ({ abierto: registroAbierto, dominio: dominioRegistro }));

  app.post('/api/registro', async (req, reply) => {
    if (!registroAbierto) throw new ErrorApp('El registro está cerrado. Pide tu cuenta al administrador.', 403);
    const ahora = Date.now();
    const recientes = (registrosPorIp.get(req.ip) ?? []).filter((t) => ahora - t < 3600_000);
    if (recientes.length >= 10) throw new ErrorApp('Demasiados registros desde esta conexión. Intenta más tarde.', 429);
    const d = cuerpo(req) as { nombre?: string; correo?: string; clave?: string; codigoAula?: string };
    const { usuario, aula } = lab.registrarAlumno(d, dominioRegistro);
    registrosPorIp.set(req.ip, [...recientes, ahora]);
    const { token } = lab.ingresar(usuario.correo, String(d.clave ?? ''));
    reply.setCookie(COOKIE, token, { path: '/', httpOnly: true, sameSite: 'lax', secure: !!opciones.cookieSegura, maxAge: 7 * 86400 });
    return { usuario: perfil(lab.usuario(usuario.id)!), aula };
  });

  app.post('/api/salir', async (req, reply) => {
    lab.salir(req.cookies?.[COOKIE]);
    reply.clearCookie(COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/api/yo', { preHandler: exigir() }, async (req) => ({ usuario: perfil(req.usuario!) }));

  app.post('/api/clave', { preHandler: exigir() }, async (req) => {
    const { actual, nueva } = cuerpo(req) as { actual?: string; nueva?: string };
    lab.cambiarMiClave(req.usuario!.id, actual ?? '', nueva ?? '');
    return { ok: true };
  });

  app.post('/api/avisos/leer', { preHandler: exigir() }, async (req) => {
    const { id } = cuerpo(req) as { id?: string };
    lab.marcarAvisos(req.usuario!.id, id);
    return { avisos: lab.avisos(req.usuario!.id) };
  });

  app.get('/api/clasificacion', { preHandler: exigir() }, async (req) => {
    const { tipo, aula } = req.query as { tipo?: 'misiones' | 'academia'; aula?: string };
    return lab.clasificacion(req.usuario!, { tipo, aulaId: aula || null });
  });

  // --- Estudiante -----------------------------------------------------------------------------------------------

  app.get('/api/alumno/estado', { preHandler: exigir('estudiante') }, async (req) => lab.estadoAlumno(req.usuario!.id));
  app.post('/api/alumno/resultados', { preHandler: exigir('estudiante') }, async (req) => lab.registrarResultado(req.usuario!.id, (cuerpo(req) as { resultado: never }).resultado));

  app.post('/api/alumno/aulas/unirse', { preHandler: exigir('estudiante') }, async (req) => {
    const a = lab.aulas.unirse(req.usuario!.id, (cuerpo(req) as { codigo?: string }).codigo ?? '');
    return { aula: { id: a.id, nombre: a.nombre, docente: a.docente }, aulas: lab.aulas.delAlumno(req.usuario!.id) };
  });

  app.get('/api/alumno/proyectos', { preHandler: exigir('estudiante') }, async (req) => ({ proyectos: lab.proyectos.delAlumno(req.usuario!.id) }));
  app.get('/api/alumno/proyectos/:id', { preHandler: exigir('estudiante') }, async (req) => lab.proyectos.paraAlumno(req.usuario!, param(req)));
  app.post('/api/alumno/proyectos/:id/entregar', { preHandler: exigir('estudiante') }, async (req) =>
    lab.proyectos.entregar(req.usuario!, param(req), (cuerpo(req) as { respuestas: never }).respuestas)
  );

  // Academia
  app.get('/api/academia', { preHandler: exigir('estudiante') }, async (req) => lab.academia.progreso(req.usuario!.id));
  app.get('/api/academia/lecciones/:id', { preHandler: exigir('estudiante') }, async (req) => lab.academia.leccionParaJugar(req.usuario!.id, param(req)));
  app.post('/api/academia/lecciones/:id', { preHandler: exigir('estudiante') }, async (req) => {
    const { respuestas, segundos } = cuerpo(req) as { respuestas: never; segundos?: number };
    return lab.academia.registrarLeccion(req.usuario!.id, param(req), respuestas, segundos ?? 0);
  });
  app.get('/api/academia/contrarreloj', { preHandler: exigir('estudiante') }, async (req) => lab.academia.contrarreloj(req.usuario!.id));
  app.post('/api/academia/contrarreloj', { preHandler: exigir('estudiante') }, async (req) =>
    lab.academia.registrarContrarreloj(req.usuario!.id, (cuerpo(req) as { respuestas: never }).respuestas)
  );
  app.get('/api/academia/repaso', { preHandler: exigir('estudiante') }, async (req) => lab.academia.repaso(req.usuario!.id));
  app.post('/api/academia/repaso', { preHandler: exigir('estudiante') }, async (req) => lab.academia.registrarRepaso(req.usuario!.id, (cuerpo(req) as { respuestas: never }).respuestas));

  // --- Docente: aulas y seguimiento ------------------------------------------------------------------------------

  app.get('/api/docente/aulas', { preHandler: exigir('docente', 'admin') }, async (req) => ({
    aulas: req.usuario!.rol === 'admin' ? lab.aulas.todas() : lab.aulas.deDocente(req.usuario!.id),
  }));

  app.post('/api/docente/aulas', { preHandler: exigir('docente') }, async (req) => ({ aula: lab.aulas.crear(req.usuario!.id, (cuerpo(req) as { nombre?: string }).nombre ?? '') }));

  app.patch('/api/docente/aulas/:id', { preHandler: exigir('docente', 'admin') }, async (req) => {
    lab.aulas.exigirAcceso(req.usuario!, param(req), true);
    return { aula: lab.aulas.actualizar(param(req), cuerpo(req) as never) };
  });

  app.get('/api/docente/aulas/:id', { preHandler: exigir('docente', 'admin') }, async (req) => {
    const aula = lab.aulas.exigirAcceso(req.usuario!, param(req), true);
    const filas = lab.aulas.filasAlumnos(aula.id);
    const seg = lab.academia.seguimiento(filas.map((f) => f.id));
    const porId = new Map(filas.map((f) => [f.id, f]));
    return {
      aula,
      ...seg,
      alumnos: seg.alumnos.map((a) => {
        const f = porId.get(a.id)!;
        return { ...a, nombre: f.nombre, correo: f.correo, codigo: f.codigo, activo: f.activo === 1, ultimoAcceso: f.ultimo_acceso };
      }),
      proyectos: lab.proyectos.deDocente(req.usuario!).filter((p) => p.aulaId === aula.id),
      misiones: lab.misionesDeAlumnos(filas.map((f) => f.id)),
      preguntasPropias: lab.academia.banco(req.usuario!).filter((p) => p.alcance === 'aula' && (!p.aulaId || p.aulaId === aula.id) && p.autorId === aula.docenteId).length,
    };
  });

  /** Misiones de los alumnos del docente (por aula). El admin ve la clasificación general aparte. */
  app.get('/api/docente/misiones', { preHandler: exigir('docente', 'admin') }, async (req) => {
    const u = req.usuario!;
    const aulas = u.rol === 'admin' ? lab.aulas.todas() : lab.aulas.deDocente(u.id);
    const { aula } = req.query as { aula?: string };
    const elegida = aulas.find((a) => a.id === aula) ?? aulas.find((a) => !a.archivada) ?? aulas[0] ?? null;
    if (!elegida) return { aulas: [], aula: null, misiones: [] };
    const ids = lab.aulas.filasAlumnos(elegida.id).map((f) => f.id);
    return { aulas: aulas.map((a) => ({ id: a.id, nombre: a.nombre, alumnos: a.alumnos, archivada: a.archivada })), aula: { id: elegida.id, nombre: elegida.nombre }, misiones: lab.misionesDeAlumnos(ids) };
  });

  app.delete('/api/docente/aulas/:id/alumnos/:alumno', { preHandler: exigir('docente', 'admin') }, async (req) => {
    lab.aulas.exigirAcceso(req.usuario!, param(req), true);
    lab.aulas.quitarAlumno(param(req), param(req, 'alumno'));
    return { ok: true };
  });

  app.get('/api/docente/alumnos/:id', { preHandler: exigir('docente', 'admin') }, async (req) => {
    const u = req.usuario!;
    const alumno = lab.usuario(param(req));
    if (!alumno || alumno.rol !== 'estudiante') throw new ErrorApp('Alumno no encontrado.', 404);
    const aulas = lab.aulas.delAlumno(alumno.id);
    if (u.rol === 'docente' && !lab.aulas.deDocente(u.id).some((a) => aulas.some((x) => x.id === a.id))) throw new ErrorApp('Este alumno no está en tus aulas.', 403);
    const e = lab.estadoAlumno(alumno.id);
    return {
      alumno: { ...alumno, aulas },
      xp: e.xp,
      nivel: e.nivel,
      racha: e.racha,
      insignias: e.insignias,
      academia: lab.academia.detalleAlumno(alumno.id),
      misiones: { ...lab.resumenMisiones(alumno.id), mejores: e.mejores },
    };
  });

  // --- Banco de preguntas ---------------------------------------------------------------------------------------

  app.get('/api/preguntas', { preHandler: exigir('docente', 'admin') }, async (req) => ({ preguntas: lab.academia.banco(req.usuario!) }));
  app.post('/api/preguntas', { preHandler: exigir('docente', 'admin') }, async (req) => ({ pregunta: lab.academia.crearPregunta(req.usuario!, cuerpo(req) as never) }));
  app.put('/api/preguntas/:id', { preHandler: exigir('docente', 'admin') }, async (req) => ({ pregunta: lab.academia.actualizarPregunta(req.usuario!, param(req), cuerpo(req) as never) }));
  app.post('/api/preguntas/:id/estado', { preHandler: exigir('docente', 'admin') }, async (req) => {
    lab.academia.cambiarEstado(req.usuario!, param(req), !!(cuerpo(req) as { activo?: boolean }).activo);
    return { ok: true };
  });
  app.post('/api/preguntas/:id/restaurar', { preHandler: exigir('docente', 'admin') }, async (req) => ({ pregunta: lab.academia.restaurar(req.usuario!, param(req)) }));
  app.delete('/api/preguntas/:id', { preHandler: exigir('docente', 'admin') }, async (req) => {
    lab.academia.eliminar(req.usuario!, param(req));
    return { ok: true };
  });

  // --- Proyectos por equipos -------------------------------------------------------------------------------------

  app.get('/api/docente/proyectos', { preHandler: exigir('docente', 'admin') }, async (req) => ({ proyectos: lab.proyectos.deDocente(req.usuario!) }));
  app.post('/api/docente/proyectos', { preHandler: exigir('docente') }, async (req) => lab.proyectos.crear(req.usuario!, cuerpo(req) as never));
  app.get('/api/docente/proyectos/:id', { preHandler: exigir('docente', 'admin') }, async (req) => lab.proyectos.detalleDocente(req.usuario!, param(req)));
  app.put('/api/docente/proyectos/:id', { preHandler: exigir('docente', 'admin') }, async (req) => lab.proyectos.actualizar(req.usuario!, param(req), cuerpo(req) as never));
  app.delete('/api/docente/proyectos/:id', { preHandler: exigir('docente', 'admin') }, async (req) => {
    lab.proyectos.eliminar(req.usuario!, param(req));
    return { ok: true };
  });
  app.post('/api/docente/proyectos/:id/accion', { preHandler: exigir('docente', 'admin') }, async (req) =>
    lab.proyectos.accion(req.usuario!, param(req), (cuerpo(req) as { accion: never }).accion)
  );
  app.get('/api/proyectos/:id/tablero', { preHandler: exigir() }, async (req) => lab.proyectos.tablero(req.usuario!, param(req)));

  // --- Administración -------------------------------------------------------------------------------------------

  app.get('/api/admin/resumen', { preHandler: exigir('admin') }, async () => lab.resumenAdmin());
  app.get('/api/admin/usuarios', { preHandler: exigir('admin') }, async () => ({ usuarios: lab.listarUsuarios(), aulas: lab.aulas.todas() }));
  app.post('/api/admin/usuarios', { preHandler: exigir('admin') }, async (req) => {
    const r = lab.crearUsuario(cuerpo(req) as never);
    return { usuario: r.usuario, clave: r.clave };
  });
  app.post('/api/admin/usuarios/lote', { preHandler: exigir('admin') }, async (req) => lab.crearLote(cuerpo(req) as never));
  app.patch('/api/admin/usuarios/:id', { preHandler: exigir('admin') }, async (req) => ({ usuario: lab.actualizarUsuario(param(req), cuerpo(req) as never, req.usuario!.id) }));
  app.post('/api/admin/usuarios/:id/clave', { preHandler: exigir('admin') }, async (req) => ({ clave: lab.fijarClave(param(req), (cuerpo(req) as { clave?: string }).clave) }));
  app.post('/api/admin/usuarios/:id/aula', { preHandler: exigir('admin') }, async (req) => {
    const { aulaId, quitar } = cuerpo(req) as { aulaId?: string; quitar?: boolean };
    if (!aulaId || !lab.aulas.aula(aulaId)) throw new ErrorApp('Aula no encontrada.', 404);
    if (quitar) lab.aulas.quitarAlumno(aulaId, param(req));
    else lab.aulas.agregarAlumno(aulaId, param(req));
    return { aulas: lab.aulas.delAlumno(param(req)) };
  });
  app.delete('/api/admin/usuarios/:id', { preHandler: exigir('admin') }, async (req) => {
    lab.eliminarUsuario(param(req), req.usuario!.id);
    return { ok: true };
  });

  app.all('/api/*', async (_req, reply) => reply.status(404).send({ error: 'Ruta no encontrada.' }));

  // --- Sitio ya compilado (npm run build && npm start) ----------------------------------------------------------

  if (opciones.carpetaWeb && existsSync(opciones.carpetaWeb)) {
    app.register(fastifyStatic, { root: opciones.carpetaWeb, wildcard: false });
    app.setNotFoundHandler((req, reply) => {
      if (req.method === 'GET' && !req.url.startsWith('/api/')) return reply.sendFile('index.html');
      return reply.status(404).send({ error: 'Ruta no encontrada.' });
    });
  }

  return app;
}
