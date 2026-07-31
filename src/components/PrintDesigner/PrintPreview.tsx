// FABIS MediCare - Print Designer Live Preview Engine

import React from 'react';
import { PrintTemplateConfig } from './TemplateStorage';
import { DoctorProfile, Patient } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Sparkles, QrCode, CheckCircle2, ShieldCheck, MapPin, Phone, Mail, Globe, Stethoscope } from 'lucide-react';

interface PrintPreviewProps {
  config: PrintTemplateConfig;
  doctor: DoctorProfile;
  patient?: Patient | null;
}

// Sample fallback patient data for rich preview display
const SAMPLE_PATIENT = {
  id: 'P-1008',
  name: 'Ananya Sharma',
  age: 32,
  gender: 'Female',
  mobile: '+91 98765 43210',
  address: 'Anna Nagar, Chennai, TN',
};

const SAMPLE_INVOICE_ITEMS = [
  { description: 'Root Canal Treatment (RCT) - Upper Molar #16', toothNumber: 16, qty: 1, unitPrice: 4500, total: 4500 },
  { description: 'Composite Resin Aesthetic Restoration #15', toothNumber: 15, qty: 1, unitPrice: 1200, total: 1200 },
  { description: 'IOPA Digital X-Ray Examination', toothNumber: 16, qty: 1, unitPrice: 300, total: 300 },
];

export const PrintPreview: React.FC<PrintPreviewProps> = ({ config, doctor, patient }) => {
  const activePatient = patient || SAMPLE_PATIENT;

  const fontClass =
    config.fontSize === 'small' ? 'text-[11px]' : config.fontSize === 'large' ? 'text-[14px]' : 'text-[12px]';

  const weightClass =
    config.fontWeight === 'bold'
      ? 'font-bold'
      : config.fontWeight === 'medium'
      ? 'font-semibold'
      : 'font-normal';

  // ----------------------------------------------------
  // 1. A4 INVOICE PREVIEW
  // ----------------------------------------------------
  if (config.type === 'invoice_a4') {
    const subtotal = 6000;
    const discount = 500;
    const grandTotal = 5500;

    return (
      <div className="w-full flex justify-center bg-slate-200/60 p-4 sm:p-6 rounded-2xl overflow-x-auto min-h-[620px]">
        {/* Simulated A4 Paper */}
        <div
          className={`bg-white shadow-2xl rounded-sm text-slate-900 border border-slate-300 w-full max-w-[680px] flex flex-col justify-between transition-all duration-200 ${fontClass} ${weightClass}`}
          style={{
            padding: `${Math.max(8, config.marginMm)}px`,
            minHeight: '820px',
          }}
        >
          {/* Header Section */}
          <div className="space-y-4">
            <div
              className="flex flex-col sm:flex-row justify-between items-start pb-4 border-b gap-3"
              style={{
                borderColor: `${config.primaryColor}25`,
                minHeight: `${config.headerHeightMm * 2.2}px`,
              }}
            >
              {/* Clinic Info & Logo */}
              <div className="flex items-start gap-3">
                {config.showLogo && (
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200 text-[#581C87]">
                    {config.logoUrl ? (
                      <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                    ) : (
                      <Stethoscope className="w-6 h-6" />
                    )}
                  </div>
                )}
                <div>
                  {config.showClinicName && (
                    <h1
                      className="font-black text-lg sm:text-xl tracking-tight uppercase"
                      style={{ color: config.primaryColor }}
                    >
                      {config.clinicNameOverride || doctor.clinicName || 'FABIS DENTAL CARE'}
                    </h1>
                  )}
                  {config.showDoctorName && (
                    <p className="font-bold text-slate-800 text-xs mt-0.5">
                      Dr. {config.doctorNameOverride || doctor.name}
                      {config.showQualification && (
                        <span className="font-normal text-slate-500 ml-1">
                          ({config.qualificationOverride || doctor.qualifications || 'BDS, MDS'})
                        </span>
                      )}
                    </p>
                  )}
                  {config.showRegNumber && (
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      Reg #: {config.regNumberOverride || doctor.regNumber || 'DENT-12345'}
                    </p>
                  )}
                  {config.showClinicAddress && (
                    <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{config.clinicAddressOverride || doctor.clinicAddress || '123 Health Ave, Medical Zone'}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-600 mt-0.5">
                    {config.showClinicPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {config.clinicPhoneOverride || doctor.clinicPhone || '+91 98765 43210'}
                      </span>
                    )}
                    {config.showClinicEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {config.clinicEmailOverride || doctor.clinicEmail || 'contact@fabismedicare.com'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Title Banner */}
              <div className="text-right sm:text-right self-start">
                <span
                  className="inline-block px-3 py-1 rounded-lg text-white font-black text-xs uppercase tracking-wider"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  TAX INVOICE
                </span>
                <p className="text-[11px] font-mono font-bold text-slate-700 mt-1.5">
                  Invoice #: <span className="text-slate-900">INV-2026-089</span>
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Patient Info Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row justify-between gap-2 text-xs">
              <div>
                <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">BILLED TO PATIENT</p>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{activePatient.name}</p>
                <p className="text-slate-600 text-[11px]">
                  MRN #: <span className="font-mono font-bold">{activePatient.id}</span>
                  {config.showPatientAgeGender && ` | ${activePatient.age} Yrs / ${activePatient.gender}`}
                </p>
              </div>
              <div className="sm:text-right">
                {config.showPatientPhone && (
                  <p className="text-slate-600 text-[11px]">Phone: {activePatient.mobile}</p>
                )}
                <p className="text-slate-600 text-[11px]">Status: <span className="font-bold text-emerald-700">PAID IN FULL</span></p>
              </div>
            </div>

            {/* Invoice Line Items Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead style={{ backgroundColor: `${config.primaryColor}12`, color: config.primaryColor }}>
                  <tr className="font-extrabold text-[11px] uppercase border-b border-slate-200">
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Procedure / Description</th>
                    <th className="p-2.5 text-center">Tooth</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {SAMPLE_INVOICE_ITEMS.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{item.description}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-purple-700">
                        {item.toothNumber ? `#${item.toothNumber}` : '-'}
                      </td>
                      <td className="p-2.5 text-right font-medium">{item.qty}</td>
                      <td className="p-2.5 text-right font-bold font-mono">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & QR Code Block */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
              {/* QR Code / UPI Block */}
              {config.showQrCode ? (
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-14 h-14 bg-white p-1 rounded-lg border border-purple-200 flex items-center justify-center shrink-0">
                    <QrCode className="w-12 h-12 text-purple-900" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-purple-950">{config.qrCodeLabel || 'Scan to Pay via UPI'}</p>
                    <p className="text-[10px] text-purple-700 font-mono mt-0.5 truncate max-w-[180px]">
                      {config.qrCodeText || 'upi://pay?pa=fabismedicare@upi'}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Instant Verified Receipt
                    </span>
                  </div>
                </div>
              ) : (
                <div />
              )}

              {/* Totals Summary */}
              <div className="w-full sm:w-64 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono font-bold">- {formatCurrency(discount)}</span>
                </div>
                <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-slate-900">
                  <span>GRAND TOTAL:</span>
                  <span className="font-mono text-purple-900" style={{ color: config.primaryColor }}>
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer & Terms Section */}
          <div
            className="pt-4 border-t space-y-3 mt-6"
            style={{
              borderColor: `${config.primaryColor}20`,
              minHeight: `${config.footerHeightMm * 2.2}px`,
            }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-end gap-3 text-xs">
              {/* Terms & Thank You */}
              <div className="space-y-1 max-w-sm">
                {config.showTerms && config.termsText && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terms & Conditions</p>
                    <p className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">{config.termsText}</p>
                  </div>
                )}
                {config.showThankYou && config.thankYouMessage && (
                  <p className="text-xs font-bold text-slate-800 pt-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{config.thankYouMessage}</span>
                  </p>
                )}
              </div>

              {/* Doctor Signature */}
              {config.showSignature && (
                <div className="text-center sm:text-right shrink-0 min-w-[150px]">
                  <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center sm:justify-end pb-1 text-slate-300 italic text-xs font-serif">
                    {config.signatureText || 'Doctor Signature'}
                  </div>
                  <p className="text-[10px] font-bold text-slate-700 mt-1">
                    Dr. {config.doctorNameOverride || doctor.name}
                  </p>
                  <p className="text-[9px] text-slate-400">Authorized Stamp & Sign</p>
                </div>
              )}
            </div>

            {/* Bottom Footer Line */}
            {config.showFooter && config.footerText && (
              <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-medium">
                {config.footerText}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. 80MM THERMAL RECEIPT PREVIEW
  // ----------------------------------------------------
  if (config.type === 'receipt_80mm') {
    return (
      <div className="w-full flex justify-center bg-slate-200/60 p-4 sm:p-6 rounded-2xl min-h-[550px]">
        {/* Simulated Thermal Tape */}
        <div
          className={`bg-white shadow-xl text-black border border-slate-300 w-[300px] font-mono p-4 space-y-3 rounded-t-sm transition-all duration-200 ${fontClass} ${weightClass}`}
          style={{
            borderBottom: '4px dashed #CBD5E1',
          }}
        >
          {/* Header */}
          <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-400">
            {config.showClinicName && (
              <h2 className="font-black text-sm uppercase tracking-wide">
                {config.clinicNameOverride || doctor.clinicName || 'FABIS DENTAL CARE'}
              </h2>
            )}
            {config.showClinicAddress && (
              <p className="text-[10px] font-normal leading-tight">
                {config.clinicAddressOverride || doctor.clinicAddress || '123 Health Ave, Medical Zone'}
              </p>
            )}
            {config.showClinicPhone && (
              <p className="text-[10px] font-normal">
                Ph: {config.clinicPhoneOverride || doctor.clinicPhone || '+91 98765 43210'}
              </p>
            )}
          </div>

          {/* Receipt Info */}
          <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-slate-400">
            <div className="flex justify-between">
              <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
              <span className="font-bold">#INV-8092</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Pt: {activePatient.name}</span>
              <span>MRN: {activePatient.id}</span>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between font-bold border-b border-slate-300 pb-1">
              <span>PROCEDURE</span>
              <span>AMOUNT</span>
            </div>
            {SAMPLE_INVOICE_ITEMS.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start gap-2">
                <span className="font-normal truncate">{item.description}</span>
                <span className="font-bold shrink-0">₹{item.total}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-2 border-t border-dashed border-slate-400 space-y-1">
            <div className="flex justify-between text-xs font-black text-base">
              <span>GRAND TOTAL</span>
              <span>₹5,500.00</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span>Payment Mode:</span>
              <span className="border border-black px-1.5 rounded">UPI CASH</span>
            </div>
          </div>

          {/* QR Code */}
          {config.showQrCode && (
            <div className="text-center pt-2 flex flex-col items-center">
              <div className="w-16 h-16 border border-black p-1 bg-white">
                <QrCode className="w-full h-full text-black" />
              </div>
              <p className="text-[9px] font-bold mt-1">{config.qrCodeLabel || 'Scan to Pay via UPI'}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-2 border-t border-dashed border-slate-400 space-y-0.5">
            {config.showThankYou && (
              <p className="font-bold text-[11px]">{config.thankYouMessage || 'THANK YOU FOR YOUR VISIT!'}</p>
            )}
            {config.showFooter && (
              <p className="text-[9px] font-normal text-slate-700">{config.footerText || 'Keep smiling. Valid Cash Receipt.'}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. A4 PRESCRIPTION PREVIEW
  // ----------------------------------------------------
  return (
    <div className="w-full flex justify-center bg-slate-200/60 p-4 sm:p-6 rounded-2xl overflow-x-auto min-h-[620px]">
      <div
        className={`bg-white shadow-2xl rounded-sm text-slate-900 border border-slate-300 w-full max-w-[680px] flex flex-col justify-between transition-all duration-200 ${fontClass} ${weightClass}`}
        style={{
          padding: `${Math.max(8, config.marginMm)}px`,
          minHeight: '820px',
        }}
      >
        <div className="space-y-4">
          {/* Header Section */}
          <div
            className="flex flex-col sm:flex-row justify-between items-start pb-4 border-b gap-3"
            style={{
              borderColor: `${config.primaryColor}25`,
              minHeight: `${config.headerHeightMm * 2.2}px`,
            }}
          >
            {/* Clinic Info */}
            <div className="flex items-start gap-3">
              {config.showLogo && (
                <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center shrink-0 border border-sky-200 text-sky-700">
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <Stethoscope className="w-6 h-6" />
                  )}
                </div>
              )}
              <div>
                {config.showClinicName && (
                  <h1
                    className="font-black text-lg sm:text-xl tracking-tight uppercase"
                    style={{ color: config.primaryColor }}
                  >
                    {config.clinicNameOverride || doctor.clinicName || 'FABIS DENTAL CARE'}
                  </h1>
                )}
                {config.showClinicAddress && (
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {config.clinicAddressOverride || doctor.clinicAddress || '123 Health Ave, Medical Zone'}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-3 text-[11px] text-slate-500 mt-0.5">
                  {config.showClinicPhone && <span>Ph: {config.clinicPhoneOverride || doctor.clinicPhone}</span>}
                  {config.showClinicEmail && <span>| {config.clinicEmailOverride || doctor.clinicEmail}</span>}
                </div>
              </div>
            </div>

            {/* Doctor Info (Right) */}
            <div className="text-right sm:text-right">
              {config.showDoctorName && (
                <p className="font-extrabold text-slate-900 text-sm">Dr. {config.doctorNameOverride || doctor.name}</p>
              )}
              {config.showQualification && (
                <p className="text-[11px] text-slate-500">{config.qualificationOverride || doctor.qualifications || 'BDS, MDS'}</p>
              )}
              {config.showRegNumber && (
                <p className="text-[11px] font-bold text-sky-700 mt-0.5">
                  Reg #: {config.regNumberOverride || doctor.regNumber || 'DENT-12345'}
                </p>
              )}
            </div>
          </div>

          {/* Patient Details Card */}
          <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 flex flex-col sm:flex-row justify-between gap-2 text-xs">
            <div>
              <p className="font-bold text-slate-900">
                Patient: <span className="text-slate-900 font-extrabold">{activePatient.name}</span>
                <span className="font-normal text-slate-500 ml-2">({activePatient.age} Yrs / {activePatient.gender})</span>
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">MRN: <span className="font-mono font-bold text-slate-700">{activePatient.id}</span></p>
            </div>
            <div className="sm:text-right text-[11px] text-slate-600">
              <p>Date: {new Date().toLocaleDateString('en-IN')}</p>
              <p>Rx ID: <span className="font-mono font-bold">RX-2026-042</span></p>
            </div>
          </div>

          {/* Rx Symbol & Prescribed Medications */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black italic font-serif" style={{ color: config.primaryColor }}>
                Rx
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Prescription</span>
            </div>

            <div className="space-y-2.5 pl-2 border-l-2" style={{ borderColor: `${config.primaryColor}40` }}>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <p className="font-bold text-slate-900">1. Tab. Amoxicillin + Clavulanate (Augmentin 625mg)</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Dosage: 1 - 0 - 1 (After Food) | Duration: 5 Days</p>
                <p className="text-slate-400 text-[10px] italic">Note: Complete full antibiotic course.</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <p className="font-bold text-slate-900">2. Tab. Zerodol-SP (Aceclofenac + Paracetamol + Serratiopeptidase)</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Dosage: 1 - 0 - 1 (As needed for pain) | Duration: 3 Days</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <p className="font-bold text-slate-900">3. Chlorhexidine Mouthwash 0.2% (Hexidine)</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Dosage: 10ml warm water rinse twice daily | Duration: 7 Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Signature */}
        <div
          className="pt-4 border-t space-y-3 mt-6"
          style={{
            borderColor: `${config.primaryColor}20`,
            minHeight: `${config.footerHeightMm * 2.2}px`,
          }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-end gap-3 text-xs">
            <div className="space-y-1 max-w-sm">
              {config.showTerms && config.termsText && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instructions & Advice</p>
                  <p className="text-[10px] text-slate-600 whitespace-pre-line">{config.termsText}</p>
                </div>
              )}
              {config.showThankYou && (
                <p className="text-xs font-bold text-sky-700 pt-1">{config.thankYouMessage || 'Wishing you a speedy recovery!'}</p>
              )}
            </div>

            {config.showSignature && (
              <div className="text-center sm:text-right shrink-0 min-w-[150px]">
                <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center sm:justify-end pb-1 text-slate-300 italic text-xs font-serif">
                  {config.signatureText || 'Doctor Signature'}
                </div>
                <p className="text-[10px] font-bold text-slate-700 mt-1">Dr. {config.doctorNameOverride || doctor.name}</p>
              </div>
            )}
          </div>

          {config.showFooter && (
            <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-medium">
              {config.footerText || 'Valid Medical Prescription — FABIS MediCare'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
