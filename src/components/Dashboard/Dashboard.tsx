import React, { useState, useMemo } from 'react';
import { Patient, Appointment, FollowUpTask, Invoice, UserRole } from '../../types';
import { formatCurrency, formatDate, formatTodayISO } from '../../utils/formatters';
import { ChairManagementGrid } from './ChairManagementGrid';
import { DoctorAlertCenterDrawer } from './DoctorAlertCenterDrawer';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  UserPlus, 
  CalendarPlus, 
  Receipt, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  PhoneCall, 
  ArrowUpRight, 
  DollarSign, 
  Users, 
  CheckSquare, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Stethoscope,
  ShieldAlert,
  Bell
} from 'lucide-react';

interface DashboardProps {
  patients: Patient[];
  activeRole?: UserRole;
  onSelectPatient: (patientId: string) => void;
  onOpenAddPatient: () => void;
  onOpenBookAppointment: (defaultDate?: string, patientId?: string) => void;
  onOpenCreateInvoice: (patientId?: string) => void;
  onOpenPrescription: (patientId?: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
  onUpdateFollowUpStatus: (followUpId: string, status: FollowUpTask['status']) => void;
  onRescheduleFollowUp?: (followUpId: string, days?: number) => void;
  onAddFollowUp?: (patientId: string, followUp: { dueDate: string; reason: string; notes?: string }) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  patients,
  activeRole = 'admin',
  onSelectPatient,
  onOpenAddPatient,
  onOpenBookAppointment,
  onOpenCreateInvoice,
  onOpenPrescription,
  onUpdateAppointmentStatus,
  onUpdateFollowUpStatus,
  onRescheduleFollowUp,
  onAddFollowUp,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(formatTodayISO());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isAlertCenterOpen, setIsAlertCenterOpen] = useState<boolean>(false);

  const todayStr = formatTodayISO();

  // Flatten appointments, follow-ups, and invoices across all patients
  const { allAppointments, allFollowUps, allInvoices, allPrescriptions } = useMemo(() => {
    const appointments: (Appointment & { patientMrn: string })[] = [];
    const followUps: (FollowUpTask & { patientMrn: string })[] = [];
    const invoices: Invoice[] = [];
    const prescriptions: any[] = [];

    patients.forEach((p) => {
      p.appointments.forEach((apt) => {
        appointments.push({ ...apt, patientMrn: p.mrn });
      });
      p.followUps.forEach((flw) => {
        followUps.push({ ...flw, patientMrn: p.mrn });
      });
      p.invoices.forEach((inv) => {
        invoices.push(inv);
      });
      p.prescriptions.forEach((rx) => {
        prescriptions.push(rx);
      });
    });

    return { 
      allAppointments: appointments, 
      allFollowUps: followUps, 
      allInvoices: invoices,
      allPrescriptions: prescriptions
    };
  }, [patients]);

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Dashboard Live Metrics
  const metrics = useMemo(() => {
    const todayApts = allAppointments.filter((a) => a.date === todayStr);
    const scheduledToday = todayApts.filter((a) => a.status === 'Scheduled').length;
    const todayFollows = allFollowUps.filter((f) => f.dueDate === todayStr);

    let todayIncome = 0;
    allInvoices.forEach((inv) => {
      inv.paymentHistory.forEach((p) => {
        if (p.date === todayStr) {
          todayIncome += p.amount;
        }
      });
    });

    let pendingBalances = 0;
    allInvoices.forEach((inv) => {
      pendingBalances += inv.balanceDue;
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newPatientsCount = patients.filter((p) => new Date(p.createdAt) >= thirtyDaysAgo).length;

    const completedProceduresToday = allAppointments.filter(
      (a) => a.date === todayStr && a.status === 'Completed'
    ).length;

    return {
      todayAppointmentsCount: todayApts.length,
      scheduledTodayCount: scheduledToday,
      todayFollowUpsCount: todayFollows.length,
      newPatientsCount,
      todayIncome,
      pendingBalances,
      completedProceduresToday,
      totalRxCount: allPrescriptions.length,
    };
  }, [allAppointments, allFollowUps, allInvoices, allPrescriptions, patients, todayStr]);

  // Calendar Date map calculation for dot indicators
  const dateCountsMap = useMemo(() => {
    const map: Record<string, { appointments: number; followUps: number }> = {};

    allAppointments.forEach((apt) => {
      if (!map[apt.date]) map[apt.date] = { appointments: 0, followUps: 0 };
      map[apt.date].appointments += 1;
    });

    allFollowUps.forEach((flw) => {
      if (!map[flw.dueDate]) map[flw.dueDate] = { appointments: 0, followUps: 0 };
      map[flw.dueDate].followUps += 1;
    });

    return map;
  }, [allAppointments, allFollowUps]);

  // Filtered Appointments for selected date (sorted chronologically)
  const selectedDateAppointments = useMemo(() => {
    return allAppointments
      .filter((a) => a.date === selectedDate)
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [allAppointments, selectedDate]);

  // Filtered Follow-ups for selected date
  const selectedDateFollowUps = useMemo(() => {
    return allFollowUps.filter((f) => f.dueDate === selectedDate);
  }, [allFollowUps, selectedDate]);

  // Calendar Month Navigation Helpers
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');
      days.push(`${year}-${monthStr}-${dayStr}`);
    }
    return days;
  }, [currentMonth]);

  const monthYearLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  return (
    <div className="space-y-6 pb-12 min-w-0">
      {/* 1. Welcome Banner Card (matching reference image) */}
      <div className="bg-theme-card rounded-[28px] border border-theme-border p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[140px] gap-4">
        <div className="z-10 space-y-2 max-w-xl">
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-theme-main tracking-tight leading-tight">
            {getGreeting()}, <span className="text-theme-primary">{activeRole === 'admin' ? 'Clinic Admin' : 'Dr. V. Radhakrishnan'}</span> 👋
          </h1>
          <p className="text-sm sm:text-[17px] font-medium text-theme-secondary flex items-center gap-2 flex-wrap">
            <span>Here's what's happening in your clinic today</span>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-theme-secondary/40" />
            <span className="font-bold text-theme-main">{formatDate(todayStr)}</span>
          </p>
        </div>

        {/* Dental Chair Vector Graphic Asset */}
        <div className="hidden md:flex items-center justify-end z-10 shrink-0 opacity-90 pr-4">
          <div className="relative w-48 h-28 flex items-center justify-center">
            <svg className="w-44 h-24" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 90 L60 90 L80 60 L140 60 L160 40 L180 40" className="stroke-theme-accent" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M70 60 L110 20 L130 20 L110 60" className="fill-theme-accent" opacity="0.15" />
              <circle cx="120" cy="30" r="16" className="fill-theme-accent" opacity="0.2" />
              <path d="M40 90 L30 110 M70 90 L80 110 M130 60 L140 110" className="stroke-theme-secondary" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-theme-accent/10 to-transparent pointer-events-none" />
      </div>

      {/* 2. Metrics Summary Cards Row (5 Stat Cards with adaptive responsive grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: OPD Queue Today */}
        <div className="bg-theme-card p-4 sm:p-5 rounded-[24px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.05)] transition-all flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] lg:text-[12px] font-extrabold text-theme-secondary uppercase tracking-wider leading-tight">OPD QUEUE TODAY</p>
            <h3 className="text-2xl lg:text-[30px] font-black text-theme-main leading-none my-1 truncate">{metrics.todayAppointmentsCount}</h3>
            <div className="text-xs font-bold text-emerald-600 truncate">{metrics.scheduledTodayCount} upcoming slots</div>
          </div>
        </div>

        {/* Card 2: Doctor Alert Center */}
        <div
          onClick={() => setIsAlertCenterOpen(true)}
          className="bg-amber-50/90 hover:bg-amber-100/90 p-4 sm:p-5 rounded-[24px] border border-amber-300 shadow-[0_10px_30px_rgba(217,119,6,0.08)] hover:shadow-[0_15px_35px_rgba(217,119,6,0.15)] transition-all flex items-center gap-3.5 min-w-0 cursor-pointer group relative overflow-hidden"
        >
          <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <Bell className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[11px] lg:text-[12px] font-black text-amber-900 uppercase tracking-wider leading-tight">DOCTOR ALERTS</p>
              {allFollowUps.filter((f) => f.status !== 'Completed' && f.dueDate < todayStr).length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              )}
            </div>
            <h3 className="text-2xl lg:text-[30px] font-black text-amber-950 leading-none my-1 truncate">
              {metrics.todayFollowUpsCount} <span className="text-xs font-bold text-amber-800">Due Today</span>
            </h3>
            <div className="text-xs font-extrabold text-amber-700 truncate flex items-center gap-1 group-hover:underline">
              <span>Doctor Alert Center</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Card 3: Active EMRs */}
        <div className="bg-theme-card p-4 sm:p-5 rounded-[24px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.05)] transition-all flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] lg:text-[12px] font-extrabold text-theme-secondary uppercase tracking-wider leading-tight">ACTIVE EMRS</p>
            <h3 className="text-2xl lg:text-[30px] font-black text-theme-main leading-none my-1 truncate">{patients.length}</h3>
            <div className="text-xs font-medium text-theme-secondary truncate">Registered records</div>
          </div>
        </div>

        {/* Card 4: Completed Visits / Income */}
        <div className="bg-theme-card p-4 sm:p-5 rounded-[24px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.05)] transition-all flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] lg:text-[12px] font-extrabold text-theme-secondary uppercase tracking-wider leading-tight">COMPLETED VISITS</p>
            <h3 className="text-2xl lg:text-[30px] font-black text-theme-main leading-none my-1 truncate">
              {activeRole === 'admin' ? formatCurrency(metrics.todayIncome) : metrics.completedProceduresToday}
            </h3>
            <div className="text-xs font-bold text-emerald-600 truncate">Procedures done today</div>
          </div>
        </div>

        {/* Card 5: Digital Prescriptions */}
        <div className="bg-theme-card p-4 sm:p-5 rounded-[24px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.05)] transition-all flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 font-bold text-base sm:text-lg">
            Rx
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] lg:text-[12px] font-extrabold text-theme-secondary uppercase tracking-wider leading-tight">DIGITAL PRESCRIPTIONS</p>
            <h3 className="text-2xl lg:text-[30px] font-black text-theme-main leading-none my-1 truncate">{metrics.totalRxCount}</h3>
            <div className="text-xs font-semibold text-purple-600 truncate">Rx slips generated</div>
          </div>
        </div>
      </div>

      {/* Operatory Chairs Live Status Grid */}
      <ChairManagementGrid patients={patients} onSelectPatient={onSelectPatient} />

      {/* 3. Main Split View: Appointment Calendar & Today's Schedule */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols on XL): Interactive Calendar */}
        <div className="xl:col-span-5 bg-theme-card p-5 sm:p-6 rounded-[28px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="w-6 h-6 text-theme-accent" />
              <h3 className="text-[20px] font-bold text-theme-main">Appointment Calendar</h3>
            </div>
            <button
              onClick={() => {
                setSelectedDate(todayStr);
                setCurrentMonth(new Date());
              }}
              className="px-4 py-1.5 rounded-xl bg-theme-page hover:bg-theme-border text-theme-secondary text-sm font-bold transition-all cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* Month Header Navigation */}
          <div className="flex items-center justify-between bg-theme-page p-3 rounded-2xl border border-theme-border">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-xl text-theme-secondary hover:text-theme-main hover:bg-theme-card transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[20px] sm:text-[22px] font-extrabold text-theme-main">
              {monthYearLabel}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-xl text-theme-secondary hover:text-theme-main hover:bg-theme-card transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-bold text-theme-secondary uppercase tracking-wider">
            <span className="truncate">SUN</span>
            <span className="truncate">MON</span>
            <span className="truncate">TUE</span>
            <span className="truncate">WED</span>
            <span className="truncate">THU</span>
            <span className="truncate">FRI</span>
            <span className="truncate">SAT</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {daysInMonth.map((dayIso, idx) => {
              if (!dayIso) {
                return <div key={`empty-${idx}`} className="h-10 sm:h-12 rounded-2xl bg-transparent" />;
              }

              const dayNum = parseInt(dayIso.split('-')[2], 10);
              const isSelected = selectedDate === dayIso;
              const isToday = todayStr === dayIso;
              const counts = dateCountsMap[dayIso];

              return (
                <button
                  key={dayIso}
                  onClick={() => setSelectedDate(dayIso)}
                  className={`h-10 sm:h-12 rounded-2xl flex flex-col items-center justify-center text-xs sm:text-sm lg:text-[16px] font-bold transition-all duration-200 relative cursor-pointer min-w-0 ${
                    isSelected
                      ? 'bg-theme-accent text-white shadow-md scale-105 z-10'
                      : isToday
                      ? 'bg-theme-accent/10 text-theme-accent border border-theme-accent/30'
                      : 'bg-theme-page hover:bg-theme-border/50 text-theme-main'
                  }`}
                >
                  <span>{dayNum}</span>

                  {/* Indicator Dots */}
                  {counts?.appointments ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${
                        isSelected ? 'bg-white' : 'bg-theme-accent'
                      }`}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-theme-page rounded-2xl border border-theme-border text-sm text-theme-secondary space-y-1">
            <div className="flex items-center justify-between font-semibold">
              <span>Selected Date:</span>
              <span className="text-theme-accent font-bold">{formatDate(selectedDate)}</span>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Schedule & Follow-ups */}
        <div className="lg:col-span-7 space-y-6">
          {/* Schedule Panel */}
          <div className="bg-theme-card p-4 sm:p-6 rounded-[28px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-theme-border">
              <div>
                <h3 className="text-lg sm:text-[20px] font-bold text-theme-main flex items-center gap-2.5 flex-wrap">
                  <span className="w-3 h-3 rounded-full bg-[#10B981] shrink-0"></span>
                  <span>Today's Appointment Schedule</span>
                  <span className="text-theme-secondary font-normal text-xs sm:text-sm">
                    ({formatDate(selectedDate)})
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-theme-secondary mt-0.5 font-medium">
                  {selectedDateAppointments.length} patient visit(s) scheduled
                </p>
              </div>

              <button
                onClick={() => onOpenBookAppointment(selectedDate)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-theme-accent/15 hover:bg-theme-accent/25 text-theme-accent text-xs sm:text-sm font-bold border border-theme-accent/30 transition-all cursor-pointer shrink-0"
              >
                <CalendarPlus className="w-4 h-4 text-theme-accent" />
                <span>+ Slot</span>
              </button>
            </div>

            {selectedDateAppointments.length === 0 ? (
              <div className="p-8 sm:p-10 text-center rounded-2xl bg-theme-page border border-dashed border-theme-border text-theme-secondary space-y-3">
                <Clock className="w-10 h-10 mx-auto text-theme-secondary/60" />
                <p className="text-sm font-semibold">No appointments scheduled for {formatDate(selectedDate)}.</p>
                <button
                  onClick={() => onOpenBookAppointment(selectedDate)}
                  className="text-sm text-theme-accent hover:underline font-bold cursor-pointer"
                >
                  Click here to book a patient slot
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateAppointments.map((apt) => {
                  const statusColors = {
                    Scheduled: 'bg-theme-accent/15 text-theme-accent border-theme-accent/30',
                    'In-Chair': 'bg-amber-50 text-amber-800 border-amber-200',
                    Completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    Cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
                    'No-Show': 'bg-slate-100 text-slate-600 border-slate-200',
                  };

                  return (
                    <div
                      key={apt.id}
                      className="p-4 bg-theme-page border border-theme-border rounded-2xl hover:bg-theme-card transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs min-w-0"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-theme-card text-theme-main border border-theme-border shadow-2xs shrink-0">
                            {apt.timeSlot}
                          </span>
                          <button
                            onClick={() => onSelectPatient(apt.patientId)}
                            className="text-base sm:text-[17px] font-bold text-theme-main hover:text-theme-accent transition-colors flex items-center gap-1 cursor-pointer truncate max-w-[200px] sm:max-w-none"
                          >
                            <span className="truncate">{apt.patientName}</span>
                            <ArrowUpRight className="w-4 h-4 text-theme-secondary shrink-0" />
                          </button>
                          <span className="text-xs text-theme-secondary font-mono shrink-0">({apt.patientMrn})</span>
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-theme-secondary flex flex-wrap items-center gap-2">
                          <span>{apt.procedure}</span>
                          <span className="text-theme-secondary/50">•</span>
                          <span className="text-theme-secondary text-xs">{apt.chair}</span>
                        </div>
                        {apt.notes && (
                          <p className="text-xs text-theme-secondary italic truncate">"{apt.notes}"</p>
                        )}
                      </div>

                      {/* Status Selector */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                        <select
                          value={apt.status}
                          onChange={(e) =>
                            onUpdateAppointmentStatus(apt.id, e.target.value as Appointment['status'])
                          }
                          className={`w-full sm:w-auto text-xs font-bold px-3 py-2 rounded-xl border outline-none cursor-pointer ${
                            statusColors[apt.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="In-Chair">In-Chair</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="No-Show">No-Show</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Follow-Ups Checklist Panel */}
          <div className="bg-theme-card p-6 rounded-[28px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4 text-theme-main">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border">
              <div>
                <h3 className="text-[20px] font-bold text-theme-main flex items-center gap-2.5">
                  <span>Follow-Up Checklist</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    {selectedDateFollowUps.length} pending
                  </span>
                </h3>
                <p className="text-sm text-theme-secondary mt-0.5 font-medium">
                  Post-procedure calls, suture removals, and impression reviews
                </p>
              </div>
            </div>

            {selectedDateFollowUps.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-theme-page border border-dashed border-theme-border text-theme-secondary space-y-2">
                <FileText className="w-8 h-8 mx-auto text-purple-400" />
                <p className="text-sm font-medium">No follow-ups due on {formatDate(selectedDate)}.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDateFollowUps.map((flw) => (
                  <div
                    key={flw.id}
                    className="p-3.5 bg-theme-page border border-theme-border rounded-2xl flex items-center justify-between gap-3 hover:bg-theme-card transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectPatient(flw.patientId)}
                          className="text-[16px] font-bold text-theme-main hover:text-theme-primary transition-colors cursor-pointer"
                        >
                          {flw.patientName}
                        </button>
                        <a
                          href={`tel:${flw.patientPhone}`}
                          className="flex items-center gap-1 text-xs text-theme-accent font-mono hover:underline"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          {flw.patientPhone}
                        </a>
                      </div>
                      <p className="text-xs text-theme-secondary">{flw.reason}</p>
                    </div>

                    <select
                      value={flw.status}
                      onChange={(e) =>
                        onUpdateFollowUpStatus(flw.id, e.target.value as FollowUpTask['status'])
                      }
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-theme-card text-theme-main border border-theme-border outline-none cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Call Placed">Call Placed</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
