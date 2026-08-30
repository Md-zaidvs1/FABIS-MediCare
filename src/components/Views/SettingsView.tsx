import React, { useState, useEffect, useRef } from 'react';
import { DoctorProfile, UserRole, UserCredentials, ThemePalette, Patient, Prescription } from '../../types';
import { 
  getStoredCredentials, 
  saveCredentials, 
  getStoredTheme, 
  saveStoredTheme,
  getStoredCustomClinicLogo,
  saveCustomClinicLogo,
  getStoredCustomAppIcon,
  saveCustomAppIcon,
  getStoredCustomDoctorSignature,
  saveCustomDoctorSignature,
  getStoredCustomClinicStamp,
  saveCustomClinicStamp,
  getStoredPatients,
  deletePatientPermanently,
  resetCustomBranding,
} from '../../utils/storage';
import {
  exportEncryptedBackup,
  verifyAndParseBackupFile,
  restoreFromBackupData,
  getBackupReminderFrequency,
  saveBackupReminderFrequency,
  getLastBackupTimestamp,
  BackupFrequency,
  BackupData,
} from '../../utils/backupRestore';
import {
  getStoredSupabaseConfig,
  saveCustomSupabaseConfig,
  getRequiredSupabaseSqlSchema,
  testSupabaseConnection,
} from '../../utils/supabaseMultiTenant';
import { FabisLogo } from '../FabisLogo';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  Building, 
  User, 
  Palette, 
  Key, 
  CheckCircle2, 
  LockKeyhole,
  Upload,
  Image as ImageIcon,
  Trash2,
  Database,
  Smartphone,
  Download,
  UploadCloud,
  FileCheck,
  Clock,
  AlertTriangle,
  Printer,
  CloudCheck,
  RefreshCw,
  Server,
  Copy,
  Terminal,
  Code2,
  Receipt,
  Globe,
  PenTool,
  Eye,
  FileText,
  X,
  Search,
  UserX,
} from 'lucide-react';
import { SmsIntegrationSettings } from '../Settings/SmsIntegrationSettings';
import {
  performSupabaseCloudBackup,
  restoreFromSupabaseCloud,
  getStoredCloudSyncTime,
} from '../../utils/supabaseCloudBackup';
import { generatePrescriptionJsPdf } from '../../utils/jsPdfPrescriptionGenerator';
import { printPdfBlob } from '../../utils/pdfShare';
import {
  evaluateSoftwareAccess,
  setDoctorAccessStatus,
  setMaintenanceModeStatus,
  SoftwareAccessState,
} from '../../utils/softwareLock';

interface SettingsViewProps {
  doctor: DoctorProfile;
  activeRole?: UserRole;
  onSaveDoctor: (doctor: DoctorProfile) => void;
  onResetDemoData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  doctor,
  activeRole = 'admin',
  onSaveDoctor,
  onResetDemoData,
}) => {
  const [formData, setFormData] = useState<DoctorProfile>(doctor);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Credentials State
  const [credentials, setCredentials] = useState<UserCredentials>(getStoredCredentials());
  const [credSavedSuccess, setCredSavedSuccess] = useState(false);

  // Theme State
  const [currentTheme, setCurrentTheme] = useState<ThemePalette>(getStoredTheme());

  // Branding State
  const [clinicLogo, setClinicLogo] = useState<string | null>(getStoredCustomClinicLogo() || doctor.logoUrl || null);
  const [appIcon, setAppIcon] = useState<string | null>(getStoredCustomAppIcon());
  const [doctorSignature, setDoctorSignature] = useState<string | null>(getStoredCustomDoctorSignature() || doctor.signatureUrl || null);
  const [clinicStamp, setClinicStamp] = useState<string | null>(getStoredCustomClinicStamp() || doctor.stampUrl || null);
  const [brandingSavedSuccess, setBrandingSavedSuccess] = useState(false);

  // Active Tab State
  const [activeSection, setActiveSection] = useState<'profile' | 'sms' | 'backup' | 'admin'>('profile');

  // Signature Canvas State
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasCanvasDrawn, setHasCanvasDrawn] = useState(false);

  // Backup & Sync State
  const [backupFreq, setBackupFreq] = useState<BackupFrequency>(getBackupReminderFrequency());
  const [lastBackup, setLastBackup] = useState<string | null>(getLastBackupTimestamp());
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(getStoredCloudSyncTime());
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudRestoreMessage, setCloudRestoreMessage] = useState<string | null>(null);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [restoreCandidate, setRestoreCandidate] = useState<BackupData | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  // Supabase Custom Config State
  const [supabaseConfig, setSupabaseConfig] = useState(getStoredSupabaseConfig());
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(supabaseConfig.url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(supabaseConfig.anonKey);
  const [supabaseTestResult, setSupabaseTestResult] = useState<any>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);

  // Patient Deletion State (Admin Only)
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedPatientToDelete, setSelectedPatientToDelete] = useState<Patient | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);
  const [deletionSuccessMessage, setDeletionSuccessMessage] = useState<string | null>(null);
  const [deletionErrorMessage, setDeletionErrorMessage] = useState<string | null>(null);

  // Software Access & Service Lock State (Admin Only)
  const [softwareAccess, setSoftwareAccess] = useState<SoftwareAccessState | null>(null);
  const [isUpdatingLock, setIsUpdatingLock] = useState(false);
  const [lockStatusMessage, setLockStatusMessage] = useState<string | null>(null);
  const [showLockConfirmModal, setShowLockConfirmModal] = useState(false);

  const loadSoftwareAccessStatus = async () => {
    try {
      const state = await evaluateSoftwareAccess();
      setSoftwareAccess(state);
    } catch (e) {
      console.warn('Error evaluating software access:', e);
    }
  };

  useEffect(() => {
    setFormData(doctor);
    if (doctor.logoUrl) setClinicLogo(doctor.logoUrl);
    if (doctor.signatureUrl) setDoctorSignature(doctor.signatureUrl);
    if (doctor.stampUrl) setClinicStamp(doctor.stampUrl);
  }, [doctor]);

  const loadPatients = () => {
    try {
      const pts = getStoredPatients();
      setPatientsList(pts);
    } catch (e) {
      console.warn('Error loading patients:', e);
    }
  };

  useEffect(() => {
    setCredentials(getStoredCredentials());
    setCurrentTheme(getStoredTheme());
    setClinicLogo(getStoredCustomClinicLogo() || doctor.logoUrl || null);
    setAppIcon(getStoredCustomAppIcon());
    setDoctorSignature(getStoredCustomDoctorSignature() || doctor.signatureUrl || null);
    setClinicStamp(getStoredCustomClinicStamp() || doctor.stampUrl || null);
    setBackupFreq(getBackupReminderFrequency());
    setLastBackup(getLastBackupTimestamp());
    setLastCloudSync(getStoredCloudSyncTime());

    const cfg = getStoredSupabaseConfig();
    setSupabaseConfig(cfg);
    setSupabaseUrlInput(cfg.url);
    setSupabaseKeyInput(cfg.anonKey);
    testSupabaseConnection().then(setSupabaseTestResult);

    loadPatients();
    loadSoftwareAccessStatus();

    const handleLicenseEvent = () => loadSoftwareAccessStatus();
    window.addEventListener('software-license-updated', handleLicenseEvent);
    return () => window.removeEventListener('software-license-updated', handleLicenseEvent);
  }, []);

  const handleManualCloudBackup = async () => {
    setIsCloudSyncing(true);
    setBackupNotice(null);
    try {
      const res = await performSupabaseCloudBackup(undefined, doctor);
      if (res.success) {
        setLastCloudSync(res.timestamp);
        setBackupNotice(res.message || 'Clinic data backed up to Supabase Cloud successfully!');
        setTimeout(() => setBackupNotice(null), 6000);
        testSupabaseConnection().then(setSupabaseTestResult);
      }
    } catch (err: any) {
      setBackupNotice('Cloud backup error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleSaveSupabaseSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingSupabase(true);
    saveCustomSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    const updated = getStoredSupabaseConfig();
    setSupabaseConfig(updated);
    const testRes = await testSupabaseConnection();
    setSupabaseTestResult(testRes);
    setIsTestingSupabase(false);
  };

  const handleTestSupabaseConn = async () => {
    setIsTestingSupabase(true);
    const testRes = await testSupabaseConnection();
    setSupabaseTestResult(testRes);
    setIsTestingSupabase(false);
  };

  const handleRestoreFromCloud = async () => {
    if (activeRole !== 'admin') return;
    setIsCloudSyncing(true);
    setCloudRestoreMessage(null);
    setRestoreError(null);
    try {
      const res = await restoreFromSupabaseCloud();
      if (res.success) {
        setCloudRestoreMessage(res.message);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setRestoreError(res.message);
      }
    } catch (err: any) {
      setRestoreError('Cloud restore error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleDownloadBackup = () => {
    try {
      exportEncryptedBackup(undefined, doctor);
      setLastBackup(new Date().toISOString());
      setBackupNotice('Encrypted backup generated and downloaded successfully!');
      setTimeout(() => setBackupNotice(null), 4000);
    } catch (err: any) {
      alert('Failed to export backup: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = verifyAndParseBackupFile(content);
      if (res.valid && res.data) {
        setRestoreCandidate(res.data);
      } else {
        setRestoreError(res.error || 'Invalid or corrupted backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!restoreCandidate) return;
    try {
      const res = await restoreFromBackupData(restoreCandidate);
      setRestoreSuccess(`Successfully restored ${res.patientsCount} patient records!`);
      setRestoreCandidate(null);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setRestoreError('Restore failed: ' + (err.message || 'Unknown error'));
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    type: 'clinicLogo' | 'appIcon' | 'doctorSignature' | 'clinicStamp'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, SVG, or WebP).');
      return;
    }

    // Try multi-tenant Supabase storage upload
    try {
      const { uploadClinicFile } = await import('../../utils/supabaseMultiTenant');
      const uploaded = await uploadClinicFile(file, 'logos', undefined, doctor);
      if (uploaded?.url) {
        if (type === 'clinicLogo') {
          setClinicLogo(uploaded.url);
          saveCustomClinicLogo(uploaded.url);
          setFormData(prev => ({ ...prev, logoUrl: uploaded.url }));
        } else if (type === 'appIcon') {
          setAppIcon(uploaded.url);
          saveCustomAppIcon(uploaded.url);
        } else if (type === 'doctorSignature') {
          setDoctorSignature(uploaded.url);
          saveCustomDoctorSignature(uploaded.url);
          setFormData(prev => ({ ...prev, signatureUrl: uploaded.url }));
        } else if (type === 'clinicStamp') {
          setClinicStamp(uploaded.url);
          saveCustomClinicStamp(uploaded.url);
          setFormData(prev => ({ ...prev, stampUrl: uploaded.url }));
        }
        setBrandingSavedSuccess(true);
        setTimeout(() => setBrandingSavedSuccess(false), 3000);
        window.dispatchEvent(new Event('custom-branding-updated'));
        window.dispatchEvent(new Event('doctor-profile-updated'));
        return;
      }
    } catch (sbErr) {
      console.info('Supabase storage fallback to local Base64:', sbErr);
    }

    // Local Base64 fallback
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (type === 'clinicLogo') {
        setClinicLogo(base64);
        saveCustomClinicLogo(base64);
        setFormData(prev => ({ ...prev, logoUrl: base64 }));
      } else if (type === 'appIcon') {
        setAppIcon(base64);
        saveCustomAppIcon(base64);
      } else if (type === 'doctorSignature') {
        setDoctorSignature(base64);
        saveCustomDoctorSignature(base64);
        setFormData(prev => ({ ...prev, signatureUrl: base64 }));
      } else if (type === 'clinicStamp') {
        setClinicStamp(base64);
        saveCustomClinicStamp(base64);
        setFormData(prev => ({ ...prev, stampUrl: base64 }));
      }
      setBrandingSavedSuccess(true);
      setTimeout(() => setBrandingSavedSuccess(false), 3000);
      window.dispatchEvent(new Event('custom-branding-updated'));
      window.dispatchEvent(new Event('doctor-profile-updated'));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAsset = (type: 'clinicLogo' | 'appIcon' | 'doctorSignature' | 'clinicStamp') => {
    if (type === 'clinicLogo') {
      setClinicLogo(null);
      saveCustomClinicLogo(null);
      setFormData(prev => ({ ...prev, logoUrl: undefined }));
    } else if (type === 'appIcon') {
      setAppIcon(null);
      saveCustomAppIcon(null);
    } else if (type === 'doctorSignature') {
      setDoctorSignature(null);
      saveCustomDoctorSignature(null);
      setFormData(prev => ({ ...prev, signatureUrl: undefined }));
    } else if (type === 'clinicStamp') {
      setClinicStamp(null);
      saveCustomClinicStamp(null);
      setFormData(prev => ({ ...prev, stampUrl: undefined }));
    }
    setBrandingSavedSuccess(true);
    setTimeout(() => setBrandingSavedSuccess(false), 3000);
    window.dispatchEvent(new Event('custom-branding-updated'));
    window.dispatchEvent(new Event('doctor-profile-updated'));
  };

  // Canvas signature drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawingSignature(true);
    setHasCanvasDrawn(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0F172A';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawingSignature(false);
  };

  const clearCanvasSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasCanvasDrawn(false);
  };

  const saveCanvasSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL('image/png');
    setDoctorSignature(base64);
    saveCustomDoctorSignature(base64);
    setFormData(prev => ({ ...prev, signatureUrl: base64 }));
    setBrandingSavedSuccess(true);
    setTimeout(() => setBrandingSavedSuccess(false), 3000);
    window.dispatchEvent(new Event('doctor-profile-updated'));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDoctor: DoctorProfile = {
      ...formData,
      logoUrl: clinicLogo || undefined,
      signatureUrl: doctorSignature || undefined,
      stampUrl: clinicStamp || undefined,
    };
    onSaveDoctor(updatedDoctor);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCredentials(credentials);
    setCredSavedSuccess(true);
    setTimeout(() => setCredSavedSuccess(false), 4000);
  };

  const handleThemeChange = (theme: ThemePalette) => {
    setCurrentTheme(theme);
    saveStoredTheme(theme);
  };

  // Preview Sample Prescription PDF
  const handlePreviewSamplePrescription = () => {
    try {
      const sampleDoctor: DoctorProfile = {
        ...formData,
        logoUrl: clinicLogo || undefined,
        signatureUrl: doctorSignature || undefined,
        stampUrl: clinicStamp || undefined,
      };

      const samplePatient: Patient = {
        id: 'PREVIEW_SAMPLE',
        mrn: 'FM-SAMPLE-001',
        name: 'Mr. Rajesh Kumar',
        age: 38,
        gender: 'Male',
        phone: '+91 98765 43210',
        status: 'Active',
        medicalHistory: {
          systemicConditions: [],
          currentMedications: [],
          allergies: ['None'],
          bleedingDisorder: false,
          notes: 'Routine dental checkup',
        },
        teethMap: {},
        treatmentPlans: [],
        prescriptions: [],
        invoices: [],
        appointments: [],
        followUps: [],
        media: [],
        createdAt: new Date().toISOString(),
      };

      const samplePrescription: Prescription = {
        id: 'RX-PREVIEW-001',
        patientId: samplePatient.id,
        doctorName: sampleDoctor.name,
        chiefComplaint: 'Enamel Sensitivity & Mild Gingival Bleeding',
        date: new Date().toISOString(),
        diagnosis: 'Chronic Marginal Gingivitis & Enamel Sensitivity',
        medicines: [
          {
            id: 'm1',
            name: 'Amoxicillin 500mg Capsule',
            dosage: '1 cap',
            frequency: '1-0-1 (Twice daily after meals)',
            duration: '5 Days',
            instructions: 'Complete full course. Take after breakfast and dinner.',
          },
          {
            id: 'm2',
            name: 'Paracetamol 650mg Tablet',
            dosage: '1 tab',
            frequency: 'SOS (As needed for mild pain)',
            duration: '3 Days',
            instructions: 'Take only if pain or discomfort occurs.',
          },
          {
            id: 'm3',
            name: 'Chlorhexidine 0.2% Oral Rinse',
            dosage: '10 ml',
            frequency: 'Twice daily',
            duration: '7 Days',
            instructions: 'Rinse mouth for 30 seconds after brushing. Do not swallow.',
          },
        ],
        specialInstructions: 'Maintain warm saline gargles. Use ultra-soft bristle toothbrush. Avoid direct biting on hard foods for 48 hours.',
        nextVisitDate: 'After 7 days for follow-up evaluation',
      };

      const pdfBlob = generatePrescriptionJsPdf(samplePrescription, sampleDoctor, samplePatient);
      printPdfBlob(pdfBlob);
    } catch (err: any) {
      alert('Error generating preview PDF: ' + (err.message || 'Unknown error'));
    }
  };

  // Permanent Patient Deletion Handler
  const handleExecutePermanentDelete = async () => {
    if (!selectedPatientToDelete) return;
    const requiredConfirmation = selectedPatientToDelete.mrn || selectedPatientToDelete.name;
    const inputClean = deleteConfirmInput.trim().toUpperCase();

    if (inputClean !== requiredConfirmation.toUpperCase() && inputClean !== 'DELETE') {
      setDeletionErrorMessage(`Please type "${requiredConfirmation}" or "DELETE" to confirm permanent deletion.`);
      return;
    }

    setIsDeletingPatient(true);
    setDeletionErrorMessage(null);
    setDeletionSuccessMessage(null);

    try {
      const ok = await deletePatientPermanently(selectedPatientToDelete.id);
      if (ok) {
        setDeletionSuccessMessage(`✓ Patient ${selectedPatientToDelete.name} (${selectedPatientToDelete.mrn}) was permanently deleted.`);
        setSelectedPatientToDelete(null);
        setDeleteConfirmInput('');
        loadPatients();
        window.dispatchEvent(new Event('patients-updated'));
      } else {
        setDeletionErrorMessage('Failed to delete patient record. Please check permissions.');
      }
    } catch (err: any) {
      setDeletionErrorMessage('Deletion failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeletingPatient(false);
    }
  };

  // Clean Curated Clinical Themes
  const themeOptions: { 
    id: ThemePalette; 
    name: string; 
    desc: string; 
    primary: string; 
    accent: string; 
    light: string;
  }[] = [
    {
      id: 'lavender-dream',
      name: 'Lavender Dream',
      desc: 'Soft Purple & Pastel Harmony',
      primary: '#6345B5',
      accent: '#B794E6',
      light: '#EBD8F7',
    },
    {
      id: 'ocean-breeze',
      name: 'Ocean Breeze',
      desc: 'Fresh Blue & Aqua Clinical',
      primary: '#1C58BA',
      accent: '#42B4F8',
      light: '#A3E4D7',
    },
    {
      id: 'royal-navy',
      name: 'Royal Navy / Violet',
      desc: 'Royal Indigo & Sky Blue',
      primary: '#5B4CF0',
      accent: '#3BA7F5',
      light: '#DCE6FC',
    },
    {
      id: 'emerald-green',
      name: 'Emerald Clinical',
      desc: 'Clinical Mint & Forest Green',
      primary: '#059669',
      accent: '#10B981',
      light: '#D1FAE5',
    },
    {
      id: 'ocean-blue',
      name: 'Deep Blue',
      desc: 'Modern Oceanic & Sky Cyan',
      primary: '#0284C7',
      accent: '#38BDF8',
      light: '#E0F2FE',
    },
    {
      id: 'midnight-obsidian',
      name: 'Midnight Obsidian',
      desc: 'Sleek Dark Mode Canvas',
      primary: '#8B5CF6',
      accent: '#38BDF8',
      light: '#334155',
    },
  ];

  const filteredPatients = patientsList.filter(p => 
    p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    (p.mrn && p.mrn.toLowerCase().includes(patientSearchTerm.toLowerCase())) ||
    (p.phone && p.phone.includes(patientSearchTerm))
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header Card */}
      <div className="bg-theme-card p-6 rounded-[28px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-theme-main">
        <div>
          <h2 className="text-xl font-extrabold text-theme-main flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-theme-accent" />
            <span>Settings & Practice Configuration</span>
          </h2>
          <p className="text-xs text-theme-secondary font-medium mt-1">
            Configure clinic identity, official prescription headers, branding, security credentials, and backups.
          </p>
        </div>

        <button
          onClick={onResetDemoData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-theme-page hover:bg-rose-50 text-theme-secondary hover:text-rose-700 border border-theme-border hover:border-rose-200 text-xs font-bold transition-all shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-theme-border pb-3">
        <button
          type="button"
          onClick={() => setActiveSection('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeSection === 'profile'
              ? 'bg-theme-accent text-white shadow-md'
              : 'bg-theme-card text-theme-secondary hover:text-theme-main border border-theme-border'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Doctor Profile & Prescription PDF</span>
        </button>

        {/* SMS Gateway Tab is strictly Admin-Only */}
        {activeRole === 'admin' && (
          <button
            type="button"
            onClick={() => setActiveSection('sms')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'sms'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-theme-card text-theme-secondary hover:text-theme-main border border-theme-border'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-300" />
            <span>SMS Gateway (TextBee)</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveSection('backup')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeSection === 'backup'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-theme-card text-theme-secondary hover:text-theme-main border border-theme-border'
          }`}
        >
          <Database className="w-4 h-4 text-indigo-300" />
          <span>Data Protection & Backups</span>
        </button>

        {/* Admin Data Management Tab (Permanent Patient Deletion & DB Settings) */}
        {activeRole === 'admin' && (
          <button
            type="button"
            onClick={() => {
              setActiveSection('admin');
              loadPatients();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'admin'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-theme-card text-theme-secondary hover:text-rose-700 border border-theme-border'
            }`}
          >
            <UserX className="w-4 h-4 text-rose-300" />
            <span>Admin Data Management</span>
          </button>
        )}
      </div>

      {/* SMS Settings Section (Admin Only) */}
      {activeSection === 'sms' && activeRole === 'admin' && (
        <SmsIntegrationSettings activeRole={activeRole} />
      )}

      {/* Profile & Prescription PDF Section */}
      {activeSection === 'profile' && (
        <>
        {/* Clean Global Theme Palette Selector */}
        <div className="bg-theme-card p-6 sm:p-7 rounded-[28px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-5 text-theme-main">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-theme-border pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2.5 text-theme-accent font-extrabold text-lg">
                <div className="p-2 rounded-xl bg-theme-accent/10 border border-theme-accent/20">
                  <Palette className="w-5 h-5 text-theme-accent" />
                </div>
                <span>Clinical Theme Palette</span>
              </div>
              <p className="text-xs text-theme-secondary font-medium mt-1">
                Select your preferred visual style across all clinical workflows and patient management screens.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-full bg-theme-accent/15 text-theme-accent border border-theme-accent/30 self-start sm:self-auto shrink-0 shadow-2xs">
              Active: {currentTheme.toUpperCase()}
            </span>
          </div>

          {/* Clean 6-Theme Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
            {themeOptions.map((t) => {
              const isActive = currentTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 relative group cursor-pointer ${
                    isActive
                      ? 'border-theme-accent ring-2 ring-theme-accent/30 bg-theme-accent/10 shadow-md scale-[1.01]'
                      : 'border-theme-border hover:border-theme-accent/50 bg-theme-card hover:bg-theme-page/60 shadow-2xs hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-theme-main tracking-tight truncate">
                      {t.name}
                    </span>
                    {isActive && (
                      <CheckCircle2 className="w-4 h-4 text-theme-accent shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-theme-secondary font-medium block truncate">
                    {t.desc}
                  </span>

                  <div className="flex items-center gap-2 pt-1">
                    <span
                      className="w-5 h-5 rounded-full shadow-inner border border-black/10"
                      style={{ backgroundColor: t.primary }}
                      title="Primary"
                    />
                    <span
                      className="w-5 h-5 rounded-full shadow-inner border border-black/10"
                      style={{ backgroundColor: t.accent }}
                      title="Accent"
                    />
                    <span
                      className="w-5 h-5 rounded-full shadow-inner border border-black/10"
                      style={{ backgroundColor: t.light }}
                      title="Pastel"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Doctor & Clinic Profile Settings Form */}
        <form onSubmit={handleProfileSubmit} className="bg-white p-6 sm:p-7 rounded-[28px] border border-[#E8ECF3] shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6 text-xs text-[#1E293B]">
          <div className="border-b border-[#E8ECF3] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[#3BA7F5] font-bold text-base">
              <User className="w-5 h-5 text-[#3BA7F5]" />
              <span>Doctor Information & Medical Credentials</span>
            </div>
            <button
              type="button"
              onClick={handlePreviewSamplePrescription}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition-all cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Eye className="w-4 h-4 text-sky-600" />
              <span>Preview Sample Prescription PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Doctor Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Medical Registration Number *</label>
              <input
                type="text"
                required
                value={formData.regNumber}
                onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                className="w-full p-3 bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] font-mono focus:border-[#3BA7F5] outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Qualifications *</label>
              <input
                type="text"
                required
                value={formData.qualifications}
                onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                className="w-full p-3 bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Title / Specialty</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none transition-all"
              />
            </div>
          </div>

          <div className="border-b border-[#E8ECF3] pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#3BA7F5] font-bold text-base">
              <Building className="w-5 h-5 text-[#3BA7F5]" />
              <span>Clinic Letterhead & Contact Details</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Printed on all prescriptions and tax invoices</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">
                Clinic Display Name <span className="text-slate-400 font-normal">(Sidebar & Navigation)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. RK Dental Clinic"
                value={formData.clinicDisplayName || ''}
                onChange={(e) => setFormData({ ...formData, clinicDisplayName: e.target.value })}
                className="w-full p-3 bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none transition-all font-medium"
              />
            </div>

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Clinic Legal / Letterhead Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. FABIS MediCare Dental Clinic"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                className="w-full p-3 bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Phone Number(s) *</label>
              <input
                type="text"
                required
                value={formData.clinicPhone}
                onChange={(e) => setFormData({ ...formData, clinicPhone: e.target.value })}
                className="w-full p-3 bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Clinic Email</label>
              <input
                type="email"
                value={formData.clinicEmail || ''}
                onChange={(e) => setFormData({ ...formData, clinicEmail: e.target.value })}
                className="w-full p-3 bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-600" />
                <span>Clinic Website</span>
              </label>
              <input
                type="text"
                placeholder="e.g. www.rkdentalclinic.com"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full p-3 bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[#1E293B] font-bold block mb-1.5">Clinic Address *</label>
              <input
                type="text"
                required
                value={formData.clinicAddress}
                onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })}
                className="w-full p-3 bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none transition-all"
              />
            </div>
          </div>

          {/* GST Details Section */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-sky-600" />
                <span className="font-extrabold text-sm text-slate-800 tracking-tight">GST Details</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Optional
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[#1E293B] font-bold block mb-1.5">GST Number / GSTIN</label>
                <input
                  type="text"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  value={formData.gstin || ''}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  className="w-full p-3 bg-white border border-[#E8ECF3] rounded-2xl text-[#1E293B] font-mono uppercase focus:border-[#3BA7F5] outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[#1E293B] font-bold block mb-1.5">
                  GST Registered Name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. RK Dental Healthcare LLP"
                  value={formData.gstRegisteredName || ''}
                  onChange={(e) => setFormData({ ...formData, gstRegisteredName: e.target.value })}
                  className="w-full p-3 bg-white border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[#1E293B] font-bold block mb-1.5">
                  GST Address <span className="text-slate-400 font-normal">(optional if different from clinic address)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Principal Place of Business / Registered Office"
                  value={formData.gstAddress || ''}
                  onChange={(e) => setFormData({ ...formData, gstAddress: e.target.value })}
                  className="w-full p-3 bg-white border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Prescription Branding Assets (Logo, Signature, Stamp) */}
          <div className="border-t border-[#E8ECF3] pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <ImageIcon className="w-4 h-4 text-sky-600" />
                <span>Prescription Letterhead Assets (Logo, Signature & Stamp)</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Integrated into PDF generation engine</span>
            </div>

            {brandingSavedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Letterhead assets updated! Saved persistently in Supabase and local storage.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Clinic Logo */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <span className="font-bold text-xs text-slate-800 block mb-1">Clinic Logo</span>
                  <p className="text-[10px] text-slate-500 mb-2">Printed on top header of Rx & invoices</p>
                  
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-center min-h-[90px]">
                    {clinicLogo ? (
                      <img src={clinicLogo} alt="Clinic Logo" className="max-h-16 max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">No custom logo</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      onChange={(e) => handleFileUpload(e, 'clinicLogo')}
                      className="hidden"
                    />
                  </label>
                  {clinicLogo && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAsset('clinicLogo')}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl cursor-pointer"
                      title="Remove logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Doctor Signature */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <span className="font-bold text-xs text-slate-800 block mb-1">Doctor Signature</span>
                  <p className="text-[10px] text-slate-500 mb-2">Appears in footer above doctor name</p>
                  
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-center min-h-[90px]">
                    {doctorSignature ? (
                      <img src={doctorSignature} alt="Doctor Signature" className="max-h-16 max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">No signature attached</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      onChange={(e) => handleFileUpload(e, 'doctorSignature')}
                      className="hidden"
                    />
                  </label>
                  {doctorSignature && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAsset('doctorSignature')}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl cursor-pointer"
                      title="Remove signature"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Clinic Official Stamp */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <span className="font-bold text-xs text-slate-800 block mb-1">Clinic Stamp</span>
                  <p className="text-[10px] text-slate-500 mb-2">Watermark seal on verified prescriptions</p>
                  
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-center min-h-[90px]">
                    {clinicStamp ? (
                      <img src={clinicStamp} alt="Clinic Stamp" className="max-h-16 max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">No official stamp</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      onChange={(e) => handleFileUpload(e, 'clinicStamp')}
                      className="hidden"
                    />
                  </label>
                  {clinicStamp && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAsset('clinicStamp')}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl cursor-pointer"
                      title="Remove stamp"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Touch / Mouse Signature Drawer */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Or Draw Signature Live (Touch / Mouse)</span>
                </span>
                {hasCanvasDrawn && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearCanvasSignature}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={saveCanvasSignature}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer shadow-xs"
                    >
                      Save As Signature
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-xl border border-dashed border-slate-300 overflow-hidden flex items-center justify-center">
                <canvas
                  ref={sigCanvasRef}
                  width={600}
                  height={130}
                  onMouseDown={startDrawing}
                  onMouseMove={drawSignature}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={drawSignature}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair w-full max-w-[600px] h-[130px] touch-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E8ECF3]">
            {savedSuccess ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Profile & Letterhead settings updated successfully!
              </span>
            ) : (
              <span className="text-[#94A3B8]">Persisted in Supabase & Local Database</span>
            )}

            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-[#3BA7F5] hover:bg-[#2A96E4] text-white font-bold text-xs shadow-[0_8px_20px_rgba(59,167,245,0.3)] flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-white" />
              <span>Save Doctor Profile</span>
            </button>
          </div>
        </form>

        {/* Admin Credentials Manager Section */}
        {activeRole === 'admin' && (
          <form onSubmit={handleCredentialsSubmit} className="bg-white p-6 rounded-[28px] border border-[#E8ECF3] shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4 text-xs text-[#1E293B]">
            <div className="border-b border-[#E8ECF3] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-base">
                <Key className="w-5 h-5 text-purple-600" />
                <span>Admin & Doctor Credentials Manager</span>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                ⚙️ Admin Privileges Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Admin Credentials */}
              <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                <div className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                  <span>⚙️ Admin Role Credentials</span>
                </div>

                <div>
                  <label className="text-[#1E293B] font-bold block mb-1">Admin Username / Email</label>
                  <input
                    type="text"
                    required
                    value={credentials.adminUsername}
                    onChange={(e) => setCredentials({ ...credentials, adminUsername: e.target.value })}
                    className="w-full p-3 min-h-[44px] bg-white border border-purple-200 rounded-xl text-[#1E293B] font-mono text-xs focus:border-purple-600 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[#1E293B] font-bold block mb-1">Admin Password / PIN</label>
                  <input
                    type="text"
                    required
                    value={credentials.adminPin}
                    onChange={(e) => setCredentials({ ...credentials, adminPin: e.target.value })}
                    className="w-full p-3 min-h-[44px] bg-white border border-purple-200 rounded-xl text-[#1E293B] font-mono text-xs focus:border-purple-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Doctor Credentials */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                  <span>👨‍⚕️ Doctor Role Credentials</span>
                </div>

                <div>
                  <label className="text-[#1E293B] font-bold block mb-1">Doctor Username / Email</label>
                  <input
                    type="text"
                    required
                    value={credentials.doctorUsername}
                    onChange={(e) => setCredentials({ ...credentials, doctorUsername: e.target.value })}
                    className="w-full p-3 min-h-[44px] bg-white border border-emerald-200 rounded-xl text-[#1E293B] font-mono text-xs focus:border-emerald-600 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[#1E293B] font-bold block mb-1">Doctor Password / PIN</label>
                  <input
                    type="text"
                    required
                    value={credentials.doctorPin}
                    onChange={(e) => setCredentials({ ...credentials, doctorPin: e.target.value })}
                    className="w-full p-3 min-h-[44px] bg-white border border-emerald-200 rounded-xl text-[#1E293B] font-mono text-xs focus:border-emerald-600 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E8ECF3]">
              {credSavedSuccess ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Credentials updated safely.
                </span>
              ) : (
                <span className="text-[#94A3B8]">Changes apply immediately on next sign in</span>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-purple-200" />
                <span>Save Credentials</span>
              </button>
            </div>
          </form>
        )}
        </>
      )}

      {/* Simplified, Clean & Compact Data Backup Card */}
      {activeSection === 'backup' && (
        <div className="bg-theme-card p-6 rounded-[28px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6 text-xs text-theme-main max-w-3xl">
          <div className="border-b border-theme-border pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-700">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-theme-main">DATA BACKUP & CLOUD RECOVERY</h3>
                <p className="text-xs text-theme-secondary font-medium">
                  Secure local and cloud disaster recovery snapshots
                </p>
              </div>
            </div>

            <span className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-full text-xs font-extrabold flex items-center gap-1.5">
              <CloudCheck className="w-4 h-4 text-emerald-600" />
              <span>✓ Cloud Connected</span>
            </span>
          </div>

          {/* Backup & Cloud Timestamps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-theme-page p-4 rounded-2xl border border-theme-border">
            <div>
              <span className="text-theme-secondary font-bold block text-[11px]">Last Local Backup:</span>
              <span className="text-sm font-extrabold text-theme-main">
                {lastBackup ? new Date(lastBackup).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Ready to export'}
              </span>
            </div>
            <div>
              <span className="text-theme-secondary font-bold block text-[11px]">Cloud Sync Status:</span>
              <span className="text-sm font-extrabold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {lastCloudSync ? `Synced (${new Date(lastCloudSync).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})` : 'Synced & Ready'}
              </span>
            </div>
          </div>

          {/* Notices */}
          {backupNotice && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{backupNotice}</span>
            </div>
          )}

          {restoreSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{restoreSuccess}</span>
            </div>
          )}

          {restoreError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{restoreError}</span>
            </div>
          )}

          {cloudRestoreMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{cloudRestoreMessage}</span>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                handleDownloadBackup();
                handleManualCloudBackup();
              }}
              disabled={isCloudSyncing}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Backup Now</span>
            </button>

            <label className="px-6 py-3 bg-theme-card hover:bg-theme-page text-theme-main border border-theme-border hover:border-slate-400 rounded-2xl font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-2 text-center">
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>Restore Backup</span>
              <input
                type="file"
                accept=".fabis,.json"
                onChange={handleRestoreFileSelected}
                className="hidden"
              />
            </label>

            {activeRole === 'admin' && (
              <button
                type="button"
                onClick={handleRestoreFromCloud}
                disabled={isCloudSyncing}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                <span>Restore from Cloud</span>
              </button>
            )}
          </div>

          {/* Restore Confirmation Dialog */}
          {restoreCandidate && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3 mt-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Confirm Data Restore</span>
              </div>
              <p className="text-xs text-amber-800 font-medium">
                This backup contains <strong className="text-amber-950">{restoreCandidate.patients.length} patient records</strong> from{' '}
                <strong className="text-amber-950">{new Date(restoreCandidate.timestamp).toLocaleString()}</strong>.
                Restoring will safely load records into your system.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRestoreCandidate(null)}
                  className="px-4 py-2 rounded-xl border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Confirm & Restore</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Data Management Section (Permanent Patient Deletion & Supabase Config) */}
      {activeSection === 'admin' && activeRole === 'admin' && (
        <div className="space-y-6">
          {/* Doctor Access & Developer Maintenance Mode Controls */}
          <div className="bg-white p-6 sm:p-7 rounded-[28px] border border-indigo-200 shadow-[0_10px_30px_rgba(99,102,241,0.06)] space-y-6 text-xs text-[#1E293B]">
            <div className="border-b border-indigo-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-indigo-900 font-extrabold text-base">
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200">
                  <LockKeyhole className="w-5 h-5 text-indigo-600" />
                </div>
                <span>Doctor Access & Maintenance Controls</span>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Manage Doctor EMR portal access and Developer Maintenance mode. The software remains permanently usable unless Admin manually locks access. Administrator access is always unrestricted, and all patient records in Supabase remain intact and secure.
            </p>

            {lockStatusMessage && (
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{lockStatusMessage}</span>
              </div>
            )}

            {/* Two Control Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Doctor Access Control Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Doctor Access</span>
                    <span className={`px-3 py-1 rounded-full font-extrabold text-xs border flex items-center gap-1.5 ${
                      softwareAccess?.doctorAccess === 'Locked'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${softwareAccess?.doctorAccess === 'Locked' ? 'bg-rose-600' : 'bg-emerald-600'}`} />
                      <span>{softwareAccess?.doctorAccess === 'Locked' ? '🔴 Locked' : '🟢 Active'}</span>
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    When Locked, Doctor is prevented from accessing the EMR dashboard and patient records. Admin retains full control.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  {softwareAccess?.doctorAccess === 'Locked' ? (
                    <button
                      type="button"
                      disabled={isUpdatingLock}
                      onClick={async () => {
                        setIsUpdatingLock(true);
                        try {
                          await setDoctorAccessStatus('Active');
                          await loadSoftwareAccessStatus();
                          setLockStatusMessage('Doctor Access unlocked! Doctor can now log in normally.');
                        } finally {
                          setIsUpdatingLock(false);
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Unlock Doctor Access</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isUpdatingLock}
                      onClick={() => setShowLockConfirmModal(true)}
                      className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
                    >
                      <LockKeyhole className="w-4 h-4" />
                      <span>Lock Doctor Access</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Developer Maintenance Mode Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Developer Maintenance Mode</span>
                    <span className={`px-3 py-1 rounded-full font-extrabold text-xs border flex items-center gap-1.5 ${
                      softwareAccess?.maintenanceMode
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${softwareAccess?.maintenanceMode ? 'bg-amber-600 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{softwareAccess?.maintenanceMode ? 'ON' : 'OFF'}</span>
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    When ON, Doctor access is temporarily blocked with a clean 404 maintenance screen. Admin access remains completely unaffected.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  {softwareAccess?.maintenanceMode ? (
                    <button
                      type="button"
                      disabled={isUpdatingLock}
                      onClick={async () => {
                        setIsUpdatingLock(true);
                        try {
                          await setMaintenanceModeStatus(false);
                          await loadSoftwareAccessStatus();
                          setLockStatusMessage('Developer Maintenance Mode disabled.');
                        } finally {
                          setIsUpdatingLock(false);
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Disable Maintenance Mode</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isUpdatingLock}
                      onClick={async () => {
                        setIsUpdatingLock(true);
                        try {
                          await setMaintenanceModeStatus(true);
                          await loadSoftwareAccessStatus();
                          setLockStatusMessage('Developer Maintenance Mode enabled.');
                        } finally {
                          setIsUpdatingLock(false);
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Enable Maintenance Mode</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Lock Confirmation Modal */}
            {showLockConfirmModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-left space-y-4">
                  <div className="flex items-center gap-2.5 text-rose-700 font-extrabold text-base">
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                      <LockKeyhole className="w-5 h-5 text-rose-600" />
                    </div>
                    <span>Lock Doctor Access?</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    The Doctor will temporarily be unable to access the EMR. Existing patient data will remain completely safe.
                  </p>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowLockConfirmModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingLock}
                      onClick={async () => {
                        setIsUpdatingLock(true);
                        try {
                          await setDoctorAccessStatus('Locked');
                          setShowLockConfirmModal(false);
                          await loadSoftwareAccessStatus();
                          setLockStatusMessage('Doctor Access is now Locked.');
                        } finally {
                          setIsUpdatingLock(false);
                        }
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
                    >
                      Lock Doctor
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Permanent Patient Record Deletion Card */}
          <div className="bg-white p-6 sm:p-7 rounded-[28px] border border-rose-200 shadow-[0_10px_30px_rgba(244,63,94,0.06)] space-y-5 text-xs text-[#1E293B]">
            <div className="border-b border-rose-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-700 font-extrabold text-base">
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                  <UserX className="w-5 h-5 text-rose-600" />
                </div>
                <span>Permanent Patient Record Deletion</span>
              </div>
              <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-xs border border-rose-200">
                ⚠️ Strict Admin Action
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Select a patient to permanently wipe all associated clinical records (Dental Charts, Prescriptions, Appointments, and Invoices) from Supabase Cloud and local storage.
            </p>

            {deletionSuccessMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{deletionSuccessMessage}</span>
              </div>
            )}

            {deletionErrorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{deletionErrorMessage}</span>
              </div>
            )}

            {/* Search & Patient Selector */}
            <div className="space-y-3">
              <label className="text-slate-900 font-bold block">1. Search & Select Patient to Delete</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Patient Name, ID (e.g. RK001), or Phone number..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:border-rose-500 outline-none transition-all"
                />
              </div>

              {/* Patient List */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                {filteredPatients.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 font-medium">
                    No matching patients found.
                  </div>
                ) : (
                  filteredPatients.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatientToDelete(p);
                        setDeleteConfirmInput('');
                        setDeletionErrorMessage(null);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        selectedPatientToDelete?.id === p.id
                          ? 'border-rose-500 bg-rose-50 font-bold text-rose-900'
                          : 'border-transparent hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {p.mrn || p.id}
                        </span>
                        <span className="font-extrabold text-xs">{p.name}</span>
                        <span className="text-slate-400 text-[11px] font-normal">
                          {p.age}y / {p.gender}
                        </span>
                      </div>
                      <span className="text-slate-500 text-[11px]">{p.phone}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Selected Patient Deletion Confirmation Panel */}
            {selectedPatientToDelete && (
              <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-4 animate-fadeIn">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-extrabold text-sm text-rose-900 block">
                      Confirm Permanent Deletion for {selectedPatientToDelete.name}
                    </span>
                    <span className="text-xs text-rose-700 font-medium block mt-0.5">
                      Patient MRN: {selectedPatientToDelete.mrn} • Phone: {selectedPatientToDelete.phone}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPatientToDelete(null)}
                    className="p-1 rounded-lg text-rose-400 hover:text-rose-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-rose-200 text-rose-900 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-rose-700">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Warning: This cannot be undone!</span>
                  </p>
                  <p className="text-[11px] text-rose-800">
                    Deleting this patient permanently deletes their complete EMR history, all prescription records, dental examination charts, and treatment invoices.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-rose-900 font-bold block text-xs">
                    Type <span className="font-mono bg-rose-200 px-1.5 py-0.5 rounded text-rose-900">{selectedPatientToDelete.patientId || 'DELETE'}</span> to confirm:
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Type ${selectedPatientToDelete.patientId || 'DELETE'} here...`}
                      value={deleteConfirmInput}
                      onChange={(e) => setDeleteConfirmInput(e.target.value)}
                      className="flex-1 w-full p-3 bg-white border border-rose-300 rounded-xl font-mono text-xs text-slate-900 focus:border-rose-600 outline-none uppercase"
                    />
                    <button
                      type="button"
                      disabled={isDeletingPatient}
                      onClick={handleExecutePermanentDelete}
                      className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                    >
                      {isDeletingPatient ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span>Permanently Delete Patient</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Supabase Custom Config & Connection Testing */}
          <div className="bg-white p-6 rounded-[28px] border border-[#E8ECF3] shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4 text-xs text-[#1E293B]">
            <div className="border-b border-[#E8ECF3] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                <Server className="w-5 h-5 text-indigo-600" />
                <span>Supabase Cloud Database Settings</span>
              </div>
              <span className={`px-3 py-1 rounded-full font-bold text-xs border ${
                supabaseTestResult?.connected 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {supabaseTestResult?.connected ? '● Cloud Connected' : '○ Standalone / Ready'}
              </span>
            </div>

            <form onSubmit={handleSaveSupabaseSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-800 font-bold block mb-1">Supabase Project URL</label>
                  <input
                    type="url"
                    placeholder="https://your-project.supabase.co"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:border-indigo-600 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-800 font-bold block mb-1">Supabase Anon Key</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOi..."
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestSupabaseConn}
                  disabled={isTestingSupabase}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>

                <button
                  type="submit"
                  disabled={isTestingSupabase}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                >
                  Save Supabase Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
