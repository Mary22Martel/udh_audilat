# AUDIT LAB – UDH

Simulador de auditorías tributarias para estudiantes de Contabilidad y Auditoría (Universidad de Huánuco).
Casos, empresas y RUC ficticios: **no hay conexión real con SUNAT**.

Tiene tres tipos de cuenta:

| Rol | Qué hace |
| --- | --- |
| **Administrador** | Crea las cuentas (una por una o pegando una lista), las agrega a un aula, restablece contraseñas y ve el uso del laboratorio. |
| **Docente** | Crea sus aulas y comparte un código. Ve el avance de sus alumnos en la Academia, edita y agrega preguntas, y arma competencias por equipos en vivo. |
| **Estudiante** | Aprende en la Academia (lo que mide su docente), practica libremente en las misiones, se une a aulas con un código y juega los retos por equipos. |

### Los tres módulos

- **Academia (lo que se mide):** 6 módulos y 12 lecciones de contabilidad y tributación. Cada lección es una «prueba de campo» con 3 escudos: cada error descuenta uno. Siete minijuegos: opción múltiple, verdadero o falso, cálculo, clasificar, armar el asiento contable, encontrar el error en un comprobante y ordenar pasos. Al responder cae un sello CONFORME u OBSERVADO con la explicación. Además: contrarreloj de 60 segundos y repaso de las preguntas falladas.
- **Misiones (práctica libre):** los 5 casos completos de fiscalización. Cualquier estudiante puede jugarlos; tienen su propia clasificación general.
- **Proyectos por equipos:** el docente elige preguntas del banco o crea casos con plantillas de factura, boleta, nota de crédito, guía de remisión o recibo por honorarios (cambia los datos y marca dónde está el error). Forma equipos, abre la sala y da inicio: todos juegan a la vez y el tablero se ve en vivo en el proyector. Gana el equipo con más aciertos; si empatan, el que entregó primero.

## Cómo correrlo en Visual Studio Code

### 1. Requisitos (solo la primera vez)

- **Node.js 22.13 o superior** (el mismo que usas para la bolsa). Compruébalo con `node -v`.

### 2. Instalar

Abre la carpeta `audit-lab-udh` en VS Code (**Archivo → Abrir carpeta…**) y en la terminal:

```bash
npm install
```

### 3. Crear las cuentas

Opción A, **datos de prueba** (recomendado para presentar): crea un admin, 2 docentes y 12 alumnos con avances.

```bash
npm run datos-demo
```

| Cuenta | Correo | Contraseña |
| --- | --- | --- |
| Administrador | admin@udh.edu.pe | auditlab2026 |
| Docente (con aula de 9 alumnos) | docente@udh.edu.pe | docente2026 |
| Alumna (Valeria) | 2023110482@udh.edu.pe | alumno2026 |

También deja un proyecto ya jugado y otro, «Gran reto de auditoría», listo para jugarlo en vivo. El comando muestra el código de cada aula (cambia en cada computadora).

Opción B, **solo tu administrador**, y desde ahí creas las demás cuentas:

```bash
npm run crear-admin -- admin@udh.edu.pe "tu-contraseña"
```

Si olvidas la contraseña del admin, corre el mismo comando con una nueva.

### 4. Ejecutar

```bash
npm run dev
```

Se abre solo <http://localhost:3000>. Este comando arranca dos cosas a la vez: el **servidor** (puerto 3001, guarda usuarios y progreso) y la **página** (puerto 3000, se actualiza al guardar un archivo). Para detenerlo: `Ctrl + C`.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor + página con recarga automática |
| `npm run datos-demo` | Carga cuentas y avances de prueba |
| `npm run crear-admin -- correo clave` | Crea el administrador o cambia su contraseña |
| `npm test` | Pruebas automáticas del servidor |
| `npm run build` y luego `npm start` | Versión final: todo en <http://localhost:3001> |
| `npm run lint` | Revisa errores de TypeScript |

## Dónde están los datos

- **Base de datos:** `data/auditlab.db` (SQLite, viene incluido en Node; no hay que instalar nada). No se sube a GitHub, así que en cada computadora hay que volver a crear las cuentas.
- **Para empezar de cero:** detén el servidor, borra la carpeta `data/` y vuelve a correr `npm run datos-demo`.
- Contraseñas cifradas con scrypt; la sesión viaja en una cookie segura (HttpOnly) y dura 7 días.

## Reglas del juego (cómo se calcula)

- **XP del alumno** = XP de la Academia (mejor intento de cada lección) + XP de misiones (mejor intento de cada misión). Repetir solo suma si superas tu marca.
- **Lección aprobada:** responder todas las preguntas sin perder los 3 escudos. Estrellas: 3 con 90 % o más, 2 con 70 % o más, 1 si apruebas. XP = 10 por acierto + 15 por estrella. Cada lección se desbloquea al aprobar la anterior.
- **Clasificación:** la de la Academia es por aula; la de misiones es general.
- **Banco de preguntas:** es compartido entre docentes. Las preguntas base se pueden editar, desactivar o restaurar; las creadas por docentes también se pueden eliminar.
- Las respuestas se califican en el servidor con la misma función que usa la pantalla (`src/lib/preguntas.ts`). En los proyectos, las soluciones no llegan al navegador hasta que el reto termina.

## Dónde editar cada cosa

| Quiero cambiar… | Archivo |
| --- | --- |
| Las misiones, documentos, decisiones | `src/data/missionsData.ts` |
| Módulos, lecciones y preguntas base de la Academia | `src/data/academiaCurso.ts` |
| Plantillas de comprobantes y tipos de pregunta | `src/lib/preguntas.ts` |
| Esquelas de SUNAT y mensajes de cada caso, fichas normativas, niveles, insignias | `src/data/academyData.ts` |
| Reglas de XP, insignias, competencias, qué ficha repasar | `src/lib/reglas.ts` |
| Portada y login | `src/pages/Portada.tsx`, `src/pages/Ingresar.tsx` |
| Pantallas del alumno | `src/pages/alumno/`, `src/pages/academia/`, `src/pages/proyectos/` |
| Panel docente | `src/pages/docente/` |
| Panel de administrador | `src/pages/admin/` |
| La sala de auditoría (el juego) | `src/components/AuditRoom.tsx` |
| Colores de los modos claro y oscuro | `src/index.css` |
| Servidor y base de datos | `server/` |

## Problemas comunes

- **«No hay conexión con el servidor»** → usa `npm run dev` (no solo `vite`), que también arranca el servidor.
- **En Windows: «la ejecución de scripts está deshabilitada»** → usa la terminal **Command Prompt**, o en PowerShell: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
- **«Correo o contraseña incorrectos» con las cuentas de prueba** → corre primero `npm run datos-demo`.
- **El puerto 3000 o 3001 está ocupado** → cierra la otra terminal donde corre el sistema.
