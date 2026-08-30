// FABIS MediCare - Canva-like Interactive Drag & Drop Canvas Engine

import React, { useState, useRef, useEffect } from 'react';
import { CanvasElement, PrintTemplateConfig, DYNAMIC_FIELDS_LIST } from './TemplateStorage';
import { DoctorProfile, Patient } from '../../types';
import { formatCurrency, formatPatientId } from '../../utils/formatters';
import {
  Lock,
  Unlock,
  RotateCw,
  Copy,
  Trash2,
  Move,
  Stethoscope,
  QrCode,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  BarChart,
  Grid,
} from 'lucide-react';

interface CanvaCanvasProps {
  config: PrintTemplateConfig;
  doctor: DoctorProfile;
  patient?: Patient | null;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onChangeElements: (elements: CanvasElement[]) => void;
  showGrid?: boolean;
}

const SAMPLE_PATIENT_DATA: Record<string, string> = {
  patient_name: 'Ananya Sharma',
  mrn: 'P-1008',
  age: '32 Yrs',
  gender: 'Female',
  mobile: '+91 98765 43210',
  address: 'Anna Nagar, Chennai, TN',
  appointment_date: '02 Aug 2026',
  invoice_number: 'INV-2026-089',
  prescription: 'Augmentin 625mg 1-0-1 | Zerodol-SP 1-0-1',
  diagnosis: 'Deep Dental Caries #16 Molar',
  treatment: 'Root Canal Treatment (RCT) + Crown',
  treatment_cost: '₹4,500.00',
  discount: '₹500.00',
  tax: '₹0.00',
  grand_total: '₹5,500.00',
  payment_method: 'UPI / Cash',
  doctor_name: 'Dr. Sarah Mitchell',
  doctor_reg_no: 'DENT-12345',
  clinic_name: 'FABIS DENTAL CARE',
  clinic_address: '123 Health Ave, Medical Zone',
  clinic_phone: '+91 98765 43210',
  clinic_email: 'contact@fabismedicare.com',
  website: 'www.fabismedicare.com',
  qr_payment: 'Scan UPI to Pay',
  thank_you_message: 'Thank you for choosing FABIS MediCare!',
  custom_notes: 'Please retain this invoice for warranty claims.',
};

export const CanvaCanvas: React.FC<CanvaCanvasProps> = ({
  config,
  doctor,
  patient,
  selectedElementId,
  onSelectElement,
  onChangeElements,
  showGrid = true,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState<{ x: number; y: number; w: number; h: number; rot: number }>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    rot: 0,
  });

  const elements = config.elements || [];

  // Get dynamic field value helper
  const getFieldValue = (fieldKey: string) => {
    if (patient) {
      if (fieldKey === 'patient_name') return patient.name;
      if (fieldKey === 'mrn' || fieldKey === 'patient_id') return formatPatientId(patient);
      if (fieldKey === 'age') return `${patient.age} Yrs`;
      if (fieldKey === 'gender') return patient.gender;
      if (fieldKey === 'mobile') return patient.phone;
      if (fieldKey === 'address') return patient.address || SAMPLE_PATIENT_DATA.address;
    }
    if (doctor) {
      if (fieldKey === 'doctor_name') return `Dr. ${doctor.name}`;
      if (fieldKey === 'doctor_reg_no') return doctor.regNumber || 'DENT-12345';
      if (fieldKey === 'clinic_name') return doctor.clinicName || 'FABIS DENTAL CARE';
      if (fieldKey === 'clinic_address') return doctor.clinicAddress || '123 Health Ave';
      if (fieldKey === 'clinic_phone') return doctor.clinicPhone || '+91 98765 43210';
      if (fieldKey === 'clinic_email') return doctor.clinicEmail || 'contact@fabismedicare.com';
    }
    return SAMPLE_PATIENT_DATA[fieldKey] || `{${fieldKey}}`;
  };

  // Mouse Down handler on Element
  const handleElementMouseDown = (e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();
    onSelectElement(el.id);

    if (el.isLocked) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ x: el.x, y: el.y, w: el.width, h: el.height, rot: el.rotation || 0 });
  };

  // Mouse Down handler on Resize Handle
  const handleResizeMouseDown = (e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();
    if (el.isLocked) return;

    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ x: el.x, y: el.y, w: el.width, h: el.height, rot: el.rotation || 0 });
  };

  // Mouse Down handler on Rotate Handle
  const handleRotateMouseDown = (e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();
    if (el.isLocked) return;

    setIsRotating(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ x: el.x, y: el.y, w: el.width, h: el.height, rot: el.rotation || 0 });
  };

  // Global Mouse Move & Mouse Up
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!selectedElementId || (!isDragging && !isResizing && !isRotating)) return;
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;

      const rect = canvasEl.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
      const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

      const updated = elements.map((el) => {
        if (el.id !== selectedElementId || el.isLocked) return el;

        if (isDragging) {
          const newX = Math.max(0, Math.min(90, elementStart.x + dx));
          const newY = Math.max(0, Math.min(90, elementStart.y + dy));
          return { ...el, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 };
        }

        if (isResizing) {
          const newW = Math.max(5, Math.min(95, elementStart.w + dx));
          const newH = Math.max(3, Math.min(95, elementStart.h + dy));
          return { ...el, width: Math.round(newW * 10) / 10, height: Math.round(newH * 10) / 10 };
        }

        if (isRotating) {
          const centerX = rect.left + (elementStart.x + elementStart.w / 2) * (rect.width / 100);
          const centerY = rect.top + (elementStart.y + elementStart.h / 2) * (rect.height / 100);
          const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
          let deg = Math.round((angleRad * 180) / Math.PI + 90);
          if (deg < 0) deg += 360;
          return { ...el, rotation: deg % 360 };
        }

        return el;
      });

      onChangeElements(updated);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    if (isDragging || isResizing || isRotating) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isRotating, dragStart, elementStart, selectedElementId, elements, onChangeElements]);

  const isThermal = config.type === 'receipt_80mm';

  return (
    <div
      className="relative flex justify-center items-center bg-slate-800/90 p-4 sm:p-6 rounded-2xl overflow-auto min-h-[640px] select-none"
      onClick={() => onSelectElement(null)}
    >
      {/* Paper Container */}
      <div
        ref={canvasRef}
        className={`relative bg-white shadow-2xl rounded-sm border border-slate-300 transition-all ${
          isThermal ? 'w-[320px] min-h-[580px]' : 'w-full max-w-[650px] min-h-[820px]'
        }`}
        style={{
          aspectRatio: isThermal ? '80/160' : '210/297',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Grid Overlay */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
        )}

        {/* Base Static Template Preview Layer (Underneath Custom Elements) */}
        <div className="absolute inset-0 p-4 pointer-events-none opacity-40">
          <div className="border-b pb-2 mb-2 flex justify-between items-start" style={{ borderColor: config.primaryColor }}>
            <div>
              <h2 className="font-extrabold uppercase text-xs" style={{ color: config.primaryColor }}>
                {config.clinicNameOverride || doctor.clinicName || 'FABIS DENTAL CARE'}
              </h2>
              <p className="text-[9px] text-slate-500">Dr. {config.doctorNameOverride || doctor.name}</p>
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-600">
              {isThermal ? 'RECEIPT #INV-8092' : 'TAX INVOICE #INV-2026-089'}
            </span>
          </div>
        </div>

        {/* Dynamic Canvas Elements Layer */}
        {elements.map((el) => {
          if (el.hidden) return null;

          const isSelected = selectedElementId === el.id;

          const style: React.CSSProperties = {
            position: 'absolute',
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.width}%`,
            height: `${el.height}%`,
            transform: `rotate(${el.rotation || 0}deg)`,
            zIndex: el.zIndex || 1,
            fontFamily: el.fontFamily || config.fontFamily || 'sans-serif',
            fontSize: `${el.fontSize || 12}px`,
            fontWeight: el.bold ? 'bold' : 'normal',
            fontStyle: el.italic ? 'italic' : 'normal',
            textDecoration: el.underline ? 'underline' : 'none',
            color: el.color || config.textColor || '#0F172A',
            backgroundColor: el.backgroundColor || 'transparent',
            textAlign: el.textAlign || 'left',
            letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal',
            lineHeight: el.lineHeight || 1.2,
            textTransform: el.textTransform || 'none',
            opacity: el.opacity !== undefined ? el.opacity : 1,
          };

          return (
            <div
              key={el.id}
              style={style}
              className={`group transition-shadow cursor-grab active:cursor-grabbing rounded p-1 flex items-center ${
                isSelected
                  ? 'ring-2 ring-purple-600 ring-offset-1 bg-purple-50/20'
                  : 'hover:ring-1 hover:ring-purple-300'
              }`}
              onMouseDown={(e) => handleElementMouseDown(e, el)}
            >
              {/* Element Content Rendering */}
              <div className="w-full h-full overflow-hidden flex items-center">
                {/* 1. Text Element */}
                {el.type === 'text' && (
                  <span className="w-full break-words">{el.content || 'Sample Text'}</span>
                )}

                {/* 2. Dynamic Field Element */}
                {el.type === 'dynamic_field' && el.fieldKey && (
                  <div className="w-full break-words flex items-center gap-1">
                    {el.labelOverride && (
                      <span className="font-bold opacity-80 text-[10px]">{el.labelOverride}:</span>
                    )}
                    <span className="font-semibold">{getFieldValue(el.fieldKey)}</span>
                  </div>
                )}

                {/* 3. Image Element */}
                {el.type === 'image' && (
                  <div className="w-full h-full flex items-center justify-center">
                    {el.src ? (
                      <img src={el.src} alt="Canvas element" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                        {el.imageType || 'Image'}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Shape Element */}
                {el.type === 'shape' && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: el.fillColor || 'transparent',
                      border: `${el.strokeWidth || 1}px solid ${el.strokeColor || '#000'}`,
                      borderRadius:
                        el.shapeType === 'circle'
                          ? '9999px'
                          : el.shapeType === 'divider'
                          ? '0px'
                          : `${el.borderRadius || 0}px`,
                      height: el.shapeType === 'divider' || el.shapeType === 'line' ? '2px' : '100%',
                    }}
                  />
                )}

                {/* 5. Icon Element */}
                {el.type === 'icon' && (
                  <div className="w-full h-full flex items-center justify-center text-purple-700">
                    <Stethoscope className="w-full h-full" style={{ color: el.color || config.primaryColor }} />
                  </div>
                )}

                {/* 6. QR Code Element */}
                {el.type === 'qr_code' && (
                  <div className="w-full h-full bg-white p-1 border border-slate-200 rounded flex flex-col items-center justify-center">
                    <QrCode className="w-full h-[80%] text-slate-900" />
                    <span className="text-[8px] font-bold text-slate-600 truncate">{el.label || 'UPI Pay'}</span>
                  </div>
                )}

                {/* 7. Barcode Element */}
                {el.type === 'barcode' && (
                  <div className="w-full h-full bg-white p-1 border border-slate-200 rounded flex flex-col items-center justify-center">
                    <BarChart className="w-full h-[70%] text-slate-900" />
                    <span className="text-[8px] font-mono font-bold">{SAMPLE_PATIENT_DATA.mrn}</span>
                  </div>
                )}
              </div>

              {/* Selection Bounding Box Handles */}
              {isSelected && !el.isLocked && (
                <>
                  {/* Top Rotation Handle */}
                  <div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center shadow cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleRotateMouseDown(e, el)}
                    title="Rotate Element"
                  >
                    <RotateCw className="w-3 h-3" />
                  </div>

                  {/* Bottom Right Resize Handle */}
                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-purple-600 border-2 border-white rounded-sm shadow cursor-se-resize hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleResizeMouseDown(e, el)}
                    title="Resize Element"
                  />
                </>
              )}

              {/* Locked Indicator Badge */}
              {el.isLocked && isSelected && (
                <div className="absolute -top-3 -right-3 bg-amber-500 text-white p-1 rounded-full shadow text-[10px]">
                  <Lock className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
