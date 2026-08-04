import React, { useState, useEffect } from 'react';
import { DoctorProfile, UserRole, UserCredentials, ThemePalette, ChairStatus } from '../../types';
import { 
  getStoredCredentials, 
  saveCredentials, 
  getStoredTheme, 
  saveStoredTheme,
  getStoredCustomClinicLogo,
  saveCustomClinicLogo,
  getStoredCustomAppIcon,
  saveCustomAppIcon,
  resetCustomBranding,
  getStoredChairs,
  saveStoredChairs
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
import { FabisLogo } from '../FabisLogo';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  Building, 
  User, 
  Lock, 
  Palette, 
  Key, 
  CheckCircle2, 
  Sparkles,
  LockKeyhole,
  Upload,
  Image as ImageIcon,
  Trash2,
  Database,
  Download,
  UploadCloud,
  FileCheck,
  Clock,
  AlertTriangle,
  Printer,
  Armchair,
  Plus,
  Edit2,
  Check,
  FileImage,
  CloudCheck,
  RefreshCw,
  Server,
  LayoutDashboard,
} from 'lucide-react';
import { PrintDesignerModule } from '../PrintDesigner/PrintDesignerModule';
import { DashboardPersonalizationSection } from '../Settings/DashboardPersonalizationSection';
import {
  performSupabaseCloudBackup,
  restoreFromSupabaseCloud,
  getStoredCloudSyncTime,
} from '../../utils/supabaseCloudBackup';

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
  const [clinicLogo, setClinicLogo] = useState<string | null>(getStoredCustomClinicLogo());
  const [appIcon, setAppIcon] = useState<string | null>(getStoredCustomAppIcon());
  const [brandingSavedSuccess, setBrandingSavedSuccess] = useState(false);

  // Data Protection & Backup State
  const [activeSection, setActiveSection] = useState<'profile' | 'chairs' | 'dashboard' | 'print' | 'backup'>('profile');

  const [backupFreq, setBackupFreq] = useState<BackupFrequency>(getBackupReminderFrequency());
  const [lastBackup, setLastBackup] = useState<string | null>(getLastBackupTimestamp());
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(getStoredCloudSyncTime());
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudRestoreMessage, setCloudRestoreMessage] = useState<string | null>(null);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [restoreCandidate, setRestoreCandidate] = useState<BackupData | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  // Chair Management State
  const [configuredChairs, setConfiguredChairs] = useState<ChairStatus[]>(getStoredChairs());
  const [newChairName, setNewChairName] = useState('');
  const [editingChairId, setEditingChairId] = useState<string | null>(null);
  const [editingChairName, setEditingChairName] = useState('');
  const [chairNotice, setChairNotice] = useState<string | null>(null);

  useEffect(() => {
    setCredentials(getStoredCredentials());
    setCurrentTheme(getStoredTheme());
    setClinicLogo(getStoredCustomClinicLogo());
    setAppIcon(getStoredCustomAppIcon());
    setBackupFreq(getBackupReminderFrequency());
    setLastBackup(getLastBackupTimestamp());
    setLastCloudSync(getStoredCloudSyncTime());
  }, []);

  const handleManualCloudBackup = async () => {
    setIsCloudSyncing(true);
    setBackupNotice(null);
    try {
      const res = await performSupabaseCloudBackup(undefined, doctor);
      if (res.success) {
        setLastCloudSync(res.timestamp);
        setBackupNotice('Clinic data backed up to Supabase Cloud successfully!');
        setTimeout(() => setBackupNotice(null), 4000);
      }
    } catch (err: any) {
      setBackupNotice('Cloud backup error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsCloudSyncing(false);
    }
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

  const handleBackupFreqChange = (freq: BackupFrequency) => {
    setBackupFreq(freq);
    saveBackupReminderFrequency(freq);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'clinicLogo' | 'appIcon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, SVG, or WebP).');
      return;
    }

    // Try multi-tenant Supabase storage upload ({clinic_id}/logos/{filename})
    try {
      const { uploadClinicFile } = await import('../../utils/supabaseMultiTenant');
      const uploaded = await uploadClinicFile(file, 'logos', undefined, doctor);
      if (uploaded?.url) {
        if (type === 'clinicLogo') {
          setClinicLogo(uploaded.url);
          saveCustomClinicLogo(uploaded.url);
        } else {
          setAppIcon(uploaded.url);
          saveCustomAppIcon(uploaded.url);
        }
        setBrandingSavedSuccess(true);
        setTimeout(() => setBrandingSavedSuccess(false), 3000);
        window.dispatchEvent(new Event('custom-branding-updated'));
        return;
      }
    } catch (sbErr) {
      console.info('Supabase storage fallback to local Base64 branding:', sbErr);
    }

    // Local Base64 fallback
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (type === 'clinicLogo') {
        setClinicLogo(base64);
        saveCustomClinicLogo(base64);
      } else {
        setAppIcon(base64);
        saveCustomAppIcon(base64);
      }
      setBrandingSavedSuccess(true);
      setTimeout(() => setBrandingSavedSuccess(false), 3000);
      window.dispatchEvent(new Event('custom-branding-updated'));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = (type: 'clinicLogo' | 'appIcon') => {
    if (type === 'clinicLogo') {
      setClinicLogo(null);
      saveCustomClinicLogo(null);
    } else {
      setAppIcon(null);
      saveCustomAppIcon(null);
    }
    setBrandingSavedSuccess(true);
    setTimeout(() => setBrandingSavedSuccess(false), 3000);
    window.dispatchEvent(new Event('custom-branding-updated'));
  };

  const handleResetBranding = () => {
    resetCustomBranding();
    setClinicLogo(null);
    setAppIcon(null);
    setBrandingSavedSuccess(true);
    setTimeout(() => setBrandingSavedSuccess(false), 3000);
    window.dispatchEvent(new Event('custom-branding-updated'));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveDoctor(formData);
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

  const handleSetSingleChairPreset = () => {
    const singleChair: ChairStatus[] = [
      {
        id: 'Chair 1 (Main Operatory)',
        name: 'Chair 1 - Main Operatory',
        status: 'Available',
      },
    ];
    setConfiguredChairs(singleChair);
    saveStoredChairs(singleChair);
    setChairNotice('Set to 1 Chair (Single Operatory Clinic) successfully!');
    setTimeout(() => setChairNotice(null), 3000);
  };

  const handleAddChair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChairName.trim()) return;
    const chairNum = configuredChairs.length + 1;
    const newId = `Chair ${chairNum} (${newChairName.trim()})`;
    const updated = [
      ...configuredChairs,
      {
        id: newId,
        name: `Chair ${chairNum} - ${newChairName.trim()}`,
        status: 'Available' as const,
      },
    ];
    setConfiguredChairs(updated);
    saveStoredChairs(updated);
    setNewChairName('');
    setChairNotice(`Added "${newChairName.trim()}" successfully! Live Dashboard updated.`);
    setTimeout(() => setChairNotice(null), 3000);
  };

  const handleDeleteChair = (chairId: string) => {
    if (configuredChairs.length <= 1) {
      alert('You must keep at least 1 dental chair configured for your clinic.');
      return;
    }
    const updated = configuredChairs.filter((c) => c.id !== chairId);
    setConfiguredChairs(updated);
    saveStoredChairs(updated);
    setChairNotice('Chair deleted successfully! Live Dashboard updated.');
    setTimeout(() => setChairNotice(null), 3000);
  };

  const handleStartRename = (c: ChairStatus) => {
    setEditingChairId(c.id);
    setEditingChairName(c.name);
  };

  const handleSaveRename = (chairId: string) => {
    if (!editingChairName.trim()) return;
    const updated = configuredChairs.map((c) =>
      c.id === chairId ? { ...c, name: editingChairName.trim() } : c
    );
    setConfiguredChairs(updated);
    saveStoredChairs(updated);
    setEditingChairId(null);
    setChairNotice('Chair renamed successfully!');
    setTimeout(() => setChairNotice(null), 3000);
  };

  const themeOptions: { id: ThemePalette; name: string; desc: string; primary: string; accent: string; bg: string }[] = [
    {
      id: 'royal-navy',
      name: 'Royal Navy & Teal',
      desc: 'Executive Classic',
      primary: '#1e3a8a',
      accent: '#0d9488',
      bg: '#f8fafc',
    },
    {
      id: 'emerald-gold',
      name: 'Emerald Gold',
      desc: 'Luxury Aesthetic',
      primary: '#065f46',
      accent: '#d97706',
      bg: '#f0fdf4',
    },
    {
      id: 'sapphire-ice',
      name: 'Sapphire Ice',
      desc: 'Modern Tech',
      primary: '#1d4ed8',
      accent: '#0891b2',
      bg: '#f0f9ff',
    },
    {
      id: 'sage-stone',
      name: 'Sage & Stone',
      desc: 'Calming Minimalist',
      primary: '#475569',
      accent: '#65a30d',
      bg: '#f8fafc',
    },
    {
      id: 'midnight-obsidian',
      name: 'Midnight Obsidian',
      desc: 'Sleek Dark Mode',
      primary: '#7c3aed',
      accent: '#38bdf8',
      bg: '#090d16',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header Card */}
      <div className="bg-theme-card p-6 rounded-[28px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-theme-main">
        <div>
          <h2 className="text-xl font-extrabold text-theme-main flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-theme-accent" />
            <span>FABIS MediCare System Settings</span>
          </h2>
          <p className="text-sm font-medium text-theme-secondary mt-1">
            Configure letterhead details, credentials manager, master price lists, print template designer, and global theme
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
          <span>Doctor Profile, Branding & Theme</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('chairs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeSection === 'chairs'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-theme-card text-theme-secondary hover:text-theme-main border border-theme-border'
          }`}
        >
          <Armchair className="w-4 h-4 text-amber-300" />
          <span>Dental Chairs & Operatories ({configuredChairs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('dashboard')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeSection === 'dashboard'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-theme-card text-theme-secondary hover:text-theme-main border border-theme-border'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-sky-300" />
          <span>Dashboard Personalization</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('print')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeSection === 'print'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-theme-card text-theme-secondary hover:text-theme-main border border-theme-border'
          }`}
        >
          <Printer className="w-4 h-4 text-purple-300" />
          <span>A4 Invoice & PDF Designer</span>
        </button>


        <button
          type="button"
          onClick={() => setActiveSection('backup')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeSection === 'backup'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-theme-card text-theme-secondary hover:text-theme-main border border-theme-border'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-300" />
          <span>Data Protection & Backups</span>
        </button>
      </div>

      {/* Chair Settings View */}
      {activeSection === 'chairs' && (
        <div className="bg-theme-card p-6 rounded-[28px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6 text-theme-main">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-border pb-4">
            <div>
              <h3 className="text-lg font-black text-theme-main flex items-center gap-2">
                <Armchair className="w-5 h-5 text-amber-500" />
                <span>Dental Chair & Operatory Management</span>
              </h3>
              <p className="text-xs text-theme-secondary mt-1">
                Configure the active operatory chairs for this branch. Changes instantly sync to the Dashboard grid and scheduler.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSetSingleChairPreset}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Check className="w-4 h-4 text-amber-700" />
              <span>Set to 1 Chair (Single Operatory Clinic)</span>
            </button>
          </div>

          {/* Success Notice Banner */}
          {chairNotice && (
            <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{chairNotice}</span>
            </div>
          )}

          {/* Active Chairs Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-theme-secondary uppercase tracking-wider">
              Configured Chairs ({configuredChairs.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {configuredChairs.map((c, index) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-theme-border bg-theme-page/60 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 flex items-center justify-center font-black text-sm shrink-0">
                      💺
                    </div>

                    <div className="min-w-0 flex-1">
                      {editingChairId === c.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingChairName}
                            onChange={(e) => setEditingChairName(e.target.value)}
                            className="px-2 py-1 text-xs font-bold rounded-lg bg-theme-card border border-theme-accent text-theme-main outline-none w-full"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(c.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-theme-main truncate">{c.name}</span>
                          <button
                            type="button"
                            onClick={() => handleStartRename(c)}
                            className="text-theme-secondary hover:text-theme-main p-1 cursor-pointer"
                            title="Rename Chair"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[11px] font-mono text-theme-secondary mt-0.5">
                        <span>ID: {c.id}</span>
                        <span>•</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">Status: {c.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Delete Chair Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteChair(c.id)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 transition-all cursor-pointer shrink-0 flex items-center gap-1 text-xs font-extrabold"
                    title="Delete this chair"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Chair Form */}
          <form onSubmit={handleAddChair} className="pt-4 border-t border-theme-border space-y-3">
            <h4 className="text-xs font-extrabold text-theme-secondary uppercase tracking-wider">
              Add New Operatory Chair
            </h4>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="e.g. Hygiene & Scaling Chair, Surgical OT 2"
                value={newChairName}
                onChange={(e) => setNewChairName(e.target.value)}
                className="flex-1 w-full px-4 py-2.5 rounded-xl bg-theme-page border border-theme-border text-theme-main text-xs font-bold outline-none focus:border-theme-accent"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Chair</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dashboard Personalization Settings View */}
      {activeSection === 'dashboard' && (
        <DashboardPersonalizationSection doctor={doctor} />
      )}

      {/* A4 Invoice & PDF Print Customizer Settings View */}
      {activeSection === 'print' && (
        <div className="space-y-5">
          <PrintDesignerModule doctor={doctor} />
        </div>
      )}

      {/* Profile & Theme View */}
      {activeSection === 'profile' && (
        <>
      <div className="bg-theme-card p-6 rounded-[28px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4 text-theme-main">
        <div className="flex items-center justify-between border-b border-theme-border pb-3">
          <div className="flex items-center gap-2 text-theme-accent font-bold text-base">
            <Palette className="w-5 h-5 text-theme-accent" />
            <span>1-Click Global Theme Manager</span>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-theme-accent/15 text-theme-accent border border-theme-accent/30">
            Active: {currentTheme.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {themeOptions.map((t) => {
            const isActive = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between space-y-3 relative group cursor-pointer ${
                  isActive
                    ? 'border-theme-accent ring-2 ring-theme-accent/30 bg-theme-accent/10 shadow-md scale-102'
                    : 'border-theme-border hover:border-theme-accent/50 bg-theme-card hover:bg-theme-page'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-theme-main">{t.name}</span>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-theme-accent shrink-0" />}
                  </div>
                  <span className="text-[10px] text-theme-secondary font-medium block mt-0.5">{t.desc}</span>
                </div>

                {/* Color Swatch Preview */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span
                    className="w-5 h-5 rounded-full shadow-inner border border-white/20 shrink-0"
                    style={{ backgroundColor: t.primary }}
                    title={`Primary: ${t.primary}`}
                  />
                  <span
                    className="w-5 h-5 rounded-full shadow-inner border border-white/20 shrink-0"
                    style={{ backgroundColor: t.accent }}
                    title={`Accent: ${t.accent}`}
                  />
                  <span
                    className="w-5 h-5 rounded-full shadow-inner border border-zinc-300 shrink-0"
                    style={{ backgroundColor: t.bg }}
                    title={`Canvas: ${t.bg}`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clinic Branding & Logo Settings Card (Admin Only) */}
      {activeRole === 'admin' && (
      <div className="bg-theme-card p-6 rounded-[28px] border border-theme-border shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-5 text-theme-main">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-theme-border pb-3 gap-2">
          <div>
            <div className="flex items-center gap-2 text-theme-accent font-bold text-base">
              <ImageIcon className="w-5 h-5 text-theme-accent" />
              <span>Clinic Branding & Logo Settings</span>
            </div>
            <p className="text-xs text-theme-secondary font-medium mt-0.5">
              Customize logos across the Login Portal, App Sidebar, and printed Invoices & Prescriptions
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetBranding}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-theme-page hover:bg-rose-50 text-theme-secondary hover:text-rose-700 border border-theme-border hover:border-rose-200 text-xs font-bold transition-all cursor-pointer shrink-0"
            title="Reset branding to default FABIS logos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default Logos</span>
          </button>
        </div>

        {brandingSavedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Branding updated! Changes saved to persistent storage and live across all components.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Primary Clinic Logo Uploader */}
          <div className="p-5 rounded-2xl bg-theme-page/60 border border-theme-border flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-theme-main flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-theme-accent" />
                  <span>Primary Clinic Logo</span>
                </span>
                <span className="text-[10px] font-bold text-theme-accent bg-theme-accent/10 px-2 py-0.5 rounded-full border border-theme-accent/20">
                  Login & Letterhead
                </span>
              </div>
              <p className="text-[11px] text-theme-secondary font-medium mb-3">
                Replaces top FABIS logo on the Login Card & printed Invoice / Rx headers. Accepts PNG, JPG, JPEG, SVG, WebP.
              </p>

              {/* Preview Container */}
              <div className="p-4 bg-white rounded-2xl border border-theme-border flex items-center justify-center min-h-[120px] shadow-2xs relative group">
                {clinicLogo ? (
                  <img
                    src={clinicLogo}
                    alt="Custom Clinic Logo"
                    className="max-h-24 max-w-full object-contain drop-shadow-xs"
                  />
                ) : (
                  <div className="text-center py-2 space-y-1">
                    <FabisLogo size="sm" showPillars={false} />
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">(Default FABIS Logo Active)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <label className="flex-1 px-4 py-2.5 min-h-[42px] bg-theme-accent hover:bg-theme-accent-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors">
                <Upload className="w-4 h-4 text-white" />
                <span>{clinicLogo ? 'Change Logo' : 'Upload Clinic Logo'}</span>
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
                  onClick={() => handleRemoveLogo('clinicLogo')}
                  className="px-3 py-2.5 min-h-[42px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Remove custom logo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2. App Sidebar / Favicon Icon Uploader */}
          <div className="p-5 rounded-2xl bg-theme-page/60 border border-theme-border flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-theme-main flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-theme-accent" />
                  <span>App Sidebar / Favicon Icon</span>
                </span>
                <span className="text-[10px] font-bold text-theme-accent bg-theme-accent/10 px-2 py-0.5 rounded-full border border-theme-accent/20">
                  Navigation Badge
                </span>
              </div>
              <p className="text-[11px] text-theme-secondary font-medium mb-3">
                Replaces tooth icon badge in the top sidebar navigation header. Accepts square PNG, JPG, JPEG, SVG, WebP.
              </p>

              {/* Preview Container */}
              <div className="p-4 bg-white rounded-2xl border border-theme-border flex items-center justify-center min-h-[120px] shadow-2xs relative group">
                {appIcon ? (
                  <div className="w-16 h-16 rounded-2xl p-2 bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-center shadow-xs">
                    <img
                      src={appIcon}
                      alt="Custom App Icon"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-center py-2 space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-center p-2.5">
                      <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
                        <path
                          d="M 50 20 C 32 20, 22 30, 22 48 C 22 66, 30 84, 42 86 C 47 87, 48 78, 50 78 C 52 78, 53 87, 58 86 C 70 84, 78 66, 78 48 C 78 30, 68 20, 50 20 Z"
                          className="stroke-theme-primary"
                          strokeWidth="7"
                          strokeLinecap="round"
                          fill="none"
                        />
                        <path
                          d="M 38 40 C 42 32, 60 34, 54 68"
                          className="stroke-theme-accent"
                          strokeWidth="5"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold block">(Default Tooth Badge Active)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <label className="flex-1 px-4 py-2.5 min-h-[42px] bg-theme-accent hover:bg-theme-accent-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors">
                <Upload className="w-4 h-4 text-white" />
                <span>{appIcon ? 'Change App Icon' : 'Upload App Icon'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  onChange={(e) => handleFileUpload(e, 'appIcon')}
                  className="hidden"
                />
              </label>

              {appIcon && (
                <button
                  type="button"
                  onClick={() => handleRemoveLogo('appIcon')}
                  className="px-3 py-2.5 min-h-[42px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Remove custom icon"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Admin Credentials Manager Section */}
      {activeRole === 'admin' ? (
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

          <p className="text-[#64748B] text-xs font-medium">
            Updating credentials stores authentication states safely in localStorage without altering or deleting any existing EMR patient records, dental charts, or invoices.
          </p>

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
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Credentials updated! EMR data preserved 100%.
              </span>
            ) : (
              <span className="text-[#94A3B8]">Admin credentials take effect immediately on next login</span>
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
      ) : (
        <div className="bg-[#EBF7FC] p-4 rounded-2xl border border-[#3BA7F5]/30 text-xs text-[#1E88A8] flex items-center gap-3 font-medium">
          <LockKeyhole className="w-5 h-5 text-[#3BA7F5] shrink-0" />
          <div>
            <span className="font-bold block text-[#1E293B]">User Credentials Manager Restricted</span>
            <span>Switch to ⚙️ Admin Role to modify system passwords, PINs, or global price master settings.</span>
          </div>
        </div>
      )}

      {/* Doctor & Clinic Profile Settings */}
      <form onSubmit={handleProfileSubmit} className="bg-white p-6 rounded-[28px] border border-[#E8ECF3] shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-5 text-xs text-[#1E293B]">
        <div className="border-b border-[#E8ECF3] pb-3 flex items-center gap-2 text-[#3BA7F5] font-bold text-base">
          <User className="w-5 h-5 text-[#3BA7F5]" />
          <span>Doctor Information & Medical Credentials</span>
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

        <div className="border-b border-[#E8ECF3] pt-4 pb-3 flex items-center gap-2 text-[#3BA7F5] font-bold text-base">
          <Building className="w-5 h-5 text-[#3BA7F5]" />
          <span>Clinic & Letterhead Details</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[#1E293B] font-bold block mb-1.5">Clinic Name *</label>
            <input
              type="text"
              required
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

        <div className="flex items-center justify-between pt-4 border-t border-[#E8ECF3]">
          {savedSuccess ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Profile updated successfully!
            </span>
          ) : (
            <span className="text-[#94A3B8]">Changes reflect on printed Rx & Invoices automatically</span>
          )}

          <button
            type="submit"
            className="px-6 py-3 rounded-full bg-[#3BA7F5] hover:bg-[#2A96E4] text-white font-bold text-xs shadow-[0_8px_20px_rgba(59,167,245,0.3)] flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-white" />
            <span>Save Profile Settings</span>
          </button>
        </div>
      </form>
      </>
      )}

      {/* Production-Grade Data Protection, Encrypted Backup & Restore Card */}
      {activeSection === 'backup' && (
      <div className="bg-white p-6 rounded-[28px] border border-[#E8ECF3] shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6 text-xs text-[#1E293B]">
        <div className="border-b border-[#E8ECF3] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>Automated Cloud Backup & Disaster Recovery Engine</span>
          </div>
          <span className="px-3.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-full text-xs font-extrabold flex items-center gap-1.5 self-start sm:self-auto">
            <CloudCheck className="w-4 h-4 text-emerald-600" />
            <span>Supabase Cloud Auto-Sync Active</span>
          </span>
        </div>

        {/* Supabase Cloud Auto-Sync Banner & Controls */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white space-y-4 shadow-md border border-teal-800/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-sm text-teal-300">
                <Server className="w-4 h-4 text-teal-300" />
                <span>Live Supabase Cloud Sync & Failsafe Storage</span>
              </div>
              <p className="text-xs text-slate-300 font-medium max-w-2xl">
                Background auto-sync routinely backs up all clinic data (Patients, Appointments, Treatments, Bills, Prescriptions, Settings, Branding, and Reports) to the Supabase database.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleManualCloudBackup}
                disabled={isCloudSyncing}
                className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-slate-950 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                <span>{isCloudSyncing ? 'Syncing...' : 'Backup Now to Cloud'}</span>
              </button>

              {activeRole === 'admin' && (
                <button
                  type="button"
                  onClick={handleRestoreFromCloud}
                  disabled={isCloudSyncing}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-50"
                  title="Admin-only: Recover all clinic data from cloud snapshot without duplicates"
                >
                  <UploadCloud className="w-4 h-4 text-slate-950" />
                  <span>Restore from Cloud Backup</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono pt-2 border-t border-slate-700/60 text-slate-300">
            <div>
              Last Cloud Backup:{' '}
              <span className="font-bold text-teal-300">
                {lastCloudSync ? new Date(lastCloudSync).toLocaleString() : 'Just now'}
              </span>
            </div>
            <div>•</div>
            <div>
              Sync Status:{' '}
              <span className="font-bold text-emerald-400">
                {isCloudSyncing ? 'Syncing...' : 'Synced & Secured'}
              </span>
            </div>
            <div>•</div>
            <div>
              Duplicate Prevention:{' '}
              <span className="font-bold text-amber-300">Active (MRN & ID Deduplication)</span>
            </div>
          </div>
        </div>

        {cloudRestoreMessage && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{cloudRestoreMessage}</span>
          </div>
        )}

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Export / Backup Column */}
          <div className="bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Export Encrypted Backup</span>
            </div>
            <p className="text-slate-500 text-xs">
              Downloads a full encrypted snapshot of patients, dental charts, EMR notes, prescriptions, invoices, and settings.
            </p>
            <div className="text-[11px] text-slate-500 font-medium">
              Last Backup: <span className="font-bold text-slate-800">{lastBackup ? new Date(lastBackup).toLocaleString() : 'Never'}</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Encrypted Backup (.fabis)</span>
            </button>
          </div>

          {/* Import / Restore Column */}
          <div className="bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Restore Backup File</span>
            </div>
            <p className="text-slate-500 text-xs">
              Select a `.fabis` encrypted backup file to restore complete clinical data to this system.
            </p>
            <label className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer text-center">
              <UploadCloud className="w-4 h-4 text-slate-600" />
              <span>Select Backup File to Restore</span>
              <input
                type="file"
                accept=".fabis,.json"
                onChange={handleRestoreFileSelected}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Restore Confirmation Dialog */}
        {restoreCandidate && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3 mt-2">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Confirm Data Restore</span>
            </div>
            <p className="text-xs text-amber-800 font-medium">
              This backup file contains <span className="font-bold text-amber-950">{restoreCandidate.patients.length} patient records</span> from{' '}
              <span className="font-bold text-amber-950">{new Date(restoreCandidate.timestamp).toLocaleString()}</span>.
              Restoring will merge and update system records safely.
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
                <span>Confirm & Restore All Data</span>
              </button>
            </div>
          </div>
        )}

        {/* Backup Reminder Schedule Config */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E8ECF3]">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Automated Backup Reminder Schedule:</span>
          </div>
          <div className="flex items-center gap-2">
            {(['daily', 'weekly', 'monthly', 'never'] as BackupFrequency[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => handleBackupFreqChange(f)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer capitalize ${
                  backupFreq === f
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-[#F8FAFC] border border-[#E8ECF3] text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
