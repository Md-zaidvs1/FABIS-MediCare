import React, { useState, useMemo } from 'react';
import { Patient, Prescription, DoctorProfile } from '../../types';
import { formatDate, formatPatientId } from '../../utils/formatters';
import { sharePrescriptionPdf, printPdfBlob, generatePrescriptionJsPdf } from '../../utils/pdfShare';
import { getStoredCustomClinicLogo } from '../../utils/storage';
import { 
  FileSpreadsheet, 
  Plus, 
  Printer, 
  ArrowUpRight, 
  Trash2, 
  Search, 
  X, 
  FileText, 
  Calendar, 
  Pill,
  Clock
} from 'lucide-react';

interface PrescriptionsViewProps {
  patients: Patient[];
  doctor?: DoctorProfile;
  onSelectPatient: (patientId: string) => void;
  onOpenPrescription: () => void;
  onViewPrescriptionModal: (rx: Prescription) => void;
  onDeletePrescription?: (patientId: string, rxId: string) => void;
}

export const PrescriptionsView: React.FC<PrescriptionsViewProps> = ({
  patients,
  doctor,
  onSelectPatient,
  onOpenPrescription,
  onViewPrescriptionModal,
  onDeletePrescription,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getDefaultDoctor = (): DoctorProfile => doctor || {
    name: 'Dr. Dental Specialist',
    qualifications: 'BDS, MDS',
    regNumber: 'DENT-12345',
    clinicName: 'Dental Care Clinic',
    clinicAddress: 'Main Healthcare Avenue',
    clinicPhone: '+91 98765 43210',
    clinicEmail: 'contact@dentalclinic.com',
  };

  // Flatten all prescriptions with patient details attached
  const allRx = useMemo(() => {
    const list = (patients || []).flatMap((p) =>
      (p?.prescriptions || []).map((rx) => ({
        ...rx,
        patientObj: p,
        patientName: p?.name || '',
        patientPhone: p?.phone || '',
        patientRkId: formatPatientId(p),
      }))
    );
    // Sort newest first
    return list.sort((a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime());
  }, [patients]);

  // Filtered list
  const filteredRx = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allRx;
    return allRx.filter((rx) => {
      return (
        (rx.patientName || '').toLowerCase().includes(q) ||
        (rx.patientRkId || '').toLowerCase().includes(q) ||
        (rx.diagnosis && rx.diagnosis.toLowerCase().includes(q)) ||
        (rx.chiefComplaint && rx.chiefComplaint.toLowerCase().includes(q)) ||
        (rx.medicines && rx.medicines.some((m) => m && m.name && m.name.toLowerCase().includes(q)))
      );
    });
  }, [allRx, searchQuery]);

  const handleDelete = (patientId: string, rxId: string) => {
    if (window.confirm('Are you sure you want to delete this prescription record?')) {
      onDeletePrescription?.(patientId, rxId);
    }
  };

  const handlePrintA4 = (rx: Prescription, patient?: Patient) => {
    const targetPatient = patient || (rx as any).patientObj || patients.find((p) => p.id === rx.patientId || p.mrn === rx.patientId);
    const pdfBlob = generatePrescriptionJsPdf(
      rx,
      getDefaultDoctor(),
      targetPatient,
      getStoredCustomClinicLogo()
    );
    if (pdfBlob) {
      printPdfBlob(pdfBlob);
    }
  };

  const handleShareWhatsApp = (rx: Prescription, patient?: Patient) => {
    const targetPatient = patient || (rx as any).patientObj || patients.find((p) => p.id === rx.patientId || p.mrn === rx.patientId);
    sharePrescriptionPdf({
      rx,
      doctor: getDefaultDoctor(),
      patient: targetPatient,
      customLogo: getStoredCustomClinicLogo(),
      format: 'a4',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-[24px] border border-[#E8ECF3] shadow-[0_8px_24px_rgba(0,0,0,0.03)] text-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#3BA7F5] shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1E293B] tracking-tight">
              PRESCRIPTION HISTORY
            </h1>
            <div className="text-xs font-semibold text-[#64748B] mt-0.5">
              {allRx.length} {allRx.length === 1 ? 'Prescription Recorded' : 'Prescriptions Recorded'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenPrescription()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3BA7F5] hover:bg-[#2A96E4] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Prescription</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Patient Name, RK Patient ID (e.g. RK881), Medicine, or Diagnosis..."
          className="w-full pl-11 pr-10 py-3 bg-white border border-[#E8ECF3] rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none focus:border-[#3BA7F5] focus:ring-2 focus:ring-sky-100 transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Prescription History Cards Grid / Timeline */}
      {filteredRx.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-[#E8ECF3] p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Pill className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-slate-700">
            {searchQuery ? 'No matching prescriptions found' : 'No prescriptions recorded yet'}
          </div>
          <div className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'Try searching with a different patient name, RK Patient ID, or medicine.'
              : 'Click "New Prescription" above to issue a digital prescription for a patient.'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRx.map((rx) => {
            const patient = rx.patientObj || patients.find((p) => p.id === rx.patientId);
            const ptRkId = formatPatientId(patient || rx.patientId);

            return (
              <div
                key={rx.id}
                className="bg-white rounded-[22px] border border-[#E8ECF3] p-5 shadow-[0_6px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:border-sky-200 transition-all text-[#1E293B] flex flex-col justify-between space-y-4"
              >
                {/* Top Row: Date & Status Badge */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-sky-500" />
                    <span>{formatDate(rx.date)}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wider">
                    Prescription
                  </span>
                </div>

                {/* Patient Information Row */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onSelectPatient(rx.patientId)}
                      className="font-bold text-base text-slate-900 hover:text-sky-600 flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                    >
                      <span>{rx.patientName}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <div className="text-xs font-mono font-bold text-sky-700 bg-sky-50/70 px-2 py-0.5 rounded-md border border-sky-100">
                      Patient ID: {ptRkId}
                    </div>
                  </div>

                  {rx.diagnosis && (
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-400">Diagnosis: </span>
                      <span className="font-bold text-slate-800">{rx.diagnosis}</span>
                    </div>
                  )}
                </div>

                {/* Medicines List */}
                <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-sky-500" />
                    <span>Medicines</span>
                  </div>
                  <div className="space-y-1.5">
                    {rx.medicines.map((m) => (
                      <div key={m.id} className="text-xs flex items-start justify-between gap-2">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="text-sky-500 font-black">•</span>
                          <span>{m.name}</span>
                        </div>
                        <div className="text-[11px] font-mono font-bold text-slate-500 shrink-0">
                          {m.frequency}{m.duration ? ` (${m.duration})` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Follow-Up / Next Visit */}
                {rx.nextVisitDate && (
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 bg-amber-50/70 border border-amber-200/80 px-3 py-1.5 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Follow-Up: {formatDate(rx.nextVisitDate)}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* A4 PDF Button */}
                    <button
                      type="button"
                      onClick={() => handlePrintA4(rx, patient)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-sky-400" />
                      <span>A4 PDF</span>
                    </button>

                    {/* WhatsApp Button */}
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(rx, patient)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="text-xs">💬</span>
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  {onDeletePrescription && (
                    <button
                      type="button"
                      onClick={() => handleDelete(rx.patientId, rx.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete prescription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

