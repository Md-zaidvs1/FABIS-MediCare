import React, { useState, useEffect } from 'react';
import { 
  Patient, 
  DoctorProfile, 
  ToothCondition, 
  TreatmentPlanItem, 
  Appointment, 
  FollowUpTask, 
  Invoice, 
  Prescription, 
  Vitals,
  UserRole
} from './types';
import { 
  getStoredDoctor, 
  saveDoctor, 
  getStoredPatients, 
  savePatients, 
  resetToDemoData, 
  checkIsLoggedIn, 
  setLoggedIn,
  getStoredRole,
  saveStoredRole,
  getStoredTheme,
  applyThemeToDocument
} from './utils/storage';
import { formatTodayISO, universalToFDI, getToothName } from './utils/formatters';
import { useOfflineSync } from './hooks/useOfflineSync';
import { autoRestoreSmsSettingsIfNeeded } from './utils/smsApi';

// Layout Components
import { Header } from './components/Header';
import { SidebarNav, NavigationTab } from './components/SidebarNav';
import { DoctorLogin } from './components/DoctorLogin';

// Main Views
import { Dashboard } from './components/Dashboard/Dashboard';
import { PatientDirectory } from './components/PatientEMR/PatientDirectory';
import { PatientEMRWorkspace } from './components/PatientEMR/PatientEMRWorkspace';
import { AppointmentsView } from './components/Views/AppointmentsView';
import { BillingView } from './components/Views/BillingView';
import { PrescriptionsView } from './components/Views/PrescriptionsView';
import { SettingsView } from './components/Views/SettingsView';
import { SmsCenterView } from './components/Views/SmsCenterView';

// Modals
import { AddPatientModal } from './components/Modals/AddPatientModal';
import { BookAppointmentModal } from './components/Modals/BookAppointmentModal';
import { CreateInvoiceModal } from './components/Modals/CreateInvoiceModal';
import { PrescriptionModal } from './components/Modals/PrescriptionModal';
import { ViewInvoiceModal } from './components/Modals/ViewInvoiceModal';
import { DoctorAlertCenterDrawer } from './components/Dashboard/DoctorAlertCenterDrawer';

export default function App() {
  const [isLoggedIn, setIsLoggedInState] = useState<boolean>(checkIsLoggedIn);
  const [activeRole, setActiveRole] = useState<UserRole>(getStoredRole);
  const [loggedInUsername, setLoggedInUsername] = useState<string>('');
  const [doctor, setDoctorState] = useState<DoctorProfile>(getStoredDoctor);
  const [patients, setPatientsState] = useState<Patient[]>(getStoredPatients);

  // Production Data Protection & Offline Dual Save Hook
  const {
    isOnline,
    pendingCount,
    isSyncing,
    syncPendingRecords,
    triggerDualSave,
  } = useOfflineSync(patients);

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientInitialTab, setPatientInitialTab] = useState<'overview' | 'teethMap' | 'perio' | 'treatments' | 'prescriptions' | 'invoices' | 'timeline' | 'media'>('overview');
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isBookAppointmentOpen, setIsBookAppointmentOpen] = useState(false);
  const [appointmentDefaultDate, setAppointmentDefaultDate] = useState<string | undefined>(undefined);
  const [appointmentDefaultPatientId, setAppointmentDefaultPatientId] = useState<string | undefined>(undefined);

  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [invoiceDefaultPatientId, setInvoiceDefaultPatientId] = useState<string | undefined>(undefined);

  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [prescriptionDefaultPatientId, setPrescriptionDefaultPatientId] = useState<string | undefined>(undefined);

  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);

  // Apply saved theme and auto-restore SMS gateway credentials on initial load
  useEffect(() => {
    applyThemeToDocument(getStoredTheme());
    autoRestoreSmsSettingsIfNeeded().catch((err) =>
      console.warn('[SMS Boot Auto-Sync] Notice:', err)
    );
  }, []);

  // Sync patients changes to localStorage and IndexedDB (Dual Save)
  const updatePatients = (newPatients: Patient[]) => {
    setPatientsState(newPatients);
    savePatients(newPatients);
    triggerDualSave(newPatients);
  };

  const updateDoctor = (newDoctor: DoctorProfile) => {
    setDoctorState(newDoctor);
    saveDoctor(newDoctor);
  };

  const handleLoginSuccess = (role: UserRole, username: string) => {
    saveStoredRole(role);
    setActiveRole(role);
    setLoggedInUsername(username);
    setLoggedIn(true);
    setIsLoggedInState(true);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setIsLoggedInState(false);
  };

  const handleSwitchRole = () => {
    setLoggedIn(false);
    setIsLoggedInState(false);
  };

  const handleResetDemoData = () => {
    const { doctor: d, patients: p } = resetToDemoData();
    setDoctorState(d);
    setPatientsState(p);
    setSelectedPatientId(null);
    setActiveTab('dashboard');
  };

  // Keyboard shortcut Ctrl+K / Cmd+K for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="search"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isLoggedIn) {
    return <DoctorLogin doctor={doctor} onLoginSuccess={handleLoginSuccess} />;
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Today's appointments count for sidebar badge
  const todayStr = formatTodayISO();
  const todayAppointmentsCount = patients
    .flatMap((p) => p.appointments)
    .filter((a) => a.date === todayStr).length;

  // Patient Actions
  const handleAddPatient = (
    patientData: Omit<
      Patient,
      'id' | 'mrn' | 'createdAt' | 'teethMap' | 'treatmentPlans' | 'prescriptions' | 'invoices' | 'appointments' | 'followUps' | 'media'
    >
  ): Patient => {
    const newId = `PAT-${100 + patients.length + 1}`;
    const newMrn = `FM-2026-${100 + patients.length + 1}`;

    const blankTeethMap: Patient['teethMap'] = {};
    for (let i = 1; i <= 32; i++) {
      blankTeethMap[i] = {
        toothNumber: i,
        fdiNumber: universalToFDI(i),
        name: getToothName(i),
        condition: 'Healthy',
      };
    }

    const newPatient: Patient = {
      ...patientData,
      id: newId,
      mrn: newMrn,
      createdAt: todayStr,
      teethMap: blankTeethMap,
      treatmentPlans: [],
      prescriptions: [],
      invoices: [],
      appointments: [],
      followUps: [],
      media: [],
    };

    const updated = [newPatient, ...patients];
    updatePatients(updated);
    setSelectedPatientId(newId);
    return newPatient;
  };

  const handleUpdatePatientTeeth = (
    patientId: string,
    toothNumber: number,
    condition: ToothCondition,
    notes?: string,
    diagnoses?: string[]
  ) => {
    const updated = patients.map((p) => {
      if (p.id !== patientId) return p;
      const currentTooth = p.teethMap[toothNumber] || {
        toothNumber,
        fdiNumber: universalToFDI(toothNumber),
        name: getToothName(toothNumber),
        condition: 'Healthy',
      };
      return {
        ...p,
        teethMap: {
          ...p.teethMap,
          [toothNumber]: {
            ...currentTooth,
            condition,
            notes,
            diagnoses: diagnoses ?? currentTooth.diagnoses ?? [],
            updatedAt: todayStr,
          },
        },
      };
    });
    updatePatients(updated);
  };

  const handleAddTreatmentPlan = (
    patientId: string,
    plan: Omit<TreatmentPlanItem, 'id' | 'patientId'>
  ) => {
    const updated = patients.map((p) => {
      if (p.id !== patientId) return p;
      const treatmentPlans = p.treatmentPlans || [];

      // Prevent active duplicates for the same tooth and procedure name
      const isDuplicate = treatmentPlans.some(
        (tp) =>
          (tp.toothNumber === plan.toothNumber || (!tp.toothNumber && !plan.toothNumber)) &&
          tp.procedureName.trim().toLowerCase() === plan.procedureName.trim().toLowerCase() &&
          (tp.status === 'Planned' || tp.status === 'In-Progress')
      );

      if (isDuplicate) {
        return p;
      }

      const newPlanItem: TreatmentPlanItem = {
        ...plan,
        id: `TP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        patientId,
      };

      return {
        ...p,
        treatmentPlans: [newPlanItem, ...treatmentPlans],
      };
    });
    updatePatients(updated);
  };

  const handleUpdateTreatmentStatus = (
    patientId: string,
    planId: string,
    status: TreatmentPlanItem['status']
  ) => {
    const updated = patients.map((p) => {
      if (p.id !== patientId) return p;
      const treatmentPlans = p.treatmentPlans || [];
      return {
        ...p,
        treatmentPlans: treatmentPlans.map((t) => (t.id === planId ? { ...t, status } : t)),
      };
    });
    updatePatients(updated);
  };

  const handleUpdateTreatmentPlanCost = (
    patientId: string,
    planId: string,
    estimatedCost: number
  ) => {
    const updated = patients.map((p) => {
      if (p.id !== patientId) return p;
      const treatmentPlans = p.treatmentPlans || [];
      return {
        ...p,
        treatmentPlans: treatmentPlans.map((t) => (t.id === planId ? { ...t, estimatedCost } : t)),
      };
    });
    updatePatients(updated);
  };

  const handleDeleteTreatmentPlan = (patientId: string, planId: string) => {
    const updated = patients.map((p) => {
      if (p.id !== patientId) return p;
      const treatmentPlans = p.treatmentPlans || [];
      return {
        ...p,
        treatmentPlans: treatmentPlans.filter((t) => t.id !== planId),
      };
    });
    updatePatients(updated);
  };

  const handleUpdateVitals = (patientId: string, vitals: Vitals) => {
    const updated = patients.map((p) => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        vitals: {
          ...p.vitals,
          ...vitals,
        },
      };
    });
    updatePatients(updated);
  };

  const handleBookAppointment = (appointment: Omit<Appointment, 'id'>) => {
    const nowIso = new Date().toISOString();
    const newApt: Appointment = {
      ...appointment,
      id: `APT-${Date.now()}`,
      createdAt: appointment.createdAt || nowIso,
      updatedAt: nowIso,
      checkInTime: appointment.status === 'Arrived' ? nowIso : appointment.checkInTime,
      treatmentStartTime: (appointment.status === 'In-Chair' || appointment.status === 'In Consultation') ? nowIso : appointment.treatmentStartTime,
      completedTime: appointment.status === 'Completed' ? nowIso : appointment.completedTime,
    };
    const updated = patients.map((p) => {
      if (p.id !== appointment.patientId) return p;
      const appointments = p.appointments || [];
      return {
        ...p,
        appointments: [newApt, ...appointments],
      };
    });
    updatePatients(updated);
  };

  const handleUpdateAppointmentStatus = (
    appointmentId: string,
    status: Appointment['status']
  ) => {
    const nowIso = new Date().toISOString();
    const updated = patients.map((p) => {
      const appointments = p.appointments || [];
      const aptExists = appointments.some((a) => a.id === appointmentId);
      if (!aptExists) return p;
      return {
        ...p,
        appointments: appointments.map((a) => {
          if (a.id === appointmentId) {
            const isCheckIn = status === 'Arrived';
            const isStartingTreatment = status === 'In-Chair' || status === 'In Consultation';
            const isCompleting = status === 'Completed';

            const checkInTime = isCheckIn ? (a.checkInTime || nowIso) : a.checkInTime;
            const treatmentStartTime = isStartingTreatment ? (a.treatmentStartTime || nowIso) : a.treatmentStartTime;
            const completedTime = isCompleting ? (a.completedTime || nowIso) : a.completedTime;
            const treatmentEndTime = isCompleting ? (a.treatmentEndTime || nowIso) : a.treatmentEndTime;

            return {
              ...a,
              status,
              checkInTime,
              treatmentStartTime,
              treatmentEndTime,
              completedTime,
              updatedAt: nowIso,
            };
          }
          return a;
        }),
      };
    });
    updatePatients(updated);
  };

  const handleUpdateAppointmentChair = (
    appointmentId: string,
    chair: Appointment['chair']
  ) => {
    const updated = patients.map((p) => {
      const appointments = p.appointments || [];
      const aptExists = appointments.some((a) => a.id === appointmentId);
      if (!aptExists) return p;
      return {
        ...p,
        appointments: appointments.map((a) => (a.id === appointmentId ? { ...a, chair } : a)),
      };
    });
    updatePatients(updated);
  };

  const handleRescheduleAppointment = (
    appointmentId: string,
    newTimeSlot: string,
    newDate?: string
  ) => {
    const updated = patients.map((p) => {
      const appointments = p.appointments || [];
      const aptExists = appointments.some((a) => a.id === appointmentId);
      if (!aptExists) return p;
      return {
        ...p,
        appointments: appointments.map((a) =>
          a.id === appointmentId
            ? { ...a, timeSlot: newTimeSlot, date: newDate || a.date }
            : a
        ),
      };
    });
    updatePatients(updated);
  };

  const handleUpdateFollowUpStatus = (followUpId: string, status: FollowUpTask['status'] = 'Completed') => {
    const updated = patients.map((p) => {
      const followUps = p.followUps || [];
      const flwExists = followUps.some((f) => f.id === followUpId);
      if (!flwExists) return p;
      return {
        ...p,
        followUps: followUps.map((f) => (f.id === followUpId ? { ...f, status: status || 'Completed' } : f)),
      };
    });
    updatePatients(updated);
  };

  const handleRescheduleFollowUp = (followUpId: string, days: number = 3) => {
    const updated = patients.map((p) => {
      const followUps = p.followUps || [];
      const flwExists = followUps.some((f) => f.id === followUpId);
      if (!flwExists) return p;
      return {
        ...p,
        followUps: followUps.map((f) => {
          if (f.id !== followUpId) return f;
          const curr = new Date(f.dueDate || Date.now());
          curr.setDate(curr.getDate() + days);
          const newDueDate = curr.toISOString().split('T')[0];
          return {
            ...f,
            dueDate: newDueDate,
            status: 'Pending' as const,
          };
        }),
      };
    });
    updatePatients(updated);
  };

  const handleAddFollowUp = (
    patientId: string,
    followUp: { dueDate: string; reason: string; notes?: string }
  ) => {
    const target = patients.find((p) => p.id === patientId);
    if (!target) return;

    const newFollowUp: FollowUpTask = {
      id: `FLW-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      patientId,
      patientName: target.name,
      patientPhone: target.phone,
      dueDate: followUp.dueDate,
      reason: followUp.reason,
      status: 'Pending',
      notes: followUp.notes,
    };

    const updated = patients.map((p) => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        followUps: [newFollowUp, ...p.followUps],
      };
    });
    updatePatients(updated);
  };

  const handleCreateInvoice = (
    patientId: string,
    invoiceData: Omit<Invoice, 'id' | 'patientId' | 'patientName'>
  ) => {
    const targetPatient = patients.find((p) => p.id === patientId);
    if (!targetPatient) return;

    // Generate unique invoice ID across all patients
    const allInvoices = patients.flatMap((p) => p.invoices || []);
    const maxNum = allInvoices.reduce((max, inv) => {
      const match = inv.id.match(/INV-2026-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 110);

    const newInvoice: Invoice = {
      ...invoiceData,
      id: `INV-2026-${maxNum + 1}`,
      patientId,
      patientName: targetPatient.name,
    };

    const todayIsoStr = formatTodayISO();

    const updated = patients.map((p) => {
      if (p.id !== patientId) return p;

      // Automatically complete today's active appointments when patient is billed
      const updatedAppointments = (p.appointments || []).map((apt) => {
        if (
          apt.date === todayIsoStr &&
          (apt.status === 'In-Chair' || apt.status === 'In Consultation' || apt.status === 'Arrived' || apt.status === 'Waiting-List')
        ) {
          return { ...apt, status: 'Completed' as const };
        }
        return apt;
      });

      return {
        ...p,
        appointments: updatedAppointments,
        invoices: [newInvoice, ...(p.invoices || [])],
      };
    });

    updatePatients(updated);
    setViewingInvoice(newInvoice);
  };

  const handleSavePrescription = (
    patientId: string,
    rxData: Omit<Prescription, 'id' | 'patientId'>,
    followUpAlert?: { dueDate: string; reason: string; notes?: string }
  ) => {
    const newRx: Prescription = {
      ...rxData,
      id: `RX-${Date.now()}`,
      patientId,
    };
    const updated = patients.map((p) => {
      if (p.id !== patientId) return p;
      const newFollowUps = [...(p.followUps || [])];
      if (followUpAlert && followUpAlert.reason.trim()) {
        newFollowUps.unshift({
          id: `FLW-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          patientId,
          patientName: p.name,
          patientPhone: p.phone,
          dueDate: followUpAlert.dueDate,
          reason: followUpAlert.reason.trim(),
          status: 'Pending',
          notes: followUpAlert.notes || `Set from Rx: ${rxData.diagnosis || ''}`,
        });
      }
      return {
        ...p,
        prescriptions: [newRx, ...(p.prescriptions || [])],
        followUps: newFollowUps,
      };
    });
    updatePatients(updated);
  };

  const handleDeletePrescription = (patientId: string, rxId: string) => {
    const updated = patients.map((p) => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        prescriptions: (p.prescriptions || []).filter((rx) => rx.id !== rxId),
      };
    });
    updatePatients(updated);
  };

  return (
    <div className="min-h-screen bg-theme-page text-theme-main flex flex-col font-sans antialiased selection:bg-theme-accent selection:text-white transition-colors duration-200 overflow-x-hidden">
      {/* Top Application Header */}
      <Header
        doctor={doctor}
        patients={patients}
        activeRole={activeRole}
        username={loggedInUsername}
        searchQuery={searchQuery}
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onManualSync={syncPendingRecords}
        onSearchChange={setSearchQuery}
        onSelectPatient={(id) => {
          setSelectedPatientId(id);
          setPatientInitialTab('overview');
          setActiveTab('patients');
        }}
        onOpenAddPatient={() => setIsAddPatientOpen(true)}
        onOpenBookAppointment={(date, pid) => {
          setAppointmentDefaultDate(typeof date === 'string' ? date : undefined);
          setAppointmentDefaultPatientId(typeof pid === 'string' ? pid : undefined);
          setIsBookAppointmentOpen(true);
        }}
        onOpenCreateInvoice={(pid) => {
          setInvoiceDefaultPatientId(typeof pid === 'string' ? pid : undefined);
          setIsCreateInvoiceOpen(true);
        }}
        onOpenPrescription={(pid) => {
          setPrescriptionDefaultPatientId(typeof pid === 'string' ? pid : undefined);
          setIsPrescriptionOpen(true);
        }}
        onResetDemoData={handleResetDemoData}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
      />

      {/* Main Body Shell */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1720px] w-full mx-auto p-3 sm:p-5 lg:p-6 gap-3 sm:gap-4 lg:gap-5 min-w-0">
        <SidebarNav
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          totalPatientsCount={patients.length}
          todayAppointmentsCount={todayAppointmentsCount}
          activeRole={activeRole}
          doctor={doctor}
        />

        {/* View Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              patients={patients}
              activeRole={activeRole}
              onSelectPatient={(id, initialTab) => {
                setSelectedPatientId(id);
                setPatientInitialTab(initialTab || 'overview');
                setActiveTab('patients');
              }}
              onOpenAddPatient={() => setIsAddPatientOpen(true)}
              onOpenBookAppointment={(date, pid) => {
                setAppointmentDefaultDate(date);
                setAppointmentDefaultPatientId(pid);
                setIsBookAppointmentOpen(true);
              }}
              onOpenCreateInvoice={(pid) => {
                setInvoiceDefaultPatientId(pid);
                setIsCreateInvoiceOpen(true);
              }}
              onOpenPrescription={(pid) => {
                setPrescriptionDefaultPatientId(pid);
                setIsPrescriptionOpen(true);
              }}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onUpdateAppointmentChair={handleUpdateAppointmentChair}
              onRescheduleAppointment={handleRescheduleAppointment}
              onUpdateFollowUpStatus={handleUpdateFollowUpStatus}
              onRescheduleFollowUp={handleRescheduleFollowUp}
              onAddFollowUp={handleAddFollowUp}
            />
          )}

          {activeTab === 'patients' && (
            selectedPatient ? (
              <PatientEMRWorkspace
                patient={selectedPatient}
                doctor={doctor}
                initialTab={patientInitialTab}
                onBackToDirectory={() => setSelectedPatientId(null)}
                onUpdatePatientTeeth={handleUpdatePatientTeeth}
                onAddTreatmentPlan={handleAddTreatmentPlan}
                onUpdateTreatmentStatus={handleUpdateTreatmentStatus}
                onUpdateTreatmentPlanCost={handleUpdateTreatmentPlanCost}
                onDeleteTreatmentPlan={handleDeleteTreatmentPlan}
                onUpdateVitals={handleUpdateVitals}
                onOpenBookAppointment={(date, pid) => {
                  setAppointmentDefaultDate(date);
                  setAppointmentDefaultPatientId(pid || selectedPatient.id);
                  setIsBookAppointmentOpen(true);
                }}
                onOpenCreateInvoice={(pid) => {
                  setInvoiceDefaultPatientId(pid || selectedPatient.id);
                  setIsCreateInvoiceOpen(true);
                }}
                onOpenPrescription={(pid) => {
                  setPrescriptionDefaultPatientId(pid || selectedPatient.id);
                  setIsPrescriptionOpen(true);
                }}
                onViewInvoiceModal={(inv) => setViewingInvoice(inv)}
                onViewPrescriptionModal={(rx) => setViewingPrescription(rx)}
                onDeletePrescription={handleDeletePrescription}
                onUpdateFollowUpStatus={handleUpdateFollowUpStatus}
                onRescheduleFollowUp={handleRescheduleFollowUp}
              />
            ) : (
              <PatientDirectory
                patients={patients}
                onSelectPatient={(id) => setSelectedPatientId(id)}
                onOpenAddPatient={() => setIsAddPatientOpen(true)}
              />
            )
          )}

          {activeTab === 'appointments' && (
            <AppointmentsView
              patients={patients}
              activeRole={activeRole}
              onSelectPatient={(id) => {
                setSelectedPatientId(id);
                setActiveTab('patients');
              }}
              onOpenBookAppointment={(date, pid) => {
                setAppointmentDefaultDate(date);
                setAppointmentDefaultPatientId(pid);
                setIsBookAppointmentOpen(true);
              }}
              onOpenAddPatient={() => setIsAddPatientOpen(true)}
              onOpenCreateInvoice={(pid) => {
                setInvoiceDefaultPatientId(pid);
                setIsCreateInvoiceOpen(true);
              }}
              onOpenPrescription={(pid) => {
                setPrescriptionDefaultPatientId(pid);
                setIsPrescriptionOpen(true);
              }}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onUpdateAppointmentChair={handleUpdateAppointmentChair}
              onRescheduleAppointment={handleRescheduleAppointment}
              onUpdateFollowUpStatus={handleUpdateFollowUpStatus}
              onAddAppointment={handleBookAppointment}
            />
          )}

          {activeTab === 'billing' && (
            <BillingView
              patients={patients}
              activeRole={activeRole}
              onSelectPatient={(id) => {
                setSelectedPatientId(id);
                setActiveTab('patients');
              }}
              onOpenCreateInvoice={() => setIsCreateInvoiceOpen(true)}
              onViewInvoiceModal={(inv) => setViewingInvoice(inv)}
            />
          )}

          {activeTab === 'prescriptions' && (
            <PrescriptionsView
              patients={patients}
              doctor={doctor}
              onSelectPatient={(id) => {
                setSelectedPatientId(id);
                setActiveTab('patients');
              }}
              onOpenPrescription={() => setIsPrescriptionOpen(true)}
              onViewPrescriptionModal={(rx) => setViewingPrescription(rx)}
              onDeletePrescription={handleDeletePrescription}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              doctor={doctor}
              activeRole={activeRole}
              onSaveDoctor={updateDoctor}
              onResetDemoData={handleResetDemoData}
            />
          )}

          {activeTab === 'sms' && (
            <SmsCenterView />
          )}
        </main>
      </div>

      {/* Footer copyright */}
      <footer className="py-4 text-center text-xs font-semibold text-[#94A3B8]">
        © 2026 FABIS MediCare. All rights reserved.
      </footer>

      {/* Global Doctor Action Modals */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onAddPatient={handleAddPatient}
        existingPatients={patients}
        onSelectExistingPatient={(patientId) => {
          setSelectedPatientId(patientId);
          setActiveTab('patients');
          setIsAddPatientOpen(false);
        }}
        onPatientSaved={(newPatient) => {
          setAppointmentDefaultPatientId(newPatient.id);
          setIsBookAppointmentOpen(true);
        }}
      />

      <BookAppointmentModal
        isOpen={isBookAppointmentOpen}
        onClose={() => setIsBookAppointmentOpen(false)}
        patients={patients}
        defaultDate={appointmentDefaultDate}
        defaultPatientId={appointmentDefaultPatientId}
        onBookAppointment={handleBookAppointment}
        onOpenAddPatient={() => {
          setIsBookAppointmentOpen(false);
          setIsAddPatientOpen(true);
        }}
      />

      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        patients={patients}
        defaultPatientId={invoiceDefaultPatientId}
        onCreateInvoice={handleCreateInvoice}
      />

      <PrescriptionModal
        isOpen={isPrescriptionOpen || !!viewingPrescription}
        onClose={() => {
          setIsPrescriptionOpen(false);
          setViewingPrescription(null);
        }}
        doctor={doctor}
        patients={patients}
        defaultPatientId={prescriptionDefaultPatientId}
        initialPrescription={viewingPrescription}
        onSavePrescription={handleSavePrescription}
      />

      <ViewInvoiceModal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        doctor={doctor}
        patient={patients.find((p) => p.id === viewingInvoice?.patientId)}
        invoice={viewingInvoice}
      />

      <DoctorAlertCenterDrawer
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        patients={patients}
        onSelectPatient={(id, initialTab) => {
          setSelectedPatientId(id);
          setPatientInitialTab(initialTab || 'teethMap');
          setActiveTab('patients');
          setIsNotificationCenterOpen(false);
        }}
        onMarkCompleted={(id, status) => handleUpdateFollowUpStatus(id, status || 'Completed')}
        onReschedule={handleRescheduleFollowUp}
        onAddFollowUp={handleAddFollowUp}
        onOpenSmsSettings={() => {
          setActiveTab('sms');
          setIsNotificationCenterOpen(false);
        }}
      />
    </div>
  );
}
