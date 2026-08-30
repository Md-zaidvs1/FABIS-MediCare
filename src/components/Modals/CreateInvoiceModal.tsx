import React, { useState, useEffect } from 'react';
import { Patient, Invoice, PaymentMethod } from '../../types';
import { formatCurrency, formatTodayISO, formatPatientId } from '../../utils/formatters';
import {
  BillTemplateItem,
  DEFAULT_BILL_TEMPLATES,
  getStoredCustomBillTemplates,
  saveCustomBillTemplates,
} from '../../utils/storage';
import { Receipt, X, Plus, Trash2, Download, Tag, Percent, IndianRupee, Search, Sparkles } from 'lucide-react';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  defaultPatientId?: string;
  onCreateInvoice: (patientId: string, invoice: Omit<Invoice, 'id' | 'patientId' | 'patientName'>) => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  patients,
  defaultPatientId,
  onCreateInvoice,
}) => {
  const [patientId, setPatientId] = useState(defaultPatientId || (patients[0]?.id || ''));
  const [items, setItems] = useState<
    { id: string; description: string; toothNumber?: number; quantity: number; unitPrice: number }[]
  >([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountInputVal, setDiscountInputVal] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState('');

  // Bill Templates State
  const [templateSearch, setTemplateSearch] = useState('');
  const [customTemplates, setCustomTemplates] = useState<BillTemplateItem[]>([]);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomPrice, setNewCustomPrice] = useState<number>(500);

  // Sync selected patient treatment plans whenever patientId or isOpen changes
  useEffect(() => {
    if (isOpen) {
      const activeId = defaultPatientId || patientId || (patients[0]?.id || '');
      setPatientId(activeId);
      importPatientTreatments(activeId);
      setCustomTemplates(getStoredCustomBillTemplates());
      setTemplateSearch('');
    }
  }, [isOpen, defaultPatientId]);

  const allTemplates = [
    ...DEFAULT_BILL_TEMPLATES,
    ...customTemplates.map((c) => ({ ...c, isCustom: true })),
  ];

  const filteredTemplates = allTemplates.filter((t) =>
    t.name.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const handleSelectTemplate = (template: BillTemplateItem) => {
    const newItem = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: template.name,
      quantity: 1,
      unitPrice: template.amount,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleSaveCustomTemplate = () => {
    if (!newCustomName.trim()) return;
    const newTemplate: BillTemplateItem = {
      id: `custom-bt-${Date.now()}`,
      name: newCustomName.trim(),
      amount: newCustomPrice > 0 ? newCustomPrice : 0,
      isCustom: true,
    };
    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    saveCustomBillTemplates(updated);
    setNewCustomName('');
    setNewCustomPrice(500);
    setShowAddCustomModal(false);
  };

  const handleDeleteCustomTemplate = (id: string) => {
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    saveCustomBillTemplates(updated);
  };

  const importPatientTreatments = (targetPatientId: string) => {
    const selectedPatient = patients.find((p) => p.id === targetPatientId);
    if (selectedPatient && selectedPatient.treatmentPlans && selectedPatient.treatmentPlans.length > 0) {
      const loaded = selectedPatient.treatmentPlans.map((tp, idx) => ({
        id: tp.id || `tp-${idx}`,
        description: tp.procedureName,
        toothNumber: tp.toothNumber,
        quantity: 1,
        unitPrice: tp.estimatedCost,
      }));
      setItems(loaded);
      const totalCost = loaded.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      setPaidAmount(totalCost);
    } else if (
      selectedPatient &&
      selectedPatient.visitHistory &&
      selectedPatient.visitHistory.length > 0 &&
      selectedPatient.visitHistory[0].procedures &&
      selectedPatient.visitHistory[0].procedures.length > 0
    ) {
      const recentVisit = selectedPatient.visitHistory[0];
      const loaded = recentVisit.procedures.map((proc, idx) => ({
        id: `proc-${idx}`,
        description: proc,
        quantity: 1,
        unitPrice: 500,
      }));
      setItems(loaded.length > 0 ? loaded : [{ id: '1', description: 'Consultation & Dental Examination', quantity: 1, unitPrice: 500 }]);
      const totalCost = loaded.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      setPaidAmount(totalCost || 500);
    } else {
      setItems([
        { id: '1', description: 'Consultation & Dental Examination', quantity: 1, unitPrice: 500 },
      ]);
      setPaidAmount(500);
    }
  };

  const handlePatientSelectChange = (newId: string) => {
    setPatientId(newId);
    importPatientTreatments(newId);
  };

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  // Recalculate discount
  const calculatedDiscount = discountType === 'percent'
    ? Math.round((subtotal * (discountInputVal || 0)) / 100)
    : (discountInputVal || 0);

  const netTotal = Math.max(0, subtotal - calculatedDiscount);
  const balanceDue = Math.max(0, netTotal - paidAmount);

  const applyPresetDiscount = (val: number, type: 'flat' | 'percent') => {
    setDiscountType(type);
    setDiscountInputVal(val);
    if (type === 'percent') {
      const disc = Math.round((subtotal * val) / 100);
      setDiscountAmount(disc);
    } else {
      setDiscountAmount(val);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: 'Dental Procedure / Restoration',
        quantity: 1,
        unitPrice: 1500,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((i) => i.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = formatTodayISO();

    const formattedItems = items.map((i) => ({
      ...i,
      totalPrice: i.quantity * i.unitPrice,
    }));

    const status = balanceDue === 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid';

    onCreateInvoice(patientId, {
      date: today,
      dueDate: today,
      items: formattedItems,
      subtotal,
      discountAmount: calculatedDiscount,
      taxAmount: 0,
      netTotal,
      paidAmount,
      balanceDue,
      status,
      paymentMethod,
      paymentHistory:
        paidAmount > 0
          ? [
              {
                id: `P-${Date.now()}`,
                date: today,
                amount: paidAmount,
                method: paymentMethod,
                referenceNo: `${paymentMethod}/TXN-${Math.floor(1000 + Math.random() * 9000)}`,
                notes: 'Payment collected at checkout',
              },
            ]
          : [],
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-[#E8ECF3] rounded-[28px] w-[94vw] sm:w-[90vw] md:w-[90vw] max-w-3xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-[#1E293B] max-h-[92vh] flex flex-col justify-between">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E8ECF3] pb-4 shrink-0">
          <div className="flex items-center gap-2.5 text-[#3BA7F5] font-extrabold text-base sm:text-lg">
            <Receipt className="w-5 h-5 text-[#3BA7F5]" />
            <span>Bill Invoice</span>
          </div>
          <button onClick={onClose} className="p-2 text-[#94A3B8] hover:text-[#1E293B] hover:bg-slate-100 rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden pt-3 text-xs">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Select Patient *</label>
              <select
                value={patientId}
                onChange={(e) => handlePatientSelectChange(e.target.value)}
                className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none font-semibold cursor-pointer"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatPatientId(p)} - {p.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Mapped Treatment Items */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-[#1E293B] font-bold text-xs">Mapped Dental Treatments & Procedures *</label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => importPatientTreatments(patientId)}
                    className="px-3 py-2 min-h-[44px] rounded-2xl bg-[#EBF7FC] hover:bg-[#3BA7F5]/20 text-[#1E88A8] border border-[#3BA7F5]/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Load unbilled treatment plans from selected patient EMR"
                  >
                    <Download className="w-4 h-4 text-[#3BA7F5]" />
                    <span>Import Treatments</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-2 min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#1E293B] text-xs flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#3BA7F5]" /> Add Manual Item
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E8ECF3] flex flex-col sm:flex-row items-center gap-2.5"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Procedure description"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].description = e.target.value;
                        setItems(newItems);
                      }}
                      className="flex-1 p-3 min-h-[44px] bg-white border border-[#E8ECF3] rounded-2xl text-[#1E293B] outline-none font-semibold focus:border-[#3BA7F5]"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="Tooth #"
                      value={item.toothNumber || ''}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].toothNumber = e.target.value ? parseInt(e.target.value, 10) : undefined;
                        setItems(newItems);
                      }}
                      className="w-full sm:w-24 p-3 min-h-[44px] bg-white border border-[#E8ECF3] rounded-2xl text-[#1E293B] outline-none text-center font-bold focus:border-[#3BA7F5]"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                        setItems(newItems);
                      }}
                      className="w-full sm:w-20 p-3 min-h-[44px] bg-white border border-[#E8ECF3] rounded-2xl text-[#1E293B] outline-none text-center font-bold focus:border-[#3BA7F5]"
                      title="Quantity"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      required
                      placeholder="Cost (₹)"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                        setItems(newItems);
                      }}
                      className="w-full sm:w-32 p-3 min-h-[44px] bg-white border border-[#E8ECF3] rounded-2xl text-[#1E88A8] font-mono font-bold outline-none text-right focus:border-[#3BA7F5]"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-2xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Pick Bill Templates */}
            <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-slate-900 font-extrabold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#3BA7F5]" />
                  <span>Quick Pick Bill Templates</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(true)}
                  className="px-3.5 py-1.5 min-h-[36px] bg-[#3BA7F5] hover:bg-[#2A96E4] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 self-start sm:self-auto shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Bill Template</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search bill templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-sky-200 rounded-xl text-slate-800 outline-none focus:border-[#3BA7F5] font-medium"
                />
              </div>

              {/* Template Items */}
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1 pt-1">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="group relative flex items-center bg-white hover:bg-sky-100/80 border border-sky-200 hover:border-[#3BA7F5] rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 transition-all cursor-pointer shadow-2xs"
                    title="Click to add as invoice line item"
                  >
                    <span>{template.name}</span>
                    <span className="ml-1.5 font-bold font-mono text-[#1E88A8]">
                      ₹{template.amount}
                    </span>
                    {template.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomTemplate(template.id);
                        }}
                        className="ml-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete custom template"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {filteredTemplates.length === 0 && (
                  <div className="text-xs text-slate-500 py-1 font-medium">No templates matching "{templateSearch}".</div>
                )}
              </div>
            </div>

            {/* Checkout Discount Engine */}
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-amber-950 font-extrabold text-xs flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <span>Final Checkout Discount Engine</span>
                </label>
                <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                  Savings: ₹{calculatedDiscount}
                </span>
              </div>

              {/* Quick Pick Presets */}
              <div className="space-y-2">
                <span className="text-[11px] text-amber-900 font-bold uppercase tracking-wider block">
                  1-Tap Quick Discount Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '5% Off', val: 5, type: 'percent' as const },
                    { label: '10% Off', val: 10, type: 'percent' as const },
                    { label: '₹100 Off', val: 100, type: 'flat' as const },
                    { label: '₹200 Off', val: 200, type: 'flat' as const },
                    { label: '₹500 Off', val: 500, type: 'flat' as const },
                    { label: '₹1000 Off', val: 1000, type: 'flat' as const },
                  ].map((preset) => {
                    const isActive = discountType === preset.type && discountInputVal === preset.val;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyPresetDiscount(preset.val, preset.type)}
                        className={`px-3.5 py-2.5 min-h-[44px] rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#3BA7F5] text-white border-[#3BA7F5] shadow-xs scale-105'
                            : 'bg-white text-zinc-800 hover:bg-amber-100/80 border-amber-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => applyPresetDiscount(0, 'flat')}
                    className="px-3 py-2.5 min-h-[44px] rounded-2xl text-xs font-bold text-amber-900 hover:text-rose-700 underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Custom Discount Input */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs font-bold text-amber-950">Custom Discount:</span>
                <div className="flex items-center bg-white border border-amber-300 rounded-2xl overflow-hidden flex-1 max-w-[200px] min-h-[44px]">
                  <button
                    type="button"
                    onClick={() => setDiscountType(discountType === 'flat' ? 'percent' : 'flat')}
                    className="px-3 py-3 min-h-[44px] bg-amber-100 text-amber-950 text-xs font-bold border-r border-amber-300 hover:bg-amber-200 cursor-pointer"
                    title="Toggle % or Flat ₹"
                  >
                    {discountType === 'percent' ? '%' : '₹'}
                  </button>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={discountInputVal || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDiscountInputVal(val);
                    }}
                    placeholder="0"
                    className="w-full p-2.5 min-h-[44px] text-right text-xs font-mono font-bold text-[#1E88A8] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Calculations Summary Box */}
            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E8ECF3] space-y-3 font-mono">
              <div className="flex justify-between text-[#64748B] text-xs">
                <span>Subtotal:</span>
                <span className="font-bold text-[#1E293B]">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between text-amber-800 font-bold text-xs">
                <span>Discount Savings:</span>
                <span>- {formatCurrency(calculatedDiscount)}</span>
              </div>

              <div className="flex justify-between text-[#1E293B] font-bold border-t border-[#E8ECF3] pt-2 text-sm">
                <span>Net Invoice Payable:</span>
                <span className="text-emerald-600 font-black">{formatCurrency(netTotal)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E8ECF3]">
                <div>
                  <label className="text-[11px] font-sans text-[#64748B] font-bold block mb-1">Paid Amount Now (₹)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 min-h-[44px] bg-white border border-[#E8ECF3] rounded-2xl text-right text-emerald-600 font-bold outline-none focus:border-[#3BA7F5]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-sans text-[#64748B] font-bold block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-3 min-h-[44px] bg-white border border-[#E8ECF3] rounded-2xl text-[#1E293B] font-sans font-bold outline-none cursor-pointer focus:border-[#3BA7F5]"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between text-xs font-bold pt-2 border-t border-[#E8ECF3]">
                <span className="text-[#64748B] font-sans">Balance Due Remaining:</span>
                <span className={balanceDue > 0 ? 'text-rose-600 font-black' : 'text-emerald-600 font-black'}>
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Billing Notes / Terms</label>
              <input
                type="text"
                placeholder="e.g. Next installment due on crown fitting date..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none"
              />
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 pb-1 border-t border-[#E8ECF3] flex flex-wrap items-center justify-end gap-3 z-20 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 min-h-[44px] rounded-full bg-[#F1F5F9] text-[#64748B] font-bold hover:bg-[#E2E8F0] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 min-h-[44px] rounded-full bg-[#3BA7F5] hover:bg-[#2A96E4] text-white font-bold shadow-[0_8px_20px_rgba(59,167,245,0.3)] transition-all cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Custom Template Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl max-w-md w-full space-y-4 text-xs text-[#1E293B]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#3BA7F5]" /> Add Custom Bill Template
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Treatment / Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laser Teeth Whitening"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#3BA7F5] font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Default Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 5000"
                  value={newCustomPrice || ''}
                  onChange={(e) => setNewCustomPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#3BA7F5] font-mono font-bold text-[#1E88A8]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomTemplate}
                className="px-4 py-2 text-xs font-bold bg-[#3BA7F5] text-white hover:bg-[#2A96E4] rounded-xl shadow-xs cursor-pointer"
              >
                Save for Future Invoices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
