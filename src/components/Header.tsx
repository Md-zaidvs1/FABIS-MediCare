import React from 'react';
import { DoctorProfile, Patient, UserRole } from '../types';
import { getLastVisitAndTreatment } from '../utils/formatters';
import { 
  UserPlus, 
  CalendarPlus, 
  Receipt, 
  Search, 
  LogOut, 
  Bell,
  Stethoscope,
  RefreshCw,
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  doctor: DoctorProfile;
  patients: Patient[];
  activeRole?: UserRole;
  username?: string;
  searchQuery: string;
  isOnline?: boolean;
  pendingCount?: number;
  isSyncing?: boolean;
  onManualSync?: () => void;
  onSearchChange: (query: string) => void;
  onSelectPatient: (patientId: string) => void;
  onOpenAddPatient: () => void;
  onOpenBookAppointment: () => void;
  onOpenCreateInvoice: () => void;
  onOpenPrescription: () => void;
  onResetDemoData: () => void;
  onLogout: () => void;
  onSwitchRole?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  doctor,
  patients,
  activeRole = 'admin',
  username,
  searchQuery,
  isOnline = true,
  pendingCount = 0,
  isSyncing = false,
  onManualSync,
  onSearchChange,
  onSelectPatient,
  onOpenAddPatient,
  onOpenBookAppointment,
  onOpenCreateInvoice,
  onOpenPrescription,
  onResetDemoData,
  onLogout,
  onSwitchRole,
}) => {
  const [showSearchResults, setShowSearchResults] = React.useState(false);

  // Compute total pending/due followups for notification badge
  const notificationCount = React.useMemo(() => {
    let count = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    patients.forEach((p) => {
      (p.followUps || []).forEach((f) => {
        if (f.status !== 'Completed' && f.dueDate <= todayStr) {
          count++;
        }
      });
    });
    return count;
  }, [patients]);

  const filteredPatients = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }, [searchQuery, patients]);

  return (
    <header className="sticky top-0 z-40 bg-theme-page/95 backdrop-blur-md px-3 sm:px-6 lg:px-8 py-2.5 transition-all text-theme-main border-b border-theme-border/60 shadow-2xs max-w-full">
      <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-3 min-w-0 max-w-full">
        
        {/* Global Search Bar on Far Left */}
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-xl">
          {/* Universal Patient Quick Search */}
          <div className="relative flex-1">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-theme-secondary pointer-events-none" />
              <input
                type="text"
                placeholder="Search patient, MRN, phone..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full pl-10 pr-4 py-2 bg-theme-card border border-theme-border focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 text-theme-main placeholder-theme-secondary rounded-xl text-xs font-semibold transition-all outline-none shadow-2xs"
              />
            </div>

            {/* Quick Search Dropdown Results */}
            {showSearchResults && filteredPatients.length > 0 && (
              <div 
                className="absolute left-0 right-0 top-full mt-2 bg-theme-card border border-theme-border rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-theme-border max-h-80 overflow-y-auto"
              >
                <div className="px-4 py-2 text-[11px] font-bold uppercase text-theme-secondary bg-theme-page">
                  Found {filteredPatients.length} matching patients
                </div>
                {filteredPatients.map((p) => {
                  const totalBalance = (p.invoices || []).reduce((sum, inv) => sum + inv.balanceDue, 0);
                  const { lastVisitDate, lastTxName } = getLastVisitAndTreatment(p);

                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPatient(p.id);
                        setShowSearchResults(false);
                        onSearchChange('');
                      }}
                      className="w-full text-left p-3 hover:bg-theme-page transition-colors flex items-center justify-between group gap-3 cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-bold text-theme-main group-hover:text-theme-accent flex items-center gap-2 truncate">
                          <span className="truncate">{p.name}</span>
                          <span className="text-theme-secondary font-normal text-[11px] shrink-0">({p.age}Y / {p.gender})</span>
                        </div>
                        <div className="text-[11px] text-theme-secondary flex items-center gap-1.5 flex-wrap mt-0.5 font-medium">
                          <span>MRN: {p.mrn}</span>
                          <span>•</span>
                          <span>Mob: {p.phone}</span>
                          <span>•</span>
                          <span>Last: {lastVisitDate}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {totalBalance > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 block">
                            Due: ₹{totalBalance}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 block">
                            Paid
                          </span>
                        )}
                        <span className="text-[11px] text-theme-accent mt-0.5 block font-bold">
                          Open EMR →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons & Profile Controls */}
        <div className="flex items-center gap-2 flex-shrink-0 touch-manipulation">
          {/* + Patient */}
          <button
            onClick={() => onOpenAddPatient()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-theme-accent hover:bg-theme-accent-hover active:scale-[0.98] text-white shadow-xs transition-all whitespace-nowrap cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-white shrink-0" />
            <span>+ Patient</span>
          </button>

          {/* + Appointment */}
          <button
            onClick={() => onOpenBookAppointment()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-theme-card hover:bg-theme-page text-theme-main border border-theme-border shadow-2xs transition-all whitespace-nowrap active:scale-[0.98] cursor-pointer"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-theme-accent shrink-0" />
            <span>+ Appointment</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              title="Notifications & Alerts"
              className="w-9 h-9 rounded-xl bg-theme-card border border-theme-border flex items-center justify-center text-theme-secondary hover:text-theme-main transition-all cursor-pointer relative shadow-2xs"
            >
              <Bell className="w-4 h-4 text-theme-main" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-theme-card">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>

          {/* Doctor Profile Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-theme-border/60">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              <Stethoscope className="w-4 h-4 text-blue-600" />
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-extrabold text-theme-main leading-tight">
                {doctor.name || 'Dr. V. Radhakrishnan'}
              </div>
              <div className="text-[10px] font-semibold text-theme-secondary leading-none">
                {activeRole === 'admin' ? 'Clinic Admin' : 'Senior Dentist'}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => onLogout()}
              title="Logout"
              className="p-1.5 rounded-lg text-theme-secondary hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

