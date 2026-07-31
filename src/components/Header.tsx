import React from 'react';
import { DoctorProfile, Patient, UserRole } from '../types';
import { getLastVisitAndTreatment } from '../utils/formatters';
import { 
  UserPlus, 
  CalendarPlus, 
  FileText, 
  Receipt, 
  Search, 
  RotateCcw, 
  LogOut, 
  ShieldCheck,
  UserCheck,
  RefreshCw
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
    <header className="sticky top-0 z-30 bg-theme-page/90 backdrop-blur-md px-3 sm:px-6 lg:px-8 py-3.5 transition-all text-theme-main border-b border-theme-border/50 max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-2 px-4 py-3 min-w-0 max-w-full overflow-hidden">
        
        {/* Universal Patient Quick Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs md:max-w-md">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-theme-secondary pointer-events-none" />
            <input
              type="text"
              placeholder="Search patients, MRN, phone, invoice..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-theme-card border border-theme-border focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 text-theme-main placeholder-theme-secondary rounded-full text-xs sm:text-sm font-medium transition-all outline-none shadow-xs"
            />
          </div>

          {/* Quick Search Dropdown Results */}
          {showSearchResults && filteredPatients.length > 0 && (
            <div 
              className="absolute left-0 right-0 top-full mt-2 bg-theme-card border border-theme-border rounded-[24px] shadow-lg overflow-hidden z-50 divide-y divide-theme-border max-h-80 overflow-y-auto"
            >
              <div className="px-4 py-2.5 text-[12px] font-bold uppercase text-theme-secondary bg-theme-page">
                Found {filteredPatients.length} matching patients
              </div>
              {filteredPatients.map((p) => {
                const totalBalance = p.invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
                const { lastVisitDate, lastTxName } = getLastVisitAndTreatment(p);

                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPatient(p.id);
                      setShowSearchResults(false);
                      onSearchChange('');
                    }}
                    className="w-full text-left p-3.5 hover:bg-theme-page transition-colors flex items-center justify-between group gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm sm:text-base font-bold text-theme-main group-hover:text-theme-accent flex items-center gap-2 truncate">
                        <span className="truncate">{p.name}</span>
                        <span className="text-theme-secondary font-normal text-xs shrink-0">({p.age}Y / {p.gender})</span>
                      </div>
                      <div className="text-xs text-theme-secondary flex items-center gap-2 flex-wrap mt-0.5">
                        <span>MRN: {p.mrn}</span>
                        <span>•</span>
                        <span>Mob: {p.phone}</span>
                        <span>•</span>
                        <span>Last: {lastVisitDate}</span>
                      </div>
                      <div className="text-xs text-theme-secondary font-medium truncate mt-0.5">
                        Tx: {lastTxName}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {totalBalance > 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 block">
                          Due: ₹{totalBalance}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 block">
                          Paid
                        </span>
                      )}
                      <span className="text-xs text-theme-accent mt-1 block font-semibold">
                        Open EMR →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0 touch-manipulation">
          <button
            onClick={() => onOpenAddPatient()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs md:text-sm font-bold rounded-full bg-theme-accent hover:bg-theme-accent-hover active:scale-[0.98] text-white shadow-md transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-white shrink-0" />
            <span>+ Add Patient</span>
          </button>

          <button
            onClick={() => onOpenBookAppointment()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs md:text-sm font-semibold rounded-full bg-theme-card hover:bg-theme-page text-theme-main border border-theme-border shadow-xs transition-all whitespace-nowrap active:scale-[0.98] shrink-0 cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4 text-theme-accent shrink-0" />
            <span>Book Visit</span>
          </button>

          <button
            onClick={() => onOpenCreateInvoice()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs md:text-sm font-semibold rounded-full bg-theme-card hover:bg-theme-page text-theme-main border border-theme-border shadow-xs transition-all whitespace-nowrap active:scale-[0.98] shrink-0 cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Invoice</span>
          </button>

          <button
            onClick={() => onOpenPrescription()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs md:text-sm font-semibold rounded-full bg-theme-card hover:bg-theme-page text-theme-main border border-theme-border shadow-xs transition-all whitespace-nowrap active:scale-[0.98] shrink-0 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Rx</span>
          </button>

          {/* Icon Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Online / Offline Sync Badge */}
            <button
              onClick={onManualSync}
              title={isOnline ? (pendingCount > 0 ? `${pendingCount} pending updates. Click to sync.` : 'Online & Dual-Saved to IndexedDB') : 'Offline Mode active. All saves held locally in IndexedDB.'}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border shadow-2xs transition-all cursor-pointer ${
                !isOnline
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : pendingCount > 0
                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  !isOnline
                    ? 'bg-amber-500 animate-pulse'
                    : pendingCount > 0
                    ? 'bg-sky-500 animate-bounce'
                    : 'bg-emerald-500'
                }`}
              />
              <span className="hidden sm:inline-block">
                {!isOnline ? 'Offline Mode' : pendingCount > 0 ? `Sync (${pendingCount})` : 'Cloud & IDB Synced'}
              </span>
              {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-current ml-0.5" />}
            </button>

            <button
              onClick={() => onLogout()}
              title="Logout"
              className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-theme-card border border-theme-border flex items-center justify-center text-theme-secondary hover:text-rose-600 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4 text-theme-secondary shrink-0" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
