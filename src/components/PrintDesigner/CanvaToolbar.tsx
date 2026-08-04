// FABIS MediCare - Canva-like Formatting Toolbar & Inspector Component

import React from 'react';
import { CanvasElement, PrintTemplateConfig } from './TemplateStorage';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Type,
  Lock,
  Unlock,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Sliders,
} from 'lucide-react';

interface CanvaToolbarProps {
  config: PrintTemplateConfig;
  selectedElement: CanvasElement | null;
  onChangeElement: (updated: CanvasElement) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onReorderElement: (id: string, direction: 'up' | 'down') => void;
}

const FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Playfair Display',
  'Courier Prime',
  'Montserrat',
  'Open Sans',
  'Cinzel',
  'Lato',
];

export const CanvaToolbar: React.FC<CanvaToolbarProps> = ({
  config,
  selectedElement,
  onChangeElement,
  onDuplicateElement,
  onDeleteElement,
  onReorderElement,
}) => {
  if (!selectedElement) {
    return (
      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Click any element on the canvas to edit formatting, fonts, colors & position.</span>
        </div>
      </div>
    );
  }

  const update = (props: Partial<CanvasElement>) => {
    onChangeElement({ ...selectedElement, ...props });
  };

  return (
    <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2 gap-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-700" />
          <span className="font-extrabold text-slate-900 capitalize">
            {selectedElement.type.replace('_', ' ')} Properties
          </span>
          {selectedElement.isLocked && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => update({ isLocked: !selectedElement.isLocked })}
            className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
              selectedElement.isLocked
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title={selectedElement.isLocked ? 'Unlock Element' : 'Lock Element'}
          >
            {selectedElement.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => onReorderElement(selectedElement.id, 'up')}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
            title="Bring Forward"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onReorderElement(selectedElement.id, 'down')}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
            title="Send Backward"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDuplicateElement(selectedElement.id)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteElement(selectedElement.id)}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 cursor-pointer"
            title="Delete Element"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Formatting Controls Grid */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Text / Label Input */}
        {(selectedElement.type === 'text' || selectedElement.type === 'dynamic_field') && (
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600">
              {selectedElement.type === 'dynamic_field' ? 'Label:' : 'Text:'}
            </span>
            <input
              type="text"
              value={selectedElement.type === 'dynamic_field' ? selectedElement.labelOverride || '' : selectedElement.content || ''}
              onChange={(e) =>
                selectedElement.type === 'dynamic_field'
                  ? update({ labelOverride: e.target.value })
                  : update({ content: e.target.value })
              }
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs outline-none focus:border-purple-600 w-36"
              placeholder="Custom Label"
            />
          </div>
        )}

        {/* Font Family Selector */}
        <div className="flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedElement.fontFamily || config.fontFamily || 'Inter'}
            onChange={(e) => update({ fontFamily: e.target.value })}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs outline-none focus:border-purple-600"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-1">
          <span className="font-bold text-slate-600">Size:</span>
          <input
            type="number"
            min={8}
            max={72}
            value={selectedElement.fontSize || 12}
            onChange={(e) => update({ fontSize: parseInt(e.target.value) || 12 })}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs outline-none focus:border-purple-600 w-14 text-center"
          />
        </div>

        {/* Bold, Italic, Underline Buttons */}
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
          <button
            type="button"
            onClick={() => update({ bold: !selectedElement.bold })}
            className={`p-1.5 hover:bg-slate-200 transition-colors ${
              selectedElement.bold ? 'bg-purple-700 text-white' : 'text-slate-700'
            }`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => update({ italic: !selectedElement.italic })}
            className={`p-1.5 hover:bg-slate-200 transition-colors ${
              selectedElement.italic ? 'bg-purple-700 text-white' : 'text-slate-700'
            }`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => update({ underline: !selectedElement.underline })}
            className={`p-1.5 hover:bg-slate-200 transition-colors ${
              selectedElement.underline ? 'bg-purple-700 text-white' : 'text-slate-700'
            }`}
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
          <button
            type="button"
            onClick={() => update({ textAlign: 'left' })}
            className={`p-1.5 hover:bg-slate-200 transition-colors ${
              selectedElement.textAlign === 'left' ? 'bg-purple-700 text-white' : 'text-slate-700'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => update({ textAlign: 'center' })}
            className={`p-1.5 hover:bg-slate-200 transition-colors ${
              selectedElement.textAlign === 'center' ? 'bg-purple-700 text-white' : 'text-slate-700'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => update({ textAlign: 'right' })}
            className={`p-1.5 hover:bg-slate-200 transition-colors ${
              selectedElement.textAlign === 'right' ? 'bg-purple-700 text-white' : 'text-slate-700'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Color Picker */}
        <div className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-bold text-slate-600">Color:</span>
          <input
            type="color"
            value={selectedElement.color || config.textColor || '#0F172A'}
            onChange={(e) => update({ color: e.target.value })}
            className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
            title="Text Color"
          />
        </div>

        {/* Background Color Picker */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-600">Bg:</span>
          <input
            type="color"
            value={selectedElement.backgroundColor || '#ffffff'}
            onChange={(e) => update({ backgroundColor: e.target.value })}
            className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
            title="Background Color"
          />
        </div>

        {/* Text Transform */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-600">Case:</span>
          <select
            value={selectedElement.textTransform || 'none'}
            onChange={(e) => update({ textTransform: e.target.value as any })}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs outline-none focus:border-purple-600"
          >
            <option value="none">Normal</option>
            <option value="uppercase">UPPERCASE</option>
            <option value="lowercase">lowercase</option>
          </select>
        </div>

        {/* Opacity Slider */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-600">Opacity:</span>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.1}
            value={selectedElement.opacity !== undefined ? selectedElement.opacity : 1.0}
            onChange={(e) => update({ opacity: parseFloat(e.target.value) })}
            className="w-20 cursor-pointer accent-purple-600"
          />
        </div>
      </div>
    </div>
  );
};
