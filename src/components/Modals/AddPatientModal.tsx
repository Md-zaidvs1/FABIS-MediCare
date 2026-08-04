import React, { useState, useMemo } from 'react';
import { Patient, Gender } from '../../types';
import { UserPlus, X, AlertTriangle, UserCheck } from 'lucide-react';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (patientData: Omit<Patient, 'id' | 'mrn' | 'createdAt' | 'teethMap' | 'treatmentPlans' | 'prescriptions' | 'invoices' | 'appointments' | 'followUps' | 'media'>) => Patient | void;
  existingPatients?: Patient[];
  onSelectExistingPatient?: (patientId: string) => void;
  onPatientSaved?: (patient: Patient) => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onAddPatient,
  existingPatients = [],
  onSelectExistingPatient,
  onPatientSaved,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<Gender>('Male');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [cityArea, setCityArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [notes, setNotes] = useState('');

  // Duplicate Patient Detection
  const matchingPatients = useMemo(() => {
    if (!existingPatients || existingPatients.length === 0) return [];
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanName = name.trim().toLowerCase();
    if (!cleanPhone && cleanName.length < 3) return [];

    return existingPatients.filter((p) => {
      const pPhoneClean = p.phone.replace(/\D/g, '');
      const phoneMatch = cleanPhone.length >= 4 && pPhoneClean.includes(cleanPhone);
      const nameMatch = cleanName.length >= 3 && p.name.toLowerCase().includes(cleanName);
      const mrnMatch = cleanName.length >= 3 && p.mrn.toLowerCase().includes(cleanName);
      return phoneMatch || nameMatch || mrnMatch;
    });
  }, [name, phone, existingPatients]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const fullAddrParts = [
      streetAddress.trim(),
      cityArea.trim(),
      pincode.trim() ? `Pincode: ${pincode.trim()}` : '',
    ].filter(Boolean);
    const formattedAddress = fullAddrParts.join(', ');

    const createdPatient = onAddPatient({
      name: name.trim(),
      age,
      gender,
      phone: phone.trim(),
      streetAddress: streetAddress.trim(),
      cityArea: cityArea.trim(),
      pincode: pincode.trim(),
      address: formattedAddress,
      bloodGroup,
      status: 'Active',
      medicalHistory: {
        allergies: [],
        systemicConditions: [],
        currentMedications: [],
        bleedingDisorder: false,
        notes,
      },
      vitals: {
        bloodPressure: '120/80',
        pulseRate: 72,
      },
    });

    if (createdPatient && onPatientSaved) {
      onPatientSaved(createdPatient);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-[#E8ECF3] rounded-[28px] w-[92vw] sm:w-[90vw] md:w-[90vw] max-w-xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-[#1E293B] max-h-[92vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8ECF3] pb-4 shrink-0">
          <div className="flex items-center gap-2.5 text-[#3BA7F5] font-extrabold text-base sm:text-lg">
            <UserPlus className="w-5 h-5 text-[#3BA7F5]" />
            <span>Add Patient — New Registration</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#3BA7F5]/10 text-[#2A96E4] border border-[#3BA7F5]/20">
              ⚡ Auto MRN
            </span>
            <button onClick={onClose} className="p-2 text-[#94A3B8] hover:text-[#1E293B] rounded-full hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form with Flex Scrollable Body & Sticky Footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden pt-3 text-xs">
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            {matchingPatients.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-amber-900 font-extrabold text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Existing Patient Found ({matchingPatients.length})</span>
                  </div>
                  <span className="text-[11px] font-bold bg-amber-200/80 text-amber-950 px-2.5 py-0.5 rounded-full">
                    Prevent Duplicate
                  </span>
                </div>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  A patient matching your input already exists in the clinic system. You can open their record directly:
                </p>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {matchingPatients.map((ep) => (
                    <div
                      key={ep.id}
                      className="bg-white border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {ep.name} <span className="text-xs font-mono font-bold text-sky-600">({ep.mrn})</span>
                        </div>
                        <div className="text-xs text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5 font-medium mt-0.5">
                          <span>📱 {ep.phone}</span>
                          <span>🎂 {ep.age} yrs ({ep.gender})</span>
                          <span>🗓️ Last Visit: {ep.appointments[ep.appointments.length - 1]?.date || 'N/A'}</span>
                          <span>📑 Total Visits: {ep.appointments.length}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectExistingPatient) {
                            onSelectExistingPatient(ep.id);
                            onClose();
                          }
                        }}
                        className="px-3 py-1.5 min-h-[36px] bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Open Patient Record</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Full Patient Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sanya Malhotra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] placeholder-[#94A3B8] focus:border-[#3BA7F5] outline-none transition-all font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[#1E293B] font-bold block mb-1.5">Age *</label>
                <input
                  type="number"
                  inputMode="numeric"
                  required
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value, 10))}
                  className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none transition-all font-bold text-center"
                />
              </div>

              <div>
                <label className="text-[#1E293B] font-bold block mb-1.5">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none transition-all cursor-pointer font-semibold"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[#1E293B] font-bold block mb-1.5">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none transition-all cursor-pointer font-semibold"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Mobile Phone *</label>
              <input
                type="text"
                inputMode="tel"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] placeholder-[#94A3B8] focus:border-[#3BA7F5] outline-none transition-all font-mono font-semibold"
              />
            </div>

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">House / Street Address</label>
              <input
                type="text"
                placeholder="Door No. 12/A, Gandhi Street, Indiranagar"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] placeholder-[#94A3B8] focus:border-[#3BA7F5] outline-none transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[#1E293B] font-bold block mb-1.5">City / Area</label>
                <input
                  type="text"
                  placeholder="Bangalore / Koramangala"
                  value={cityArea}
                  onChange={(e) => setCityArea(e.target.value)}
                  className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] placeholder-[#94A3B8] focus:border-[#3BA7F5] outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-[#1E293B] font-bold block mb-1.5">Pincode (Optional)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="560038"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] placeholder-[#94A3B8] focus:border-[#3BA7F5] outline-none transition-all font-mono font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Chief Complaint / Initial Clinical Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Pain in upper molar, desires teeth cleaning..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] placeholder-[#94A3B8] focus:border-[#3BA7F5] outline-none transition-all"
              />
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 pb-1 border-t border-[#E8ECF3] flex items-center justify-end gap-3 z-20 shrink-0">
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
              Save Patient (Auto Generate MRN)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
