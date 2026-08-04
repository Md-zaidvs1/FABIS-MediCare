import React, { useState, useEffect, useMemo } from 'react';
import { Patient, Appointment, FollowUpTask, Invoice, UserRole, DashboardPersonalizationSettings, DoctorProfile, ChairStatus } from '../../types';
import { formatCurrency, formatDate, formatTodayISO } from '../../utils/formatters';
import { getStoredDashboardSettings, getStoredDoctor, getStoredChairs } from '../../utils/storage';
import { ChairManagementGrid } from './ChairManagementGrid';
import { DoctorAlertCenterDrawer } from './DoctorAlertCenterDrawer';
import { AppointmentSchedulerSection } from './AppointmentSchedulerSection';
import { 
  Clock, 
  UserPlus, 
  CalendarPlus, 
  FileText, 
  CheckCircle2, 
  PhoneCall, 
  DollarSign, 
  Users, 
  Activity,
  Stethoscope,
  Calendar,
  CheckSquare,
  Sparkles,
  Zap,
  Receipt,
  AlertCircle,
  Play,
  UserCheck,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Sun,
  Shield,
  Heart,
  Crown,
  Award,
  Smile,
  Quote,
  Building2,
  Armchair,
  Moon
} from 'lucide-react';

const WELCOME_CARD_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Sparkles,
  Stethoscope,
  Sun,
  Shield,
  Heart,
  Crown,
  Award,
  Activity,
  Smile,
};


interface DashboardProps {
  patients: Patient[];
  activeRole?: UserRole;
  onSelectPatient: (patientId: string) => void;
  onOpenAddPatient: () => void;
  onOpenBookAppointment: (defaultDate?: string, patientId?: string) => void;
  onOpenCreateInvoice: (patientId?: string) => void;
  onOpenPrescription: (patientId?: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
  onUpdateAppointmentChair?: (appointmentId: string, chair: Appointment['chair']) => void;
  onRescheduleAppointment?: (appointmentId: string, newTimeSlot: string, newDate?: string) => void;
  onUpdateFollowUpStatus: (followUpId: string, status: FollowUpTask['status']) => void;
  onRescheduleFollowUp?: (followUpId: string, days?: number) => void;
  onAddFollowUp?: (patientId: string, followUp: { dueDate: string; reason: string; notes?: string }) => void;
}

// Helper: Parse "09:30 AM" into minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
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
  onUpdateAppointmentChair,
  onRescheduleAppointment,
  onUpdateFollowUpStatus,
  onRescheduleFollowUp,
  onAddFollowUp,
}) => {
  const [isAlertCenterOpen, setIsAlertCenterOpen] = useState<boolean>(false);
  const todayStr = formatTodayISO();

  // Personalization settings and doctor profile
  const [dashboardSettings, setDashboardSettings] = useState<DashboardPersonalizationSettings>(getStoredDashboardSettings());
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>(getStoredDoctor());
  const [chairsList, setChairsList] = useState<ChairStatus[]>(getStoredChairs());

  useEffect(() => {
    const syncData = () => {
      setDashboardSettings(getStoredDashboardSettings());
      setDoctorProfile(getStoredDoctor());
      setChairsList(getStoredChairs());
    };

    window.addEventListener('dashboard-settings-updated', syncData);
    window.addEventListener('fabis_chairs_updated', syncData);
    window.addEventListener('fabis_doctor_updated', syncData);
    return () => {
      window.removeEventListener('dashboard-settings-updated', syncData);
      window.removeEventListener('fabis_chairs_updated', syncData);
      window.removeEventListener('fabis_doctor_updated', syncData);
    };
  }, []);

  // Real-time ticker
  const [nowDate, setNowDate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowDate(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

  // Collapsible section states
  const [collapseChairs, setCollapseChairs] = useState<boolean>(false);
  const [collapsePendingPayments, setCollapsePendingPayments] = useState<boolean>(false);
  const [collapseFollowups, setCollapseFollowups] = useState<boolean>(false);
  const [collapseRecent, setCollapseRecent] = useState<boolean>(false);

  // List expansion states
  const [showAllPayments, setShowAllPayments] = useState<boolean>(false);
  const [showAllFollowups, setShowAllFollowups] = useState<boolean>(false);
  const [showAllRecent, setShowAllRecent] = useState<boolean>(false);

  // Flatten appointments, follow-ups, invoices, and prescriptions
  const { allAppointments, allFollowUps, allInvoices, allPrescriptions } = useMemo(() => {
    const appointments: (Appointment & { patientMrn: string })[] = [];
    const followUps: (FollowUpTask & { patientMrn: string })[] = [];
    const invoices: Invoice[] = [];
    const prescriptions: any[] = [];

    patients.forEach((p) => {
      (p.appointments || []).forEach((apt) => {
        appointments.push({ ...apt, patientMrn: p.mrn });
      });
      (p.followUps || []).forEach((flw) => {
        followUps.push({ ...flw, patientMrn: p.mrn });
      });
      (p.invoices || []).forEach((inv) => {
        invoices.push(inv);
      });
      (p.prescriptions || []).forEach((rx) => {
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

  const getGreeting = () => {
    const hour = nowDate.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // 5 KPI Metrics
  const kpiMetrics = useMemo(() => {
    const todayApts = allAppointments.filter((a) => a.date === todayStr);
    const appointmentsCount = todayApts.length;
    
    let waitingCount = 0;
    let inTreatmentCount = 0;
    let completedCount = 0;

    todayApts.forEach((apt) => {
      if (apt.status === 'Arrived' || apt.status === 'Waiting-List') {
        waitingCount++;
      } else if (apt.status === 'In-Chair' || apt.status === 'In Consultation') {
        inTreatmentCount++;
      } else if (apt.status === 'Completed') {
        completedCount++;
      } else if (apt.status === 'Scheduled') {
        // If appointment time passed and not started, consider in waiting/overdue
        const startMins = parseTimeToMinutes(apt.timeSlot);
        if (nowMinutes > startMins + 5) {
          waitingCount++;
        }
      }
    });

    let todayRevenue = 0;
    allInvoices.forEach((inv) => {
      (inv.paymentHistory || []).forEach((p) => {
        if (p.date === todayStr) {
          todayRevenue += p.amount;
        }
      });
    });

    return {
      appointmentsCount,
      waitingCount,
      inTreatmentCount,
      completedCount,
      todayRevenue
    };
  }, [allAppointments, allInvoices, todayStr, nowMinutes]);

  // Today's appointments sorted chronologically
  const todayAppointments = useMemo(() => {
    return allAppointments
      .filter((a) => a.date === todayStr)
      .sort((a, b) => parseTimeToMinutes(a.timeSlot) - parseTimeToMinutes(b.timeSlot));
  }, [allAppointments, todayStr]);

  // Next Patient Up
  const nextPatientApt = useMemo(() => {
    if (todayAppointments.length === 0) return null;

    const inChair = todayAppointments.find((a) => a.status === 'In-Chair');
    if (inChair) return inChair;

    const upcoming = todayAppointments.find((a) => {
      const aptMins = parseTimeToMinutes(a.timeSlot);
      return aptMins >= nowMinutes - 15 && a.status !== 'Completed' && a.status !== 'Cancelled';
    });

    return upcoming || todayAppointments.find(a => a.status !== 'Completed' && a.status !== 'Cancelled') || todayAppointments[0];
  }, [todayAppointments, nowMinutes]);

  // Pending Payments list
  const pendingInvoices = useMemo(() => {
    const list: { invoice: Invoice; patientName: string; patientPhone: string; patientId: string }[] = [];
    patients.forEach((p) => {
      (p.invoices || []).forEach((inv) => {
        if (inv.balanceDue > 0 && inv.status !== 'Paid') {
          list.push({
            invoice: inv,
            patientName: p.name,
            patientPhone: p.phone,
            patientId: p.id,
          });
        }
      });
    });
    return list;
  }, [patients]);

  // Today's Follow-up Tasks
  const todayFollowUps = useMemo(() => {
    return allFollowUps.filter((f) => f.dueDate === todayStr || f.status !== 'Completed');
  }, [allFollowUps, todayStr]);

  // Recent Completed Activities
  const recentActivities = useMemo(() => {
    const list: { id: string; title: string; subtitle: string; time: string; type: 'completed' | 'rx' | 'payment' }[] = [];

    allAppointments
      .filter((a) => a.status === 'Completed')
      .forEach((a, idx) => {
        list.push({
          id: `apt-${a.id}-${idx}`,
          title: `Completed ${a.procedure}`,
          subtitle: `Patient: ${a.patientName} (${a.chair})`,
          time: a.timeSlot,
          type: 'completed',
        });
      });

    allPrescriptions.forEach((rx, idx) => {
      list.push({
        id: `rx-${rx.id}-${idx}`,
        title: `Prescription issued (${rx.medications?.length || 1} meds)`,
        subtitle: `Patient ID: ${rx.patientId}`,
        time: formatDate(rx.date),
        type: 'rx',
      });
    });

    allInvoices.forEach((inv, invIdx) => {
      (inv.paymentHistory || []).forEach((p, idx) => {
        list.push({
          id: `pay-${inv.id}-${invIdx}-${p.id || idx}`,
          title: `Collected Payment: ${formatCurrency(p.amount)}`,
          subtitle: `Invoice #${inv.invoiceNumber} • ${p.method}`,
          time: formatDate(p.date),
          type: 'payment',
        });
      });
    });

    return list;
  }, [allAppointments, allPrescriptions, allInvoices]);

  return (
    <div className="space-y-6 pb-12 min-w-0 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* 1. CUSTOMIZABLE PREMIUM DASHBOARD WELCOME CARD */}
      {(() => {
        const WelcomeIcon = WELCOME_CARD_ICONS[dashboardSettings.cardIcon] || Sparkles;
        const effectiveClinicName = dashboardSettings.clinicNameOverride?.trim() || doctorProfile.clinicName || 'FABIS MediCare Dental Clinic';
        const activeChairsCount = chairsList.length;

        return (
          <div
            className={`relative rounded-3xl p-6 sm:p-7 text-white shadow-xl overflow-hidden border border-slate-700/40 transition-all ${
              dashboardSettings.backgroundType === 'gradient'
                ? `bg-gradient-to-r ${dashboardSettings.backgroundGradient}`
                : ''
            }`}
            style={{
              backgroundColor: dashboardSettings.backgroundType === 'solid' ? dashboardSettings.backgroundColor : undefined,
              backgroundImage:
                dashboardSettings.backgroundType === 'image' && dashboardSettings.backgroundImageUrl
                  ? `url(${dashboardSettings.backgroundImageUrl})`
                  : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Dark gradient overlay for banner image background mode */}
            {dashboardSettings.backgroundType === 'image' && (
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/75 to-slate-950/60 backdrop-blur-[1px]" />
            )}

            <div className="relative z-10 space-y-4">
              {/* Top Row: Greeting, Clinic Badge, Doctor Name, Card Icon, Date & Dynamic Greeting */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                      <Building2 className="w-3.5 h-3.5" />
                      {effectiveClinicName}
                    </span>

                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                      {nowDate.getHours() < 18 ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      {getGreeting()}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1 flex items-center gap-2 flex-wrap">
                    <span>{dashboardSettings.welcomeTitle || getGreeting()},</span>
                    <span className="text-sky-300">{doctorProfile.name || (activeRole === 'admin' ? 'Doctor' : 'Dr. V. Radhakrishnan')}</span>
                  </h1>
                </div>

                {/* Right Side Date Badge & Custom Icon */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-slate-100 shadow-xs">
                    <Calendar className="w-4 h-4 text-sky-300" />
                    <span>{formatDate(todayStr)}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-sky-500/20 border border-sky-400/30 text-sky-300 backdrop-blur-md shadow-xs">
                    <WelcomeIcon className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Subtext Message */}
              {dashboardSettings.welcomeMessage && (
                <p className="text-xs sm:text-sm font-medium text-slate-200/95 leading-relaxed max-w-3xl">
                  {dashboardSettings.welcomeMessage}
                </p>
              )}

              {/* Motivational Quote */}
              {dashboardSettings.motivationalQuote && (
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-3xl">
                  <Quote className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium italic text-amber-100/90 leading-snug">
                    "{dashboardSettings.motivationalQuote}"
                  </p>
                </div>
              )}

              {/* Configurable Live Metrics Grid */}
              {(dashboardSettings.showActiveChairs ||
                dashboardSettings.showTodayAppointments ||
                dashboardSettings.showWaitingPatients ||
                dashboardSettings.showTodayRevenue) && (
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/10">
                  {/* Active Chairs */}
                  {dashboardSettings.showActiveChairs && (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 hover:bg-white/10 transition-all">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                        <Armchair className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-300">Active Chairs</div>
                        <div className="text-sm font-black text-white truncate">{activeChairsCount} Chairs</div>
                      </div>
                    </div>
                  )}

                  {/* Today's Appointments */}
                  {dashboardSettings.showTodayAppointments && (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 hover:bg-white/10 transition-all">
                      <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-300">Today's Appointments</div>
                        <div className="text-sm font-black text-white truncate">{kpiMetrics.appointmentsCount} Booked</div>
                      </div>
                    </div>
                  )}

                  {/* Waiting Patients */}
                  {dashboardSettings.showWaitingPatients && (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 hover:bg-white/10 transition-all">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-300">Waiting Room</div>
                        <div className="text-sm font-black text-white truncate">{kpiMetrics.waitingCount} Waiting</div>
                      </div>
                    </div>
                  )}

                  {/* Today's Revenue */}
                  {dashboardSettings.showTodayRevenue && (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 hover:bg-white/10 transition-all">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-300">Today's Revenue</div>
                        <div className="text-sm font-black text-white truncate">
                          {formatCurrency(kpiMetrics.todayRevenue, doctorProfile.currencySymbol || '₹')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}


      {/* 2. QUICK ACTIONS */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Actions</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {/* New Patient */}
          <button
            onClick={() => onOpenAddPatient()}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 text-sky-400 shrink-0" />
            <span>New Patient</span>
          </button>

          {/* Appointment */}
          <button
            onClick={() => onOpenBookAppointment()}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <CalendarPlus className="w-4 h-4 text-white shrink-0" />
            <span>Appointment</span>
          </button>

          {/* Start Treatment */}
          <button
            onClick={() => {
              if (nextPatientApt) {
                onSelectPatient(nextPatientApt.patientId);
              } else {
                onOpenBookAppointment();
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <Play className="w-4 h-4 text-indigo-200 shrink-0 fill-current" />
            <span>Start Treatment</span>
          </button>

          {/* Create Bill */}
          <button
            onClick={() => onOpenCreateInvoice()}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <Receipt className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>Create Bill</span>
          </button>

          {/* Prescription */}
          <button
            onClick={() => onOpenPrescription()}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer active:scale-[0.98] col-span-2 sm:col-span-1"
          >
            <FileText className="w-4 h-4 text-amber-100 shrink-0" />
            <span>Prescription</span>
          </button>
        </div>
      </div>

      {/* 3. KPI CARDS (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Appointments */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Appointments</p>
            <h3 className="text-xl font-black text-slate-900 leading-tight my-0.5">{kpiMetrics.appointmentsCount}</h3>
            <p className="text-[10px] font-bold text-purple-600 truncate">Total scheduled</p>
          </div>
        </div>

        {/* Waiting */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Waiting</p>
            <h3 className="text-xl font-black text-amber-600 leading-tight my-0.5">{kpiMetrics.waitingCount}</h3>
            <p className="text-[10px] font-bold text-amber-600 truncate">In lounge / Arrived</p>
          </div>
        </div>

        {/* In Treatment */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">In Treatment</p>
            <h3 className="text-xl font-black text-sky-600 leading-tight my-0.5">{kpiMetrics.inTreatmentCount}</h3>
            <p className="text-[10px] font-bold text-sky-600 truncate">Engaged in chair</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Completed</p>
            <h3 className="text-xl font-black text-emerald-600 leading-tight my-0.5">{kpiMetrics.completedCount}</h3>
            <p className="text-[10px] font-bold text-emerald-600 truncate">Finished today</p>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-200/60 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Revenue</p>
            <h3 className="text-xl font-black text-teal-700 leading-tight my-0.5">{formatCurrency(kpiMetrics.todayRevenue)}</h3>
            <p className="text-[10px] font-bold text-teal-600 truncate">Collected today</p>
          </div>
        </div>
      </div>

      {/* 4. TODAY'S APPOINTMENT TIMELINE (Largest Section) */}
      <div className="space-y-4">
        {/* Next Patient Banner if active */}
        {nextPatientApt && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-extrabold text-[10px] uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Next Active Patient</span>
                </span>
                <span className="text-xs font-mono font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-lg">
                  {nextPatientApt.timeSlot} • {nextPatientApt.chair}
                </span>
              </div>

              <div className="flex items-baseline gap-2.5 flex-wrap">
                <h3 className="text-lg font-black tracking-tight text-white">{nextPatientApt.patientName}</h3>
                <span className="text-xs text-slate-300 font-mono">({nextPatientApt.patientMrn})</span>
              </div>

              <p className="text-xs text-slate-300 font-medium truncate">
                Procedure: <strong className="text-white">{nextPatientApt.procedure}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={() => onSelectPatient(nextPatientApt.patientId)}
                className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs transition-colors shadow-xs cursor-pointer"
              >
                Open EMR →
              </button>
              {nextPatientApt.status !== 'In-Chair' && nextPatientApt.status !== 'Completed' && (
                <button
                  type="button"
                  onClick={() => onUpdateAppointmentStatus(nextPatientApt.id, 'In-Chair')}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 font-extrabold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Engage Chair
                </button>
              )}
            </div>
          </div>
        )}

        {/* Appointment Timeline Scheduler */}
        <AppointmentSchedulerSection
          patients={patients}
          activeRole={activeRole}
          onSelectPatient={onSelectPatient}
          onOpenBookAppointment={onOpenBookAppointment}
          onOpenAddPatient={onOpenAddPatient}
          onOpenCreateInvoice={onOpenCreateInvoice}
          onOpenPrescription={onOpenPrescription}
          onUpdateAppointmentStatus={onUpdateAppointmentStatus}
          onUpdateAppointmentChair={onUpdateAppointmentChair}
          onRescheduleAppointment={onRescheduleAppointment}
        />
      </div>

      {/* 5. CHAIR STATUS (Below Appointment Timeline) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setCollapseChairs(!collapseChairs)}
          className="w-full px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-200/80 flex items-center justify-between cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Stethoscope className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Operatory Chair Status</span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-extrabold">
              3 Active Operatories
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-xs font-bold">
            <span>{collapseChairs ? 'Expand' : 'Collapse'}</span>
            {collapseChairs ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </button>

        {!collapseChairs && (
          <div className="p-4">
            <ChairManagementGrid patients={patients} onSelectPatient={onSelectPatient} />
          </div>
        )}
      </div>

      {/* 6. BOTTOM WIDGETS (Pending Payments, Follow-ups, Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Widget 1: Pending Payments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Pending Payments</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                {pendingInvoices.length} Due
              </span>
            </div>

            <div className="p-3 space-y-2">
              {pendingInvoices.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">All invoices are settled!</p>
              ) : (
                (showAllPayments ? pendingInvoices : pendingInvoices.slice(0, 4)).map((item) => (
                  <div
                    key={item.invoice.id}
                    className="p-3 bg-slate-50/60 hover:bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => onSelectPatient(item.patientId)}
                        className="text-xs font-extrabold text-slate-900 hover:text-sky-600 transition-colors text-left truncate block"
                      >
                        {item.patientName}
                      </button>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Inv #{item.invoice.invoiceNumber}</span>
                        <span>•</span>
                        <span>Due: {formatDate(item.invoice.dueDate)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-black text-rose-600">
                        {formatCurrency(item.invoice.balanceDue)}
                      </div>
                      <button
                        onClick={() => onOpenCreateInvoice(item.patientId)}
                        className="mt-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold transition-colors cursor-pointer"
                      >
                        Collect ₹
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {pendingInvoices.length > 4 && (
            <div className="p-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowAllPayments(!showAllPayments)}
                className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
              >
                {showAllPayments ? 'Show Less' : `View All (${pendingInvoices.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Widget 2: Follow-ups */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Follow-ups</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                {todayFollowUps.length} Pending
              </span>
            </div>

            <div className="p-3 space-y-2">
              {todayFollowUps.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No pending follow-ups today.</p>
              ) : (
                (showAllFollowups ? todayFollowUps : todayFollowUps.slice(0, 4)).map((flw) => (
                  <div
                    key={flw.id}
                    className="p-3 bg-slate-50/60 border border-slate-200/80 rounded-xl space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onSelectPatient(flw.patientId)}
                          className="text-xs font-extrabold text-slate-900 hover:text-sky-600 transition-colors text-left truncate block"
                        >
                          {flw.patientName}
                        </button>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">{flw.reason}</p>
                      </div>

                      <a
                        href={`tel:${flw.patientPhone}`}
                        className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 cursor-pointer shrink-0"
                        title="Call Patient"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                      <span className="text-[10px] font-mono text-slate-400">Due: {flw.dueDate}</span>
                      <select
                        value={flw.status}
                        onChange={(e) =>
                          onUpdateFollowUpStatus(flw.id, e.target.value as FollowUpTask['status'])
                        }
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-slate-800 border border-slate-300 outline-none cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Call Placed">Call Placed</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {todayFollowUps.length > 4 && (
            <div className="p-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowAllFollowups(!showAllFollowups)}
                className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
              >
                {showAllFollowups ? 'Show Less' : `View All (${todayFollowUps.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Widget 3: Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Recent Activity</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                {recentActivities.length} Logged
              </span>
            </div>

            <div className="p-3 space-y-2">
              {recentActivities.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No recent activity logged today.</p>
              ) : (
                (showAllRecent ? recentActivities : recentActivities.slice(0, 4)).map((act, actIdx) => (
                  <div
                    key={`${act.id}-${actIdx}`}
                    className="p-2.5 bg-slate-50/60 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        act.type === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        act.type === 'rx' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        'bg-sky-50 text-sky-600 border border-sky-200'
                      }`}>
                        {act.type === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                         act.type === 'rx' ? <FileText className="w-3.5 h-3.5" /> :
                         <DollarSign className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{act.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">{act.subtitle}</div>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                      {act.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {recentActivities.length > 4 && (
            <div className="p-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowAllRecent(!showAllRecent)}
                className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
              >
                {showAllRecent ? 'Show Less' : `View All (${recentActivities.length})`}
              </button>
            </div>
          )}
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
