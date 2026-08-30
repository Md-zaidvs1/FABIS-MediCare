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

  // Render PNG template with overlaid elements if backgroundImageUrl exists
  if (config.backgroundImageUrl && config.elements && config.elements.length > 0) {
    const isThermal = config.type === 'receipt_80mm';
    return (
      <div className="w-full flex justify-center bg-slate-200/60 p-4 sm:p-6 rounded-2xl overflow-x-auto min-h-[620px]">
        <div
          className={`bg-white shadow-2xl relative select-none overflow-hidden transition-all border border-slate-300 ${
            isThermal ? 'w-[320px] min-h-[600px]' : 'w-[540px] h-[760px]'
          }`}
          style={{
            backgroundImage: `url(${config.backgroundImageUrl})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {config.watermarkImageUrl && (
            <div
              className="absolute inset-0 pointer-events-none opacity-15 bg-center bg-no-repeat bg-contain"
              style={{ backgroundImage: `url(${config.watermarkImageUrl})` }}
            />
          )}

          {config.elements.map((el) => {
            if (el.hidden) return null;
            let text = el.content;
            if (el.fieldKey === 'patient_name') text = (el.labelOverride ? `${el.labelOverride}: ` : '') + activePatient.name;
            else if (el.fieldKey === 'mrn') text = (el.labelOverride ? `${el.labelOverride}: ` : '') + activePatient.id;
            else if (el.fieldKey === 'appointment_date') text = (el.labelOverride ? `${el.labelOverride}: ` : '') + '02 Aug 2026';
            else if (el.fieldKey === 'invoice_number') text = (el.labelOverride ? `${el.labelOverride}: ` : '') + 'INV-2026-089';
            else if (el.fieldKey === 'grand_total') text = (el.labelOverride ? `${el.labelOverride}: ` : '') + '₹5,500.00';
            else if (el.fieldKey === 'payment_method') text = (el.labelOverride ? `${el.labelOverride}: ` : '') + 'CARD / UPI';
            else if (el.fieldKey === 'clinic_name') text = config.clinicNameOverride || doctor.clinicName || 'RK DENTAL CLINIC';
            else if (el.fieldKey === 'clinic_address') text = config.clinicAddressOverride || doctor.clinicAddress || 'Kalavai 632506';
            else if (el.fieldKey === 'clinic_phone') text = `Ph: ${config.clinicPhoneOverride || doctor.clinicPhone || '+91 8883261285'}`;
            else if (el.fieldKey === 'doctor_name') text = `Dr. ${doctor.name}`;
            else if (el.fieldKey === 'doctor_reg_no') text = `Reg: ${doctor.regNumber || 'DENT-12345'}`;
            else if (el.fieldKey === 'thank_you_message') text = config.thankYouMessage || 'THANK YOU FOR YOUR VISIT!';

            return (
              <div
                key={el.id}
                className="absolute px-1 py-0.5"
                style={{
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: el.width ? `${el.width}%` : 'auto',
                  fontSize: el.fontSize ? `${el.fontSize}px` : '12px',
                  fontFamily: el.fontFamily || 'sans-serif',
                  fontWeight: el.bold ? 'bold' : 'normal',
                  fontStyle: el.italic ? 'italic' : 'normal',
                  textDecoration: el.underline ? 'underline' : 'none',
                  color: el.color || '#000000',
                  textAlign: el.textAlign || 'left',
                }}
              >
                {el.type === 'table' ? (
                  <div className="border border-slate-300 bg-white/80 p-1 text-[10px]">
                    <div className="font-bold flex justify-between border-b pb-0.5 mb-0.5">
                      <span>PROCEDURE</span>
                      <span>AMOUNT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dental Consultation</span>
                      <span>₹200.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Root Canal Treatment</span>
                      <span>₹4,500.00</span>
                    </div>
                  </div>
                ) : el.type === 'barcode' ? (
                  <div className="bg-white/90 p-1 border border-slate-300 text-center text-[9px] font-mono font-bold">
                    ||||||||||||||||||||||||||||||||
                    <br />
                    RK-20260717-0001
                  </div>
                ) : (
                  text || el.labelOverride || el.id
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

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
    const thermalItems = [
      { description: 'Dental Consultation', total: 200 },
      { description: 'Surgical / Impacted Extraction', total: 2500 },
      { description: 'Single Tooth Extraction', total: 500 },
    ];
    const thermalGrandTotal = 3200;
    const invId = config.barcodeText || 'RK-20260717-0001';

    const getDividerClass = () => {
      if (config.dividerStyle === 'solid') return 'border-b border-black my-2';
      if (config.dividerStyle === 'dashed') return 'border-b border-dashed border-black my-2';
      if (config.dividerStyle === 'double') return 'border-b-2 border-double border-black my-2';
      return 'border-b border-dotted border-black my-2';
    };

    return (
      <div className="w-full flex justify-center bg-slate-200/60 p-4 sm:p-6 rounded-2xl min-h-[550px]">
        {/* Simulated Thermal Paper Roll with Sawtooth Edges */}
        <div
          className={`bg-white shadow-2xl text-black border border-slate-300 w-[310px] font-mono p-4 space-y-1.5 rounded-t-sm transition-all duration-200 relative ${fontClass} ${weightClass}`}
          style={{
            fontFamily: config.fontFamily || 'Courier Prime, monospace',
            paddingLeft: `${Math.max(4, config.marginMm * 2)}px`,
            paddingRight: `${Math.max(4, config.marginMm * 2)}px`,
            borderBottom: '6px dotted #94A3B8',
          }}
        >
          {/* Watermark Image Layer */}
          {config.watermarkImageUrl && (
            <div
              className="absolute inset-0 pointer-events-none opacity-10 bg-center bg-no-repeat bg-contain m-4"
              style={{ backgroundImage: `url(${config.watermarkImageUrl})` }}
            />
          )}

          {/* Logo Header */}
          {config.showLogo && config.logoUrl && (
            <div className="flex justify-center pb-1">
              <img src={config.logoUrl} alt="Clinic Logo" className="h-10 object-contain" />
            </div>
          )}

          {/* Clinic Information (Centered) */}
          <div className="text-center space-y-0.5">
            {config.showClinicName && (
              <h2 className="font-black text-sm sm:text-base uppercase tracking-tight text-black">
                {config.clinicNameOverride || doctor.clinicName || 'RK DENTAL CLINIC'}
              </h2>
            )}
            {config.showClinicAddress && (
              <p className="text-[10px] font-normal leading-snug px-2 text-black">
                {config.clinicAddressOverride || doctor.clinicAddress || 'No.10/1 School street, near police station, Kalavai 632506'}
              </p>
            )}
            {config.showClinicPhone && (
              <p className="text-[10px] font-normal text-black">
                Ph: {config.clinicPhoneOverride || doctor.clinicPhone || '+91 8883261285'}
              </p>
            )}
            {config.showClinicEmail && config.clinicEmailOverride && (
              <p className="text-[10px] font-normal text-black">Email: {config.clinicEmailOverride}</p>
            )}
            {config.showClinicWebsite && config.clinicWebsiteOverride && (
              <p className="text-[10px] font-normal text-black">{config.clinicWebsiteOverride}</p>
            )}
          </div>

          {/* Divider 1 */}
          <div className={getDividerClass()} />

          {/* Date & Invoice Meta Row 1 */}
          <div className="text-[11px] flex justify-between items-center font-normal">
            <span>Date: 2026-07-17 13:55</span>
            <span className="font-extrabold">{invId}</span>
          </div>

          {/* Patient & Phone Meta Row 2 */}
          <div className="text-[11px] flex justify-between items-center font-normal">
            <span>Patient: {activePatient.name === 'Ananya Sharma' ? 'ZAID' : activePatient.name}</span>
            <span>Ph: {activePatient.mobile === '+91 98765 43210' ? '7418773765' : activePatient.mobile}</span>
          </div>

          {/* Divider 2 */}
          <div className={getDividerClass()} />

          {/* Procedure Table Header */}
          <div className="text-[11px] font-black flex justify-between items-center uppercase tracking-wider">
            <span>PROCEDURE</span>
            <span>AMOUNT</span>
          </div>

          {/* Divider 3 */}
          <div className={getDividerClass()} />

          {/* Procedure Line Items */}
          <div className="space-y-1 text-[11px]">
            {thermalItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start gap-2">
                <span className="font-normal leading-tight max-w-[190px]">{item.description}</span>
                <span className="font-extrabold shrink-0 text-right">
                  {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>

          {/* Divider 4 */}
          <div className={getDividerClass()} />

          {/* Grand Total */}
          <div className="text-xs sm:text-sm font-black flex justify-between items-center uppercase tracking-tight py-0.5">
            <span>GRAND TOTAL</span>
            <span className="text-sm font-black">
              ₹ {thermalGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Divider 5 */}
          <div className={getDividerClass()} />

          {/* Payment Mode */}
          {config.showPaymentMode !== false && (
            <>
              <div className="text-[11px] flex justify-between items-center font-normal py-0.5">
                <span>Payment Mode</span>
                <span className="border-2 border-black px-2 py-0.5 font-black text-[11px] uppercase rounded-none tracking-wider">
                  {config.paymentModeOverride || 'CARD'}
                </span>
              </div>
              {/* Divider 6 */}
              <div className={getDividerClass()} />
            </>
          )}

          {/* Footer Thank You & Sub-note */}
          <div className="text-center pt-1 space-y-0.5">
            {config.showThankYou && (
              <h3 className="font-black text-xs sm:text-sm uppercase tracking-tight text-black">
                {config.thankYouMessage || 'THANK YOU FOR YOUR VISIT!'}
              </h3>
            )}
            {config.showFooter && (
              <p className="text-[10px] font-normal text-black">{config.footerText || 'Keep smiling.'}</p>
            )}
          </div>

          {/* Stamp & Signature if present */}
          {(config.stampImageUrl || config.signatureImageUrl) && (
            <div className="flex justify-around items-center pt-2">
              {config.stampImageUrl && (
                <img src={config.stampImageUrl} alt="Stamp" className="h-8 object-contain" />
              )}
              {config.signatureImageUrl && (
                <div className="text-center">
                  <img src={config.signatureImageUrl} alt="Signature" className="h-6 object-contain mx-auto" />
                  <span className="text-[8px] block font-bold">Authorized Sign</span>
                </div>
              )}
            </div>
          )}

          {/* UPI QR Code if enabled */}
          {config.showQrCode && (
            <div className="text-center pt-2 flex flex-col items-center">
              <div className="w-16 h-16 border-2 border-black p-1 bg-white">
                <QrCode className="w-full h-full text-black" />
              </div>
              <p className="text-[9px] font-extrabold mt-0.5 uppercase">{config.qrCodeLabel || 'Scan UPI'}</p>
            </div>
          )}

          {/* Barcode graphic at bottom */}
          {(config.showBarcode ?? true) && (
            <div className="text-center pt-3 pb-1 flex flex-col items-center justify-center">
              <div className="flex items-end justify-center h-9 gap-[2px] overflow-hidden py-1">
                {[4, 2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 1, 2, 4, 2, 1, 3, 1, 4, 2, 3, 1, 2].map((w, i) => (
                  <div key={i} className="bg-black h-full" style={{ width: `${w}px` }} />
                ))}
              </div>
              <span className="text-[10px] font-mono font-black tracking-widest text-black mt-0.5">{invId}</span>
            </div>
          )}
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
          {/* Header Section matching Bill A4 */}
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
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: `${config.primaryColor}15`,
                    borderColor: `${config.primaryColor}30`,
                    color: config.primaryColor,
                  }}
                >
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
                  {config.showClinicPhone && <span>Ph: {config.clinicPhoneOverride || doctor.clinicPhone || '+91 8883261285'}</span>}
                  {config.showClinicEmail && <span>| {config.clinicEmailOverride || doctor.clinicEmail || 'contact@fabismedicare.com'}</span>}
                </div>
              </div>
            </div>

            {/* Document Title Banner & Doctor Info (Right) */}
            <div className="text-right sm:text-right self-start">
              <span
                className="inline-block px-3 py-1 rounded-lg text-white font-black text-xs uppercase tracking-wider mb-1.5"
                style={{ backgroundColor: config.primaryColor }}
              >
                PRESCRIPTION
              </span>
              {config.showDoctorName && (
                <p className="font-extrabold text-slate-900 text-sm">Dr. {config.doctorNameOverride || doctor.name}</p>
              )}
              {config.showQualification && (
                <p className="text-[11px] text-slate-500">{config.qualificationOverride || doctor.qualifications || 'BDS, MDS'}</p>
              )}
              {config.showRegNumber && (
                <p className="text-[11px] font-bold mt-0.5" style={{ color: config.primaryColor }}>
                  Reg #: {config.regNumberOverride || doctor.regNumber || 'DENT-12345'}
                </p>
              )}
            </div>
          </div>

          {/* Patient & Prescription Info Cards Grid (Twin 2-Column Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patient Details Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div
                className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-200"
                style={{ color: config.primaryColor }}
              >
                PATIENT DETAILS
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500 shrink-0">Patient:</span>
                <span className="font-bold text-slate-800 text-right truncate">{activePatient.name.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500 shrink-0">Patient ID:</span>
                <span className="font-mono text-slate-700 font-bold text-right">{activePatient.id}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500 shrink-0">Age / Gender:</span>
                <span className="text-slate-700 text-right">{activePatient.age} Yrs / {activePatient.gender}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500 shrink-0">Contact No:</span>
                <span className="text-slate-700 text-right">{activePatient.mobile}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500 shrink-0">Address:</span>
                <span className="text-slate-700 text-right truncate max-w-[180px]">{activePatient.address || 'Kalavai, Tamil Nadu'}</span>
              </div>
            </div>

            {/* Prescription Details Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div
                className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-200"
                style={{ color: config.primaryColor }}
              >
                PRESCRIPTION DETAILS
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500 shrink-0">Rx Number:</span>
                <span className="font-mono font-bold text-slate-800 text-right">#RX-2026-042</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500 shrink-0">Date:</span>
                <span className="text-slate-700 text-right">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500 shrink-0">Chief Complaint:</span>
                <span className="text-slate-700 text-right truncate max-w-[180px]">Pain in lower right molar (#46)</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500 shrink-0">Diagnosis:</span>
                <span className="font-bold text-slate-800 text-right truncate max-w-[180px]">Acute Irreversible Pulpitis</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Status:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                  ACTIVE RX
                </span>
              </div>
            </div>
          </div>

          {/* Prescribed Medicines Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead style={{ backgroundColor: `${config.primaryColor}15`, color: config.primaryColor }}>
                <tr className="font-extrabold text-[11px] uppercase border-b border-slate-200">
                  <th className="p-2.5 whitespace-nowrap">#</th>
                  <th className="p-2.5 whitespace-nowrap">Medicine Name & Formulation</th>
                  <th className="p-2.5 whitespace-nowrap">Dosage</th>
                  <th className="p-2.5 whitespace-nowrap">Frequency / Timing</th>
                  <th className="p-2.5 whitespace-nowrap">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-medium text-slate-500 whitespace-nowrap">1</td>
                  <td className="p-2.5 font-bold text-slate-900">
                    <div>Amoxicillin + Clavulanic Acid 625mg</div>
                    <div className="text-[10px] text-slate-500 font-normal">Form: Augmentin 625 Tab</div>
                  </td>
                  <td className="p-2.5 text-slate-600 whitespace-nowrap">1 Tab</td>
                  <td className="p-2.5 font-bold whitespace-nowrap" style={{ color: config.primaryColor }}>
                    1 - 0 - 1 (After Food)
                  </td>
                  <td className="p-2.5 font-bold text-slate-800 whitespace-nowrap">5 Days</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-medium text-slate-500 whitespace-nowrap">2</td>
                  <td className="p-2.5 font-bold text-slate-900">
                    <div>Zerodol-SP</div>
                    <div className="text-[10px] text-slate-500 font-normal">Form: Aceclofenac + Paracetamol + Serratiopeptidase</div>
                  </td>
                  <td className="p-2.5 text-slate-600 whitespace-nowrap">1 Tab</td>
                  <td className="p-2.5 font-bold whitespace-nowrap" style={{ color: config.primaryColor }}>
                    1 - 0 - 1 (SOS Pain)
                  </td>
                  <td className="p-2.5 font-bold text-slate-800 whitespace-nowrap">3 Days</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 font-medium text-slate-500 whitespace-nowrap">3</td>
                  <td className="p-2.5 font-bold text-slate-900">
                    <div>Chlorhexidine 0.2% Mouthwash</div>
                    <div className="text-[10px] text-slate-500 font-normal">Form: Hexidine Oral Rinse</div>
                  </td>
                  <td className="p-2.5 text-slate-600 whitespace-nowrap">10ml swish</td>
                  <td className="p-2.5 font-bold whitespace-nowrap" style={{ color: config.primaryColor }}>
                    1 - 0 - 1 (After Brushing)
                  </td>
                  <td className="p-2.5 font-bold text-slate-800 whitespace-nowrap">7 Days</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Doctor Advice Box */}
          {config.showTerms && config.termsText && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-1">
              <p className="font-bold text-amber-900 text-xs uppercase tracking-wide">
                DOCTOR ADVICE / SPECIAL INSTRUCTIONS:
              </p>
              <p className="text-amber-950 text-xs leading-relaxed whitespace-pre-line">{config.termsText}</p>
            </div>
          )}

          {/* Next Visit / Follow-up Box */}
          <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-sky-600" />
              <span className="font-bold text-xs text-sky-900">
                Follow-up Visit: <span className="font-black text-sky-700">In 5 Days (Post-medication Review)</span>
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase text-sky-600 bg-sky-100 px-2.5 py-0.5 rounded-full">
              Recommended
            </span>
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
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <p className="font-bold" style={{ color: config.primaryColor }}>Digital EMR Certified Prescription</p>
                <p className="text-slate-400">* Please follow prescribed dosage instructions carefully.</p>
                <p className="text-slate-400">* In case of any adverse reactions or acute pain, contact clinic immediately.</p>
              </div>
              {config.showThankYou && (
                <p className="text-xs font-bold pt-1" style={{ color: config.primaryColor }}>
                  {config.thankYouMessage || 'Wishing you a speedy recovery!'}
                </p>
              )}
            </div>

            {config.showSignature && (
              <div className="text-center sm:text-right shrink-0 min-w-[150px]">
                <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center sm:justify-end pb-1 text-slate-300 italic text-xs font-serif">
                  {config.signatureText || 'Doctor Signature'}
                </div>
                <p className="text-[10px] font-bold text-slate-700 mt-1">Dr. {config.doctorNameOverride || doctor.name}</p>
                <p className="text-[9px] text-slate-400">Doctor Signature & Stamp</p>
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
