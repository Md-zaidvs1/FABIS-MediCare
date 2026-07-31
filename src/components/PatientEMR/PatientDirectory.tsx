import React, { useState } from 'react';
import { Patient } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  Users, 
  Search, 
  UserPlus, 
  ChevronRight, 
  FileText, 
  Phone, 
  Calendar, 
  AlertCircle,
  Activity,
  MapPin
} from 'lucide-react';

interface PatientDirectoryProps {
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
  onOpenAddPatient: () => void;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({
  patients,
  onSelectPatient,
  onOpenAddPatient,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mrn.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && p.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Directory Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-theme-card p-6 rounded-[28px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div>
          <h2 className="text-xl font-extrabold text-theme-main flex items-center gap-2.5">
            <Users className="w-6 h-6 text-theme-accent" />
            <span>Patient EMR Directory</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-theme-accent/15 text-theme-accent border border-theme-accent/30">
              {patients.length} Total Patients
            </span>
          </h2>
          <p className="text-sm font-medium text-theme-secondary mt-1">
            Access longitudinal dental histories, teeth maps, treatment plans, prescriptions, and billing ledgers
          </p>
        </div>

        <button
          onClick={() => onOpenAddPatient()}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-theme-accent hover:bg-theme-accent-hover text-white font-bold text-sm shadow-md transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4 text-white" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-theme-card p-4 rounded-[24px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] min-w-0">
        <div className="relative w-full sm:w-80 md:w-96 shrink-0">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-theme-secondary pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, MRN, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 min-h-[44px] bg-theme-page border border-theme-border rounded-2xl text-sm text-theme-main placeholder-theme-secondary focus:outline-none focus:border-theme-accent transition-all font-semibold"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 touch-manipulation min-w-0 whitespace-nowrap">
          {['ALL', 'Treatment Ongoing', 'Active', 'Completed', 'Follow-up Due'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 min-h-[40px] rounded-2xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                statusFilter === st
                  ? 'bg-theme-accent/15 text-theme-accent border-theme-accent/40 shadow-xs'
                  : 'bg-theme-page text-theme-secondary border-theme-border hover:text-theme-main hover:bg-theme-border/30'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((patient) => {
          // Calculate pending balance
          const totalBalance = patient.invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

          return (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className="bg-theme-card hover:bg-theme-page p-6 rounded-[24px] border border-theme-border hover:border-theme-accent/50 transition-all cursor-pointer group flex flex-col justify-between space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.07)]"
            >
              <div className="space-y-3">
                {/* Header info - Restructured into vertical flex (flex flex-col gap-1.5) */}
                <div className="flex flex-col gap-1.5 min-w-0">
                  {/* Row 1: Patient Name (full name 100% width) */}
                  <h3 className="text-base sm:text-lg font-bold text-theme-main group-hover:text-theme-accent transition-colors truncate w-full">
                    {patient.name}
                  </h3>

                  {/* Row 2: Status Badge + Age/Gender Tag + MRN */}
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 whitespace-nowrap ${
                        patient.status === 'Treatment Ongoing'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : patient.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-sky-50 text-sky-800 border-sky-200'
                      }`}
                    >
                      {patient.status}
                    </span>
                    <span className="text-xs font-semibold text-theme-secondary px-2 py-0.5 rounded-md bg-theme-page border border-theme-border/60 shrink-0">
                      {patient.age}{patient.gender[0]}
                    </span>
                    <span className="text-xs font-mono text-theme-secondary whitespace-nowrap shrink-0">
                      MRN: {patient.mrn}
                    </span>
                  </div>
                </div>

                {/* Contact & Vitals snippet */}
                <div className="space-y-2 text-xs text-theme-secondary bg-theme-page p-3.5 rounded-2xl border border-theme-border font-medium">
                  <div className="flex items-center gap-2 text-theme-main">
                    <Phone className="w-4 h-4 text-theme-accent shrink-0" />
                    <span>{patient.phone}</span>
                  </div>
                  {(patient.streetAddress || patient.cityArea || patient.address) && (
                    <div className="flex items-center gap-2 text-theme-main">
                      <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">
                        {[patient.streetAddress, patient.cityArea, patient.pincode].filter(Boolean).join(', ') || patient.address}
                      </span>
                    </div>
                  )}
                  {patient.vitals?.bloodPressure && (
                    <div className="flex items-center gap-2 text-xs text-theme-secondary">
                      <Activity className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>BP: {patient.vitals.bloodPressure} mmHg</span>
                      {patient.vitals.pulseRate && <span>• Pulse: {patient.vitals.pulseRate} bpm</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Active procedures & dues */}
              <div className="pt-3 border-t border-theme-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-theme-secondary block font-extrabold">Pending Dues</span>
                  <span
                    className={`font-bold font-mono text-sm ${
                      totalBalance > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {formatCurrency(totalBalance)}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-theme-accent font-bold text-xs group-hover:translate-x-1 transition-transform">
                  <span>Open EMR</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
