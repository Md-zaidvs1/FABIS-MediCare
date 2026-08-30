import React, { useState, useEffect, useMemo } from 'react';
import { Patient, Appointment, FollowUpTask, UserRole, DoctorProfile } from '../../types';
import {
  formatDate,
  formatTodayISO,
  parseTimeToMinutes,
  formatMinutesToTime,
  normalizeTimeSlot,
} from '../../utils/formatters';
import { getStoredDoctor } from '../../utils/storage';
import { DoctorAlertCenterDrawer } from './DoctorAlertCenterDrawer';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  UserPlus,
  CalendarPlus,
  Search,
  Bell,
  X,
  Check,
  CheckCircle2,
  Stethoscope,
  Phone,
  ArrowRight,
  Sparkles,
  FileText,
  Receipt,
  LogOut,
  Armchair
} from 'lucide-react';

interface DashboardProps {
  patients: Patient[];
  activeRole?: UserRole;
  onSelectPatient: (patientId: string, initialTab?: 'overview' | 'teethMap' | 'treatments' | 'prescriptions' | 'invoices') => void;
  onOpenAddPatient: () => void;
  onOpenBookAppointment: (defaultDate?: string, patientId?: string) => void;
  onOpenCreateInvoice?: (patientId?: string) => void;
  onOpenPrescription?: (patientId?: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
  onUpdateAppointmentChair?: (appointmentId: string, chair: Appointment['chair']) => void;
  onRescheduleAppointment?: (appointmentId: string, newTimeSlot: string, newDate?: string) => void;
  onUpdateFollowUpStatus: (followUpId: string, status: FollowUpTask['status']) => void;
  onRescheduleFollowUp?: (followUpId: string, days?: number) => void;
  onAddFollowUp?: (patientId: string, followUp: { dueDate: string; reason: string; notes?: string }) => void;
  onLogout?: () => void;
}

export type CalendarViewMode = 'Day' | 'Week' | 'Month';

export { parseTimeToMinutes, formatMinutesToTime };

export const Dashboard: React.FC<DashboardProps> = ({
  patients,
  activeRole = 'admin',
  onSelectPatient,
  onOpenAddPatient,
  onOpenBookAppointment,
  onOpenCreateInvoice,
  onOpenPrescription,
  onUpdateAppointmentStatus,
  onUpdateAppointmentChair,
  onRescheduleAppointment,
  onUpdateFollowUpStatus,
  onRescheduleFollowUp,
  onAddFollowUp,
  onLogout,
}) => {
  const todayIso = formatTodayISO();
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('Week');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isAlertCenterOpen, setIsAlertCenterOpen] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>(getStoredDoctor());

  useEffect(() => {
    const handleDoctorUpdate = () => setDoctorProfile(getStoredDoctor());
    window.addEventListener('fabis_doctor_updated', handleDoctorUpdate);
    return () => window.removeEventListener('fabis_doctor_updated', handleDoctorUpdate);
  }, []);

  // Live timer for current time indicator
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Flatten all appointments from patient records
  const allAppointments = useMemo(() => {
    const list: (Appointment & { patientMrn?: string; patientPhone?: string; patientAge?: number; patientGender?: string })[] = [];
    patients.forEach((p) => {
      (p.appointments || []).forEach((apt) => {
        list.push({
          ...apt,
          patientMrn: p.mrn,
          patientPhone: p.phone,
          patientAge: p.age,
          patientGender: p.gender,
        });
      });
    });
    return list;
  }, [patients]);

  // Total pending notifications for badge
  const pendingNotificationCount = useMemo(() => {
    let count = 0;
    patients.forEach((p) => {
      (p.followUps || []).forEach((f) => {
        if (f.status !== 'Completed' && f.dueDate <= todayIso) {
          count++;
        }
      });
    });
    return count;
  }, [patients, todayIso]);

  // Filtered patients for search dropdown
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }, [patients, searchQuery]);

  // Appointments for the selected date
  const selectedDateAppointments = useMemo(() => {
    return allAppointments
      .filter((a) => a && a.date === selectedDate)
      .sort((a, b) => parseTimeToMinutes(a.timeSlot) - parseTimeToMinutes(b.timeSlot));
  }, [allAppointments, selectedDate]);

  // Date Navigation Helpers
  const handlePrev = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'Day') {
      d.setDate(d.getDate() - 1);
    } else if (viewMode === 'Week') {
      d.setDate(d.getDate() - 7);
    } else if (viewMode === 'Month') {
      d.setMonth(d.getMonth() - 1);
    }
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNext = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'Day') {
      d.setDate(d.getDate() + 1);
    } else if (viewMode === 'Week') {
      d.setDate(d.getDate() + 7);
    } else if (viewMode === 'Month') {
      d.setMonth(d.getMonth() + 1);
    }
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(todayIso);
  };

  // Week View Days (Monday to Sunday)
  const weekDays = useMemo(() => {
    const current = new Date(selectedDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      days.push({
        date: d,
        iso,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: iso === todayIso,
        isSelected: iso === selectedDate,
      });
    }
    return days;
  }, [selectedDate, todayIso]);

  // Month View Days Matrix (6 rows x 7 cols)
  const monthDays = useMemo(() => {
    const current = new Date(selectedDate);
    const year = current.getFullYear();
    const month = current.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday as 0, Sunday as 6
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();

    const cells: { iso: string; dayNumber: number; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      const iso = prevDate.toISOString().split('T')[0];
      cells.push({
        iso,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        isSelected: iso === selectedDate,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const curDate = new Date(year, month, i);
      const iso = curDate.toISOString().split('T')[0];
      cells.push({
        iso,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: iso === todayIso,
        isSelected: iso === selectedDate,
      });
    }

    // Next month padding to fill grid (35 or 42)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const iso = nextDate.toISOString().split('T')[0];
      cells.push({
        iso,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        isSelected: iso === selectedDate,
      });
    }

    return cells;
  }, [selectedDate, todayIso]);

  // Current Date Header Title
  const headerDateTitle = useMemo(() => {
    const d = new Date(selectedDate);
    if (viewMode === 'Day') {
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (viewMode === 'Week' && weekDays.length > 0) {
      const start = weekDays[0];
      const end = weekDays[weekDays.length - 1];
      if (start.monthName === end.monthName) {
        return `${start.monthName} ${start.dayNumber} – ${end.dayNumber}, ${d.getFullYear()}`;
      }
      return `${start.monthName} ${start.dayNumber} – ${end.monthName} ${end.dayNumber}, ${d.getFullYear()}`;
    }
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedDate, viewMode, weekDays]);

  // Hourly grid constants (08:00 AM to 08:00 PM)
  const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const HOUR_HEIGHT = 72; // px per hour
  const GRID_START_MINUTES = 8 * 60; // 480 mins

  // Current time marker position
  const currentTimeTop = ((nowMinutes - GRID_START_MINUTES) / 60) * HOUR_HEIGHT;

  // Appointment Status Colors (Subtle & Professional)
  const getStatusBadgeStyle = (status: Appointment['status']) => {
    switch (status) {
      case 'In-Chair':
      case 'In Consultation':
        return {
          bg: 'bg-indigo-50 hover:bg-indigo-100/90 text-indigo-900 border-indigo-200/80 shadow-xs',
          dot: 'bg-indigo-600',
          badge: 'bg-indigo-100 text-indigo-800',
          label: 'In Chair',
        };
      case 'Arrived':
      case 'Waiting-List':
        return {
          bg: 'bg-amber-50 hover:bg-amber-100/90 text-amber-900 border-amber-200/80 shadow-xs',
          dot: 'bg-amber-500',
          badge: 'bg-amber-100 text-amber-800',
          label: 'Arrived',
        };
      case 'Completed':
        return {
          bg: 'bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 border-emerald-200/80 shadow-xs',
          dot: 'bg-emerald-500',
          badge: 'bg-emerald-100 text-emerald-800',
          label: 'Completed',
        };
      case 'Cancelled':
        return {
          bg: 'bg-slate-100 text-slate-500 border-slate-200 line-through opacity-70',
          dot: 'bg-slate-400',
          badge: 'bg-slate-200 text-slate-600',
          label: 'Cancelled',
        };
      case 'Scheduled':
      default:
        return {
          bg: 'bg-sky-50/90 hover:bg-sky-100/90 text-sky-950 border-sky-200/80 shadow-xs',
          dot: 'bg-sky-500',
          badge: 'bg-sky-100 text-sky-800',
          label: 'Scheduled',
        };
    }
  };

  return (
    <div className="space-y-4 pb-10 min-w-0 max-w-7xl mx-auto font-sans text-slate-800 antialiased">
      
      {/* 1. CALENDAR CONTROLS HEADER */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Navigation, Today Button, and Date Title */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer transition-all"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedDate === todayIso
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer transition-all"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-sky-500 shrink-0" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {headerDateTitle}
            </h2>
            {selectedDate === todayIso && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                Current Day
              </span>
            )}
          </div>
        </div>

        {/* Right: Calendar View Switcher (Month / Week / Day) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['Month', 'Week', 'Day'] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                viewMode === mode
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* 3. PRIMARY APPOINTMENT CALENDAR VIEW */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[640px]">
        
        {/* ========================================================================= */}
        {/* A. WEEK VIEW (Default, Fast & Clean Time-Grid) */}
        {/* ========================================================================= */}
        {viewMode === 'Week' && (
          <div className="flex flex-col flex-1 overflow-x-auto">
            {/* Header Columns */}
            <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-20">
              {/* Time Column Header */}
              <div className="w-16 sm:w-20 shrink-0 p-3 text-center text-[11px] font-bold text-slate-400 border-r border-slate-200">
                Time
              </div>

              {/* 7 Days Headers */}
              {weekDays.map((day) => (
                <div
                  key={day.iso}
                  onClick={() => setSelectedDate(day.iso)}
                  className={`flex-1 min-w-[130px] p-2.5 text-center border-r border-slate-200 cursor-pointer transition-all ${
                    day.isToday
                      ? 'bg-sky-50/70 border-b-2 border-b-sky-500'
                      : day.isSelected
                      ? 'bg-slate-100'
                      : 'hover:bg-slate-100/60'
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {day.dayName}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                        day.isToday
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'text-slate-800'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Time Grid & Appointment Blocks */}
            <div className="flex flex-1 relative min-h-[900px]">
              {/* Left Time Slots Column */}
              <div className="w-16 sm:w-20 shrink-0 border-r border-slate-200 bg-slate-50/50 select-none">
                {HOURS.map((hour) => {
                  const label = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;
                  return (
                    <div
                      key={hour}
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      className="border-b border-slate-100 px-2 pt-1 text-[11px] font-bold text-slate-400 text-right"
                    >
                      {label}
                    </div>
                  );
                })}
              </div>

              {/* 7 Columns Container */}
              <div className="flex-1 flex relative">
                {/* Horizontal Background Hour Grid Lines */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  {HOURS.map((hour, idx) => (
                    <div
                      key={hour}
                      style={{ top: `${idx * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                      className="border-b border-slate-100 relative"
                    >
                      <div className="absolute top-1/2 left-0 right-0 border-b border-slate-100/60 border-dashed" />
                    </div>
                  ))}
                </div>

                {/* Live Current Time Red Line Indicator */}
                {weekDays.some((d) => d.isToday) &&
                  nowMinutes >= GRID_START_MINUTES &&
                  nowMinutes <= 20 * 60 && (
                    <div
                      style={{ top: `${currentTimeTop}px` }}
                      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                    >
                      <div className="bg-rose-500 text-white font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded-r shadow-xs">
                        {formatMinutesToTime(nowMinutes)}
                      </div>
                      <div className="flex-1 border-b-2 border-rose-500" />
                    </div>
                  )}

                {/* Day Columns */}
                {weekDays.map((day) => {
                  const dayAppts = allAppointments.filter((a) => a && a.date === day.iso);

                  return (
                    <div
                      key={day.iso}
                      onDoubleClick={() => onOpenBookAppointment(day.iso)}
                      className={`flex-1 min-w-[130px] border-r border-slate-200 relative z-10 ${
                        day.isToday ? 'bg-sky-50/20' : ''
                      }`}
                    >
                      {/* Render Appointment Cards */}
                      {dayAppts.map((apt) => {
                        const startMins = parseTimeToMinutes(apt.timeSlot);
                        const duration = apt.durationMinutes || 30;
                        const startOffset = Math.max(0, startMins - GRID_START_MINUTES);
                        const topPx = (startOffset / 60) * HOUR_HEIGHT;
                        const heightPx = Math.max(40, (duration / 60) * HOUR_HEIGHT - 4);
                        const style = getStatusBadgeStyle(apt.status);

                        return (
                          <div
                            key={apt.id}
                            onClick={() => setSelectedAppointment(apt)}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                            }}
                            className={`absolute left-1 right-1 rounded-xl p-2 cursor-pointer border transition-all hover:scale-[1.02] hover:z-40 overflow-hidden flex flex-col justify-between ${style.bg}`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-1 text-[10px] font-black text-slate-700">
                                <span className="truncate">{apt.timeSlot}</span>
                                <span className={`w-2 h-2 rounded-full ${style.dot} shrink-0`} />
                              </div>
                              <div className="font-black text-xs text-slate-900 truncate mt-0.5">
                                {apt.patientName}
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-600 truncate font-medium">
                              {apt.procedure}
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
        )}

        {/* ========================================================================= */}
        {/* B. DAY VIEW (Focused Single-Day Timeline Schedule Only) */}
        {/* ========================================================================= */}
        {viewMode === 'Day' && (
          <div className="flex flex-col flex-1">
            {/* Main Hourly Timeline */}
            <div className="flex-1 overflow-x-auto flex flex-col min-w-0">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Timeline Schedule • {formatDate(selectedDate)}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {selectedDateAppointments.length} Appointments Booked
                </span>
              </div>

              <div className="flex flex-1 relative min-h-[900px]">
                {/* Time labels */}
                <div className="w-20 shrink-0 border-r border-slate-200 bg-slate-50/50 select-none">
                  {HOURS.map((hour) => {
                    const label = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;
                    return (
                      <div
                        key={hour}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className="border-b border-slate-100 px-2 pt-1 text-[11px] font-bold text-slate-400 text-right"
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>

                {/* Day Slot Grid */}
                <div className="flex-1 relative">
                  {/* Grid Lines */}
                  {HOURS.map((hour, idx) => (
                    <div
                      key={hour}
                      style={{ top: `${idx * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                      className="border-b border-slate-100 relative"
                    >
                      <div className="absolute top-1/2 left-0 right-0 border-b border-slate-100/60 border-dashed" />
                    </div>
                  ))}

                  {/* Red Live Time Line */}
                  {selectedDate === todayIso &&
                    nowMinutes >= GRID_START_MINUTES &&
                    nowMinutes <= 20 * 60 && (
                      <div
                        style={{ top: `${currentTimeTop}px` }}
                        className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                      >
                        <div className="bg-rose-500 text-white font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded-r shadow-xs">
                          {formatMinutesToTime(nowMinutes)}
                        </div>
                        <div className="flex-1 border-b-2 border-rose-500" />
                      </div>
                    )}

                  {/* Appointment blocks */}
                  {selectedDateAppointments.map((apt) => {
                    const startMins = parseTimeToMinutes(apt.timeSlot);
                    const duration = apt.durationMinutes || 30;
                    const startOffset = Math.max(0, startMins - GRID_START_MINUTES);
                    const topPx = (startOffset / 60) * HOUR_HEIGHT;
                    const heightPx = Math.max(48, (duration / 60) * HOUR_HEIGHT - 4);
                    const style = getStatusBadgeStyle(apt.status);

                    return (
                      <div
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx}px`,
                        }}
                        className={`absolute left-3 right-3 rounded-2xl p-3 cursor-pointer border transition-all hover:shadow-md hover:z-30 flex items-center justify-between gap-3 ${style.bg}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{apt.timeSlot}</span>
                            <span className="text-xs font-extrabold text-slate-800">• {apt.patientName}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                              {style.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 truncate mt-0.5 font-medium flex items-center gap-2">
                            <span>{apt.procedure}</span>
                            {apt.chair && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-500">{apt.chair}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPatient(apt.patientId);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shadow-2xs border border-slate-200 shrink-0 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>Open EMR</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* C. MONTH VIEW (7-Day Grid Matrix) */}
        {/* ========================================================================= */}
        {viewMode === 'Month' && (
          <div className="flex flex-col flex-1">
            {/* Month Day-Name Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-500 py-2.5">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-slate-100">
              {monthDays.map((cell) => {
                const dayAppts = allAppointments.filter((a) => a && a.date === cell.iso);
                return (
                  <div
                    key={cell.iso}
                    onClick={() => {
                      setSelectedDate(cell.iso);
                      setViewMode('Day');
                    }}
                    onDoubleClick={() => onOpenBookAppointment(cell.iso)}
                    className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer ${
                      cell.isCurrentMonth ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/50 text-slate-400'
                    } ${cell.isToday ? 'bg-sky-50/30' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                          cell.isToday
                            ? 'bg-sky-500 text-white shadow-xs'
                            : cell.isSelected
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-700'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {dayAppts.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          {dayAppts.length} {dayAppts.length === 1 ? 'apt' : 'apts'}
                        </span>
                      )}
                    </div>

                    {/* Compact appointment chips */}
                    <div className="space-y-1 my-1 overflow-hidden">
                      {dayAppts.slice(0, 3).map((apt) => {
                        const style = getStatusBadgeStyle(apt.status);
                        return (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(apt);
                            }}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate border flex items-center gap-1 transition-transform hover:scale-[1.02] ${style.bg}`}
                          >
                            <span className="font-mono text-[9px]">{apt.timeSlot.split(' ')[0]}</span>
                            <span className="truncate">{apt.patientName}</span>
                          </div>
                        );
                      })}
                      {dayAppts.length > 3 && (
                        <div className="text-[9px] font-bold text-sky-600 px-1">
                          +{dayAppts.length - 3} more
                        </div>
                      )}
                    </div>

                    <div className="h-1" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* 4. FAST APPOINTMENT DETAILS & ACTION MODAL */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-sky-600">
                  Appointment Details
                </div>
                <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5">
                  {selectedAppointment.patientName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Cards */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Date & Time:
                </span>
                <span className="font-extrabold text-slate-900">
                  {formatDate(selectedAppointment.date)} @ {selectedAppointment.timeSlot}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-bold flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                  Procedure:
                </span>
                <span className="font-extrabold text-slate-900 truncate max-w-[200px]">
                  {selectedAppointment.procedure}
                </span>
              </div>

              {selectedAppointment.patientPhone && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-bold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Phone:
                  </span>
                  <a
                    href={`tel:${selectedAppointment.patientPhone}`}
                    className="font-mono font-bold text-sky-600 hover:underline"
                  >
                    {selectedAppointment.patientPhone}
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-bold">Status:</span>
                <select
                  value={selectedAppointment.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as Appointment['status'];
                    onUpdateAppointmentStatus(selectedAppointment.id, newStatus);
                    setSelectedAppointment({ ...selectedAppointment, status: newStatus });
                  }}
                  className="font-extrabold text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 outline-none cursor-pointer"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Arrived">Arrived (Waiting)</option>
                  <option value="In-Chair">In-Chair (Active)</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {/* Open EMR - Primary 1-Click Action */}
              <button
                type="button"
                onClick={() => {
                  onSelectPatient(selectedAppointment.patientId);
                  setSelectedAppointment(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Open Patient EMR & Start Work →</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {onOpenCreateInvoice && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCreateInvoice(selectedAppointment.patientId);
                      setSelectedAppointment(null);
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Create Bill</span>
                  </button>
                )}

                {onOpenPrescription && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPrescription(selectedAppointment.patientId);
                      setSelectedAppointment(null);
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Prescription</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DOCTOR ALERT CENTER DRAWER */}
      <DoctorAlertCenterDrawer
        isOpen={isAlertCenterOpen}
        onClose={() => setIsAlertCenterOpen(false)}
        patients={patients}
        onSelectPatient={onSelectPatient}
        onMarkCompleted={(followUpId) => onUpdateFollowUpStatus(followUpId, 'Completed')}
        onReschedule={(followUpId, days) => {
          if (onRescheduleFollowUp) {
            onRescheduleFollowUp(followUpId, days);
          } else {
            onUpdateFollowUpStatus(followUpId, 'Pending');
          }
        }}
        onAddFollowUp={(patientId, followUp) => {
          if (onAddFollowUp) {
            onAddFollowUp(patientId, followUp);
          }
        }}
      />

    </div>
  );
};
