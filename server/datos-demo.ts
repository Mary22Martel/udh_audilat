// Carga cuentas y avances de prueba para presentar el sistema:
//   npm run datos-demo
// Crea 1 administrador, 2 docentes con su aula, 12 alumnos con avance en la Academia y en las misiones,
// un proyecto por equipos ya jugado y otro listo para jugar en vivo.
// Si los datos ya existen, no los duplica.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LECCIONES } from '../src/data/academiaCurso';
import { MISIONES_ACTIVAS } from '../src/lib/reglas';
import { AuditLab } from './db';
import { respuestaCorrecta, respuestaIncorrecta, simularIntento } from './simular';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Reloj controlable: así los intentos quedan repartidos en las últimas dos semanas.
let reloj: Date | null = null;
const lab = new AuditLab({ ruta: process.env.AUDITLAB_DB ?? path.join(RAIZ, 'data', 'auditlab.db'), ahora: () => reloj ?? new Date() });
const haceDias = (d: number, h = 10) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  x.setHours(h, Math.floor(azar() * 59), 0, 0);
  return x;
};

// Azar con semilla: los datos salen iguales en todas las computadoras.
let semilla = 20261120;
function azar() {
  semilla = (semilla * 1664525 + 1013904223) % 4294967296;
  return semilla / 4294967296;
}

const CLAVE_ADMIN = 'auditlab2026';
const CLAVE_DOCENTE = 'docente2026';
const CLAVE_ALUMNO = 'alumno2026';

const existe = (correo: string) => lab.db.prepare('SELECT id FROM usuarios WHERE correo = ?').get(correo) as { id: string } | undefined;
const crear = (datos: Parameters<AuditLab['crearUsuario']>[0]) => {
  const e = existe(datos.correo);
  return e ? { id: e.id, nuevo: false } : { id: lab.crearUsuario(datos).usuario.id, nuevo: true };
};

lab.fijarAdmin('admin@udh.edu.pe', CLAVE_ADMIN);
const d1 = crear({ rol: 'docente', nombre: 'Mg. Rosa Albornoz Tarazona', correo: 'docente@udh.edu.pe', clave: CLAVE_DOCENTE });
const d2 = crear({ rol: 'docente', nombre: 'CPC Julio Espinoza Ramírez', correo: 'docente2@udh.edu.pe', clave: CLAVE_DOCENTE });
const aula1 = lab.aulas.deDocente(d1.id)[0] ?? lab.aulas.crear(d1.id, 'Auditoría Tributaria – Sección A');
const aula2 = lab.aulas.deDocente(d2.id)[0] ?? lab.aulas.crear(d2.id, 'Tributación I – Sección B');

// nombre, código, habilidad (0–1), lecciones de la Academia hechas, misiones hechas
const ALUMNOS: [string, string, number, number, number][] = [
  ['Valeria Mendoza Quispe', '2023110482', 0.82, 8, 3],
  ['Diego Santamaría Ríos', '2023110519', 0.93, 12, 5],
  ['Camila Huamán Torres', '2023110374', 0.88, 10, 4],
  ['Luis Ángel Rojas Céspedes', '2023110621', 0.7, 6, 2],
  ['Mariana Espinoza Lazo', '2023110288', 0.76, 7, 3],
  ['Jhon Paucar Villanueva', '2023110455', 0.58, 4, 1],
  ['Ana Lucía Trujillo Soto', '2023110702', 0.64, 5, 2],
  ['Renzo Cárdenas Alvarado', '2023110133', 0.5, 2, 0],
  ['Fiorella Ponce Ugarte', '2023110566', 0, 0, 0],
];
const ALUMNOS_2: [string, string, number, number, number][] = [
  ['Kevin Ticona Mallqui', '2023120011', 0.8, 6, 2],
  ['Sofía Ramírez Inga', '2023120045', 0.62, 4, 1],
  ['Bruno Lázaro Chávez', '2023120078', 0.5, 2, 1],
];

let intentosAcademia = 0;
let intentosMisiones = 0;

function jugarLeccion(alumnoId: string, leccionId: string, habilidad: number) {
  for (let intento = 0; intento < 3; intento++) {
    const { preguntas } = lab.academia.leccionParaJugar(alumnoId, leccionId);
    const respuestas = [];
    let errores = 0;
    for (const p of preguntas) {
      const ok = azar() < habilidad + intento * 0.1;
      if (!ok) errores++;
      respuestas.push({ preguntaId: p.id, respuesta: ok ? respuestaCorrecta(p) : respuestaIncorrecta(p) });
      if (errores >= 3) break;
    }
    const r = lab.academia.registrarLeccion(alumnoId, leccionId, respuestas, 120 + Math.round(azar() * 240));
    intentosAcademia++;
    if (r.completada) return;
  }
}

for (const [lista, aula] of [
  [ALUMNOS, aula1],
  [ALUMNOS_2, aula2],
] as const) {
  lista.forEach(([nombre, codigo, habilidad, lecciones, misiones], i) => {
    const a = crear({ rol: 'estudiante', nombre, correo: `${codigo}@udh.edu.pe`, codigo, clave: CLAVE_ALUMNO, aulaId: aula.id });
    if (!a.nuevo) return;
    for (let k = 0; k < lecciones; k++) {
      reloj = haceDias(Math.max(0, 13 - Math.floor((k * 13) / 12) - (i % 3)), 9 + (k % 8));
      jugarLeccion(a.id, LECCIONES[k].id, habilidad);
    }
    for (let k = 0; k < misiones; k++) {
      reloj = haceDias(Math.max(0, 11 - k * 3 - (i % 2)), 16);
      const r = simularIntento(MISIONES_ACTIVAS[k], habilidad, azar);
      lab.registrarResultado(a.id, r);
      intentosMisiones++;
    }
  });
}

// --- Proyectos por equipos --------------------------------------------------------------------------------------
const docente1 = lab.usuario(d1.id)!;
if (!lab.proyectos.deDocente(docente1).length) {
  const miembros = lab.aulas.filasAlumnos(aula1.id).map((f) => f.id);
  const banco = lab.academia.banco();
  const elegir = (ids: string[]) => ids.filter((id) => banco.some((p) => p.id === id));
  const equipos = [0, 1, 2].map((e) => ({ nombre: ['Equipo Turquesa', 'Equipo Ámbar', 'Equipo Coral'][e], miembros: miembros.filter((_, i) => i % 3 === e) }));

  // Uno ya jugado la semana pasada.
  reloj = haceDias(6, 11);
  const jugado = lab.proyectos.crear(docente1, {
    aulaId: aula1.id,
    nombre: 'Reto relámpago: comprobantes e IGV',
    descripcion: 'Encuentren los errores en los comprobantes y calculen el IGV. Gana el equipo con más aciertos; si empatan, el más rápido.',
    duracionMin: 15,
    preguntas: elegir(['b-m1-06', 'b-m1-07', 'b-m1-08', 'b-m2-01', 'b-m2-02', 'b-m2-07', 'b-m3-06']),
    equipos,
  });
  lab.proyectos.accion(docente1, jugado.id, 'abrir');
  lab.proyectos.accion(docente1, jugado.id, 'iniciar');
  const preguntas = jugado.preguntasCompletas;
  [
    [0.95, 7 * 60 + 12],
    [0.7, 9 * 60 + 40],
    [0.85, 8 * 60 + 5],
  ].forEach(([habilidad, seg], e) => {
    reloj = new Date(new Date(jugado.inicio ?? lab.proyectos.tablero(docente1, jugado.id).inicio!).getTime() + seg * 1000);
    const capitan = lab.usuario(equipos[e].miembros[0])!;
    lab.proyectos.entregar(
      capitan,
      jugado.id,
      preguntas.map((p, k) => ({ preguntaId: p.id, respuesta: (k * 37 + e) % 100 < habilidad * 100 ? respuestaCorrecta(p) : respuestaIncorrecta(p) }))
    );
  });

  // Otro listo para jugar en vivo durante la presentación.
  reloj = null;
  lab.proyectos.crear(docente1, {
    aulaId: aula1.id,
    nombre: 'Gran reto de auditoría',
    descripcion: 'Casos de comprobantes, asientos y crédito fiscal. ¡Trabajen en equipo!',
    duracionMin: 10,
    preguntas: elegir(['b-m1-09', 'b-m2-04', 'b-m2-09', 'b-m3-07', 'b-m4-02', 'b-m5-07', 'b-m6-07']),
    equipos,
  });
}
reloj = null;

console.log('✓ Datos de prueba listos.\n');
console.log('  Administrador  admin@udh.edu.pe       ' + CLAVE_ADMIN);
console.log('  Docente        docente@udh.edu.pe     ' + CLAVE_DOCENTE + `   aula «${aula1.nombre}» · código ${aula1.codigo}`);
console.log('  Docente 2      docente2@udh.edu.pe    ' + CLAVE_DOCENTE + `   aula «${aula2.nombre}» · código ${aula2.codigo}`);
console.log('  Alumna         2023110482@udh.edu.pe  ' + CLAVE_ALUMNO + '    (Valeria; todos los alumnos usan esta clave)');
console.log(`\n  Intentos cargados: ${intentosAcademia} en la Academia, ${intentosMisiones} en misiones.`);
console.log('  Proyecto listo para jugar en vivo: «Gran reto de auditoría» (cuenta del docente → Proyectos).');
console.log('  Entra en http://localhost:3000/ingresar');
