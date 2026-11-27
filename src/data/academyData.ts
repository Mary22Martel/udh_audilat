import { AcademyTopic, BadgeItem, LeaderboardEntry, NarrativeNotification, StudentProfile } from '../types/audit';

export const AUDITOR_LEVELS = [
  { level: 1, title: 'Aprendiz contable', minXp: 0, maxXp: 499 },
  { level: 2, title: 'Asistente de auditoría', minXp: 500, maxXp: 1199 },
  { level: 3, title: 'Analista tributario', minXp: 1200, maxXp: 2199 },
  { level: 4, title: 'Auditor junior', minXp: 2200, maxXp: 3499 },
  { level: 5, title: 'Auditor senior', minXp: 3500, maxXp: 4999 },
  { level: 6, title: 'Especialista tributario', minXp: 5000, maxXp: 6999 },
  { level: 7, title: 'Auditor experto', minXp: 7000, maxXp: 12000 },
] as const;

export function getLevelForXp(xp: number) {
  const found = AUDITOR_LEVELS.find((l) => xp >= l.minXp && xp <= l.maxXp);
  if (found) return found;
  return AUDITOR_LEVELS[AUDITOR_LEVELS.length - 1];
}

export const INITIAL_STUDENT_PROFILE: StudentProfile = {
  name: 'Valeria Mendoza Quispe',
  code: '2023110482',
  faculty: 'Escuela Profesional de Contabilidad – UDH',
  semester: 'VIII Ciclo',
  xp: 1450,
  streakDays: 6,
  completedMissionsCount: 1,
  casesReviewedCount: 4,
};

export const INITIAL_BADGES: BadgeItem[] = [
  {
    id: 'badge-detective',
    name: 'Detective de inconsistencias',
    description: 'Identificó al menos 3 observaciones críticas en documentos electrónicos.',
    criteria: 'Detecta 3 o más inconsistencias documentales en una misión.',
    unlocked: true,
    unlockedAt: '12 Nov 2026',
    iconKey: 'search',
  },
  {
    id: 'badge-igv',
    name: 'Experto en IGV',
    description: 'Dominio en validación de crédito fiscal, notas de crédito y PDT 621.',
    criteria: 'Completa «El crédito fiscal sospechoso» con precisión de 75 % o más.',
    unlocked: false,
    iconKey: 'shield',
  },
  {
    id: 'badge-dossier',
    name: 'Maestro del expediente',
    description: 'Armó un expediente de respuesta a SUNAT con el 100% de sustentos válidos.',
    criteria: 'Arma un expediente con el 100 % de los sustentos obligatorios y ninguno inválido.',
    unlocked: false,
    iconKey: 'folder',
  },
  {
    id: 'badge-inventarios',
    name: 'Especialista en inventarios',
    description: 'Resolvió diferencias de Kardex físico y valorizado con sustento técnico.',
    criteria: 'Completa la Misión 03 – El inventario desaparecido con precisión de 70 % o más.',
    unlocked: false,
    iconKey: 'boxes',
  },
  {
    id: 'badge-estratega',
    name: 'Auditor estratégico',
    description: 'Tomó decisiones gerenciales óptimas reduciendo contingencias y multas.',
    criteria: 'Toma el 100 % de decisiones óptimas en un caso.',
    unlocked: false,
    iconKey: 'compass',
  },
  {
    id: 'badge-sin-observaciones',
    name: 'Sin observaciones',
    description: 'Terminó una lección de la Academia con tres estrellas.',
    criteria: 'Logra 3 estrellas (90 % o más) en una lección de la Academia.',
    unlocked: false,
    iconKey: 'award',
  },
  {
    id: 'badge-modulo',
    name: 'Módulo certificado',
    description: 'Completó todas las lecciones de un módulo de la Academia.',
    criteria: 'Completa todas las lecciones de un módulo.',
    unlocked: false,
    iconKey: 'book',
  },
  {
    id: 'badge-reflejos',
    name: 'Reflejos de auditor',
    description: 'Respondió rápido y bien en el contrarreloj.',
    criteria: 'Logra 12 o más aciertos en el contrarreloj de 60 segundos.',
    unlocked: false,
    iconKey: 'zap',
  },
];

export const INITIAL_NOTIFICATIONS: NarrativeNotification[] = [
  {
    id: 'notif-01',
    missionId: 'mision-01',
    sender: 'SUNAT – Mesa de Partes Virtual',
    subject: 'Esquela de Citación N° 0048-2026 – Crédito Fiscal IGV',
    preview: 'Se ha generado un requerimiento relacionado con las operaciones de Octubre 2026. Revisar el Registro de Compras.',
    fullMessage:
      'Estimado contribuyente Comercializadora Huánuco S.A.C. (RUC 20604819321): Como resultado del cruce electrónico entre sus comprobantes de pago y el PDT 621 del período Octubre 2026, se han detectado inconsistencias en el crédito fiscal declarado (S/ 18,450.00). Se solicita presentar la documentación sustentatoria, medios de pago y Registro de Compras dentro del plazo simulado de 5 días hábiles.',
    date: 'Hoy, 08:15',
    priority: 'critica',
    read: false,
    dueDateLabel: 'Vence en 3 días',
  },
  {
    id: 'notif-02',
    missionId: 'mision-01',
    sender: 'Gerencia General',
    subject: 'Urgente: Aclaración sobre compras del último trimestre',
    preview: 'Contador, necesitamos conocer qué está sucediendo con las compras del período. Hay diferencias que debemos aclarar.',
    fullMessage:
      'Buenos días, Contador. Acabo de recibir la alerta del buzón sobre la Esquela #0048. Necesitamos saber qué facturas tienen problemas reales antes de responder. Te adelanto que el flete de Transportes Valle Alto sí se hizo, pero el chofer cobró en efectivo. Revisa qué impacto tiene esto en nuestro crédito fiscal y prepara el expediente.',
    date: 'Hoy, 08:42',
    priority: 'critica',
    read: false,
    dueDateLabel: 'Requiere informe',
  },
  {
    id: 'notif-03',
    missionId: 'mision-02',
    sender: 'SUNAT – Mesa de Partes Virtual',
    subject: 'Requerimiento N° 0051-2026 – Verificación de Proveedores',
    preview: 'Se solicita acreditar la fehaciencia de las adquisiciones efectuadas a proveedores observados.',
    fullMessage:
      'Contribuyente Distribuidora Andina S.A.C.: En el marco de una fiscalización parcial, deberá exhibir órdenes de compra, guías de remisión y constancias de pago correspondientes a las facturas emitidas por el proveedor Servicios Logísticos del Norte E.I.R.L.',
    date: 'Ayer, 16:30',
    priority: 'normal',
    read: true,
    dueDateLabel: 'Vence en 6 días',
  },
  {
    id: 'notif-04',
    missionId: 'mision-03',
    sender: 'Coordinación de Auditoría UDH',
    subject: 'Nuevo caso habilitado: Control de Existencias y Kardex',
    preview: 'La empresa Comercial Huánuco E.I.R.L. reporta desfase entre conteo físico y registro contable.',
    fullMessage:
      'El laboratorio ha habilitado el Expediente #0054 para práctica de auditoría de inventarios. Analiza el Kardex valorizado y determina si existe merma normal, desmedro o retiro no gravado.',
    date: '15 Nov 2026',
    priority: 'informativa',
    read: true,
    dueDateLabel: 'Disponible',
  },
  {
    id: 'notif-05',
    missionId: 'mision-04',
    sender: 'SUNAT – Mesa de Partes Virtual',
    subject: 'Requerimiento N° 0059-2026 – Deducibilidad de gastos (Renta 2026)',
    preview: 'Se solicita sustentar la causalidad de gastos registrados en las cuentas 63 y 65 del ejercicio 2026.',
    fullMessage:
      'Contribuyente Servicios Empresariales del Centro S.A.C. (RUC 20603319871): En el marco de la fiscalización del Impuesto a la Renta del ejercicio 2026, deberá sustentar la relación causal con la generación de renta de los gastos registrados en las cuentas 63 y 65. En particular, acredite el destino del equipamiento entregado en un domicilio particular y los entregables del contrato de asesoría. Plazo simulado: 7 días hábiles.',
    date: '16 Nov 2026',
    priority: 'normal',
    read: false,
    dueDateLabel: 'Vence en 7 días',
  },
  {
    id: 'notif-06',
    missionId: 'mision-04',
    sender: 'Gerencia General',
    subject: 'Sobre las compras para la casa del gerente',
    preview: 'Contador, esas compras las hicimos con la factura de la empresa. ¿Podemos defenderlas?',
    fullMessage:
      'Contador, SUNAT está preguntando por la compra en Hogar Premium. Fue equipamiento que llevamos a mi casa, pero a veces trabajo desde ahí. También pagamos una asesoría que nunca nos entregó informe. Necesito saber qué gastos podemos sostener y cuáles conviene reparar antes de que lo haga SUNAT.',
    date: '16 Nov 2026',
    priority: 'critica',
    read: false,
    dueDateLabel: 'Requiere informe',
  },
  {
    id: 'notif-07',
    missionId: 'mision-05',
    sender: 'SUNAT – Mesa de Partes Virtual',
    subject: 'Esquela N° 0063-2026 – Cruce de ventas con tarjeta (POS)',
    preview: 'Los abonos informados por el operador de tarjetas superan las ventas registradas en Octubre 2026.',
    fullMessage:
      'Contribuyente Restaurante El Buen Sabor S.A.C. (RUC 20607741290): Del cruce de la información del operador de tarjetas con su Registro de Ventas y su PDT 621 del período Octubre 2026, se observa que los cobros con tarjeta (S/ 68,000.00) superan las ventas registradas (S/ 50,000.00). Deberá explicar la diferencia o rectificar la Casilla 100 de su declaración. Plazo simulado: 4 días hábiles.',
    date: 'Hoy, 09:05',
    priority: 'critica',
    read: false,
    dueDateLabel: 'Vence en 4 días',
  },
  {
    id: 'notif-08',
    missionId: 'mision-05',
    sender: 'Gerencia General',
    subject: 'No entiendo de dónde sale esa diferencia',
    preview: 'Contador, todas las ventas pasan por caja. Revisa qué está pasando con el POS.',
    fullMessage:
      'Buenos días, Contador. Me dicen de SUNAT que vendimos más con tarjeta de lo que declaramos. Todas las ventas pasan por caja, aunque algunos días la boleta se emite al cierre. Revisa los reportes del POS contra el registro y dime cuánto tendríamos que regularizar.',
    date: 'Hoy, 09:30',
    priority: 'critica',
    read: false,
    dueDateLabel: 'Requiere informe',
  },
];

export const ACADEMY_TOPICS: AcademyTopic[] = [
  {
    id: 'credito-fiscal',
    category: 'Tributos e IGV',
    title: 'Requisitos sustanciales y formales del Crédito Fiscal',
    summary:
      'Para que el IGV pagado en compras sea deducible del impuesto bruto, la operación debe cumplir requisitos sustanciales (causalidad y destino gravado) y formales (comprobante válido y anotación oportuna).',
    legalBasis: 'Artículos 18° y 19° del TUO de la Ley del IGV e ISC (D.S. N° 055-99-EF).',
    requirements: [
      'Que la adquisición sea permitida como gasto o costo según la Ley del Impuesto a la Renta.',
      'Que se destine a operaciones por las que se deba pagar el IGV.',
      'Que el IGV esté discriminado por separado en el comprobante de pago.',
      'Que el comprobante consigne RUC y razón social del emisor en estado ACTIVO y HABIDO.',
      'Que esté anotado en el Registro de Compras (Formato 8.1) dentro de los plazos legales.',
    ],
    practicalExample: {
      scenario:
        'Una factura de compra consigna S/ 5,900.00 (IGV S/ 900.00), pero el área contable la digitó en el Registro de Compras por S/ 9,500.00 (IGV S/ 1,449.15).',
      resolution:
        'Solo es válido utilizar los S/ 900.00 que figuran en el comprobante. El exceso de S/ 549.15 constituye un reparo automático al crédito fiscal más multa por declarar datos falsos.',
    },
    auditTip:
      'Cruza siempre el Registro de Compras (Formato 8.1) contra el XML o PDF de la factura electrónica y verifica que las notas de crédito recibidas se hayan restado.',
  },
  {
    id: 'bancarizacion',
    category: 'Sustento Documental',
    title: 'Bancarización y Medios de Pago (Ley N° 28194)',
    summary:
      'Las obligaciones cuyo importe total sea igual o superior a S/ 2,000.00 (o US$ 500.00) deben cancelarse obligatoriamente utilizando medios de pago del sistema financiero para otorgar derecho a crédito fiscal y gasto deducible.',
    legalBasis: 'Texto Único Ordenado de la Ley N° 28194 y Decreto Legislativo N° 1529.',
    requirements: [
      'Aplica a pagos desde S/ 2,000.00 o US$ 500.00 (aun cuando se paguen en cuotas parciales menores).',
      'Medios válidos: depósito en cuenta, giro, transferencia de fondos, cheque no negociable, tarjeta de débito/crédito.',
      'El pago en efectivo sobre el umbral ocasiona la pérdida irreversible del crédito fiscal y del costo/gasto.',
    ],
    practicalExample: {
      scenario:
        'La empresa contrató un flete por S/ 11,800.00 y lo pagó en efectivo al transportista por urgencia operativa.',
      resolution:
        'Aunque el servicio sea real, al superar los S/ 2,000.00 sin medio de pago bancario, se pierde el crédito fiscal de S/ 1,800.00 y el gasto de S/ 10,000.00 para Impuesto a la Renta.',
    },
    auditTip:
      'Solicita siempre el Estado de Cuenta Bancario del período auditado para verificar que cada factura mayor a S/ 2,000 tenga una salida de fondos trazable.',
  },
  {
    id: 'notas-credito',
    category: 'Tributos e IGV',
    title: 'Ajustes al Crédito Fiscal por Notas de Crédito',
    summary:
      'Cuando un proveedor emite una Nota de Crédito por descuento, bonificación o devolución, el adquirente debe deducir proporcionalmente el IGV del crédito fiscal en el período de emisión.',
    legalBasis: 'Artículo 26° y 27° del TUO de la Ley del IGV e ISC.',
    requirements: [
      'Anotar la Nota de Crédito en el Registro de Compras con signo negativo en el mes de recepción.',
      'Verificar que haga referencia expresa al comprobante de pago original modificado.',
      'Reflejar el neto resultante en la casilla de compras gravadas del PDT 621.',
    ],
    practicalExample: {
      scenario:
        'Comercializadora Huánuco recibe una Nota de Crédito por S/ 1,180.00 (IGV S/ 180.00) por descuento por pronto pago, pero omite registrarla en su PDT 621.',
      resolution:
        'Se utilizó S/ 180.00 de crédito fiscal en exceso. Debe presentarse rectificatoria o asumir el reparo en fiscalización.',
    },
    auditTip:
      'Busca siempre documentos con serie FC01 o BC01 en los buzones electrónicos; suelen olvidarse en el cierre mensual.',
  },
  {
    id: 'fehaciencia',
    category: 'Fiscalización SUNAT',
    title: 'Fehaciencia de las operaciones y capacidad operativa',
    summary:
      'No basta con tener la factura y el pago; durante una fiscalización, la empresa debe demostrar que la operación existió realmente mediante pruebas documentales mínimas.',
    legalBasis: 'Criterio jurisprudencial del Tribunal Fiscal (RTF N° 01759-5-2003 y reiteradas).',
    requirements: [
      'Contratos, órdenes de compra o cotizaciones previas.',
      'Guías de remisión remitente y transportista para traslado de bienes.',
      'Partes de ingreso a almacén, Kardex o informes de conformidad de servicio.',
      'Verificación de que el proveedor cuente con condición HABIDO y actividad económica coherente.',
    ],
    practicalExample: {
      scenario:
        'Un proveedor con RUC dado de baja o dedicado a venta de abarrotes factura servicios especializados de ingeniería por S/ 25,000 sin informes entregables.',
      resolution:
        'SUNAT puede desconocer la operación calificándola como no fehaciente (operación no real), reparando IGV y Renta.',
    },
    auditTip:
      'Arma la cadena documental completa: Requerimiento -> Orden de Compra -> Guía de Remisión -> Factura -> Pago Bancario -> Kardex.',
  },
  {
    id: 'fiscalizacion-tipos',
    category: 'Fiscalización SUNAT',
    title: 'Tipos de procedimientos de fiscalización tributaria',
    summary:
      'El Código Tributario distingue las facultades de verificación según el alcance, duración y modalidad de revisión realizada por la Administración.',
    legalBasis: 'Artículos 61°, 62° y 62°-A del TUO del Código Tributario y Reglamento de Fiscalización.',
    requirements: [
      'Fiscalización Definitiva: revisa de manera integral un tributo y período, plazo máximo de 1 año.',
      'Fiscalización Parcial: revisa uno o algunos elementos específicos de la obligación tributaria, plazo máximo 6 meses.',
      'Fiscalización Parcial Electrónica: a través de sistemas informáticos con liquidación preliminar y plazo de 10 días hábiles para subsanar.',
      'Esquela de Citación / Acción Inductiva: comunicación preventiva para que el contribuyente aclare inconsistencias antes de una fiscalización formal.',
    ],
    practicalExample: {
      scenario:
        'Una empresa recibe una Esquela de Citación por inconsistencias entre su Registro de Compras electrónico y su PDT 621.',
      resolution:
        'Al encontrarse en etapa inductiva, el contribuyente puede rectificar voluntariamente antes de ser notificado con una Resolución de Determinación y acceder a mayor gradualidad de rebaja en multas.',
    },
    auditTip:
      'Identifica siempre el tipo de carta o esquela al abrir un expediente; define los plazos legales y el régimen de gradualidad aplicable.',
  },
  {
    id: 'causalidad-renta',
    category: 'Impuesto a la Renta',
    title: 'Principio de Causalidad y Deducibilidad de Gastos',
    summary:
      'Para deducir un gasto en la determinación del Impuesto a la Renta de Tercera Categoría, este debe ser necesario para producir renta gravada o mantener la fuente productora.',
    legalBasis: 'Artículo 37° de la Ley del Impuesto a la Renta.',
    requirements: [
      'Causalidad: vínculo directo con la generación de ingresos gravados.',
      'Razonabilidad y proporcionalidad respecto al volumen de operaciones.',
      'Generalidad (en gastos a favor del personal).',
      'Prohibición expresa de deducir gastos personales del titular o socios (Art. 44° LIR).',
    ],
    practicalExample: {
      scenario:
        'Se registra una factura por compra de electrodomésticos enviados al domicilio particular del gerente general.',
      resolution:
        'Gasto no deducible (reparable en DJ Anual) y sujeto a tasa adicional del 5% por disposición indirecta de renta (dividendo presunto).',
    },
    auditTip:
      'Revisa la dirección de entrega en las guías de remisión y el giro del negocio antes de validar gastos administrativos.',
  },
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Diego Santamaría Ríos',
    code: '2022108914',
    levelTitle: 'Auditor junior',
    xp: 2680,
    accuracy: 94,
    missionsCompleted: 4,
  },
  {
    rank: 2,
    name: 'Camila Huamán Paredes',
    code: '2022109402',
    levelTitle: 'Auditor junior',
    xp: 2310,
    accuracy: 91,
    missionsCompleted: 3,
  },
  {
    rank: 3,
    name: 'Andrés Tarazona Vela',
    code: '2023104411',
    levelTitle: 'Analista tributario',
    xp: 1890,
    accuracy: 88,
    missionsCompleted: 2,
  },
  {
    rank: 4,
    name: 'Valeria Mendoza Quispe',
    code: '2023110482',
    levelTitle: 'Analista tributario',
    xp: 1450,
    accuracy: 86,
    missionsCompleted: 1,
    isCurrentUser: true,
  },
  {
    rank: 5,
    name: 'Lucero Chávez Espinoza',
    code: '2023112095',
    levelTitle: 'Asistente de auditoría',
    xp: 1120,
    accuracy: 82,
    missionsCompleted: 1,
  },
  {
    rank: 6,
    name: 'Mateo Rojas Villanueva',
    code: '2023115830',
    levelTitle: 'Asistente de auditoría',
    xp: 890,
    accuracy: 79,
    missionsCompleted: 1,
  },
];
