import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  Receipt, 
  FileSpreadsheet, 
  Settings,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { UserRole, DoctorProfile } from '../types';
import { getStoredCustomAppIcon } from '../utils/storage';

export type NavigationTab = 
  | 'dashboard' 
  | 'patients' 
  | 'appointments' 
  | 'billing' 
  | 'prescriptions' 
  | 'settings'
  | 'sms';

interface SidebarNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  unreadCount?: number;
  totalPatientsCount: number;
  todayAppointmentsCount: number;
  activeRole?: UserRole;
  doctor?: DoctorProfile;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onTabChange,
  totalPatientsCount,
  todayAppointmentsCount,
  activeRole = 'admin',
  doctor,
}) => {
  const [appIcon, setAppIcon] = useState<string | null>(getStoredCustomAppIcon());
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('fabis_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const updateIcon = () => setAppIcon(getStoredCustomAppIcon());
    window.addEventListener('custom-branding-updated', updateIcon);
    return () => window.removeEventListener('custom-branding-updated', updateIcon);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem('fabis_sidebar_collapsed', String(next));
      } catch (e) {
        // ignore storage error
      }
      return next;
    });
  };

  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number; isPrimary?: boolean }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: Users,
      badge: totalPatientsCount,
      isPrimary: true,
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: CalendarDays,
      badge: todayAppointmentsCount > 0 ? todayAppointmentsCount : 12,
    },
    {
      id: 'billing',
      label: 'Billing History',
      icon: Receipt,
    },
    {
      id: 'settings',
      label: 'Setting',
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`bg-theme-card rounded-[22px] lg:rounded-[24px] border border-theme-border p-3 shadow-[0_8px_24px_rgba(0,0,0,0.03)] flex flex-col justify-between shrink-0 transition-all duration-300 w-full ${
        isCollapsed ? 'md:w-[72px] lg:w-[72px]' : 'md:w-[220px] lg:w-[220px]'
      }`}
    >
      <div className="flex flex-col gap-2 w-full">
        {/* Compact Brand Header with Collapse Toggle */}
        <div className="flex items-center justify-between gap-2 mb-2 px-1 py-1">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Tooth SVG / Custom Icon */}
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-center p-1.5 shadow-xs shrink-0 overflow-hidden">
              {appIcon ? (
                <img src={appIcon} alt="App Icon" className="w-full h-full object-contain" />
              ) : (
                <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M 50 20 C 32 20, 22 30, 22 48 C 22 66, 30 84, 42 86 C 47 87, 48 78, 50 78 C 52 78, 53 87, 58 86 C 70 84, 78 66, 78 48 C 78 30, 68 20, 50 20 Z"
                    className="stroke-theme-primary"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
              )}
            </div>
            
            {!isCollapsed && (
              <div className="hidden md:block min-w-0 flex-1">
                <div className="flex flex-col">
                  {doctor?.clinicDisplayName && doctor.clinicDisplayName.trim() ? (
                    <span className="text-theme-primary font-extrabold text-xs lg:text-sm tracking-tight leading-tight break-words" title={doctor.clinicDisplayName}>
                      {doctor.clinicDisplayName}
                    </span>
                  ) : doctor?.clinicName && doctor.clinicName.trim() ? (
                    <span className="text-theme-primary font-extrabold text-xs lg:text-sm tracking-tight leading-tight break-words" title={doctor.clinicName}>
                      {doctor.clinicName}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-theme-primary font-extrabold text-sm lg:text-base tracking-tight uppercase">FABIS</span>
                      <span className="text-theme-accent font-extrabold text-sm lg:text-base tracking-tight">MediCare</span>
                    </div>
                  )}
                  <span className="text-[9px] font-extrabold text-theme-secondary uppercase tracking-widest mt-0.5">
                    DENTAL EMR
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Sidebar Collapse / Expand Toggle Button */}
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-theme-secondary hover:text-theme-main hover:bg-theme-page transition-colors cursor-pointer shrink-0"
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4 text-theme-accent" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0 touch-manipulation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isPrimary = item.isPrimary;

            let buttonStyles = '';
            if (isPrimary) {
              if (isActive) {
                buttonStyles = 'bg-theme-accent text-white shadow-sm border-l-4 border-white font-extrabold ring-1 ring-theme-accent';
              } else {
                buttonStyles = 'bg-theme-accent/[0.08] text-theme-main border border-theme-accent/30 hover:bg-theme-accent/20 hover:border-theme-accent font-bold shadow-2xs';
              }
            } else {
              if (isActive) {
                buttonStyles = 'bg-theme-accent/15 text-theme-accent shadow-xs border-l-4 border-theme-accent font-bold';
              } else {
                buttonStyles = 'text-theme-secondary hover:text-theme-main hover:bg-theme-page font-semibold';
              }
            }

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={item.label}
                className={`flex items-center ${
                  isCollapsed ? 'md:justify-center px-2' : 'justify-start lg:justify-between px-3'
                } py-2.5 min-h-[42px] rounded-xl text-xs lg:text-[14px] transition-all duration-200 group cursor-pointer active:scale-98 shrink-0 md:shrink md:w-full relative ${buttonStyles}`}
              >
                <div className="flex items-center gap-2.5 relative">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                      isPrimary && isActive
                        ? 'text-white'
                        : isPrimary
                        ? 'text-theme-accent font-black'
                        : isActive
                        ? 'text-theme-accent'
                        : 'text-theme-secondary group-hover:text-theme-main'
                    }`}
                  />
                  {(!isCollapsed || false) && (
                    <span className="inline md:inline">{isCollapsed ? <span className="md:hidden">{item.label}</span> : item.label}</span>
                  )}

                  {/* Collapsed Badge Dot */}
                  {isCollapsed && item.badge !== undefined && (
                    <span
                      className="hidden md:block absolute -top-1 -right-1 w-2 h-2 rounded-full bg-theme-accent ring-2 ring-white"
                      title={`${item.badge}`}
                    />
                  )}
                </div>

                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isPrimary && isActive
                        ? 'bg-white/25 text-white'
                        : isPrimary
                        ? 'bg-theme-accent/20 text-theme-accent font-black'
                        : isActive
                        ? 'bg-theme-accent/20 text-theme-accent'
                        : 'bg-theme-page text-theme-secondary'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Doctor Profile Footer Card */}
      <div className="hidden md:block mt-4 pt-3 border-t border-theme-border">
        <div
          className={`bg-theme-page/60 rounded-xl p-2 border border-theme-border flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } min-w-0`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-[#3BA7F5] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              DR
            </div>
            {!isCollapsed && (
              <div className="hidden md:block min-w-0 flex-1">
                <p className="text-xs font-bold text-[#1E293B] truncate" title={doctor?.name || 'Dr. V. Radhakrishnan'}>
                  {doctor?.name || 'Dr. V. Radhakrishnan'}
                </p>
                <p className="text-[10px] text-[#64748B] font-medium truncate">
                  {doctor?.specialty || 'Dental Surgeon'}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />}
        </div>
      </div>
    </aside>
  );
};

