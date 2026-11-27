/**
 * Curso de la Academia: «Ruta de certificación del auditor».
 * Estas son las preguntas base. El servidor las copia a la base de datos la primera vez;
 * desde ahí los docentes pueden editarlas, desactivarlas o agregar más.
 * Si agregas una pregunta nueva aquí (con un id nuevo), aparece sola al reiniciar el servidor.
 */
import { plantillaComprobante, type Comprobante, type CuentaContable, type Pregunta } from '../lib/preguntas';

export interface Leccion {
  id: string;
  titulo: string;
  descripcion: string;
}

export interface Modulo {
  id: string;
  numero: number;
  titulo: string;
  descripcion: string;
  icono: 'receipt' | 'percent' | 'book' | 'boxes' | 'scale' | 'landmark';
  lecciones: Leccion[];
  /** Misión donde se aplica lo aprendido. */
  mision?: string;
}

export const MODULOS: Modulo[] = [
  {
    id: 'm1',
    numero: 1,
    titulo: 'Comprobantes de pago',
    descripcion: 'Factura, boleta, nota de crédito y guía: qué es cada una y cómo detectar un comprobante mal emitido.',
    icono: 'receipt',
    mision: 'mision-01',
    lecciones: [
      { id: 'm1-l1', titulo: 'Conoce los comprobantes', descripcion: 'Para qué sirve cada documento y quién lo emite.' },
      { id: 'm1-l2', titulo: 'Detecta el error', descripcion: 'Revisa comprobantes como lo haría SUNAT.' },
    ],
  },
  {
    id: 'm2',
    numero: 2,
    titulo: 'IGV y crédito fiscal',
    descripcion: 'Cálculo del IGV, requisitos del crédito fiscal y bancarización.',
    icono: 'percent',
    mision: 'mision-01',
    lecciones: [
      { id: 'm2-l1', titulo: 'Calcula el IGV', descripcion: 'Base imponible, impuesto y total.' },
      { id: 'm2-l2', titulo: '¿Procede el crédito fiscal?', descripcion: 'Requisitos sustanciales, formales y medios de pago.' },
    ],
  },
  {
    id: 'm3',
    numero: 3,
    titulo: 'Plan contable y asientos',
    descripcion: 'Elementos del PCGE y asientos de compra, venta, cobro y pago.',
    icono: 'book',
    lecciones: [
      { id: 'm3-l1', titulo: 'Ubica la cuenta', descripcion: 'Elementos y cuentas del PCGE.' },
      { id: 'm3-l2', titulo: 'Arma el asiento', descripcion: 'Debe y Haber en operaciones del día a día.' },
    ],
  },
  {
    id: 'm4',
    numero: 4,
    titulo: 'Existencias y kardex',
    descripcion: 'Control de inventarios, mermas, desmedros y retiro de bienes.',
    icono: 'boxes',
    mision: 'mision-03',
    lecciones: [
      { id: 'm4-l1', titulo: 'Lee el kardex', descripcion: 'Entradas, salidas y saldos.' },
      { id: 'm4-l2', titulo: 'Faltantes y retiros', descripcion: 'Merma, desmedro y retiro de bienes.' },
    ],
  },
  {
    id: 'm5',
    numero: 5,
    titulo: 'Gastos e Impuesto a la Renta',
    descripcion: 'Causalidad, sustento y gastos que no se pueden deducir.',
    icono: 'scale',
    mision: 'mision-04',
    lecciones: [
      { id: 'm5-l1', titulo: 'Principio de causalidad', descripcion: '¿Este gasto genera renta para la empresa?' },
      { id: 'm5-l2', titulo: 'Fehaciencia y sustento', descripcion: 'Probar que la operación realmente ocurrió.' },
    ],
  },
  {
    id: 'm6',
    numero: 6,
    titulo: 'Fiscalización SUNAT',
    descripcion: 'Tipos de fiscalización, plazos y cómo responder un requerimiento.',
    icono: 'landmark',
    mision: 'mision-05',
    lecciones: [
      { id: 'm6-l1', titulo: 'El procedimiento', descripcion: 'Fiscalización parcial, definitiva y sus plazos.' },
      { id: 'm6-l2', titulo: 'Responde a SUNAT', descripcion: 'Arma tu respuesta paso a paso.' },
    ],
  },
];

export const LECCIONES = MODULOS.flatMap((m) => m.lecciones.map((l) => ({ ...l, moduloId: m.id })));

/** Cuentas del PCGE que se usan en los asientos (el docente puede usar otras al editar). */
export const CUENTAS_PCGE: CuentaContable[] = [
  { codigo: '10', nombre: 'Efectivo y equivalentes de efectivo' },
  { codigo: '12', nombre: 'Cuentas por cobrar comerciales – terceros' },
  { codigo: '20', nombre: 'Mercaderías' },
  { codigo: '33', nombre: 'Propiedad, planta y equipo' },
  { codigo: '40111', nombre: 'IGV – Cuenta propia' },
  { codigo: '42', nombre: 'Cuentas por pagar comerciales – terceros' },
  { codigo: '60', nombre: 'Compras' },
  { codigo: '61', nombre: 'Variación de inventarios' },
  { codigo: '63', nombre: 'Gastos de servicios prestados por terceros' },
  { codigo: '69', nombre: 'Costo de ventas' },
  { codigo: '70', nombre: 'Ventas' },
];

const cuentas = (...codigos: string[]) => CUENTAS_PCGE.filter((c) => codigos.includes(c.codigo));

/** Comprobante a partir de una plantilla con algunos campos cambiados. */
function doc(tipo: Comprobante['tipo'], cambios: Partial<Record<string, string>> = {}, items?: Comprobante['items']): Comprobante {
  const p = plantillaComprobante(tipo);
  return { ...p, campos: { ...p.campos, ...(cambios as Record<string, string>) }, items: items ?? p.items };
}

export const PREGUNTAS_BASE: Pregunta[] = [
  // ============================== Módulo 1 · Comprobantes ==============================
  {
    id: 'b-m1-01',
    leccionId: 'm1-l1',
    tipo: 'opcion',
    enunciado: 'Una empresa compra mercadería para revender y quiere usar el IGV como crédito fiscal. ¿Qué comprobante debe pedir?',
    opciones: ['Boleta de venta', 'Factura', 'Ticket sin RUC', 'Recibo por honorarios'],
    correcta: 1,
    explicacion: 'La factura identifica al comprador con su RUC y discrimina el IGV, por eso permite usar el crédito fiscal. La boleta es para consumidores finales.',
  },
  {
    id: 'b-m1-02',
    leccionId: 'm1-l1',
    tipo: 'vf',
    enunciado: 'El RUC de una empresa (persona jurídica) tiene 11 dígitos y empieza con 20.',
    correcta: true,
    explicacion: 'Correcto. El RUC tiene 11 dígitos. Las personas jurídicas empiezan con 20 y las personas naturales con negocio, con 10.',
  },
  {
    id: 'b-m1-03',
    leccionId: 'm1-l1',
    tipo: 'clasificar',
    enunciado: 'Clasifica cada situación según el comprobante que corresponde.',
    grupos: ['Factura', 'Boleta de venta', 'Guía de remisión'],
    items: [
      { texto: 'Venta de útiles a una empresa con RUC', grupo: 0 },
      { texto: 'Venta de un celular a un estudiante con DNI', grupo: 1 },
      { texto: 'Traslado de mercadería del almacén al local del cliente', grupo: 2 },
      { texto: 'Servicio de transporte facturado a una empresa', grupo: 0 },
      { texto: 'Venta de menú a un cliente que no pide RUC', grupo: 1 },
    ],
    explicacion: 'La factura se emite a quien tiene RUC y necesita sustentar costo o crédito fiscal. La boleta, al consumidor final. La guía de remisión acompaña el traslado de bienes.',
  },
  {
    id: 'b-m1-04',
    leccionId: 'm1-l1',
    tipo: 'opcion',
    enunciado: 'El proveedor te devuelve dinero porque le devolviste 2 sacos de arroz. ¿Qué documento debe emitir?',
    opciones: ['Una nueva factura con monto negativo', 'Una nota de débito', 'Una nota de crédito que haga referencia a la factura original', 'Ninguno, basta un correo'],
    correcta: 2,
    explicacion: 'La nota de crédito sirve para anular, descontar o registrar devoluciones. Siempre indica qué comprobante modifica.',
  },
  {
    id: 'b-m1-05',
    leccionId: 'm1-l1',
    tipo: 'vf',
    enunciado: 'Una factura electrónica puede tener la serie B001.',
    correcta: false,
    explicacion: 'Las series de factura electrónica empiezan con F (por ejemplo F001). Las de boleta empiezan con B.',
  },
  {
    id: 'b-m1-06',
    leccionId: 'm1-l2',
    tipo: 'documento',
    enunciado: 'Revisa esta factura de compra. Marca el dato que no cuadra.',
    documento: doc('factura', { igv: 'S/ 594.00', total: 'S/ 4,554.00' }),
    errores: ['igv'],
    explicacion: 'La base es S/ 3,960.00 (20 × 150 + 10 × 96). El IGV correcto es 18 %: S/ 712.80, no S/ 594.00 (que es el 15 %). El total sí corresponde al IGV mal calculado, por eso el error está en el IGV.',
  },
  {
    id: 'b-m1-07',
    leccionId: 'm1-l2',
    tipo: 'documento',
    enunciado: 'Esta factura llegó para sustentar crédito fiscal. Encuentra el error.',
    documento: doc('factura', { clienteRuc: '2060481932' }),
    errores: ['clienteRuc'],
    explicacion: 'El RUC del cliente tiene solo 10 dígitos. Un RUC válido tiene 11. Con un RUC mal consignado la factura no sustenta el crédito fiscal.',
  },
  {
    id: 'b-m1-08',
    leccionId: 'm1-l2',
    tipo: 'documento',
    enunciado: 'Revisa la nota de crédito. ¿Qué dato está mal?',
    documento: doc('nota_credito', { serie: 'BC01-000044' }),
    errores: ['serie'],
    explicacion: 'La nota de crédito modifica una factura (F001-000245), así que su serie debe empezar con F. Una serie que empieza con B corresponde a boletas.',
  },
  {
    id: 'b-m1-09',
    leccionId: 'm1-l2',
    tipo: 'documento',
    enunciado: 'Revisa la línea de detalle de esta factura. Hay un dato que no coincide con el total.',
    documento: doc(
      'factura',
      { opGravada: 'S/ 3,960.00', igv: 'S/ 712.80', total: 'S/ 4,672.80' },
      [
        { descripcion: 'Arroz extra x 50 kg', cantidad: '25', valorUnitario: '150.00' },
        { descripcion: 'Aceite vegetal caja x 12', cantidad: '10', valorUnitario: '96.00' },
      ]
    ),
    errores: ['item0.cantidad'],
    explicacion: '25 × 150 + 10 × 96 = S/ 4,710.00, pero la operación gravada dice S/ 3,960.00. Los totales cuadran con 20 sacos, así que la cantidad de la primera línea está mal.',
  },
  {
    id: 'b-m1-10',
    leccionId: 'm1-l2',
    tipo: 'opcion',
    enunciado: 'Recibes una factura cuyo emisor figura como «No habido» en la consulta RUC. ¿Qué haces?',
    opciones: ['La registro igual, el IGV está bien calculado', 'La observo: no debería usarse para crédito fiscal', 'La cambio por una boleta', 'Le resto el IGV y la registro'],
    correcta: 1,
    explicacion: 'Las facturas emitidas por contribuyentes con condición de no habido no permiten ejercer el crédito fiscal. Siempre verifica el RUC del proveedor.',
  },

  // ============================== Módulo 2 · IGV y crédito fiscal ==============================
  {
    id: 'b-m2-01',
    leccionId: 'm2-l1',
    tipo: 'calculo',
    enunciado: 'El valor de venta de un servicio es S/ 2,500.00. ¿Cuánto es el IGV?',
    respuesta: 450,
    unidad: 'S/',
    explicacion: 'IGV = 2,500 × 18 % = S/ 450.00. El total a cobrar sería S/ 2,950.00.',
  },
  {
    id: 'b-m2-02',
    leccionId: 'm2-l1',
    tipo: 'calculo',
    enunciado: 'Un proveedor te cobra S/ 5,900.00 con IGV incluido. ¿Cuál es la base imponible (valor de venta)?',
    respuesta: 5000,
    unidad: 'S/',
    explicacion: 'Base = 5,900 ÷ 1.18 = S/ 5,000.00. El IGV es la diferencia: S/ 900.00.',
  },
  {
    id: 'b-m2-03',
    leccionId: 'm2-l1',
    tipo: 'opcion',
    enunciado: 'En 2026 la tasa total del IGV sigue siendo 18 %. ¿Cómo se compone?',
    opciones: ['16 % IGV + 2 % IPM', '15.5 % IGV + 2.5 % IPM', '18 % IGV sin IPM', '14 % IGV + 4 % IPM'],
    correcta: 1,
    explicacion: 'Por la Ley N° 32387, en 2026 el IGV es 15.5 % y el Impuesto de Promoción Municipal 2.5 %. El total sigue en 18 %; el IPM sube medio punto cada año hasta 4 % en 2029.',
  },
  {
    id: 'b-m2-04',
    leccionId: 'm2-l1',
    tipo: 'calculo',
    enunciado: 'En octubre la empresa vendió S/ 40,000 (base) y compró S/ 25,000 (base), todo gravado. ¿Cuánto IGV debe pagar?',
    respuesta: 2700,
    unidad: 'S/',
    explicacion: 'IGV de ventas: 40,000 × 18 % = 7,200. Crédito fiscal: 25,000 × 18 % = 4,500. IGV a pagar = 7,200 − 4,500 = S/ 2,700.',
  },
  {
    id: 'b-m2-05',
    leccionId: 'm2-l1',
    tipo: 'vf',
    enunciado: 'Si el IGV de las compras del mes es mayor que el de las ventas, la diferencia queda como saldo a favor para el mes siguiente.',
    correcta: true,
    explicacion: 'Así es: el saldo a favor del contribuyente se arrastra a los meses siguientes hasta agotarse.',
  },
  {
    id: 'b-m2-06',
    leccionId: 'm2-l2',
    tipo: 'clasificar',
    enunciado: '¿Cada requisito es sustancial o formal para usar el crédito fiscal?',
    grupos: ['Sustancial', 'Formal'],
    items: [
      { texto: 'La compra es costo o gasto para el Impuesto a la Renta', grupo: 0 },
      { texto: 'El IGV está discriminado en la factura', grupo: 1 },
      { texto: 'La compra se destina a operaciones gravadas', grupo: 0 },
      { texto: 'La factura está anotada en el Registro de Compras', grupo: 1 },
    ],
    explicacion: 'Sustanciales: que la adquisición sea costo o gasto para renta y se destine a operaciones gravadas. Formales: comprobante válido con IGV discriminado y anotado en el Registro de Compras.',
  },
  {
    id: 'b-m2-07',
    leccionId: 'm2-l2',
    tipo: 'opcion',
    enunciado: 'Desde 2022, ¿a partir de qué monto es obligatorio pagar con medios de pago (bancarización)?',
    opciones: ['S/ 3,500 o US$ 1,000', 'S/ 2,000 o US$ 500', 'S/ 1,000 o US$ 300', 'Solo si supera 1 UIT'],
    correcta: 1,
    explicacion: 'El Decreto Legislativo N° 1529 bajó el monto a S/ 2,000 o US$ 500. Si se paga en efectivo por encima de ese monto, se pierde el crédito fiscal y el gasto.',
  },
  {
    id: 'b-m2-08',
    leccionId: 'm2-l2',
    tipo: 'vf',
    enunciado: 'Un flete de S/ 11,800 pagado en efectivo al chofer sí da derecho a crédito fiscal, porque el servicio se hizo.',
    correcta: false,
    explicacion: 'Aunque el servicio sea real, al superar S/ 2,000 debía pagarse con un medio de pago. Sin bancarización no hay crédito fiscal ni gasto deducible.',
  },
  {
    id: 'b-m2-09',
    leccionId: 'm2-l2',
    tipo: 'opcion',
    enunciado: 'La gerencia compró un televisor para la casa del gerente con factura de la empresa. ¿Procede el crédito fiscal?',
    opciones: ['Sí, la factura está a nombre de la empresa', 'No, porque no se destina a operaciones gravadas ni es gasto del negocio', 'Sí, si se paga con transferencia', 'Solo el 50 %'],
    correcta: 1,
    explicacion: 'No basta que la factura esté a nombre de la empresa: el bien debe usarse en el negocio. Un bien de uso personal no cumple el requisito sustancial.',
  },
  {
    id: 'b-m2-10',
    leccionId: 'm2-l2',
    tipo: 'calculo',
    enunciado: 'Una nota de crédito por devolución tiene base S/ 300.00. ¿En cuánto se reduce tu crédito fiscal?',
    respuesta: 54,
    unidad: 'S/',
    explicacion: '300 × 18 % = S/ 54.00. La nota de crédito recibida disminuye el crédito fiscal del mes en que se emite.',
  },

  // ============================== Módulo 3 · Plan contable y asientos ==============================
  {
    id: 'b-m3-01',
    leccionId: 'm3-l1',
    tipo: 'clasificar',
    enunciado: 'Ubica cada cuenta en su elemento del PCGE.',
    grupos: ['Activo', 'Pasivo', 'Gasto', 'Ingreso'],
    items: [
      { texto: '10 Efectivo y equivalentes de efectivo', grupo: 0 },
      { texto: '42 Cuentas por pagar comerciales', grupo: 1 },
      { texto: '63 Servicios prestados por terceros', grupo: 2 },
      { texto: '70 Ventas', grupo: 3 },
      { texto: '20 Mercaderías', grupo: 0 },
      { texto: '40 Tributos por pagar', grupo: 1 },
    ],
    explicacion: 'Elementos 1, 2 y 3 son activo; el 4 es pasivo; el 5 patrimonio; el 6 gastos por naturaleza y el 7 ingresos.',
  },
  {
    id: 'b-m3-02',
    leccionId: 'm3-l1',
    tipo: 'opcion',
    enunciado: '¿En qué cuenta registras el IGV de una compra?',
    opciones: ['60 Compras', '40111 IGV – Cuenta propia', '42 Cuentas por pagar', '70 Ventas'],
    correcta: 1,
    explicacion: 'El IGV de compras se carga (Debe) a la 40111. El IGV de ventas se abona (Haber) a la misma cuenta.',
  },
  {
    id: 'b-m3-03',
    leccionId: 'm3-l1',
    tipo: 'vf',
    enunciado: 'Un aumento del activo se registra en el Debe.',
    correcta: true,
    explicacion: 'Las cuentas de activo aumentan por el Debe y disminuyen por el Haber. En el pasivo es al revés.',
  },
  {
    id: 'b-m3-04',
    leccionId: 'm3-l1',
    tipo: 'opcion',
    enunciado: 'Pagas S/ 1,200 de alquiler del local. ¿Qué cuenta de gasto usas?',
    opciones: ['60 Compras', '63 Gastos de servicios prestados por terceros', '69 Costo de ventas', '33 Propiedad, planta y equipo'],
    correcta: 1,
    explicacion: 'Los alquileres, servicios básicos, asesorías y fletes son servicios prestados por terceros: cuenta 63.',
  },
  {
    id: 'b-m3-05',
    leccionId: 'm3-l1',
    tipo: 'vf',
    enunciado: 'La cuenta 33 se usa para la mercadería que la empresa compra para vender.',
    correcta: false,
    explicacion: 'La mercadería va a la 20 (y la compra, a la 60). La 33 es para bienes de uso como maquinaria, vehículos o equipos.',
  },
  {
    id: 'b-m3-06',
    leccionId: 'm3-l2',
    tipo: 'asiento',
    enunciado: 'Compras mercadería al crédito por S/ 10,000 más IGV. Registra la compra.',
    cuentas: cuentas('10', '20', '40111', '42', '60', '70'),
    lineas: [
      { codigo: '60', debe: 10000 },
      { codigo: '40111', debe: 1800 },
      { codigo: '42', haber: 11800 },
    ],
    explicacion: 'La compra (60) y el IGV (40111) van al Debe. La deuda con el proveedor (42) va al Haber por el total: 10,000 + 1,800 = 11,800.',
  },
  {
    id: 'b-m3-07',
    leccionId: 'm3-l2',
    tipo: 'asiento',
    enunciado: 'Vendes mercadería al crédito por S/ 5,000 más IGV. Registra la venta.',
    cuentas: cuentas('10', '12', '40111', '42', '60', '70'),
    lineas: [
      { codigo: '12', debe: 5900 },
      { codigo: '40111', haber: 900 },
      { codigo: '70', haber: 5000 },
    ],
    explicacion: 'El cliente te debe el total (12, Debe: 5,900). El IGV por pagar (40111) y la venta (70) van al Haber.',
  },
  {
    id: 'b-m3-08',
    leccionId: 'm3-l2',
    tipo: 'asiento',
    enunciado: 'El cliente te paga por transferencia los S/ 5,900 que debía. Registra el cobro.',
    cuentas: cuentas('10', '12', '40111', '42', '70'),
    lineas: [
      { codigo: '10', debe: 5900 },
      { codigo: '12', haber: 5900 },
    ],
    explicacion: 'Entra dinero al banco (10, Debe) y se cancela la cuenta por cobrar (12, Haber).',
  },
  {
    id: 'b-m3-09',
    leccionId: 'm3-l2',
    tipo: 'asiento',
    enunciado: 'La mercadería comprada por S/ 10,000 ingresa al almacén. Registra el ingreso al almacén.',
    cuentas: cuentas('20', '42', '60', '61', '69'),
    lineas: [
      { codigo: '20', debe: 10000 },
      { codigo: '61', haber: 10000 },
    ],
    explicacion: 'Al ingresar al almacén, la mercadería se carga a la 20 y se abona a la 61 Variación de inventarios.',
  },
  {
    id: 'b-m3-10',
    leccionId: 'm3-l2',
    tipo: 'asiento',
    enunciado: 'Recibes la factura de un flete por S/ 800 más IGV, a pagar en 15 días. Registra el gasto.',
    cuentas: cuentas('10', '40111', '42', '60', '63'),
    lineas: [
      { codigo: '63', debe: 800 },
      { codigo: '40111', debe: 144 },
      { codigo: '42', haber: 944 },
    ],
    explicacion: 'El flete es un servicio de terceros (63). El IGV de 144 va al Debe y la deuda total de 944 al Haber de la 42.',
  },

  // ============================== Módulo 4 · Existencias ==============================
  {
    id: 'b-m4-01',
    leccionId: 'm4-l1',
    tipo: 'calculo',
    enunciado: 'Kardex de televisores: saldo inicial 30, entradas 40, salidas por venta 22. ¿Cuál es el saldo final en unidades?',
    respuesta: 48,
    unidad: 'unid.',
    explicacion: '30 + 40 − 22 = 48 unidades. Ese es el saldo que debería encontrarse en el almacén.',
  },
  {
    id: 'b-m4-02',
    leccionId: 'm4-l1',
    tipo: 'calculo',
    enunciado: 'El kardex dice 48 televisores, pero en el conteo físico hay 36. Cada uno cuesta S/ 1,450. ¿Cuál es el valor del faltante?',
    respuesta: 17400,
    unidad: 'S/',
    explicacion: 'Faltan 48 − 36 = 12 unidades. 12 × 1,450 = S/ 17,400.',
  },
  {
    id: 'b-m4-03',
    leccionId: 'm4-l1',
    tipo: 'opcion',
    enunciado: '¿Qué documento acredita que la mercadería salió del almacén hacia el cliente?',
    opciones: ['El voucher bancario', 'La guía de remisión', 'El PDT 621', 'El contrato de alquiler'],
    correcta: 1,
    explicacion: 'La guía de remisión sustenta el traslado de los bienes. Junto con la factura y el kardex, demuestra que la venta fue real.',
  },
  {
    id: 'b-m4-04',
    leccionId: 'm4-l1',
    tipo: 'ordenar',
    enunciado: 'Ordena los pasos para verificar un inventario.',
    pasos: [
      'Obtener el saldo del kardex a la fecha',
      'Realizar el conteo físico en el almacén',
      'Comparar el conteo con el kardex',
      'Investigar las diferencias con guías y comprobantes',
      'Registrar el ajuste y su sustento',
    ],
    explicacion: 'Primero se fija el saldo según registros, luego se cuenta, se compara, se investigan las diferencias y recién al final se ajusta con sustento.',
  },
  {
    id: 'b-m4-05',
    leccionId: 'm4-l2',
    tipo: 'clasificar',
    enunciado: '¿Es merma o desmedro?',
    grupos: ['Merma', 'Desmedro'],
    items: [
      { texto: 'Evaporación del alcohol almacenado', grupo: 0 },
      { texto: 'Yogures vencidos que ya no se pueden vender', grupo: 1 },
      { texto: 'Pérdida de peso del arroz por humedad', grupo: 0 },
      { texto: 'Televisores con la pantalla rota e inservibles', grupo: 1 },
    ],
    explicacion: 'La merma es una pérdida física en cantidad o peso, propia del producto. El desmedro es una pérdida de calidad que deja el bien inutilizable.',
  },
  {
    id: 'b-m4-06',
    leccionId: 'm4-l2',
    tipo: 'vf',
    enunciado: 'Si faltan bienes y no se puede justificar como merma, desmedro o robo denunciado, SUNAT puede considerarlo un retiro de bienes gravado con IGV.',
    correcta: true,
    explicacion: 'El retiro de bienes se considera venta para el IGV. Los faltantes sin sustento suelen tratarse así.',
  },
  {
    id: 'b-m4-07',
    leccionId: 'm4-l2',
    tipo: 'opcion',
    enunciado: 'Para deducir un desmedro, ¿qué debe hacer la empresa?',
    opciones: [
      'Solo anotarlo en el kardex',
      'Destruir los bienes ante notario, comunicando antes a SUNAT',
      'Venderlos sin comprobante',
      'Esperar a que SUNAT lo descubra',
    ],
    correcta: 1,
    explicacion: 'Los desmedros se acreditan con la destrucción de los bienes ante notario público o juez de paz, comunicándola previamente a SUNAT.',
  },
  {
    id: 'b-m4-08',
    leccionId: 'm4-l2',
    tipo: 'calculo',
    enunciado: 'Faltan 12 televisores de S/ 1,450 (valor de mercado) sin sustento. Si SUNAT lo trata como retiro de bienes, ¿cuánto IGV omitido calcula?',
    respuesta: 3132,
    unidad: 'S/',
    explicacion: '12 × 1,450 = 17,400. IGV = 17,400 × 18 % = S/ 3,132.',
  },

  // ============================== Módulo 5 · Gastos y renta ==============================
  {
    id: 'b-m5-01',
    leccionId: 'm5-l1',
    tipo: 'clasificar',
    enunciado: '¿El gasto es deducible para el Impuesto a la Renta de la empresa?',
    grupos: ['Deducible', 'No deducible'],
    items: [
      { texto: 'Alquiler del local de ventas', grupo: 0 },
      { texto: 'Equipamiento de la casa del gerente', grupo: 1 },
      { texto: 'Combustible de la camioneta de reparto', grupo: 0 },
      { texto: 'Cena familiar del dueño un domingo', grupo: 1 },
      { texto: 'Capacitación del personal contable', grupo: 0 },
    ],
    explicacion: 'Por el principio de causalidad, solo se deducen los gastos necesarios para generar renta o mantener la fuente. Los gastos personales no son deducibles.',
  },
  {
    id: 'b-m5-02',
    leccionId: 'm5-l1',
    tipo: 'opcion',
    enunciado: '¿Qué artículo de la Ley del Impuesto a la Renta recoge el principio de causalidad?',
    opciones: ['Artículo 17 de la Ley del IGV', 'Artículo 37 de la Ley del Impuesto a la Renta', 'Artículo 62-A del Código Tributario', 'Artículo 4 de la Ley de bancarización'],
    correcta: 1,
    explicacion: 'El artículo 37 de la LIR permite deducir los gastos necesarios para producir la renta y mantener su fuente.',
  },
  {
    id: 'b-m5-03',
    leccionId: 'm5-l1',
    tipo: 'vf',
    enunciado: 'Un gasto con factura válida y pagado con transferencia siempre es deducible.',
    correcta: false,
    explicacion: 'La factura y el pago son requisitos formales. Además, el gasto debe tener relación con el negocio (causalidad) y ser razonable.',
  },
  {
    id: 'b-m5-04',
    leccionId: 'm5-l1',
    tipo: 'clasificar',
    enunciado: 'Une cada criterio con su significado.',
    grupos: ['Necesidad', 'Normalidad', 'Razonabilidad'],
    items: [
      { texto: 'El gasto ayuda a generar ingresos o mantener el negocio', grupo: 0 },
      { texto: 'Es un gasto habitual en este tipo de actividad', grupo: 1 },
      { texto: 'El monto guarda proporción con los ingresos de la empresa', grupo: 2 },
    ],
    explicacion: 'Estos criterios ayudan a evaluar la causalidad: necesidad, normalidad respecto al giro y razonabilidad del monto.',
  },
  {
    id: 'b-m5-05',
    leccionId: 'm5-l2',
    tipo: 'opcion',
    enunciado: 'La empresa pagó una asesoría de S/ 6,500, pero no hay informes, correos ni actas del servicio. ¿Cuál es el riesgo?',
    opciones: ['Ninguno, hay factura', 'SUNAT puede considerarla una operación no real por falta de fehaciencia', 'Solo una multa por emitir tarde', 'Que el proveedor no cobre'],
    correcta: 1,
    explicacion: 'Sin evidencia de que el servicio se prestó (entregables, comunicaciones, contrato), SUNAT puede desconocer el gasto y el crédito fiscal.',
  },
  {
    id: 'b-m5-06',
    leccionId: 'm5-l2',
    tipo: 'clasificar',
    enunciado: '¿Qué documentos prueban que una compra de mercadería realmente ocurrió?',
    grupos: ['Ayuda a probarla', 'No la prueba por sí solo'],
    items: [
      { texto: 'Guía de remisión firmada al recibir', grupo: 0 },
      { texto: 'Orden de compra y cotización', grupo: 0 },
      { texto: 'Una factura sin nada más', grupo: 1 },
      { texto: 'Ingreso al kardex con fecha y cantidad', grupo: 0 },
      { texto: 'Voucher de transferencia al proveedor', grupo: 0 },
    ],
    explicacion: 'La fehaciencia se demuestra con un conjunto de pruebas coherentes. La factura sola no basta si SUNAT duda de la operación.',
  },
  {
    id: 'b-m5-07',
    leccionId: 'm5-l2',
    tipo: 'documento',
    enunciado: 'Este recibo por honorarios sustenta una asesoría. Encuentra el dato que está mal.',
    documento: doc('recibo_honorarios', { emisorRuc: '20457812364' }),
    errores: ['emisorRuc'],
    explicacion: 'Quien emite un recibo por honorarios es una persona natural, por eso su RUC empieza con 10. Un RUC que empieza con 20 es de una empresa.',
  },
  {
    id: 'b-m5-08',
    leccionId: 'm5-l2',
    tipo: 'vf',
    enunciado: 'Si SUNAT desconoce un gasto por falta de causalidad, también se pierde el crédito fiscal del IGV de esa compra.',
    correcta: true,
    explicacion: 'Uno de los requisitos sustanciales del crédito fiscal es que la compra sea costo o gasto para renta. Si el gasto no se acepta, el IGV tampoco.',
  },

  // ============================== Módulo 6 · Fiscalización ==============================
  {
    id: 'b-m6-01',
    leccionId: 'm6-l1',
    tipo: 'opcion',
    enunciado: 'Según el artículo 62-A del Código Tributario, ¿cuánto dura una fiscalización parcial?',
    opciones: ['30 días hábiles', '6 meses', '1 año', '4 años'],
    correcta: 1,
    explicacion: 'La fiscalización parcial revisa solo algunos elementos de la obligación y tiene un plazo de 6 meses.',
  },
  {
    id: 'b-m6-02',
    leccionId: 'm6-l1',
    tipo: 'opcion',
    enunciado: '¿Y una fiscalización definitiva?',
    opciones: ['3 meses', '6 meses', '1 año, ampliable en casos específicos', 'No tiene plazo'],
    correcta: 2,
    explicacion: 'Según el artículo 62-A del Código Tributario, la fiscalización definitiva dura un año desde que el contribuyente entrega toda la información, con posibles prórrogas en supuestos específicos.',
  },
  {
    id: 'b-m6-03',
    leccionId: 'm6-l1',
    tipo: 'clasificar',
    enunciado: 'Ubica cada característica en su tipo de procedimiento.',
    grupos: ['Fiscalización parcial', 'Fiscalización definitiva'],
    items: [
      { texto: 'Revisa solo uno o algunos elementos del tributo', grupo: 0 },
      { texto: 'Revisa todo el tributo y periodo', grupo: 1 },
      { texto: 'Plazo de 6 meses', grupo: 0 },
      { texto: 'Plazo de 1 año', grupo: 1 },
    ],
    explicacion: 'La parcial se centra en aspectos puntuales y es más corta. La definitiva revisa la obligación completa del periodo.',
  },
  {
    id: 'b-m6-04',
    leccionId: 'm6-l1',
    tipo: 'vf',
    enunciado: 'SUNAT puede hacer una fiscalización parcial electrónica desde sus oficinas, sin visitar a la empresa.',
    correcta: true,
    explicacion: 'Sí. La fiscalización parcial electrónica (artículo 62-B del Código Tributario) se realiza a distancia y empieza con una liquidación preliminar.',
  },
  {
    id: 'b-m6-05',
    leccionId: 'm6-l2',
    tipo: 'ordenar',
    enunciado: 'Llega un requerimiento de SUNAT. Ordena cómo respondes.',
    pasos: [
      'Leer el requerimiento y anotar el plazo',
      'Identificar qué documentos se piden',
      'Reunir y revisar los sustentos',
      'Detectar errores y decidir si conviene rectificar',
      'Presentar la respuesta dentro del plazo',
    ],
    explicacion: 'Lo primero es el plazo. Luego entiendes qué piden, reúnes los sustentos, evalúas si hay errores que corregir y respondes a tiempo.',
  },
  {
    id: 'b-m6-06',
    leccionId: 'm6-l2',
    tipo: 'opcion',
    enunciado: 'Detectas que omitiste ventas en tu declaración antes de que SUNAT te notifique. ¿Qué te conviene?',
    opciones: [
      'Esperar a ver si SUNAT se da cuenta',
      'Rectificar y pagar voluntariamente para acceder a la mayor rebaja de la multa',
      'Borrar los registros del POS',
      'Declarar en el siguiente año',
    ],
    correcta: 1,
    explicacion: 'Subsanar antes de cualquier notificación permite acceder a la mayor rebaja por el régimen de gradualidad. Esperar solo aumenta la multa y los intereses.',
  },
  {
    id: 'b-m6-07',
    leccionId: 'm6-l2',
    tipo: 'calculo',
    enunciado: 'El operador de tarjetas reporta ventas por S/ 68,000 (base), pero declaraste S/ 50,000. ¿Cuánto IGV omitiste?',
    respuesta: 3240,
    unidad: 'S/',
    explicacion: 'Diferencia no declarada: 68,000 − 50,000 = 18,000. IGV omitido = 18,000 × 18 % = S/ 3,240.',
  },
  {
    id: 'b-m6-08',
    leccionId: 'm6-l2',
    tipo: 'vf',
    enunciado: 'En una respuesta a SUNAT conviene incluir todos los documentos que tengas, aunque no estén relacionados con lo que piden.',
    correcta: false,
    explicacion: 'Presenta lo que se pide, ordenado y coherente. Incluir documentos que no sustentan nada (o que contradicen tu posición) debilita tu defensa.',
  },
];
