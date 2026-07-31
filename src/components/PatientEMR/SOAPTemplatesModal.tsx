import React, { useState } from 'react';
import { SOAPNoteTemplate } from '../../types';
import { DEFAULT_SOAP_TEMPLATES } from '../../data/initialData';
import { FileText, Copy, Check, Sparkles, X } from 'lucide-react';

interface SOAPTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (soapText: string) => void;
}

export const SOAPTemplatesModal: React.FC<SOAPTemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['All', 'Root Canal Treatment', 'Scaling & Polishing', 'Extractions', 'Crown Prep & Bridge'];

  const filteredTemplates = selectedCategory === 'All'
    ? DEFAULT_SOAP_TEMPLATES
    : DEFAULT_SOAP_TEMPLATES.filter((t) => t.category === selectedCategory);

  const formatSOAPText = (tmpl: SOAPNoteTemplate) => {
    return `[SOAP NOTE: ${tmpl.title}]\n\nS (Subjective): ${tmpl.subjective}\nO (Objective): ${tmpl.objective}\nA (Assessment): ${tmpl.assessment}\nP (Plan): ${tmpl.plan}`;
  };

  const handleInsert = (tmpl: SOAPNoteTemplate) => {
    onApplyTemplate(formatSOAPText(tmpl));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-50 to-white border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#9a7814]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">Pre-Written Clinical SOAP Templates</h2>
              <p className="text-xs text-zinc-500">1-Tap insert structured clinical notes for dental procedures</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#3BA7F5] text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:bg-zinc-200 border border-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {filteredTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-[#3BA7F5] transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#b89323] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {tmpl.category}
                  </span>
                  <h3 className="text-sm font-extrabold text-zinc-900 mt-1">{tmpl.title}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleInsert(tmpl)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#3BA7F5] hover:bg-sky-600 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Use Template</span>
                </button>
              </div>

              {/* SOAP Body Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-zinc-200 text-zinc-700">
                <div>
                  <span className="font-extrabold text-zinc-900 block text-[11px]">S (Subjective):</span>
                  <p className="text-zinc-600 line-clamp-2">{tmpl.subjective}</p>
                </div>
                <div>
                  <span className="font-extrabold text-zinc-900 block text-[11px]">O (Objective):</span>
                  <p className="text-zinc-600 line-clamp-2">{tmpl.objective}</p>
                </div>
                <div>
                  <span className="font-extrabold text-zinc-900 block text-[11px]">A (Assessment):</span>
                  <p className="text-zinc-600 line-clamp-2">{tmpl.assessment}</p>
                </div>
                <div>
                  <span className="font-extrabold text-zinc-900 block text-[11px]">P (Plan):</span>
                  <p className="text-zinc-600 line-clamp-2">{tmpl.plan}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
