import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, FileSearch, ScanSearch } from 'lucide-react';
import { AuditDocument, InspectableField } from '../types/audit';

interface DocumentPaperProps {
  document: AuditDocument;
  inspectionMode: boolean;
  zoom: number;
  resolvedFieldIds: string[];
  selectedFieldId: string | null;
  onSelectField: (field: InspectableField) => void;
  compact?: boolean;
}

const KIND_HEADERS: Record<AuditDocument['kind'], { badge: string; accent: string }> = {
  carta_sunat: { badge: 'NOTIFICACIÓN TRIBUTARIA SIMULADA', accent: 'border-amber-600 text-amber-800 bg-amber-50' },
  factura: { badge: 'FACTURA ELECTRÓNICA SIMULADA', accent: 'border-teal-700 text-teal-800 bg-teal-50' },
  nota_credito: { badge: 'NOTA DE CRÉDITO ELECTRÓNICA', accent: 'border-rose-700 text-rose-800 bg-rose-50' },
  registro_compras: { badge: 'FORMATO 8.1 · REGISTRO DE COMPRAS', accent: 'border-slate-700 text-slate-800 bg-slate-100' },
  registro_ventas: { badge: 'FORMATO 14.1 · REGISTRO DE VENTAS', accent: 'border-slate-700 text-slate-800 bg-slate-100' },
  estado_bancario: { badge: 'EXTRACTO BANCARIO SIMULADO', accent: 'border-sky-800 text-sky-900 bg-sky-50' },
  pdt_621: { badge: 'DECLARA FÁCIL 621 · IGV RENTA', accent: 'border-indigo-800 text-indigo-900 bg-indigo-50' },
  guia_remision: { badge: 'GUÍA DE REMISIÓN REMITENTE', accent: 'border-emerald-800 text-emerald-900 bg-emerald-50' },
  kardex: { badge: 'REGISTRO DE INVENTARIO PERMANENTE', accent: 'border-slate-800 text-slate-900 bg-slate-100' },
  contrato: { badge: 'CONTRATO COMERCIAL SIMULADO', accent: 'border-slate-700 text-slate-800 bg-slate-100' },
};

export const DocumentPaper: React.FC<DocumentPaperProps> = ({
  document,
  inspectionMode,
  zoom,
  resolvedFieldIds,
  selectedFieldId,
  onSelectField,
  compact = false,
}) => {
  const kindMeta = KIND_HEADERS[document.kind];
  const pendingFieldsCount = document.inspectableFields.filter(
    (f) => !resolvedFieldIds.includes(f.id)
  ).length;

  const getFieldById = (fieldId?: string) =>
    fieldId ? document.inspectableFields.find((f) => f.id === fieldId) : undefined;

  const renderInteractiveField = (fieldId: string | undefined, children: React.ReactNode) => {
    const field = getFieldById(fieldId);
    if (!field || !inspectionMode) return children;

    const isResolved = resolvedFieldIds.includes(field.id);
    const isSelected = selectedFieldId === field.id;

    return (
      <button
        type="button"
        onClick={() => onSelectField(field)}
        className={`group relative inline-flex flex-wrap items-center gap-2 text-left rounded px-1.5 py-0.5 -mx-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
          isResolved
            ? field.isAnomaly
              ? 'bg-rose-50 text-rose-950 ring-1 ring-rose-400'
              : 'bg-teal-50 text-teal-950 ring-1 ring-teal-500'
            : isSelected
            ? 'bg-amber-200/90 text-slate-950 ring-2 ring-amber-600'
            : 'bg-amber-100/75 hover:bg-amber-200/85 text-slate-950 ring-1 ring-amber-500/70'
        }`}
        title="Haz clic para inspeccionar y sellar este campo"
      >
        <span>{children}</span>
        {isResolved ? (
          <motion.span
            initial={{ scale: 1.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: -3 }}
            transition={{ duration: 0.18 }}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold tracking-wider uppercase ${
              field.isAnomaly
                ? 'border-rose-700 text-rose-800 bg-rose-100/90'
                : 'border-teal-700 text-teal-800 bg-teal-100/90'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>{field.isAnomaly ? 'OBSERVADO' : 'VERIFICADO'}</span>
          </motion.span>
        ) : (
          <FileSearch className="w-3.5 h-3.5 text-amber-700 shrink-0 opacity-85 group-hover:opacity-100" />
        )}
      </button>
    );
  };

  return (
    <div
      className="bg-[#FAFBFD] text-[var(--c-sobre)] rounded-lg border border-slate-300 shadow-xl overflow-hidden transition-transform origin-top"
      style={{ fontSize: `${Math.round(zoom * 100)}%` }}
    >
      {/* Top Educational & Scanner Strip */}
      <div className="bg-slate-900 text-slate-300 px-4 py-2 flex items-center justify-between text-[10px] tracking-wide">
        <span className="flex items-center gap-2">
          <ScanSearch className="w-3.5 h-3.5 text-teal-400" />
          <span>DOCUMENTO EDUCATIVO SIMULADO · AUDIT LAB UDH</span>
        </span>
        {inspectionMode && document.inspectableFields.length > 0 ? (
          <span className="font-mono-tabular text-amber-300 font-semibold">
            {pendingFieldsCount > 0
              ? `${pendingFieldsCount} objetivo(s) por dictaminar`
              : 'Documento inspeccionado al 100%'}
          </span>
        ) : (
          <span className="font-mono-tabular">{document.code}</span>
        )}
      </div>

      <div className={compact ? 'p-4 space-y-4' : 'p-6 sm:p-8 space-y-6'}>
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {document.issuer}
            </p>
            <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900">
              {document.title}
            </h3>
            {document.issuerRuc && (
              <p className="text-xs font-mono-tabular text-slate-600">
                RUC Emisor: {document.issuerRuc}
              </p>
            )}
          </div>

          <div className={`border px-3 py-2 rounded text-right shrink-0 ${kindMeta.accent}`}>
            <p className="text-[10px] font-bold tracking-wider">{kindMeta.badge}</p>
            <p className="font-mono-tabular text-sm font-bold mt-0.5">{document.code}</p>
            <p className="text-[11px] opacity-80 mt-0.5">Fecha: {document.date}</p>
          </div>
        </div>

        {/* Structured Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md p-3.5">
          {document.structuredMeta.map((item) => (
            <div key={item.label} className="flex flex-col">
              <span className="text-[11px] text-slate-500 font-medium">{item.label}</span>
              <div className="font-medium text-slate-900 mt-0.5">
                {renderInteractiveField(item.fieldId, item.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Narrative Body */}
        {document.narrativeBody && document.narrativeBody.length > 0 && (
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed border border-slate-200 rounded-md p-4 bg-white">
            {document.narrativeBody.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        )}

        {/* Line Items Table */}
        {document.lineItems && (
          <div className="overflow-x-auto border border-slate-200 rounded-md bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                  {document.lineItems.headers.map((h) => (
                    <th key={h} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {document.lineItems.rows.map((row) => {
                  const field = getFieldById(row.inspectableFieldId);
                  const isInteractive = Boolean(field && inspectionMode);
                  const isResolved = field ? resolvedFieldIds.includes(field.id) : false;
                  const isSelected = field ? selectedFieldId === field.id : false;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => {
                        if (isInteractive && field) onSelectField(field);
                      }}
                      className={`transition-colors ${
                        isInteractive
                          ? isResolved
                            ? 'bg-rose-50 hover:bg-rose-100/70 cursor-pointer'
                            : isSelected
                            ? 'bg-amber-100 cursor-pointer'
                            : 'bg-amber-50/70 hover:bg-amber-100/80 cursor-pointer'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {row.cells.map((cell, idx) => (
                        <td
                          key={idx}
                          className={`py-2.5 px-3 ${
                            idx >= row.cells.length - 3 && /^[\d,.\-()]+$/.test(cell.replace(/S\/\s?/, ''))
                              ? 'font-mono-tabular'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{cell}</span>
                            {isInteractive && idx === row.cells.length - 1 && (
                              isResolved ? (
                                <motion.span
                                  initial={{ scale: 1.4, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-rose-700 bg-rose-100 text-rose-800 text-[10px] font-bold uppercase shrink-0"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>SELLADO</span>
                                </motion.span>
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              )
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals Section */}
        {document.totals && document.totals.length > 0 && (
          <div className="flex justify-end">
            <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-2 text-xs">
              {document.totals.map((t) => (
                <div
                  key={t.label}
                  className={`flex items-center justify-between gap-4 ${
                    t.emphasis ? 'pt-2 border-t border-slate-300 font-bold text-sm text-slate-950' : 'text-slate-700'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className="font-mono-tabular">
                    {renderInteractiveField(t.fieldId, t.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
