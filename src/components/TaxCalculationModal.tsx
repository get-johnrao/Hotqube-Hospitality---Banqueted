import React, { useState } from 'react';
import { RateItem, TaxCalculationHistoryEntry } from '../types';
import { formatINR, formatDisplayDate, calculateFromInclusiveRate } from '../utils/formatters';
import {
  Calculator,
  Plus,
  Trash2,
  AlertCircle,
  X,
  History,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface TaxCalculationModalProps {
  initialItems?: RateItem[];
  initialBaseRate?: number;
  onAccept?: (items: RateItem[], baseRate: number, billedValue: number) => void;
  onClose: () => void;
}

const HISTORY_STORAGE_KEY = 'bems_tax_calculator_history_v1';

export const TaxCalculationModal: React.FC<TaxCalculationModalProps> = ({
  initialItems,
  initialBaseRate = 0,
  onAccept,
  onClose,
}) => {
  const [items, setItems] = useState<RateItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return [
      {
        id: '1',
        description: 'Banquet Hall Space Rental',
        amount: initialBaseRate > 0 ? initialBaseRate : 150000,
        taxRate: 18.0, // Standard 18% GST default
        taxAmount: (initialBaseRate > 0 ? initialBaseRate : 150000) * 0.18,
        totalWithTax: (initialBaseRate > 0 ? initialBaseRate : 150000) * 1.18,
      },
    ];
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isInclusiveMode, setIsInclusiveMode] = useState<boolean>(false);

  // History state: up to last 50 entries
  const [history, setHistory] = useState<TaxCalculationHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.slice(0, 50) : [];
      }
    } catch (e) {
      console.error('Failed to load tax history:', e);
    }
    return [];
  });

  const calculateItem = (amount: number, taxRate: number) => {
    const tax = amount * (taxRate / 100);
    return {
      taxAmount: Math.round(tax),
      totalWithTax: Math.round(amount + tax),
    };
  };

  const handleToggleInclusiveMode = (checked: boolean) => {
    setIsInclusiveMode(checked);
    setError('');
    setSuccessMessage(null);
    const updated = items.map(item => {
      if (checked) {
        // Switching to all-inclusive rate mode:
        // Use existing totalWithTax (or amount + taxAmount) as the all-inclusive target
        const inc = item.inclusiveAmount !== undefined && item.inclusiveAmount > 0
          ? item.inclusiveAmount
          : (item.totalWithTax || Math.round(item.amount + item.taxAmount));
        const calc = calculateFromInclusiveRate(inc, item.taxRate);
        return {
          ...item,
          isInclusive: true,
          inclusiveAmount: inc,
          amount: calc.baseRate,
          taxAmount: calc.taxAmount,
          totalWithTax: inc,
        };
      } else {
        // Switching to base exclusive mode
        return {
          ...item,
          isInclusive: false,
        };
      }
    });
    setItems(updated);
  };

  const handleItemChange = (index: number, field: 'description' | 'amount' | 'taxRate', value: any) => {
    setError('');
    setSuccessMessage(null);
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === 'description') {
      item.description = value;
    } else if (field === 'amount') {
      const val = Math.max(0, parseFloat(value) || 0);
      if (isInclusiveMode) {
        item.inclusiveAmount = val;
        item.isInclusive = true;
        const calc = calculateFromInclusiveRate(val, item.taxRate);
        item.amount = calc.baseRate;
        item.taxAmount = calc.taxAmount;
        item.totalWithTax = val;
      } else {
        item.amount = val;
        item.inclusiveAmount = undefined;
        item.isInclusive = false;
        const calc = calculateItem(val, item.taxRate);
        item.taxAmount = calc.taxAmount;
        item.totalWithTax = calc.totalWithTax;
      }
    } else if (field === 'taxRate') {
      const rate = parseFloat(value) || 0;
      item.taxRate = rate;
      if (isInclusiveMode && (item.inclusiveAmount !== undefined || item.totalWithTax)) {
        const inc = item.inclusiveAmount !== undefined && item.inclusiveAmount > 0 ? item.inclusiveAmount : item.totalWithTax;
        const calc = calculateFromInclusiveRate(inc, rate);
        item.amount = calc.baseRate;
        item.taxAmount = calc.taxAmount;
        item.totalWithTax = inc;
      } else {
        const calc = calculateItem(item.amount, rate);
        item.taxAmount = calc.taxAmount;
        item.totalWithTax = calc.totalWithTax;
      }
    }

    updated[index] = item;
    setItems(updated);
  };

  const addItem = () => {
    if (items.length >= 4) {
      setError('Maximum 4 rate line items allowed per enquiry specification.');
      return;
    }
    const defaultDescriptions = [
      'Catering & Buffet Package',
      'Audio Visual & Production',
      'High Tea & Refreshments',
      'Special Floral & Decor Inclusions',
    ];
    const desc = defaultDescriptions[items.length - 1] || 'Additional Banquet Service';
    const taxRate = 18.0;

    if (isInclusiveMode) {
      const incAmount = 59000;
      const calc = calculateFromInclusiveRate(incAmount, taxRate);
      setItems([
        ...items,
        {
          id: Date.now().toString(),
          description: desc,
          amount: calc.baseRate,
          taxRate,
          taxAmount: calc.taxAmount,
          totalWithTax: incAmount,
          isInclusive: true,
          inclusiveAmount: incAmount,
        },
      ]);
    } else {
      const amount = 50000;
      const calc = calculateItem(amount, taxRate);
      setItems([
        ...items,
        {
          id: Date.now().toString(),
          description: desc,
          amount,
          taxRate,
          taxAmount: calc.taxAmount,
          totalWithTax: calc.totalWithTax,
          isInclusive: false,
        },
      ]);
    }
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      setError('At least 1 rate item is required for the tax breakdown.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const totalBaseRate = items.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalTaxes = items.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0);
  const billedValue = totalBaseRate + totalTaxes;

  const saveToHistory = (calcItems: RateItem[], base: number, taxes: number, billed: number) => {
    const entry: TaxCalculationHistoryEntry = {
      id: 'CALC_' + Date.now(),
      timestamp: new Date().toISOString(),
      items: JSON.parse(JSON.stringify(calcItems)),
      totalBaseRate: base,
      totalTaxes: taxes,
      billedValue: billed,
    };
    const updated = [entry, ...history.filter(h => h.id !== entry.id)].slice(0, 50);
    setHistory(updated);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleValidateAndCalculate = () => {
    setError('');
    setSuccessMessage(null);

    if (items.length === 0) {
      setError('Please add at least one line item.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.description.trim()) {
        setError(`Item #${i + 1} description cannot be empty.`);
        return;
      }
      if (it.amount <= 0) {
        setError(`Item #${i + 1} amount must be greater than ₹0.`);
        return;
      }
      // Mandatory Tax % rule: [5.0%, 23.9%]
      if (it.taxRate < 5.0 || it.taxRate > 23.9) {
        setError(
          `Item #${i + 1} Tax Rate (${it.taxRate}%) is invalid. Each tax rate must be between 5.0% and 23.9% strictly.`
        );
        return;
      }
    }

    // Save to history (up to last 50 entries)
    saveToHistory(items, totalBaseRate, totalTaxes, billedValue);

    if (onAccept) {
      onAccept(items, totalBaseRate, billedValue);
    } else {
      setSuccessMessage(`Calculation recorded in History! Total Billed Value: ${formatINR(billedValue)}`);
    }
  };

  const handleRestoreFromHistory = (entry: TaxCalculationHistoryEntry) => {
    if (entry.items && entry.items.length > 0) {
      setItems(JSON.parse(JSON.stringify(entry.items)));
      setShowHistory(false);
      setError('');
      setSuccessMessage(`Loaded previous calculation from ${new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all 50 calculator history entries?')) {
      setHistory([]);
      try {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteHistoryEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="tax-calculation-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-sky-200 rounded-2xl p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-sky-100 transition-colors"
          title="Close calculator"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-5 pr-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Itemized Package Pricing & Tax Calculator</h2>
              <p className="text-xs text-slate-500">
                Tax percentage enforced between <strong className="text-teal-700">5.0%</strong> and <strong className="text-teal-700">23.9%</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              showHistory
                ? 'bg-teal-50 border-teal-300 text-teal-800'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5 text-teal-600" />
            <span>History ({history.length}/50)</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* View Mode: History OR Calculator */}
        {showHistory ? (
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <History className="w-4 h-4 text-teal-600" />
                <span>Calculator History (Last {history.length} of 50 entries)</span>
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline"
                >
                  Clear All History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-xl border border-slate-200">
                <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No calculation history entries recorded yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Perform a calculation using <strong className="text-slate-600">=&gt; Calculate</strong> to save it here automatically.
                </p>
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
                {history.map((entry, idx) => {
                  const entryDate = new Date(entry.timestamp);
                  return (
                    <div
                      key={entry.id || idx}
                      className="p-3.5 bg-white border border-slate-200 hover:border-teal-300 rounded-xl transition-all shadow-2xs flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold rounded">
                            #{history.length - idx}
                          </span>
                          <span className="text-xs font-medium text-slate-700">
                            {formatDisplayDate(entryDate.toISOString().split('T')[0])} at {entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRestoreFromHistory(entry)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Load</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteHistoryEntry(entry.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Items list preview */}
                      <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {(entry.items || []).map((it, itemIdx) => (
                          <div key={itemIdx} className="flex justify-between items-center">
                            <span className="truncate max-w-[280px]">
                              {it.description || 'Banquet Item'} <span className="text-slate-400">({it.taxRate}%)</span>
                            </span>
                            <span className="font-mono text-slate-700 font-medium">{formatINR(it.totalWithTax || it.amount)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Summary footer */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <div className="text-slate-500 font-mono text-[11px]">
                          Base: {formatINR(entry.totalBaseRate)} + Tax: {formatINR(entry.totalTaxes)}
                        </div>
                        <div className="font-bold text-teal-800 bg-teal-50/80 px-2.5 py-0.5 rounded border border-teal-200 font-mono">
                          Billed: {formatINR(entry.billedValue)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Standard Calculator Input View */
          <>
            {/* All-Inclusive Rate Mode Checkbox Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-teal-50/80 border border-teal-200 rounded-xl mb-4 shadow-2xs">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="calc-inclusive-mode-toggle"
                  checked={isInclusiveMode}
                  onChange={e => handleToggleInclusiveMode(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 border-teal-300 focus:ring-teal-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-xs text-teal-900 flex items-center gap-1.5">
                    Enter All-Inclusive Rate (Net Spoken Mode)
                  </span>
                  <span className="text-[11px] text-teal-700 block">
                    Calculates base rate and taxes automatically from spoken net rate (e.g. ₹1,239 net → ₹1,000 base + ₹239 tax at 23.9%).
                  </span>
                </div>
              </label>

              {isInclusiveMode && (
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Example:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...items];
                      const calc = calculateFromInclusiveRate(1239, 23.9);
                      updated[0] = {
                        ...updated[0],
                        description: updated[0].description || 'Banquet Package (1239 Net)',
                        amount: calc.baseRate,
                        taxRate: 23.9,
                        taxAmount: calc.taxAmount,
                        totalWithTax: 1239,
                        isInclusive: true,
                        inclusiveAmount: 1239,
                      };
                      setItems(updated);
                      setSuccessMessage('Loaded example: ₹1,239 net with 23.9% tax = ₹1,000 base + ₹239 tax');
                    }}
                    className="px-2 py-0.5 bg-white hover:bg-teal-100 text-teal-800 border border-teal-300 rounded text-[11px] font-mono font-bold transition-colors cursor-pointer"
                    title="Load user example: 1239 net with 23.9% tax"
                  >
                    ₹1,239 (23.9%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...items];
                      const calc = calculateFromInclusiveRate(1180, 18.0);
                      updated[0] = {
                        ...updated[0],
                        description: updated[0].description || 'Banquet Package (1180 Net)',
                        amount: calc.baseRate,
                        taxRate: 18.0,
                        taxAmount: calc.taxAmount,
                        totalWithTax: 1180,
                        isInclusive: true,
                        inclusiveAmount: 1180,
                      };
                      setItems(updated);
                      setSuccessMessage('Loaded example: ₹1,180 net with 18% tax = ₹1,000 base + ₹180 tax');
                    }}
                    className="px-2 py-0.5 bg-white hover:bg-teal-100 text-teal-800 border border-teal-300 rounded text-[11px] font-mono font-bold transition-colors cursor-pointer"
                    title="Load standard GST example: 1180 net with 18% tax"
                  >
                    ₹1,180 (18%)
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
                <div className="col-span-5">Item Description</div>
                <div className="col-span-3 text-right">
                  {isInclusiveMode ? 'All-Inclusive Net (₹)' : 'Base Rate (₹)'}
                </div>
                <div className="col-span-2 text-center">Tax % (5-23.9)</div>
                <div className="col-span-2 text-right">
                  {isInclusiveMode ? 'Base + Tax' : 'Total (₹)'}
                </div>
              </div>

              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-center p-2.5 bg-sky-50/50 border border-sky-100 rounded-xl"
                >
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => handleItemChange(index, 'description', e.target.value)}
                      placeholder="e.g. Hall Rent / Buffet Lunch"
                      className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-teal-500"
                    />
                    {isInclusiveMode && (
                      <span className="text-[10px] text-teal-700 font-mono mt-0.5 block">
                        Net Mode Active
                      </span>
                    )}
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      step={isInclusiveMode ? '1' : '500'}
                      value={
                        isInclusiveMode
                          ? (item.inclusiveAmount !== undefined ? item.inclusiveAmount : (item.totalWithTax || ''))
                          : (item.amount || '')
                      }
                      onChange={e => handleItemChange(index, 'amount', e.target.value)}
                      placeholder={isInclusiveMode ? 'e.g. 1239' : '₹ Amount'}
                      className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 text-xs text-right font-mono focus:outline-none focus:border-teal-500"
                    />
                    {isInclusiveMode && (
                      <div className="text-[10px] font-mono text-teal-800 text-right mt-1 font-semibold leading-tight">
                        <span>Base: ₹{item.amount.toLocaleString('en-IN')}</span>
                        <span className="text-amber-800 block">+ Tax: ₹{item.taxAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="5.0"
                        max="23.9"
                        step="0.1"
                        value={item.taxRate || ''}
                        onChange={e => handleItemChange(index, 'taxRate', e.target.value)}
                        placeholder="18.0"
                        className="w-full px-2 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 text-xs text-center font-mono focus:outline-none focus:border-teal-500"
                      />
                      <span className="absolute right-2 top-2 text-slate-400 text-xs">%</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1 text-[9px] font-mono">
                      <button
                        type="button"
                        onClick={() => handleItemChange(index, 'taxRate', 18.0)}
                        className="text-teal-700 hover:underline"
                        title="Set 18% GST"
                      >
                        18%
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleItemChange(index, 'taxRate', 23.9)}
                        className="text-teal-700 hover:underline"
                        title="Set 23.9% Tax"
                      >
                        23.9%
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-teal-700 block">
                        {formatINR(item.totalWithTax)}
                      </span>
                      {isInclusiveMode && (
                        <span className="text-[9px] font-mono text-slate-500 block">
                          Net Billed
                        </span>
                      )}
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Remove line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {items.length < 4 && (
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full py-2 border border-dashed border-sky-300 hover:border-teal-500 rounded-xl text-xs font-semibold text-slate-600 hover:text-teal-700 flex items-center justify-center gap-1.5 transition-colors bg-sky-50/30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rate Line Item ({items.length}/4)</span>
                </button>
              )}
            </div>

            {/* Aggregated Totals Breakdown */}
            <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-xl space-y-2 mb-6 font-mono text-sm">
              <div className="flex justify-between text-slate-600 text-xs">
                <span>Aggregated Base Quoted Rate:</span>
                <span className="font-bold text-slate-800">{formatINR(totalBaseRate)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-xs">
                <span>Cumulative Taxes (CGST + SGST / IGST):</span>
                <span className="font-bold text-teal-700">+{formatINR(totalTaxes)}</span>
              </div>
              <div className="pt-2 border-t border-sky-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-800 font-bold text-base">Billed Value (Final Bill):</span>
                  <p className="text-[10px] text-slate-500 font-sans">
                    {isInclusiveMode
                      ? 'Net all-inclusive billed rate correctly extracted into Base + Taxes'
                      : 'Explicit total used for revenue projections and billing'}
                  </p>
                </div>
                <span className="text-xl font-extrabold text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                  {formatINR(billedValue)}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Footer Actions: Cancel replaced with History; Calculate with => Calculate */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowHistory(prev => !prev)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition-colors border border-slate-300"
          >
            {showHistory ? (
              <>
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span>Return to Calculator</span>
              </>
            ) : (
              <>
                <History className="w-4 h-4 text-teal-600" />
                <span>History ({history.length})</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleValidateAndCalculate}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2 hover:from-teal-600 hover:to-cyan-700 transition-all text-xs"
            >
              <span className="font-mono font-bold text-sm leading-none">=&gt;</span>
              <span>Calculate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
