import React from 'react';
import { Patient, Prescription, DoctorProfile } from '../../types';
import { formatDate } from '../../utils/formatters';
import { sharePrescriptionPdf } from '../../utils/pdfShare';
import { getStoredCustomClinicLogo } from '../../utils/storage';
import { FileSpreadsheet, Plus, Printer, ArrowUpRight, Trash2 } from 'lucide-react';

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
  const allRx = patients.flatMap((p) =>
    p.prescriptions.map((rx) => ({
      ...rx,
      patientName: p.name,
      patientPhone: p.phone,
      patientMrn: p.mrn,
    }))
  );

  const handleDelete = (patientId: string, rxId: string, rxTitle: string) => {
    if (window.confirm(`Are you sure you want to delete this prescription record (${rxTitle})?`)) {
      onDeletePrescription?.(patientId, rxId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-[#E8ECF3] shadow-[0_10px_30px_rgba(0,0,0,0.03)] text-[#1E293B]">
        <div>
          <h2 className="text-xl font-extrabold text-[#1E293B] flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-[#3BA7F5]" />
            <span>Rx Prescriptions Archive</span>
          </h2>
          <p className="text-sm font-medium text-[#64748B] mt-1">
            Issued dental drug prescriptions, dosage instructions, and printable letterheads
          </p>
        </div>

        <button
          onClick={() => onOpenPrescription()}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#3BA7F5] hover:bg-[#2A96E4] text-white font-bold text-sm shadow-[0_8px_20px_rgba(59,167,245,0.3)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Generate Rx</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allRx.map((rx) => (
          <div key={rx.id} className="bg-white p-6 rounded-[24px] border border-[#E8ECF3] shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4 text-[#1E293B] hover:shadow-[0_15px_35px_rgba(0,0,0,0.06)] transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8ECF3] pb-3">
              <div>
                <button
                  onClick={() => onSelectPatient(rx.patientId)}
                  className="font-bold text-[#1E293B] text-[18px] hover:text-[#3BA7F5] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {rx.patientName} <ArrowUpRight className="w-4 h-4 text-[#94A3B8]" />
                </button>
                <div className="text-xs font-mono text-[#94A3B8]">{rx.id} • {formatDate(rx.date)}</div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const patient = patients.find((p) => p.id === rx.patientId);
                    const defaultDoctor: DoctorProfile = doctor || {
                      name: 'Dr. Dental Specialist',
                      qualifications: 'BDS, MDS',
                      regNumber: 'DENT-12345',
                      clinicName: 'Dental Care Clinic',
                      clinicAddress: 'Main Healthcare Avenue',
                      clinicPhone: '+91 98765 43210',
                      clinicEmail: 'contact@dentalclinic.com',
                    };
                    sharePrescriptionPdf({
                      rx,
                      doctor: defaultDoctor,
                      patient,
                      customLogo: getStoredCustomClinicLogo(),
                    });
                  }}
                  className="px-3.5 py-2.5 min-h-[44px] rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Share digital prescription PDF via WhatsApp"
                >
                  <span className="text-sm">💬</span>
                  <span>Share via WhatsApp</span>
                </button>

                <button
                  onClick={() => onViewPrescriptionModal(rx)}
                  className="px-3.5 py-2.5 min-h-[44px] rounded-2xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1E293B] font-bold text-xs border border-[#E8ECF3] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Print or preview prescription"
                >
                  <Printer className="w-4 h-4 text-[#64748B]" />
                  <span>Print Rx</span>
                </button>

                {onDeletePrescription && (
                  <button
                    onClick={() => handleDelete(rx.patientId, rx.id, rx.id)}
                    className="p-2.5 min-h-[44px] min-w-[44px] rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 transition-colors cursor-pointer flex items-center justify-center"
                    title="Delete prescription record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="text-sm text-[#64748B]">
              <span className="text-[#94A3B8] font-mono">Diagnosis: </span>
              <span className="font-bold text-[#1E293B]">{rx.diagnosis}</span>
            </div>

            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E8ECF3] space-y-2 text-xs">
              {rx.medicines.map((m) => (
                <div key={m.id} className="flex justify-between py-1 border-b border-[#E8ECF3]/80 last:border-none">
                  <span className="font-bold text-[#1E293B] text-sm">{m.name}</span>
                  <span className="text-[#3BA7F5] font-mono font-bold text-xs">{m.frequency} ({m.duration})</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
