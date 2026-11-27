import React, { useState } from 'react';
import { Calculator, RotateCcw } from 'lucide-react';

interface TaxCalculatorProps {
  suggestedReparo?: number;
}

export const TaxCalculator: React.FC<TaxCalculatorProps> = ({ suggestedReparo = 2529.15 }) => {
  const [mode, setMode] = useState<'igv' | 'reparo'>('igv');
  const [amountStr, setAmountStr] = useState('5900');
  const [includesIgv, setIncludesIgv] = useState(true);
  const [declaredCreditStr, setDeclaredCreditStr] = useState('18450');
  const [observedItemsStr, setObservedItemsStr] = useState(String(suggestedReparo));
  const [gradualidad, setGradualidad] = useState<95 | 70 | 0>(95);

  const amount = Math.max(0, parseFloat(amountStr) || 0);
  const base = includesIgv ? amount / 1.18 : amount;
  const igv = includesIgv ? amount - base : amount * 0.18;
  const total = includesIgv ? amount : amount + igv;

  const declaredCredit = Math.max(0, parseFloat(declaredCreditStr) || 0);
  const reparo = Math.max(0, parseFloat(observedItemsStr) || 0);
  const validCredit = Math.max(0, declaredCredit - reparo);
  const baseMulta = reparo * 0.5; // Art. 178 numeral 1 CT: 50% del tributo omitido / crédito aumentado
  const multaRebajada = baseMulta * (1 - gradualidad / 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-sm font-semibold text-[var(--c-texto)] flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[var(--c-teal)]" />
          <span>Calculadora Tributaria (18%)</span>
        </h4>
        <button
          type="button"
          onClick={() => {
            setAmountStr('5900');
            setDeclaredCreditStr('18450');
            setObservedItemsStr(String(suggestedReparo));
          }}
          className="text-[11px] text-[var(--c-suave)] hover:text-[var(--c-texto)] inline-flex items-center gap-1"
          title="Restablecer valores"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* Mode Switch */}
      <div className="grid grid-cols-2 p-1 bg-[var(--c-fondo)] rounded-lg border border-[var(--c-linea)]">
        <button
          type="button"
          onClick={() => setMode('igv')}
          className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === 'igv' ? 'bg-[var(--c-elevado)] text-[var(--c-teal)]' : 'text-[var(--c-suave)] hover:text-[var(--c-texto)]'
          }`}
        >
          Desglose IGV
        </button>
        <button
          type="button"
          onClick={() => setMode('reparo')}
          className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === 'reparo' ? 'bg-[var(--c-elevado)] text-[var(--c-oro)]' : 'text-[var(--c-suave)] hover:text-[var(--c-texto)]'
          }`}
        >
          Simular Reparo
        </button>
      </div>

      {mode === 'igv' ? (
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-[var(--c-suave)] mb-1">
              Importe en Soles (S/)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--c-fondo)] border border-[var(--c-linea)] text-sm font-mono-tabular text-[var(--c-texto)] focus:outline-none focus:border-[var(--c-teal)]"
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIncludesIgv(true)}
              className={`flex-1 py-1.5 rounded border transition-colors ${
                includesIgv
                  ? 'bg-[var(--c-teal)]/15 border-[var(--c-teal)]/50 text-[var(--c-teal)]'
                  : 'border-[var(--c-linea)] text-[var(--c-suave)]'
              }`}
            >
              Incluye IGV
            </button>
            <button
              type="button"
              onClick={() => setIncludesIgv(false)}
              className={`flex-1 py-1.5 rounded border transition-colors ${
                !includesIgv
                  ? 'bg-[var(--c-teal)]/15 border-[var(--c-teal)]/50 text-[var(--c-teal)]'
                  : 'border-[var(--c-linea)] text-[var(--c-suave)]'
              }`}
            >
              Más IGV (+18%)
            </button>
          </div>

          <div className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-lg p-3 space-y-2 text-xs">
            <div className="flex justify-between text-[var(--c-suave)]">
              <span>Base Imponible</span>
              <span className="font-mono-tabular text-[var(--c-texto)]">S/ {base.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[var(--c-suave)]">
              <span>IGV (18%)</span>
              <span className="font-mono-tabular text-[var(--c-teal)] font-semibold">S/ {igv.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[var(--c-linea)] font-semibold text-[var(--c-texto)]">
              <span>Total Comprobante</span>
              <span className="font-mono-tabular">S/ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '5,900', val: '5900' },
              { label: '9,500', val: '9500' },
              { label: '11,800', val: '11800' },
              { label: '1,180', val: '1180' },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => {
                  setAmountStr(p.val);
                  setIncludesIgv(true);
                }}
                className="px-2 py-1 rounded bg-[var(--c-fondo)] hover:bg-[var(--c-elevado)] border border-[var(--c-linea)] text-[11px] font-mono-tabular text-[var(--c-suave)] hover:text-[var(--c-texto)]"
              >
                S/ {p.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-[var(--c-suave)] mb-1">
              Crédito Fiscal Declarado (S/)
            </label>
            <input
              type="number"
              step="0.01"
              value={declaredCreditStr}
              onChange={(e) => setDeclaredCreditStr(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[var(--c-fondo)] border border-[var(--c-linea)] text-sm font-mono-tabular text-[var(--c-texto)] focus:outline-none focus:border-[var(--c-teal)]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[var(--c-suave)] mb-1">
              Total Reparos IGV Detectados (S/)
            </label>
            <input
              type="number"
              step="0.01"
              value={observedItemsStr}
              onChange={(e) => setObservedItemsStr(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[var(--c-fondo)] border border-[var(--c-linea)] text-sm font-mono-tabular text-[var(--c-oro)] focus:outline-none focus:border-[var(--c-oro)]"
            />
          </div>
          <div>
            <span className="block text-[11px] text-[var(--c-suave)] mb-1">
              Gradualidad de Multa (Art. 178° num. 1)
            </span>
            <div className="grid grid-cols-3 gap-1 text-[11px]">
              {[
                { val: 95 as const, label: '95% Volunt.' },
                { val: 70 as const, label: '70% Induct.' },
                { val: 0 as const, label: '0% Sin reb.' },
              ].map((g) => (
                <button
                  key={g.val}
                  type="button"
                  onClick={() => setGradualidad(g.val)}
                  className={`py-1 rounded border font-medium ${
                    gradualidad === g.val
                      ? 'bg-[var(--c-oro)]/15 border-[var(--c-oro)]/50 text-[var(--c-oro)]'
                      : 'border-[var(--c-linea)] text-[var(--c-suave)]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[var(--c-fondo)] border border-[var(--c-linea)] rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-[var(--c-suave)]">
              <span>Crédito Fiscal Válido</span>
              <span className="font-mono-tabular text-[var(--c-teal)] font-semibold">
                S/ {validCredit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-[var(--c-suave)]">
              <span>Multa Base (50%)</span>
              <span className="font-mono-tabular text-[var(--c-texto)]">S/ {baseMulta.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-[var(--c-linea)] font-semibold text-[var(--c-oro)]">
              <span>Multa c/ Gradualidad</span>
              <span className="font-mono-tabular">S/ {multaRebajada.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
