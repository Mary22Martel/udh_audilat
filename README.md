# AUDIT LAB – UDH

Simulador de auditorías tributarias para estudiantes de Contabilidad y Auditoría (Universidad de Huánuco).
Casos, empresas y RUC ficticios: **no hay conexión real con SUNAT**.

Tiene tres tipos de cuenta:

| Rol | Qué hace |
| --- | --- |
| **Administrador** | Crea las cuentas de docentes (y de alumnos si quiere, una por una o pegando una lista), las agrega a un aula, restablece contraseñas y ve el uso del laboratorio. |
| **Docente** | Crea sus aulas y comparte un código. Ve el avance de sus alumnos en la Academia y en las misiones (solo de sus aulas), agrega sus propias preguntas para sus alumnos y lanza actividades en vivo con tiempo (individuales o por equipos). |
| **Estudiante** | Puede crear su propia cuenta desde el login («Soy alumno nuevo», con su correo @udh.edu.pe y, si quiere, el código de su aula). Aprende en la Academia (lo que mide su docente), practica libremente en las misiones, se une a aulas con un código y responde las actividades en vivo de su docente. |

### Los tres módulos

- **Academia (lo que se mide):** 6 módulos y 12 lecciones de contabilidad y tributación. Cada lección es una «prueba de campo» con 3 escudos: cada error descuenta uno. Siete minijuegos: opción múltiple, verdadero o falso, cálculo, clasificar, armar el asiento contable, encontrar el error en un comprobante y ordenar pasos. Al responder cae un sello CONFORME u OBSERVADO con la explicación. Además: contrarreloj de 60 segundos y repaso de las preguntas falladas.
- **Misiones (práctica libre):** los 5 casos completos de fiscalización. Cualquier estudiante puede jugarlos; tienen su propia clasificación general. Los casos que siguen en preparación no se muestran.
- **Actividades en vivo:** el docente elige preguntas (las suyas o las del sistema) o crea casos con plantillas de factura, boleta, nota de crédito, guía de remisión o recibo por honorarios (cambia los datos y marca dónde está el error). Elige cuánto dura y cómo se juega:
  - **Individual** (como un Kahoot): cada alumno responde solo. Sigue abierta hasta que se acaba el tiempo o el docente la cierra.
  - **Por equipos:** forma equipos; cada equipo entrega una vez. Termina al entregar todos o al acabarse el tiempo.

  Abre la sala, da inicio y el tablero se ve en vivo en el proyector. Al acabarse el tiempo se cierra sola y ya no se puede responder. Gana quien tiene más aciertos; si empatan, quien entregó primero. Los alumnos que se unen al aula tarde entran solos (en individual con su propio puesto; en equipos, al equipo con menos integrantes).
- **Orden aleatorio:** cada alumno ve las preguntas, opciones, fichas y pasos en otro orden (en la Academia cambia en cada intento).

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

También deja un reto por equipos ya jugado, otro («Gran reto de auditoría») listo para jugar en vivo y una actividad individual («Práctica de hoy») con las preguntas propias de la docente. El comando muestra el código de cada aula (cambia en cada computadora).

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

### Registro de alumnos

En el login, la pestaña «Soy alumno nuevo» crea **solo cuentas de estudiante** (las de docente las crea el admin). Por defecto exige un correo `@udh.edu.pe`. Se puede cambiar con variables de entorno al arrancar:

- `AUDITLAB_REGISTRO=cerrado` apaga el registro (solo el admin crea cuentas).
- `AUDITLAB_DOMINIO_REGISTRO=*` acepta cualquier correo (útil para pruebas).

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor + página con recarga automática |
| `npm run respaldo` | Copia de seguridad de la base de datos en `data/respaldos/`. |
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
- **Banco de preguntas:**
  - Las preguntas **del sistema** (y las que crea el admin) las ven todos los alumnos. Solo el admin las edita, desactiva o restaura.
  - Las preguntas **de un docente** solo las ven los alumnos de sus aulas (de un aula elegida o de todas), marcadas como «Pregunta de tu docente». En cada lección entran primero (hasta 4) y se completa con las del sistema. Solo su autor las edita o elimina; otro docente no las ve.
  - El docente puede duplicar una pregunta del sistema para hacer su propia versión.
  - En los retos por equipos se usan las del sistema y las del docente del aula.
- Las respuestas se califican en el servidor con la misma función que usa la pantalla (`src/lib/preguntas.ts`). En las actividades en vivo, las soluciones no llegan al navegador hasta que terminan.

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

## Publicar en un servidor (CloudPanel)

AUDIT LAB es **un solo servicio de Node.js**: `npm start` entrega la página y la API en el mismo puerto (3001). Nginx (CloudPanel) va delante con el dominio y el certificado https.

1. En CloudPanel, crea el sitio como **Node.js Site** (versión de Node **22**, *App Port* **3001**).
2. Entra por SSH con el usuario del sitio y descarga el proyecto en su carpeta.
3. Instala, compila y crea el administrador:
   ```bash
   npm ci --include=dev
   npm run build
   npm run crear-admin -- admin@udh.edu.pe "una-clave-segura"
   ```
4. Arráncalo con PM2 (usa `ecosystem.config.cjs`, que ya trae `HOST=127.0.0.1`, `COOKIE_SEGURA=true` y `TRAS_PROXY=true`):
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.cjs
   pm2 save
   ```
5. En **SSL/TLS**, crea un certificado de Let's Encrypt.
6. En **Cron Jobs**, agrega `@reboot` → `pm2 resurrect` (para que vuelva solo si se reinicia el servidor) y un respaldo diario → `npm run respaldo`.

**Actualizar después de un cambio:**
```bash
git pull
npm ci --include=dev
npm run build
pm2 restart auditlab
```

La base de datos queda en `data/auditlab.db` (no está en GitHub y `git pull` no la toca). `npm run respaldo` guarda copias en `data/respaldos/` (las 14 más recientes).

## Problemas comunes

- **«No hay conexión con el servidor»** → usa `npm run dev` (no solo `vite`), que también arranca el servidor.
- **En Windows: «la ejecución de scripts está deshabilitada»** → usa la terminal **Command Prompt**, o en PowerShell: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
- **«Correo o contraseña incorrectos» con las cuentas de prueba** → corre primero `npm run datos-demo`.
- **El puerto 3000 o 3001 está ocupado** → cierra la otra terminal donde corre el sistema.
