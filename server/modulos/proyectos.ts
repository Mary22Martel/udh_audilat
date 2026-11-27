/**
 * Proyectos por equipos: el docente arma un reto con preguntas y casos de comprobantes, forma equipos
 * y lo juega en vivo. Gana el equipo con más aciertos; si empatan, el que entregó antes.
 *
 * Estados: preparacion → sala (equipos ven la sala de espera) → en_curso → finalizado.
 */
import { randomUUID } from 'node:crypto';
import { calificar, sinRespuestas, type Pregunta } from '../../src/lib/preguntas';
import { ErrorApp, type AuditLab, type Usuario } from '../db';
import type { RespuestaEnviada } from './academia';

export type EstadoProyecto = 'preparacion' | 'sala' | 'en_curso' | 'finalizado';

export const COLORES_EQUIPO = ['#48a6a7', '#f2b632', '#e4572e', '#8e7dbe', '#3fa34d', '#2d7dd2', '#d1495b', '#6c757d'];
export const NOMBRES_EQUIPO = ['Equipo Turquesa', 'Equipo Ámbar', 'Equipo Coral', 'Equipo Lavanda', 'Equipo Esmeralda', 'Equipo Zafiro', 'Equipo Granate', 'Equipo Grafito'];
const GRACIA_MS = 10_000;

interface FilaProyecto {
  id: string;
  docente_id: string;
  aula_id: string;
  nombre: string;
  descripcion: string;
  duracion_min: number;
  estado: EstadoProyecto;
  preguntas: string;
  inicio: string | null;
  fin: string | null;
  creado: string;
}

export interface DatosProyecto {
  aulaId: string;
  nombre: string;
  descripcion?: string;
  duracionMin: number;
  preguntas: string[];
  equipos: { nombre: string; color?: string; miembros: string[] }[];
}

export class Proyectos {
  constructor(private lab: AuditLab) {
    lab.db.exec(`
      CREATE TABLE IF NOT EXISTS proyectos (
        id TEXT PRIMARY KEY,
        docente_id TEXT NOT NULL REFERENCES usuarios(id),
        aula_id TEXT NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
        nombre TEXT NOT NULL,
        descripcion TEXT NOT NULL DEFAULT '',
        duracion_min INTEGER NOT NULL,
        estado TEXT NOT NULL DEFAULT 'preparacion',
        preguntas TEXT NOT NULL,
        inicio TEXT,
        fin TEXT,
        creado TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS equipos (
        id TEXT PRIMARY KEY,
        proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
        nombre TEXT NOT NULL,
        color TEXT NOT NULL,
        orden INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS equipo_miembros (
        equipo_id TEXT NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
        alumno_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        PRIMARY KEY (equipo_id, alumno_id)
      );
      CREATE TABLE IF NOT EXISTS entregas (
        id TEXT PRIMARY KEY,
        proyecto_id TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
        equipo_id TEXT NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
        alumno_id TEXT NOT NULL REFERENCES usuarios(id),
        respuestas TEXT NOT NULL,
        detalle TEXT NOT NULL,
        aciertos INTEGER NOT NULL,
        total INTEGER NOT NULL,
        segundos INTEGER NOT NULL,
        enviado TEXT NOT NULL,
        UNIQUE (proyecto_id, equipo_id)
      );
    `);
  }

  private fila(id: string): FilaProyecto {
    const f = this.lab.db.prepare('SELECT * FROM proyectos WHERE id = ?').get(id) as FilaProyecto | undefined;
    if (!f) throw new ErrorApp('Proyecto no encontrado.', 404);
    return this.refrescar(f);
  }

  /** Si el tiempo terminó, el proyecto se cierra solo. */
  private refrescar(f: FilaProyecto): FilaProyecto {
    if (f.estado === 'en_curso' && f.fin && this.lab.ahora().getTime() > new Date(f.fin).getTime() + GRACIA_MS) {
      this.cerrar(f.id);
      return { ...f, estado: 'finalizado' };
    }
    return f;
  }

  private cerrar(id: string) {
    this.lab.db.prepare("UPDATE proyectos SET estado = 'finalizado' WHERE id = ? AND estado != 'finalizado'").run(id);
    const f = this.lab.db.prepare('SELECT * FROM proyectos WHERE id = ?').get(id) as unknown as FilaProyecto;
    const tabla = this.clasificar(id);
    for (const eq of tabla)
      for (const m of eq.miembros)
        this.lab.avisar(m.id, {
          tipo: 'proyecto',
          titulo: `Terminó «${f.nombre}»: ${eq.puesto === 1 ? '¡tu equipo ganó!' : `tu equipo quedó en el puesto ${eq.puesto}`}`,
          texto: eq.entregado ? `${eq.aciertos} de ${eq.total} aciertos.` : 'Tu equipo no llegó a entregar.',
          enlace: `/app/proyectos/${id}`,
        });
  }

  private preguntasDe(f: FilaProyecto): Pregunta[] {
    return (JSON.parse(f.preguntas) as string[]).map((id) => this.lab.academia.pregunta(id)).filter((p): p is Pregunta => !!p);
  }

  equipos(proyectoId: string) {
    const eqs = this.lab.db.prepare('SELECT * FROM equipos WHERE proyecto_id = ? ORDER BY orden').all(proyectoId) as { id: string; nombre: string; color: string; orden: number }[];
    return eqs.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      color: e.color,
      miembros: this.lab.db
        .prepare('SELECT u.id, u.nombre FROM equipo_miembros m JOIN usuarios u ON u.id = m.alumno_id WHERE m.equipo_id = ? ORDER BY u.nombre')
        .all(e.id) as { id: string; nombre: string }[],
    }));
  }

  private resumen(f: FilaProyecto) {
    const aula = this.lab.aulas.aula(f.aula_id);
    const entregas = (this.lab.db.prepare('SELECT COUNT(*) AS n FROM entregas WHERE proyecto_id = ?').get(f.id) as { n: number }).n;
    const equipos = this.equipos(f.id);
    return {
      id: f.id,
      nombre: f.nombre,
      descripcion: f.descripcion,
      aulaId: f.aula_id,
      aula: aula?.nombre ?? '',
      docente: aula?.docente ?? '',
      duracionMin: f.duracion_min,
      estado: f.estado,
      inicio: f.inicio,
      fin: f.fin,
      creado: f.creado,
      preguntas: (JSON.parse(f.preguntas) as string[]).length,
      equipos: equipos.length,
      entregas,
      ganador: f.estado === 'finalizado' ? (this.clasificar(f.id)[0]?.nombre ?? null) : null,
    };
  }

  deDocente(u: Usuario) {
    const filas = (
      u.rol === 'admin'
        ? this.lab.db.prepare('SELECT * FROM proyectos ORDER BY creado DESC').all()
        : this.lab.db.prepare('SELECT * FROM proyectos WHERE docente_id = ? ORDER BY creado DESC').all(u.id)
    ) as unknown as FilaProyecto[];
    return filas.map((f) => this.resumen(this.refrescar(f)));
  }

  delAlumno(alumnoId: string) {
    const filas = this.lab.db
      .prepare(
        `SELECT DISTINCT p.* FROM proyectos p JOIN equipos e ON e.proyecto_id = p.id JOIN equipo_miembros m ON m.equipo_id = e.id
         WHERE m.alumno_id = ? AND p.estado != 'preparacion' ORDER BY p.creado DESC`
      )
      .all(alumnoId) as unknown as FilaProyecto[];
    return filas.map((f) => {
      const r = this.resumen(this.refrescar(f));
      const eq = this.equipoDe(f.id, alumnoId);
      return { ...r, miEquipo: eq ? { id: eq.id, nombre: eq.nombre, color: eq.color } : null };
    });
  }

  contar() {
    const r = this.lab.db.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN estado = 'finalizado' THEN 1 ELSE 0 END) AS fin FROM proyectos").get() as { n: number; fin: number | null };
    return { total: r.n, finalizados: r.fin ?? 0 };
  }

  private exigirDueno(u: Usuario, f: FilaProyecto) {
    if (u.rol === 'admin' || f.docente_id === u.id) return;
    throw new ErrorApp('Este proyecto no es tuyo.', 403);
  }

  private validar(u: Usuario, d: DatosProyecto) {
    const nombre = String(d.nombre ?? '').trim();
    if (nombre.length < 3) throw new ErrorApp('Ponle un nombre al proyecto.');
    const aula = this.lab.aulas.exigirAcceso(u, d.aulaId, true);
    const dur = Math.round(Number(d.duracionMin));
    if (!(dur >= 1 && dur <= 180)) throw new ErrorApp('La duración debe estar entre 1 y 180 minutos.');
    const preguntas = [...new Set(d.preguntas ?? [])];
    if (!preguntas.length) throw new ErrorApp('Agrega al menos una pregunta o caso.');
    for (const id of preguntas) if (!this.lab.academia.pregunta(id)) throw new ErrorApp('Una de las preguntas ya no existe.');
    const equipos = (d.equipos ?? []).filter((e) => e.miembros?.length);
    if (equipos.length < 2) throw new ErrorApp('Forma al menos dos equipos con integrantes.');
    const vistos = new Set<string>();
    for (const e of equipos)
      for (const m of e.miembros) {
        if (!this.lab.aulas.esMiembro(aula.id, m)) throw new ErrorApp('Un integrante no pertenece al aula.');
        if (vistos.has(m)) throw new ErrorApp('Un alumno está en dos equipos.');
        vistos.add(m);
      }
    return { nombre, aula, dur, preguntas, equipos };
  }

  private guardarEquipos(proyectoId: string, equipos: DatosProyecto['equipos']) {
    this.lab.db.prepare('DELETE FROM equipos WHERE proyecto_id = ?').run(proyectoId);
    equipos.forEach((e, i) => {
      const id = randomUUID();
      this.lab.db
        .prepare('INSERT INTO equipos (id, proyecto_id, nombre, color, orden) VALUES (?, ?, ?, ?, ?)')
        .run(id, proyectoId, String(e.nombre || NOMBRES_EQUIPO[i % NOMBRES_EQUIPO.length]).trim(), e.color || COLORES_EQUIPO[i % COLORES_EQUIPO.length], i);
      for (const m of e.miembros) this.lab.db.prepare('INSERT INTO equipo_miembros (equipo_id, alumno_id) VALUES (?, ?)').run(id, m);
    });
  }

  crear(u: Usuario, d: DatosProyecto) {
    const v = this.validar(u, d);
    const id = randomUUID();
    this.lab.db
      .prepare('INSERT INTO proyectos (id, docente_id, aula_id, nombre, descripcion, duracion_min, preguntas, creado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, v.aula.docenteId, v.aula.id, v.nombre, String(d.descripcion ?? '').trim(), v.dur, JSON.stringify(v.preguntas), this.lab.iso());
    this.guardarEquipos(id, v.equipos);
    return this.detalleDocente(u, id);
  }

  actualizar(u: Usuario, id: string, d: DatosProyecto) {
    const f = this.fila(id);
    this.exigirDueno(u, f);
    if (f.estado !== 'preparacion') throw new ErrorApp('Solo puedes editar un proyecto antes de abrir la sala.');
    const v = this.validar(u, d);
    this.lab.db
      .prepare('UPDATE proyectos SET aula_id = ?, nombre = ?, descripcion = ?, duracion_min = ?, preguntas = ? WHERE id = ?')
      .run(v.aula.id, v.nombre, String(d.descripcion ?? '').trim(), v.dur, JSON.stringify(v.preguntas), id);
    this.guardarEquipos(id, v.equipos);
    return this.detalleDocente(u, id);
  }

  eliminar(u: Usuario, id: string) {
    const f = this.fila(id);
    this.exigirDueno(u, f);
    if (f.estado === 'en_curso') throw new ErrorApp('No puedes eliminar un proyecto en curso. Finalízalo primero.');
    this.lab.db.prepare('DELETE FROM proyectos WHERE id = ?').run(id);
  }

  accion(u: Usuario, id: string, accion: 'abrir' | 'iniciar' | 'finalizar' | 'reiniciar') {
    const f = this.fila(id);
    this.exigirDueno(u, f);
    const miembros = this.equipos(id).flatMap((e) => e.miembros.map((m) => m.id));
    if (accion === 'abrir') {
      if (f.estado !== 'preparacion') throw new ErrorApp('La sala ya está abierta.');
      this.lab.db.prepare("UPDATE proyectos SET estado = 'sala' WHERE id = ?").run(id);
      for (const m of miembros)
        this.lab.avisar(m, { tipo: 'proyecto', titulo: `¡Competencia por equipos: «${f.nombre}»!`, texto: 'Entra a la sala de espera; tu docente dará inicio en unos minutos.', enlace: `/app/proyectos/${id}` });
    } else if (accion === 'iniciar') {
      if (f.estado !== 'sala' && f.estado !== 'preparacion') throw new ErrorApp('El proyecto ya empezó o terminó.');
      const inicio = this.lab.ahora();
      const fin = new Date(inicio.getTime() + f.duracion_min * 60000);
      this.lab.db.prepare("UPDATE proyectos SET estado = 'en_curso', inicio = ?, fin = ? WHERE id = ?").run(inicio.toISOString(), fin.toISOString(), id);
    } else if (accion === 'finalizar') {
      if (f.estado === 'finalizado') throw new ErrorApp('El proyecto ya terminó.');
      if (f.estado !== 'en_curso') throw new ErrorApp('El proyecto todavía no empieza.');
      this.lab.db.prepare('UPDATE proyectos SET fin = ? WHERE id = ?').run(this.lab.iso(), id);
      this.cerrar(id);
    } else if (accion === 'reiniciar') {
      if (f.estado === 'en_curso') throw new ErrorApp('Finaliza el proyecto antes de reiniciarlo.');
      this.lab.db.prepare('DELETE FROM entregas WHERE proyecto_id = ?').run(id);
      this.lab.db.prepare("UPDATE proyectos SET estado = 'preparacion', inicio = NULL, fin = NULL WHERE id = ?").run(id);
    } else throw new ErrorApp('Acción no válida.');
    return this.tablero(u, id);
  }

  /** Para editar: el proyecto con sus preguntas completas y equipos. */
  detalleDocente(u: Usuario, id: string) {
    const f = this.fila(id);
    this.exigirDueno(u, f);
    return { ...this.resumen(f), preguntaIds: JSON.parse(f.preguntas) as string[], listaEquipos: this.equipos(id), preguntasCompletas: this.preguntasDe(f) };
  }

  private equipoDe(proyectoId: string, alumnoId: string) {
    return this.equipos(proyectoId).find((e) => e.miembros.some((m) => m.id === alumnoId)) ?? null;
  }

  /** Clasificación de equipos: más aciertos primero; si empatan, el que entregó antes. */
  private clasificar(proyectoId: string) {
    const entregas = new Map(
      (this.lab.db.prepare('SELECT * FROM entregas WHERE proyecto_id = ?').all(proyectoId) as { equipo_id: string; aciertos: number; total: number; segundos: number; enviado: string; alumno_id: string }[]).map(
        (e) => [e.equipo_id, e]
      )
    );
    const total = (JSON.parse((this.lab.db.prepare('SELECT preguntas FROM proyectos WHERE id = ?').get(proyectoId) as { preguntas: string }).preguntas) as string[]).length;
    return this.equipos(proyectoId)
      .map((e) => {
        const en = entregas.get(e.id);
        return { ...e, entregado: !!en, aciertos: en?.aciertos ?? 0, total: en?.total ?? total, segundos: en?.segundos ?? null, enviadoPor: en ? this.lab.usuario(en.alumno_id)?.nombre ?? null : null };
      })
      .sort((a, b) => Number(b.entregado) - Number(a.entregado) || b.aciertos - a.aciertos || (a.segundos ?? 1e9) - (b.segundos ?? 1e9) || a.nombre.localeCompare(b.nombre))
      .map((e, i) => ({ ...e, puesto: i + 1 }));
  }

  private exigirVer(u: Usuario, f: FilaProyecto) {
    if (u.rol === 'admin' || f.docente_id === u.id) return;
    if (u.rol === 'estudiante' && this.equipoDe(f.id, u.id)) return;
    throw new ErrorApp('No participas en este proyecto.', 403);
  }

  /** Tablero en vivo (docente en el proyector y alumnos). */
  tablero(u: Usuario, id: string) {
    const f = this.fila(id);
    this.exigirVer(u, f);
    return { ...this.resumen(f), ahora: this.lab.iso(), equipos: this.clasificar(id), miEquipoId: u.rol === 'estudiante' ? this.equipoDe(id, u.id)?.id ?? null : null };
  }

  /** Lo que ve el alumno: las preguntas sin respuestas mientras se juega; con solución al terminar. */
  paraAlumno(u: Usuario, id: string) {
    const f = this.fila(id);
    this.exigirVer(u, f);
    const equipo = this.equipoDe(id, u.id);
    const entrega = equipo
      ? (this.lab.db.prepare('SELECT * FROM entregas WHERE proyecto_id = ? AND equipo_id = ?').get(id, equipo.id) as
          | { aciertos: number; total: number; segundos: number; detalle: string; respuestas: string; alumno_id: string }
          | undefined)
      : undefined;
    const preguntas = this.preguntasDe(f);
    let visibles: Pregunta[] = [];
    if (f.estado === 'finalizado') visibles = preguntas;
    else if (f.estado === 'en_curso' && !entrega) visibles = preguntas.map(sinRespuestas);
    return {
      ...this.tablero(u, id),
      miEquipo: equipo,
      preguntasJuego: visibles,
      entrega: entrega
        ? {
            aciertos: entrega.aciertos,
            total: entrega.total,
            segundos: entrega.segundos,
            enviadoPor: this.lab.usuario(entrega.alumno_id)?.nombre ?? '',
            detalle: f.estado === 'finalizado' ? (JSON.parse(entrega.detalle) as { preguntaId: string; correcta: boolean }[]) : null,
            respuestas: f.estado === 'finalizado' ? (JSON.parse(entrega.respuestas) as RespuestaEnviada[]) : null,
          }
        : null,
    };
  }

  /** Entrega del equipo: cuenta la primera; el tiempo se mide desde que el docente dio inicio. */
  entregar(u: Usuario, id: string, respuestas: RespuestaEnviada[]) {
    const f = this.fila(id);
    const equipo = this.equipoDe(id, u.id);
    if (!equipo) throw new ErrorApp('No participas en este proyecto.', 403);
    if (f.estado !== 'en_curso') throw new ErrorApp(f.estado === 'finalizado' ? 'El tiempo terminó.' : 'El proyecto todavía no empieza.');
    if (this.lab.db.prepare('SELECT 1 FROM entregas WHERE proyecto_id = ? AND equipo_id = ?').get(id, equipo.id))
      throw new ErrorApp('Tu equipo ya entregó. Solo cuenta la primera entrega.', 409);
    const preguntas = this.preguntasDe(f);
    const porId = new Map((respuestas ?? []).map((r) => [r.preguntaId, r.respuesta]));
    const detalle = preguntas.map((p) => ({ preguntaId: p.id, correcta: calificar(p, porId.get(p.id) ?? null) }));
    const aciertos = detalle.filter((d) => d.correcta).length;
    const segundos = Math.max(0, Math.round((this.lab.ahora().getTime() - new Date(f.inicio!).getTime()) / 1000));
    this.lab.db
      .prepare('INSERT INTO entregas (id, proyecto_id, equipo_id, alumno_id, respuestas, detalle, aciertos, total, segundos, enviado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), id, equipo.id, u.id, JSON.stringify(respuestas ?? []), JSON.stringify(detalle), aciertos, preguntas.length, segundos, this.lab.iso());
    // Si ya entregaron todos los equipos, termina.
    const n = (this.lab.db.prepare('SELECT COUNT(*) AS n FROM entregas WHERE proyecto_id = ?').get(id) as { n: number }).n;
    if (n >= this.equipos(id).length) this.cerrar(id);
    return this.paraAlumno(u, id);
  }
}
