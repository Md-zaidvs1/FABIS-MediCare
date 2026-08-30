import React, { useState, useMemo } from 'react';
import { Patient, Appointment } from '../../types';
import {
  formatDate,
  formatTodayISO,
  formatPatientId,
  parseTimeToMinutes,
  normalizeTimeSlot,
} from '../../utils/formatters';
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Stethoscope,
  Calendar as CalendarIcon,
  Search
} from 'lucide-react';

interface AppointmentsViewProps {
  patients: Patient[];
  activeRole?: string;
  onSelectPatient: (patientId: string) => void;
  onOpenBookAppointment: (date?: string, patientId?: string) => void;
  onOpenAddPatient?: () => void;
  onOpenCreateInvoice?: (patientId: string) => void;
  onOpenPrescription?: (patientId: string) => void;
  onUpdateAppointmentStatus?: (appointmentId: string, status: Appointment['status']) => void;
  onUpdateAppointmentChair?: (appointmentId: string, chair: Appointment['chair']) => void;
  onRescheduleAppointment?: (appointmentId: string, timeSlot: string, date: string) => void;
  onUpdateFollowUpStatus?: (followUpId: string, status: any) => void;
  onAddAppointment?: (appointment: Omit<Appointment, 'id'>) => void;
}

export type CalendarViewMode = 'Month' | 'Week' | 'Day';

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  patients,
  onSelectPatient,
  onOpenBookAppointment,
}) => {
  const todayIso = formatTodayISO();
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('Week');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect all appointments across patients
  const allAppointments = useMemo(() => {
    return (patients || []).flatMap((p) =>
      (p?.appointments || []).map((apt) => ({
        ...apt,
        patientMrn: p.mrn,
        patientRk: formatPatientId(p),
      }))
    );
  }, [patients]);

  // Filtered by search query
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return allAppointments;
    const q = searchQuery.trim().toLowerCase();
    return allAppointments.filter(
      (a) =>
        a &&
        ((a.patientName || '').toLowerCase().includes(q) ||
        (a.patientRk && a.patientRk.toLowerCase().includes(q)) ||
        (a.procedure || '').toLowerCase().includes(q) ||
        (a.timeSlot || '').toLowerCase().includes(q) ||
        (a.date && a.date.includes(q)))
    );
  }, [allAppointments, searchQuery]);

  // Navigate date
  const handlePrev = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'Day') d.setDate(d.getDate() - 1);
    else if (viewMode === 'Week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'Month') d.setMonth(d.getMonth() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNext = () => {
    const d = new Date(selectedDate);
    if (viewMode === 'Day') d.setDate(d.getDate() + 1);
    else if (viewMode === 'Week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'Month') d.setMonth(d.getMonth() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(todayIso);
  };

  // Week View Days
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const dayOfWeek = curr.getDay(); // 0 is Sunday
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - dayOfWeek);

    const days: { dateIso: string; dayName: string; dayNum: number; isToday: boolean; isSelected: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      days.push({
        dateIso: iso,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: iso === todayIso,
        isSelected: iso === selectedDate,
      });
    }
    return days;
  }, [selectedDate, todayIso]);

  // Month View Days
  const monthDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const year = curr.getFullYear();
    const month = curr.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: { dateIso: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }[] = [];

    // Pad leading days from prev month
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevD = new Date(year, month, -i);
      const iso = prevD.toISOString().split('T')[0];
      days.push({
        dateIso: iso,
        dayNum: prevD.getDate(),
        isCurrentMonth: false,
        isToday: iso === todayIso,
        isSelected: iso === selectedDate,
      });
    }

    // Days in current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const curD = new Date(year, month, d);
      const iso = curD.toISOString().split('T')[0];
      days.push({
        dateIso: iso,
        dayNum: d,
        isCurrentMonth: true,
        isToday: iso === todayIso,
        isSelected: iso === selectedDate,
      });
    }

    return days;
  }, [selectedDate, todayIso]);

  // Appointments for currently active day in Day view or list view
  const selectedDayAppointments = useMemo(() => {
    return filteredAppointments
      .filter((a) => a && a.date === selectedDate)
      .sort((a, b) => parseTimeToMinutes(a.timeSlot) - parseTimeToMinutes(b.timeSlot));
  }, [filteredAppointments, selectedDate]);

  return (
    <div className="space-y-5">
      {/* Top Header & Calendar Controls */}
      <div className="bg-theme-card p-4 sm:p-5 rounded-2xl border border-theme-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3BA7F5]/10 flex items-center justify-center text-[#3BA7F5] shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-theme-main">Appointments</h1>
            <p className="text-xs font-semibold text-theme-secondary">
              {formatDate(selectedDate)}
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Today and Arrows */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-white transition-all cursor-pointer shadow-2xs"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Modes [ Month ] [ Week ] [ Day ] */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['Month', 'Week', 'Day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white text-[#1E293B] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Book Appointment Button */}
          <button
            type="button"
            onClick={() => onOpenBookAppointment(selectedDate)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3BA7F5] hover:bg-[#2A96E4] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter by patient name, RK ID, or procedure..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-sky-500 shadow-2xs"
        />
      </div>

      {/* CALENDAR BODY */}
      {viewMode === 'Day' && (
        <div className="bg-theme-card p-5 sm:p-6 rounded-2xl border border-theme-border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Appointments for {formatDate(selectedDate)}
            </h2>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
              {selectedDayAppointments.length} Booked
            </span>
          </div>

          {selectedDayAppointments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No appointments scheduled for this day. Click &quot;Book Appointment&quot; to add one.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => onSelectPatient(apt.patientId)}
                  className="p-4 bg-slate-50/80 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-300 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Time */}
                    <div className="flex items-center gap-1.5 font-mono font-extrabold text-xs text-sky-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs shrink-0">
                      <Clock className="w-3.5 h-3.5 text-sky-500" />
                      <span>{apt.timeSlot}</span>
                    </div>

                    {/* Patient & Procedure */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 group-hover:text-sky-700">
                          {apt.patientName}
                        </span>
                        {apt.patientRk && (
                          <span className="text-[11px] font-mono font-bold text-sky-600 bg-sky-100/70 px-2 py-0.5 rounded-md">
                            {apt.patientRk}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-600 mt-0.5 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                        <span>{apt.procedure}</span>
                        {apt.notes && (
                          <span className="text-slate-400 font-normal">({apt.notes})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                      {apt.status || 'Scheduled'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPatient(apt.patientId);
                      }}
                      className="px-3 py-1 bg-white hover:bg-sky-600 hover:text-white border border-slate-200 hover:border-sky-600 rounded-lg text-xs font-bold text-slate-700 transition-colors"
                    >
                      Open EMR →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'Week' && (
        <div className="bg-theme-card p-4 sm:p-5 rounded-2xl border border-theme-border shadow-xs overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[720px]">
            {weekDays.map((wd) => {
              const dayAppts = filteredAppointments
                .filter((a) => a.date === wd.dateIso)
                .sort((a, b) => parseTimeToMinutes(a.timeSlot) - parseTimeToMinutes(b.timeSlot));

              return (
                <div
                  key={wd.dateIso}
                  onClick={() => setSelectedDate(wd.dateIso)}
                  className={`p-2.5 rounded-xl border flex flex-col min-h-[380px] transition-all cursor-pointer ${
                    wd.isSelected
                      ? 'bg-sky-50/50 border-sky-400 ring-2 ring-sky-200'
                      : wd.isToday
                      ? 'bg-amber-50/40 border-amber-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">{wd.dayName}</span>
                    <span
                      className={`text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center ${
                        wd.isToday
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-800'
                      }`}
                    >
                      {wd.dayNum}
                    </span>
                  </div>

                  {/* Appointments List for the day */}
                  <div className="flex-1 overflow-y-auto space-y-2 pt-2 text-xs">
                    {dayAppts.length === 0 ? (
                      <div className="text-[10px] text-slate-300 text-center py-4">No visits</div>
                    ) : (
                      dayAppts.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPatient(apt.patientId);
                          }}
                          className="p-2 bg-white hover:bg-sky-100/60 border border-slate-200 hover:border-sky-300 rounded-lg shadow-2xs transition-all cursor-pointer group"
                        >
                          <div className="text-[10px] font-mono font-bold text-sky-600">
                            {apt.timeSlot}
                          </div>
                          <div className="font-extrabold text-slate-900 text-[11px] group-hover:text-sky-700 truncate">
                            {apt.patientName}
                          </div>
                          {apt.patientRk && (
                            <div className="text-[9px] font-mono font-semibold text-slate-400">
                              {apt.patientRk}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {apt.procedure}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'Month' && (
        <div className="bg-theme-card p-4 sm:p-5 rounded-2xl border border-theme-border shadow-xs overflow-x-auto">
          <div className="grid grid-cols-7 gap-1.5 min-w-[700px]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="p-2 text-center text-xs font-extrabold text-slate-500 uppercase">
                {d}
              </div>
            ))}
            {monthDays.map((md) => {
              const dayAppts = filteredAppointments.filter((a) => a.date === md.dateIso);
              return (
                <div
                  key={md.dateIso}
                  onClick={() => setSelectedDate(md.dateIso)}
                  className={`p-2 rounded-xl border min-h-[90px] transition-all cursor-pointer flex flex-col justify-between ${
                    md.isSelected
                      ? 'bg-sky-50 border-sky-400'
                      : md.isToday
                      ? 'bg-amber-50/50 border-amber-300'
                      : md.isCurrentMonth
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-slate-50/50 border-slate-100 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${md.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                      {md.dayNum}
                    </span>
                    {dayAppts.length > 0 && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-700">
                        {dayAppts.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {dayAppts.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(apt.patientId);
                        }}
                        className="text-[9px] font-semibold text-slate-800 bg-slate-100 hover:bg-sky-100 p-1 rounded truncate cursor-pointer"
                      >
                        <span className="text-sky-600 font-mono">{apt.timeSlot.split(' ')[0]}</span> {apt.patientName}
                      </div>
                    ))}
                    {dayAppts.length > 2 && (
                      <div className="text-[8px] font-bold text-slate-400">
                        +{dayAppts.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
