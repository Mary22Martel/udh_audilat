/**
 * Tipos de pregunta de la Academia y de los proyectos por equipos.
 * La función `calificar` es la misma en el servidor y en la pantalla, así nunca se contradicen.
 */

// --- Comprobantes (plantillas que el docente edita) -------------------------------------------------------------

export type TipoComprobante = 'factura' | 'boleta' | 'nota_credito' | 'guia_remision' | 'recibo_honorarios';

export interface ItemComprobante {
  descripcion: string;
  cantidad: string;
  valorUnitario: string;
}

export interface Comprobante {
  tipo: TipoComprobante;
  /** Valor de cada campo, tal como se ve en el papel (el docente puede escribir un dato equivocado a propósito). */
  campos: Record<string, string>;
  items: ItemComprobante[];
}

export interface DefCampo {
  clave: string;
  etiqueta: string;
  zona: 'cabecera' | 'emisor' | 'cliente' | 'detalle' | 'totales' | 'pie';
}

export const NOMBRE_COMPROBANTE: Record<TipoComprobante, string> = {
  factura: 'Factura electrónica',
  boleta: 'Boleta de venta electrónica',
  nota_credito: 'Nota de crédito electrónica',
  guia_remision: 'Guía de remisión remitente',
  recibo_honorarios: 'Recibo por honorarios electrónico',
};

const EMISOR: DefCampo[] = [
  { clave: 'emisorRazon', etiqueta: 'Razón social del emisor', zona: 'emisor' },
  { clave: 'emisorRuc', etiqueta: 'RUC del emisor', zona: 'emisor' },
  { clave: 'emisorDireccion', etiqueta: 'Dirección del emisor', zona: 'emisor' },
];

export const CAMPOS_COMPROBANTE: Record<TipoComprobante, DefCampo[]> = {
  factura: [
    { clave: 'serie', etiqueta: 'Serie y número', zona: 'cabecera' },
    { clave: 'fecha', etiqueta: 'Fecha de emisión', zona: 'cabecera' },
    ...EMISOR,
    { clave: 'clienteRazon', etiqueta: 'Razón social del cliente', zona: 'cliente' },
    { clave: 'clienteRuc', etiqueta: 'RUC del cliente', zona: 'cliente' },
    { clave: 'moneda', etiqueta: 'Moneda', zona: 'cliente' },
    { clave: 'formaPago', etiqueta: 'Forma de pago', zona: 'cliente' },
    { clave: 'opGravada', etiqueta: 'Op. gravada', zona: 'totales' },
    { clave: 'igv', etiqueta: 'IGV 18 %', zona: 'totales' },
    { clave: 'total', etiqueta: 'Importe total', zona: 'totales' },
  ],
  boleta: [
    { clave: 'serie', etiqueta: 'Serie y número', zona: 'cabecera' },
    { clave: 'fecha', etiqueta: 'Fecha de emisión', zona: 'cabecera' },
    ...EMISOR,
    { clave: 'clienteRazon', etiqueta: 'Cliente', zona: 'cliente' },
    { clave: 'clienteDoc', etiqueta: 'DNI del cliente', zona: 'cliente' },
    { clave: 'moneda', etiqueta: 'Moneda', zona: 'cliente' },
    { clave: 'total', etiqueta: 'Importe total', zona: 'totales' },
  ],
  nota_credito: [
    { clave: 'serie', etiqueta: 'Serie y número', zona: 'cabecera' },
    { clave: 'fecha', etiqueta: 'Fecha de emisión', zona: 'cabecera' },
    ...EMISOR,
    { clave: 'clienteRazon', etiqueta: 'Razón social del cliente', zona: 'cliente' },
    { clave: 'clienteRuc', etiqueta: 'RUC del cliente', zona: 'cliente' },
    { clave: 'docModifica', etiqueta: 'Documento que modifica', zona: 'cliente' },
    { clave: 'motivo', etiqueta: 'Motivo', zona: 'cliente' },
    { clave: 'opGravada', etiqueta: 'Op. gravada', zona: 'totales' },
    { clave: 'igv', etiqueta: 'IGV 18 %', zona: 'totales' },
    { clave: 'total', etiqueta: 'Importe total', zona: 'totales' },
  ],
  guia_remision: [
    { clave: 'serie', etiqueta: 'Serie y número', zona: 'cabecera' },
    { clave: 'fecha', etiqueta: 'Fecha de inicio del traslado', zona: 'cabecera' },
    ...EMISOR,
    { clave: 'clienteRazon', etiqueta: 'Destinatario', zona: 'cliente' },
    { clave: 'clienteRuc', etiqueta: 'RUC del destinatario', zona: 'cliente' },
    { clave: 'partida', etiqueta: 'Punto de partida', zona: 'cliente' },
    { clave: 'llegada', etiqueta: 'Punto de llegada', zona: 'cliente' },
    { clave: 'motivo', etiqueta: 'Motivo del traslado', zona: 'cliente' },
    { clave: 'transportista', etiqueta: 'Transportista / placa', zona: 'pie' },
  ],
  recibo_honorarios: [
    { clave: 'serie', etiqueta: 'Serie y número', zona: 'cabecera' },
    { clave: 'fecha', etiqueta: 'Fecha de emisión', zona: 'cabecera' },
    { clave: 'emisorRazon', etiqueta: 'Nombre del profesional', zona: 'emisor' },
    { clave: 'emisorRuc', etiqueta: 'RUC del profesional', zona: 'emisor' },
    { clave: 'clienteRazon', etiqueta: 'Recibí de', zona: 'cliente' },
    { clave: 'clienteRuc', etiqueta: 'RUC del cliente', zona: 'cliente' },
    { clave: 'concepto', etiqueta: 'Por concepto de', zona: 'cliente' },
    { clave: 'total', etiqueta: 'Total por honorarios', zona: 'totales' },
    { clave: 'retencion', etiqueta: 'Retención (impuesto a la renta)', zona: 'totales' },
    { clave: 'neto', etiqueta: 'Total neto recibido', zona: 'totales' },
  ],
};

/** Campos de cada línea de detalle: se marcan como «item0.valorUnitario», «item1.cantidad», etc. */
export const CAMPOS_ITEM: { clave: keyof ItemComprobante; etiqueta: string }[] = [
  { clave: 'cantidad', etiqueta: 'Cantidad' },
  { clave: 'descripcion', etiqueta: 'Descripción' },
  { clave: 'valorUnitario', etiqueta: 'Valor unitario' },
];

export const tieneItems = (t: TipoComprobante) => t !== 'recibo_honorarios';

export function etiquetaCampo(c: Comprobante, clave: string): string {
  const m = clave.match(/^item(\d+)\.(\w+)$/);
  if (m) return `Línea ${Number(m[1]) + 1}: ${CAMPOS_ITEM.find((x) => x.clave === m[2])?.etiqueta ?? m[2]}`;
  return CAMPOS_COMPROBANTE[c.tipo].find((f) => f.clave === clave)?.etiqueta ?? clave;
}

export function valorCampo(c: Comprobante, clave: string): string {
  const m = clave.match(/^item(\d+)\.(\w+)$/);
  if (m) return c.items[Number(m[1])]?.[m[2] as keyof ItemComprobante] ?? '';
  return c.campos[clave] ?? '';
}

const num = (s: string) => Number(String(s).replace(/[^\d.-]/g, '')) || 0;
export const soles = (n: number) => `S/ ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Totales correctos según las líneas de detalle (el editor los usa para «Recalcular»). */
export function totalesCorrectos(c: Comprobante): Record<string, string> {
  const base = c.items.reduce((s, it) => s + num(it.cantidad) * num(it.valorUnitario), 0);
  if (c.tipo === 'recibo_honorarios') {
    const total = num(c.campos.total);
    const ret = total > 1500 ? Math.round(total * 0.08 * 100) / 100 : 0;
    return { retencion: soles(ret), neto: soles(total - ret) };
  }
  if (c.tipo === 'boleta') return { total: soles(Math.round(base * 1.18 * 100) / 100) };
  if (c.tipo === 'guia_remision') return {};
  const igv = Math.round(base * 0.18 * 100) / 100;
  return { opGravada: soles(base), igv: soles(igv), total: soles(base + igv) };
}

export function plantillaComprobante(tipo: TipoComprobante): Comprobante {
  const base: Record<TipoComprobante, Comprobante> = {
    factura: {
      tipo,
      campos: {
        serie: 'F001-000245',
        fecha: '12/10/2026',
        emisorRazon: 'Distribuidora Huallaga S.A.C.',
        emisorRuc: '20604512387',
        emisorDireccion: 'Jr. Dos de Mayo 845, Huánuco',
        clienteRazon: 'Comercializadora Huánuco S.A.C.',
        clienteRuc: '20604819321',
        moneda: 'Soles',
        formaPago: 'Crédito a 30 días',
      },
      items: [
        { descripcion: 'Arroz extra x 50 kg', cantidad: '20', valorUnitario: '150.00' },
        { descripcion: 'Aceite vegetal caja x 12', cantidad: '10', valorUnitario: '96.00' },
      ],
    },
    boleta: {
      tipo,
      campos: {
        serie: 'B001-001532',
        fecha: '15/10/2026',
        emisorRazon: 'Librería El Estudiante E.I.R.L.',
        emisorRuc: '20573311205',
        emisorDireccion: 'Jr. Huánuco 320, Huánuco',
        clienteRazon: 'María López Ríos',
        clienteDoc: '45871236',
        moneda: 'Soles',
      },
      items: [{ descripcion: 'Calculadora financiera', cantidad: '1', valorUnitario: '120.00' }],
    },
    nota_credito: {
      tipo,
      campos: {
        serie: 'FC01-000044',
        fecha: '20/10/2026',
        emisorRazon: 'Distribuidora Huallaga S.A.C.',
        emisorRuc: '20604512387',
        emisorDireccion: 'Jr. Dos de Mayo 845, Huánuco',
        clienteRazon: 'Comercializadora Huánuco S.A.C.',
        clienteRuc: '20604819321',
        docModifica: 'Factura F001-000245',
        motivo: 'Devolución de mercadería',
      },
      items: [{ descripcion: 'Devolución arroz extra x 50 kg', cantidad: '2', valorUnitario: '150.00' }],
    },
    guia_remision: {
      tipo,
      campos: {
        serie: 'T001-000318',
        fecha: '12/10/2026',
        emisorRazon: 'Distribuidora Huallaga S.A.C.',
        emisorRuc: '20604512387',
        emisorDireccion: 'Jr. Dos de Mayo 845, Huánuco',
        clienteRazon: 'Comercializadora Huánuco S.A.C.',
        clienteRuc: '20604819321',
        partida: 'Jr. Dos de Mayo 845, Huánuco',
        llegada: 'Av. Universitaria 1210, Pillco Marca',
        motivo: 'Venta',
        transportista: 'Transportes Valle Alto S.A.C. · Placa C4R-512',
      },
      items: [
        { descripcion: 'Arroz extra x 50 kg', cantidad: '20', valorUnitario: '—' },
        { descripcion: 'Aceite vegetal caja x 12', cantidad: '10', valorUnitario: '—' },
      ],
    },
    recibo_honorarios: {
      tipo,
      campos: {
        serie: 'E001-58',
        fecha: '05/10/2026',
        emisorRazon: 'Carlos Rojas Tarazona',
        emisorRuc: '10457812364',
        clienteRazon: 'Servicios Empresariales del Centro S.A.C.',
        clienteRuc: '20603319871',
        concepto: 'Asesoría contable mensual – setiembre 2026',
        total: 'S/ 2,000.00',
      },
      items: [],
    },
  };
  const c = base[tipo];
  return { ...c, campos: { ...c.campos, ...totalesCorrectos(c) } };
}

// --- Preguntas --------------------------------------------------------------------------------------------------

export interface CuentaContable {
  codigo: string;
  nombre: string;
}

export interface LineaAsiento {
  codigo: string;
  debe?: number;
  haber?: number;
}

export type DatosPregunta =
  | { tipo: 'opcion'; opciones: string[]; correcta: number }
  | { tipo: 'vf'; correcta: boolean }
  | { tipo: 'calculo'; respuesta: number; tolerancia?: number; unidad?: string }
  | { tipo: 'clasificar'; grupos: string[]; items: { texto: string; grupo: number }[] }
  | { tipo: 'asiento'; cuentas: CuentaContable[]; lineas: LineaAsiento[] }
  | { tipo: 'documento'; documento: Comprobante; errores: string[] }
  | { tipo: 'ordenar'; pasos: string[] };

export type TipoPregunta = DatosPregunta['tipo'];

export type Pregunta = DatosPregunta & {
  id: string;
  leccionId: string;
  enunciado: string;
  explicacion: string;
  /** Nombre de quien la creó (null = pregunta base del sistema). */
  autor?: string | null;
  activo?: boolean;
  editada?: boolean;
};

export const NOMBRE_TIPO: Record<TipoPregunta, { nombre: string; juego: string }> = {
  opcion: { nombre: 'Opción múltiple', juego: 'Dictamen' },
  vf: { nombre: 'Verdadero o falso', juego: '¿Procede o no procede?' },
  calculo: { nombre: 'Cálculo', juego: 'Calcula' },
  clasificar: { nombre: 'Clasificar', juego: 'Clasifica' },
  asiento: { nombre: 'Asiento contable', juego: 'Arma el asiento' },
  documento: { nombre: 'Encontrar el error en un comprobante', juego: 'Encuentra el error' },
  ordenar: { nombre: 'Ordenar pasos', juego: 'Ordena el procedimiento' },
};

/** Respuesta del alumno según el tipo de pregunta. */
export type Respuesta =
  | { tipo: 'opcion'; indice: number }
  | { tipo: 'vf'; valor: boolean }
  | { tipo: 'calculo'; valor: number }
  | { tipo: 'clasificar'; grupos: number[] } // grupo elegido para cada ítem, en el orden original
  | { tipo: 'asiento'; lineas: LineaAsiento[] }
  | { tipo: 'documento'; marcados: string[] }
  | { tipo: 'ordenar'; orden: string[] };

const mismoConjunto = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
const redondear = (n: number | undefined) => Math.round((n ?? 0) * 100);

export function calificar(p: DatosPregunta, r: Respuesta | null | undefined): boolean {
  if (!r || r.tipo !== p.tipo) return false;
  switch (p.tipo) {
    case 'opcion':
      return (r as { indice: number }).indice === p.correcta;
    case 'vf':
      return (r as { valor: boolean }).valor === p.correcta;
    case 'calculo': {
      const v = Number((r as { valor: number }).valor);
      return Number.isFinite(v) && Math.abs(v - p.respuesta) <= (p.tolerancia ?? 0.01);
    }
    case 'clasificar': {
      const g = (r as { grupos: number[] }).grupos;
      return g.length === p.items.length && p.items.every((it, i) => g[i] === it.grupo);
    }
    case 'asiento': {
      const clave = (l: LineaAsiento) => `${l.codigo}:${redondear(l.debe)}:${redondear(l.haber)}`;
      const dadas = (r as { lineas: LineaAsiento[] }).lineas.filter((l) => l.codigo).map(clave);
      return mismoConjunto(dadas, p.lineas.map(clave));
    }
    case 'documento':
      return mismoConjunto((r as { marcados: string[] }).marcados, p.errores);
    case 'ordenar':
      return (r as { orden: string[] }).orden.join('|') === p.pasos.join('|');
  }
}

/** Mezcla con semilla (para que el orden no cambie mientras el alumno responde). */
export function mezclar<T>(arr: T[], semilla = Math.random() * 1e9): T[] {
  const a = [...arr];
  let s = Math.floor(semilla) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Versión sin respuestas (para las competencias: los equipos no deben poder ver la solución).
 * Los pasos para ordenar y los ítems para clasificar se mantienen; solo se quita lo que delata la respuesta.
 */
export function sinRespuestas(p: Pregunta): Pregunta {
  const base = { ...p, explicacion: '' };
  switch (p.tipo) {
    case 'opcion':
      return { ...base, tipo: 'opcion', opciones: p.opciones, correcta: -1 };
    case 'vf':
      return { ...base, tipo: 'vf', correcta: false };
    case 'calculo':
      return { ...base, tipo: 'calculo', respuesta: 0, unidad: p.unidad };
    case 'clasificar':
      return { ...base, tipo: 'clasificar', grupos: p.grupos, items: p.items.map((it) => ({ texto: it.texto, grupo: -1 })) };
    case 'asiento':
      return { ...base, tipo: 'asiento', cuentas: p.cuentas, lineas: p.lineas.map(() => ({ codigo: '' })) };
    case 'documento':
      return { ...base, tipo: 'documento', documento: p.documento, errores: [] };
    case 'ordenar':
      return { ...base, tipo: 'ordenar', pasos: mezclar(p.pasos, p.id.length * 7919) };
  }
}

/** Revisa que una pregunta escrita por un docente esté completa antes de guardarla. */
export function validarPregunta(p: Pregunta): string | null {
  if (!p.enunciado?.trim()) return 'Escribe el enunciado.';
  if (!p.leccionId) return 'Elige la lección.';
  switch (p.tipo) {
    case 'opcion':
      if (p.opciones.filter((o) => o.trim()).length < 2) return 'Escribe al menos dos opciones.';
      if (p.correcta < 0 || p.correcta >= p.opciones.length || !p.opciones[p.correcta]?.trim()) return 'Marca la opción correcta.';
      return null;
    case 'vf':
      return typeof p.correcta === 'boolean' ? null : 'Indica si es verdadero o falso.';
    case 'calculo':
      return Number.isFinite(p.respuesta) ? null : 'Escribe la respuesta numérica.';
    case 'clasificar':
      if (p.grupos.filter((g) => g.trim()).length < 2) return 'Escribe al menos dos grupos.';
      if (p.items.length < 2 || p.items.some((it) => !it.texto.trim() || it.grupo < 0 || it.grupo >= p.grupos.length)) return 'Cada elemento necesita texto y grupo.';
      return null;
    case 'asiento': {
      if (p.lineas.length < 2 || p.lineas.some((l) => !l.codigo)) return 'El asiento necesita al menos dos líneas con cuenta.';
      const d = p.lineas.reduce((s, l) => s + (l.debe ?? 0), 0);
      const h = p.lineas.reduce((s, l) => s + (l.haber ?? 0), 0);
      if (Math.abs(d - h) > 0.005) return `El asiento no cuadra: Debe ${d.toFixed(2)} y Haber ${h.toFixed(2)}.`;
      return null;
    }
    case 'documento':
      return p.errores.length ? null : 'Marca al menos un campo con error.';
    case 'ordenar':
      return p.pasos.filter((x) => x.trim()).length >= 3 ? null : 'Escribe al menos tres pasos.';
  }
}
