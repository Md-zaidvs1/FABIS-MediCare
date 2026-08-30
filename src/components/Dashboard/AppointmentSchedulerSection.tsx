// FABIS MediCare - Professional Hospital Appointment Scheduler & Live Timeline
import React, { useState, useEffect, useMemo } from 'react';
import { Patient, Appointment, UserRole } from '../../types';
import {
  formatDate,
  formatTodayISO,
  parseTimeToMinutes,
  formatMinutesToTime,
  normalizeTimeSlot,
} from '../../utils/formatters';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Plus,
  Phone,
  DollarSign,
  FileText,
  Check,
  Maximize2,
  Minimize2,
  X,
  CheckSquare,
  AlertTriangle,
  ChevronDown,
  UserCheck,
  Stethoscope,
  Search,
  History,
  CheckCircle2,
  Play,
  RotateCcw,
} from 'lucide-react';

interface AppointmentSchedulerSectionProps {
  patients: Patient[];
  activeRole?: UserRole;
  onSelectPatient: (patientId: string, initialTab?: 'overview' | 'teethMap' | 'treatments' | 'prescriptions' | 'invoices') => void;
  onOpenBookAppointment: (defaultDate?: string, patientId?: string) => void;
  onOpenAddPatient?: () => void;
  onOpenCreateInvoice?: (patientId?: string) => void;
  onOpenPrescription?: (patientId?: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
  onUpdateAppointmentChair?: (appointmentId: string, chair: Appointment['chair']) => void;
  onRescheduleAppointment?: (appointmentId: string, newTimeSlot: string, newDate?: string) => void;
}

export type CalendarViewMode = 'Week' | 'Day' | 'Month';

export type StatusCategory = 'Overdue' | 'Waiting' | 'In Treatment' | 'Checked Out' | 'Scheduled';

export { parseTimeToMinutes, formatMinutesToTime };

export function parseDateInputToIso(inputStr: string): string | null {
  if (!inputStr) return null;
  const clean = inputStr.trim();
  const parts = clean.split(/[\/\-\.]/);
  if (parts.length === 3) {
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      day = parseInt(parts[2], 10);
    }
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      if (year < 100) year += 2000;
      const mStr = month < 10 ? `0${month}` : `${month}`;
      const dStr = day < 10 ? `0${day}` : `${day}`;
      return `${year}-${mStr}-${dStr}`;
    }
  }
  return null;
}

export function formatIsoToDDMMYYYY(isoStr: string): string {
  if (!isoStr || !isoStr.includes('-')) return isoStr;
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
}

export function getAppointmentStatusCategory(
  apt: Appointment,
  nowMinutes: number,
  selectedDateIso: string,
  todayIso: string
): StatusCategory {
  if (apt.status === 'Completed') {
    return 'Checked Out';
  }

  if (apt.status === 'In-Chair' || apt.status === 'In Consultation') {
    return 'In Treatment';
  }

  const startMins = parseTimeToMinutes(apt.timeSlot);

  // Overdue evaluation: If appointment time passed and treatment hasn't started
  const isPastDate = selectedDateIso < todayIso;
  const isTodayAndPastTime = selectedDateIso === todayIso && nowMinutes > startMins + 5;

  if ((isPastDate || isTodayAndPastTime) && apt.status !== 'Cancelled') {
    return 'Overdue';
  }

  if (apt.status === 'Arrived' || apt.status === 'Waiting-List') {
    return 'Waiting';
  }

  return 'Scheduled';
}

export function getStatusCategoryStyles(cat: StatusCategory) {
  switch (cat) {
    case 'Overdue':
      return {
        bgBlock: 'bg-[#EF4444] text-white border-[#DC2626]',
        badgeBg: 'bg-red-100 text-red-800 border border-red-300 font-bold',
        cardBorder: 'border-l-4 border-l-[#EF4444]',
        buttonBg: 'bg-amber-100 hover:bg-amber-200 text-red-700 font-bold border border-amber-300',
        label: 'Overdue',
        icon: '🔴',
      };
    case 'Waiting':
      return {
        bgBlock: 'bg-[#FACC15] text-slate-900 border-yellow-500 font-bold',
        badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
        cardBorder: 'border-l-4 border-l-[#FACC15]',
        buttonBg: 'bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold border border-teal-300',
        label: 'Waiting',
        icon: '🟡',
      };
    case 'In Treatment':
      return {
        bgBlock: 'bg-[#3B82F6] text-white border-blue-600',
        badgeBg: 'bg-blue-100 text-blue-900 border border-blue-300 font-bold',
        cardBorder: 'border-l-4 border-l-[#3B82F6]',
        buttonBg: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold border border-emerald-300',
        label: 'In Treatment',
        icon: '🔵',
      };
    case 'Checked Out':
      return {
        bgBlock: 'bg-[#10B981] text-white border-emerald-600',
        badgeBg: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold',
        cardBorder: 'border-l-4 border-l-[#10B981]',
        buttonBg: 'bg-slate-100 text-slate-500 font-bold cursor-default border border-slate-200',
        label: 'Checked Out',
        icon: '🟢',
      };
    case 'Scheduled':
    default:
      return {
        bgBlock: 'bg-slate-700 text-white border-slate-800',
        badgeBg: 'bg-slate-100 text-slate-800 border border-slate-300 font-bold',
        cardBorder: 'border-l-4 border-l-slate-600',
        buttonBg: 'bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold border border-sky-300',
        label: 'Scheduled',
        icon: '⚪',
      };
  }
}

export const AppointmentSchedulerSection: React.FC<AppointmentSchedulerSectionProps> = ({
  patients,
  onSelectPatient,
  onOpenBookAppointment,
  onOpenCreateInvoice,
  onOpenPrescription,
  onUpdateAppointmentStatus,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(formatTodayISO());
  const [manualDateInput, setManualDateInput] = useState<string>(formatIsoToDDMMYYYY(formatTodayISO()));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<CalendarViewMode>('Week');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [avgWaitFilter, setAvgWaitFilter] = useState<string>('All Patients');

  // Simulated Clock for testing Overdue behavior
  const [useSimulatedTime, setUseSimulatedTime] = useState<boolean>(false);
  const [simulatedHour, setSimulatedHour] = useState<number>(10);
  const [simulatedMinute, setSimulatedMinute] = useState<number>(15);

  // Live clock updating every second (1000ms)
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayIso = formatTodayISO();

  // Sync manual DD/MM/YYYY text when selectedDate changes
  useEffect(() => {
    setManualDateInput(formatIsoToDDMMYYYY(selectedDate));
  }, [selectedDate]);

  const currentNowMinutes = useMemo(() => {
    if (useSimulatedTime) {
      return simulatedHour * 60 + simulatedMinute;
    }
    return now.getHours() * 60 + now.getMinutes();
  }, [useSimulatedTime, simulatedHour, simulatedMinute, now]);

  // Extract all appointments from patients list
  const allAppointments = useMemo(() => {
    return (patients || []).flatMap((p) => p?.appointments || []);
  }, [patients]);

  // Filter appointments by search query across name, phone, MRN, date, procedure
  const filteredAllAppointments = useMemo(() => {
    if (!searchQuery.trim()) return allAppointments;
    const q = searchQuery.trim().toLowerCase();
    return allAppointments.filter(
      (a) =>
        a &&
        ((a.patientName || '').toLowerCase().includes(q) ||
        (a.patientPhone || '').replace(/\D/g, '').includes(q) ||
        (a.procedure || '').toLowerCase().includes(q) ||
        (a.date && a.date.includes(q)) ||
        (a.timeSlot || '').toLowerCase().includes(q))
    );
  }, [allAppointments, searchQuery]);

  // Filter appointments for selected date
  const selectedDateAppointments = useMemo(() => {
    return filteredAllAppointments.filter((apt) => apt && apt.date === selectedDate);
  }, [filteredAllAppointments, selectedDate]);

  // Automated Metrics calculation (Current Patient, Next Patient, Overdue Count, Wait Time)
  const automatedMetrics = useMemo(() => {
    const todayAppts = allAppointments.filter((a) => a && a.date === selectedDate);

    // Current Patient in chair
    const currentInChair = todayAppts.find(
      (a) => a.status === 'In-Chair' || a.status === 'In Consultation'
    );

    // Next Patient upcoming
    const sortedUpcoming = todayAppts
      .filter((a) => a.status === 'Scheduled' || a.status === 'Arrived')
      .sort((a, b) => parseTimeToMinutes(a.timeSlot) - parseTimeToMinutes(b.timeSlot));

    const nextUpcoming = sortedUpcoming.find((a) => {
      const mins = parseTimeToMinutes(a.timeSlot);
      return mins >= currentNowMinutes;
    }) || sortedUpcoming[0];

    // Overdue Count
    let overdueCount = 0;
    let scheduled = 0;
    let waiting = 0;
    let engaged = 0;
    let checkedOut = 0;

    todayAppts.forEach((apt) => {
      const cat = getAppointmentStatusCategory(apt, currentNowMinutes, selectedDate, todayIso);
      if (cat === 'Overdue') overdueCount++;
      if (cat === 'Scheduled') scheduled++;
      else if (cat === 'Waiting') waiting++;
      else if (cat === 'In Treatment') engaged++;
      else if (cat === 'Checked Out') checkedOut++;
    });

    return {
      currentInChair,
      nextUpcoming,
      overdueCount,
      scheduled,
      waiting,
      engaged,
      checkedOut,
    };
  }, [allAppointments, selectedDate, currentNowMinutes, todayIso]);

  // Generate days for Week View
  const weekDays = useMemo(() => {
    const base = new Date(selectedDate);
    const dayOfWeek = base.getDay();
    const startOfWeek = new Date(base);
    startOfWeek.setDate(base.getDate() - (dayOfWeek >= 3 ? dayOfWeek - 3 : dayOfWeek + 4));

    const days = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });

      let suffix = 'th';
      if (dayNum === 1 || dayNum === 21 || dayNum === 31) suffix = 'st';
      else if (dayNum === 2 || dayNum === 22) suffix = 'nd';
      else if (dayNum === 3 || dayNum === 23) suffix = 'rd';

      days.push({
        iso,
        label: `${dayName} ${dayNum}${suffix} ${monthName}`,
        dayName,
        dayNumStr: `${dayNum}${suffix}`,
        monthName,
        isToday: iso === todayIso,
        isSelected: iso === selectedDate,
      });
    }
    return days;
  }, [selectedDate, todayIso]);

  const dateRangeLabel = useMemo(() => {
    if (weekDays.length === 0) return selectedDate;
    const first = weekDays[0];
    const last = weekDays[weekDays.length - 1];
    return `${first.dayNumStr.replace(/\D/g, '')} - ${last.dayNumStr.replace(/\D/g, '')} ${first.monthName} ${new Date(selectedDate).getFullYear()}`;
  }, [weekDays, selectedDate]);

  // Date navigation
  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'Week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'Week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleJumpToday = () => {
    setSelectedDate(todayIso);
  };

  // Hour rows: 9:00 AM to 8:00 PM
  const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const HOUR_HEIGHT_PX = 80;
  const startGridMins = 540; // 9:00 AM

  // Calculate top position for Red Current Time Line
  const currentTopPx = ((currentNowMinutes - startGridMins) / 60) * HOUR_HEIGHT_PX;

  // Handle action button click on patient card
  const handleAdvanceStatus = (apt: Appointment) => {
    const cat = getAppointmentStatusCategory(apt, currentNowMinutes, selectedDate, todayIso);
    if (cat === 'Scheduled') {
      onUpdateAppointmentStatus(apt.id, 'Arrived');
    } else if (cat === 'Waiting' || cat === 'Overdue') {
      onUpdateAppointmentStatus(apt.id, 'In-Chair');
      onSelectPatient(apt.patientId, 'teethMap');
    } else if (cat === 'In Treatment') {
      onUpdateAppointmentStatus(apt.id, 'Completed');
    }
  };

  return (
    <div
      className={`space-y-4 font-sans text-slate-800 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-100 p-6 overflow-y-auto' : ''
      }`}
    >
      {/* 1. LIVE RUNNING TIME & DATE HEADER BANNER */}
      <div className="bg-slate-900 text-white p-4 rounded-[24px] shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Left Clock & Date Section */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Digital Clock */}
          <div className="flex items-center gap-2 bg-slate-800/90 px-4 py-2 rounded-2xl border border-slate-700 shadow-inner">
            <Clock className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                Live System Clock
              </div>
              <div className="font-mono font-black text-base sm:text-lg text-emerald-300 tracking-wider">
                🕒 {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Full Today Date */}
          <div className="flex items-center gap-2 bg-slate-800/90 px-4 py-2 rounded-2xl border border-slate-700">
            <CalendarIcon className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                Today's Date
              </div>
              <div className="font-bold text-xs sm:text-sm text-sky-200">
                📅 {now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Search Bar & Date Navigation */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Date Shortcuts */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => {
                const d = new Date(todayIso);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
            >
              Yesterday
            </button>

            <button
              type="button"
              onClick={handleJumpToday}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                selectedDate === todayIso
                  ? 'bg-[#3BA7F5] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => {
                const d = new Date(todayIso);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
            >
              Tomorrow
            </button>
          </div>

          {/* Book Appointment CTA */}
          <button
            type="button"
            onClick={() => onOpenBookAppointment(selectedDate)}
            className="px-4 py-2.5 rounded-2xl bg-[#3BA7F5] hover:bg-[#2A96E4] text-white font-extrabold text-xs shadow-[0_8px_20px_rgba(59,167,245,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* 2. AUTOMATED LIVE CLINIC METRICS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Current Patient */}
        <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
              Current Patient (In Chair)
            </div>
            <div className="font-black text-xs sm:text-sm text-slate-900 truncate mt-0.5 max-w-[180px]">
              {automatedMetrics.currentInChair ? automatedMetrics.currentInChair.patientName : 'No Patient in Chair'}
            </div>
            {automatedMetrics.currentInChair && (
              <div className="text-[10px] font-bold text-slate-500 font-mono">
                {automatedMetrics.currentInChair.chair} • {automatedMetrics.currentInChair.procedure}
              </div>
            )}
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-100">
            🔵
          </div>
        </div>

        {/* Next Patient */}
        <div className="bg-white p-3.5 rounded-2xl border border-sky-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider">
              Next Scheduled Patient
            </div>
            <div className="font-black text-xs sm:text-sm text-slate-900 truncate mt-0.5 max-w-[180px]">
              {automatedMetrics.nextUpcoming ? automatedMetrics.nextUpcoming.patientName : 'No Upcoming Patient'}
            </div>
            {automatedMetrics.nextUpcoming && (
              <div className="text-[10px] font-bold text-sky-700 font-mono">
                Scheduled @ {automatedMetrics.nextUpcoming.timeSlot}
              </div>
            )}
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shrink-0 border border-sky-100">
            ⏳
          </div>
        </div>

        {/* Overdue Count */}
        <div className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">
              Overdue Appointments
            </div>
            <div className="font-black text-lg text-rose-600 mt-0.5">
              {automatedMetrics.overdueCount} {automatedMetrics.overdueCount > 0 ? 'Patients Overdue' : 'None Overdue'}
            </div>
            <div className="text-[10px] font-medium text-slate-500">
              {automatedMetrics.overdueCount > 0 ? 'Requires immediate check-in' : 'Schedule on track'}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0 border border-rose-100">
            🔴
          </div>
        </div>

        {/* Waiting Patients */}
        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
              Waiting Patients
            </div>
            <div className="font-black text-lg text-amber-800 mt-0.5">
              {automatedMetrics.waiting} In Waiting Room
            </div>
            <div className="text-[10px] font-medium text-slate-500">
              Avg. wait time ~12 mins
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0 border border-amber-100">
            🟡
          </div>
        </div>
      </div>

      {/* 3. MAIN SCHEDULER & RIGHT PANEL */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        
        {/* LEFT AREA: CALENDAR SCHEDULER GRID */}
        <div className="flex-1 w-full bg-[#E5E7EB] border border-slate-300 rounded-[24px] shadow-sm overflow-hidden flex flex-col min-h-[680px]">
          
          {/* Top Control Header above Calendar */}
          <div className="bg-[#E5E7EB] p-3.5 border-b border-slate-300 flex flex-wrap items-center justify-between gap-3">
            
            {/* Working Calendar Picker + Manual Date Entry */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Native Date Picker Button Wrapper */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
                <CalendarIcon className="w-4 h-4 text-slate-600 shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-extrabold text-xs text-slate-800 outline-none cursor-pointer"
                  title="Click to pick calendar date"
                />
              </div>

              {/* Manual Date Input Box (DD/MM/YYYY) */}
              <div className="flex items-center bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 shadow-2xs text-xs font-mono">
                <span className="text-slate-400 font-bold mr-1">Type:</span>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={manualDateInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setManualDateInput(val);
                    const parsedIso = parseDateInputToIso(val);
                    if (parsedIso) {
                      setSelectedDate(parsedIso);
                    }
                  }}
                  className="w-24 bg-transparent font-bold text-slate-800 outline-none"
                />
              </div>

              <button
                onClick={handleJumpToday}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-300 shadow-2xs transition-all cursor-pointer"
              >
                Today
              </button>
            </div>

            {/* Search Filter & View Mode */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search filter box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient / phone / date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#3BA7F5] w-44 sm:w-56 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs transition-all cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* View Switches */}
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
                {(['Month', 'Week', 'Day'] as CalendarViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                      viewMode === mode
                        ? 'bg-[#312E81] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Nav Buttons */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
                <button
                  onClick={handlePrevDate}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextDate}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Body */}
          <div className="flex-1 overflow-x-auto bg-white flex flex-col relative">
            
            {/* Column Headers */}
            <div className="flex border-b border-slate-300 bg-slate-100 sticky top-0 z-20">
              <div className="w-16 sm:w-20 shrink-0 border-r border-slate-300 p-2.5 text-center text-[11px] font-bold text-slate-500 bg-slate-100">
                Time
              </div>

              {viewMode === 'Week' ? (
                weekDays.map((day) => (
                  <div
                    key={day.iso}
                    onClick={() => setSelectedDate(day.iso)}
                    className={`flex-1 min-w-[120px] p-2.5 text-center border-r border-slate-300 cursor-pointer transition-all ${
                      day.isSelected
                        ? 'bg-[#FEFCE8] text-amber-900 font-extrabold border-b-2 border-b-amber-500'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{day.label}</div>
                  </div>
                ))
              ) : (
                <div className="flex-1 p-2.5 text-center bg-[#FEFCE8] text-amber-900 font-extrabold border-r border-slate-300">
                  {formatDate(selectedDate)}
                </div>
              )}
            </div>

            {/* Time Grid & Appointment Blocks Overlay */}
            <div className="flex flex-1 relative min-h-[960px]">
              {/* Left Time Column */}
              <div className="w-16 sm:w-20 shrink-0 border-r border-slate-300 bg-slate-50 select-none">
                {HOURS.map((hour) => {
                  const label = hour > 12 ? `${hour - 12}:00 pm` : hour === 12 ? '12:00 pm' : `${hour}:00 am`;
                  return (
                    <div
                      key={hour}
                      style={{ height: `${HOUR_HEIGHT_PX}px` }}
                      className="border-b border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-500 text-right"
                    >
                      {label}
                    </div>
                  );
                })}
              </div>

              {/* Columns Container */}
              <div className="flex-1 flex relative">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  {HOURS.map((hour, idx) => (
                    <div
                      key={hour}
                      style={{ top: `${idx * HOUR_HEIGHT_PX}px`, height: `${HOUR_HEIGHT_PX}px` }}
                      className="border-b border-slate-200 relative"
                    >
                      <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-slate-200" />
                    </div>
                  ))}
                </div>

                {/* 4. RED CURRENT TIME LINE INDICATOR */}
                {(selectedDate === todayIso || useSimulatedTime) &&
                  currentNowMinutes >= 540 &&
                  currentNowMinutes <= 1260 && (
                    <div
                      style={{ top: `${currentTopPx}px` }}
                      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                    >
                      <div className="bg-red-600 text-white font-mono text-[10px] font-black px-2 py-0.5 rounded-r-md shadow-md flex items-center gap-1.5 shrink-0 z-40">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>
                          NOW {formatMinutesToTime(currentNowMinutes)}
                        </span>
                      </div>
                      <div className="flex-1 border-b-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
                    </div>
                  )}

                {/* Day Columns */}
                {(viewMode === 'Week' ? weekDays : [{ iso: selectedDate, isSelected: true }]).map((day) => {
                  const dayAppts = filteredAllAppointments.filter((a) => a.date === day.iso);

                  return (
                    <div
                      key={day.iso}
                      className={`flex-1 min-w-[120px] border-r border-slate-300 relative z-10 ${
                        day.isSelected ? 'bg-[#FFFBEB]/40' : 'bg-transparent'
                      }`}
                      onDoubleClick={() => onOpenBookAppointment(day.iso)}
                    >
                      {/* Appointment Card Blocks */}
                      {dayAppts.map((apt) => {
                        const startMins = parseTimeToMinutes(apt.timeSlot);
                        const duration = apt.durationMinutes || 30;

                        const startFrom9 = Math.max(0, startMins - 540);
                        const topPx = (startFrom9 / 60) * HOUR_HEIGHT_PX;
                        const heightPx = Math.max(38, (duration / 60) * HOUR_HEIGHT_PX);

                        const cat = getAppointmentStatusCategory(apt, currentNowMinutes, day.iso, todayIso);
                        const styles = getStatusCategoryStyles(cat);

                        return (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(apt);
                            }}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                            }}
                            className={`absolute left-1 right-1 rounded-xl p-2 cursor-pointer transition-all shadow-sm border flex flex-col justify-between overflow-hidden hover:scale-[1.02] hover:z-30 ${styles.bgBlock}`}
                          >
                            <div>
                              <div className="flex items-center gap-1 text-[10px] font-black opacity-90 truncate">
                                <User className="w-3 h-3 shrink-0" />
                                <span>
                                  {apt.timeSlot} - {formatMinutesToTime(startMins + duration)}
                                </span>
                              </div>

                              <div className="font-extrabold text-xs leading-tight truncate mt-0.5">
                                {apt.patientName}
                              </div>
                            </div>

                            <div className="text-[10px] opacity-80 truncate font-medium flex items-center justify-between">
                              <span className="truncate">{apt.procedure}</span>
                              <span className="font-mono text-[9px] font-bold">{styles.icon}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT AREA: TODAY'S SCHEDULE PANEL & SEARCH LIST */}
        <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0 bg-[#E5E7EB] border border-slate-300 rounded-[24px] p-3.5 shadow-sm space-y-3 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <span>Today's Schedule</span>
              <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-300">
                {selectedDateAppointments.length}
              </span>
            </h3>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevDate}
                className="p-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextDate}
                className="p-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Metric Status Badges */}
          <div className="grid grid-cols-4 gap-1.5">
            <div className="bg-white p-2 rounded-xl border border-slate-300 text-center shadow-2xs">
              <div className="text-base font-black text-slate-700 leading-none">
                {automatedMetrics.scheduled}
              </div>
              <div className="text-[10px] font-bold text-slate-600 mt-1 truncate">Scheduled</div>
            </div>

            <div className="bg-white p-2 rounded-xl border border-slate-300 text-center shadow-2xs">
              <div className="text-base font-black text-[#DC2626] leading-none">
                {automatedMetrics.waiting}
              </div>
              <div className="text-[10px] font-bold text-slate-600 mt-1 truncate">Waiting</div>
            </div>

            <div className="bg-white p-2 rounded-xl border border-slate-300 text-center shadow-2xs">
              <div className="text-base font-black text-[#15803D] leading-none">
                {automatedMetrics.engaged}
              </div>
              <div className="text-[10px] font-bold text-slate-600 mt-1 truncate">In Chair</div>
            </div>

            <div className="bg-white p-2 rounded-xl border border-slate-300 text-center shadow-2xs">
              <div className="text-base font-black text-[#0369A1] leading-none">
                {automatedMetrics.checkedOut}
              </div>
              <div className="text-[10px] font-bold text-slate-600 mt-1 truncate">Done</div>
            </div>
          </div>

          {/* Patient Cards List */}
          <div className="space-y-2.5 overflow-y-auto max-h-[580px] pr-0.5">
            {selectedDateAppointments.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-300 text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No appointments for this date</p>
                <button
                  onClick={() => onOpenBookAppointment(selectedDate)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#3BA7F5] hover:bg-[#2A96E4] text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
                >
                  Book Appointment
                </button>
              </div>
            ) : (
              selectedDateAppointments.map((apt) => {
                const cat = getAppointmentStatusCategory(apt, currentNowMinutes, selectedDate, todayIso);
                const styles = getStatusCategoryStyles(cat);

                return (
                  <div
                    key={apt.id}
                    className={`bg-white rounded-2xl p-3 border border-slate-300 shadow-2xs space-y-2.5 relative transition-all ${styles.cardBorder}`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <button
                          onClick={() => onSelectPatient(apt.patientId)}
                          className="font-extrabold text-xs text-slate-900 hover:text-[#3BA7F5] transition-colors cursor-pointer text-left block"
                        >
                          {apt.patientName}
                        </button>
                        <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                          {apt.procedure} • <span className="font-mono">{apt.chair}</span>
                        </div>
                      </div>

                      {/* Top Action Icons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onOpenCreateInvoice && (
                          <button
                            onClick={() => onOpenCreateInvoice(apt.patientId)}
                            className="w-6 h-6 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200 cursor-pointer"
                            title="Create Invoice (₹)"
                          >
                            ₹
                          </button>
                        )}

                        {onOpenPrescription && (
                          <button
                            onClick={() => onOpenPrescription(apt.patientId)}
                            className="w-6 h-6 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200 cursor-pointer"
                            title="Prescription"
                          >
                            <FileText className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          onClick={() => onSelectPatient(apt.patientId)}
                          className="w-6 h-6 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200 cursor-pointer"
                          title="Patient Profile"
                        >
                          <User className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Status Badge & Action Row */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className={`px-2.5 py-1 rounded-xl text-[11px] ${styles.badgeBg}`}>
                        {cat === 'Overdue' && `🔴 Overdue (Scheduled ${apt.timeSlot})`}
                        {cat === 'Waiting' && `🟡 Checked-In Waiting`}
                        {cat === 'Scheduled' && `Scheduled at ${apt.timeSlot}`}
                        {cat === 'In Treatment' && `🔵 In Treatment`}
                        {cat === 'Checked Out' && `🟢 Completed`}
                      </div>

                      {cat === 'Checked Out' ? (
                        <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAdvanceStatus(apt)}
                          className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer shadow-2xs ${styles.buttonBg}`}
                        >
                          {cat === 'Scheduled' && 'Check In'}
                          {cat === 'Waiting' && 'Start Treatment'}
                          {cat === 'Overdue' && 'Check In'}
                          {cat === 'In Treatment' && 'Finish & Check Out'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. APPOINTMENT DETAILS & SUPABASE TIMESTAMP TIMELINE MODAL */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#3BA7F5]" />
                <span>Appointment Detail & Audit Timestamps</span>
              </h4>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-bold">Patient Name:</span>
                <span className="font-extrabold text-slate-900">{selectedAppointment.patientName}</span>
              </div>

              <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-bold">Scheduled Time:</span>
                <span className="font-extrabold text-slate-900">
                  {selectedAppointment.date} at {selectedAppointment.timeSlot} ({selectedAppointment.durationMinutes} mins)
                </span>
              </div>

              <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-bold">Procedure:</span>
                <span className="font-extrabold text-slate-900">{selectedAppointment.procedure}</span>
              </div>

              <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-bold">Dental Chair:</span>
                <span className="font-extrabold text-slate-900">{selectedAppointment.chair}</span>
              </div>

              {/* Recorded Timestamps Audit Box */}
              <div className="p-3 rounded-2xl bg-slate-900 text-slate-200 space-y-1.5 border border-slate-800 font-mono text-[11px]">
                <div className="font-bold text-sky-400 border-b border-slate-800 pb-1 mb-1">
                  ⏱️ Granular Audit Timestamps (Supabase Persistent):
                </div>
                <div>
                  <span className="text-slate-400">Created At:</span>{' '}
                  <span className="text-emerald-300">{selectedAppointment.createdAt ? new Date(selectedAppointment.createdAt).toLocaleString() : 'System Default'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Check-In Time:</span>{' '}
                  <span className="text-amber-300">{selectedAppointment.checkInTime ? new Date(selectedAppointment.checkInTime).toLocaleTimeString() : 'Not Checked In Yet'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Treatment Start:</span>{' '}
                  <span className="text-blue-300">{selectedAppointment.treatmentStartTime ? new Date(selectedAppointment.treatmentStartTime).toLocaleTimeString() : 'Not Started'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Completed Time:</span>{' '}
                  <span className="text-emerald-300">{selectedAppointment.completedTime ? new Date(selectedAppointment.completedTime).toLocaleTimeString() : 'Incomplete'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Last Updated:</span>{' '}
                  <span className="text-slate-300">{selectedAppointment.updatedAt ? new Date(selectedAppointment.updatedAt).toLocaleString() : 'Recorded'}</span>
                </div>
              </div>
            </div>

            {/* Quick Status Action Buttons */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold text-slate-500">Update Status:</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    onUpdateAppointmentStatus(selectedAppointment.id, 'Arrived');
                    setSelectedAppointment(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs cursor-pointer border border-amber-300"
                >
                  Check In
                </button>
                <button
                  onClick={() => {
                    onUpdateAppointmentStatus(selectedAppointment.id, 'In-Chair');
                    setSelectedAppointment(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-teal-100 hover:bg-teal-200 text-teal-900 font-bold text-xs cursor-pointer border border-teal-300"
                >
                  Start Treatment
                </button>
                <button
                  onClick={() => {
                    onUpdateAppointmentStatus(selectedAppointment.id, 'Completed');
                    setSelectedAppointment(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs cursor-pointer border border-emerald-300"
                >
                  Finish
                </button>
              </div>

              <button
                onClick={() => {
                  onSelectPatient(selectedAppointment.patientId);
                  setSelectedAppointment(null);
                }}
                className="w-full mt-2 py-2.5 rounded-2xl bg-[#3BA7F5] hover:bg-[#2A96E4] text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
              >
                Open Patient Clinical EMR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
