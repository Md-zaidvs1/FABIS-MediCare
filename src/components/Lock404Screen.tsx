import React, { useState, useEffect } from 'react';
import { UserCredentials } from '../types';
import { getStoredCredentials } from '../utils/storage';
import { setDoctorAccessStatus, setMaintenanceModeStatus } from '../utils/softwareLock';
import { ArrowLeft } from 'lucide-react';

interface Lock404ScreenProps {
  onAdminUnlocked?: () => void;
  onAdminBypassLogin?: (role: 'admin', username: string) => void;
  onReturnToLogin?: () => void;
  isMaintenanceMode?: boolean;
}

export const Lock404Screen: React.FC<Lock404ScreenProps> = ({
  onAdminUnlocked,
  onAdminBypassLogin,
  onReturnToLogin,
  isMaintenanceMode = false,
}) => {
  const [clickCount, setClickCount] = useState(0);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState(false);

  // Keyboard shortcut Ctrl+Shift+U or Cmd+Shift+U for admin access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        setIsAdminModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTitleClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    if (nextCount >= 5) {
      setIsAdminModalOpen(true);
      setClickCount(0);
    }
  };

  const handleAdminLoginAndUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const creds: UserCredentials = getStoredCredentials();
    const cleanUser = adminUsername.trim().toLowerCase();
    const cleanPin = adminPin.trim();

    const expectedUser = creds.adminUsername.toLowerCase();
    const expectedPin = creds.adminPin;

    if ((cleanUser === expectedUser || cleanUser === 'admin') && cleanPin === expectedPin) {
      setUnlockSuccess(true);
      await setDoctorAccessStatus('Active');
      await setMaintenanceModeStatus(false);
      setTimeout(() => {
        if (onAdminBypassLogin) {
          onAdminBypassLogin('admin', adminUsername);
        } else if (onAdminUnlocked) {
          onAdminUnlocked();
        }
      }, 500);
    } else {
      setErrorMessage('Invalid administrator credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-slate-800 font-sans select-none relative">
      <div className="text-center max-w-md w-full">
        {/* Subtle 5-click trigger on the 404 text */}
        <h1 
          onClick={handleTitleClick}
          className="text-7xl sm:text-8xl font-black text-slate-300 tracking-tight mb-2 cursor-default transition-colors hover:text-slate-400"
          title=""
        >
          404
        </h1>
        
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
          {isMaintenanceMode ? 'System Maintenance' : 'Page Not Found'}
        </h2>
        
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          {isMaintenanceMode 
            ? 'System maintenance is currently in progress. Please check back later.' 
            : 'The requested URL was not found on this server.'}
        </p>

        {onReturnToLogin && (
          <div className="mb-6">
            <button
              onClick={onReturnToLogin}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </div>
        )}

        <div className="inline-block border-t border-slate-200 pt-4 text-xs text-slate-400">
          Error code: HTTP 404 ({isMaintenanceMode ? 'MAINTENANCE_MODE' : 'RESOURCE_UNAVAILABLE'})
        </div>
      </div>

      {/* Discrete bottom corner admin access trigger */}
      <div 
        onClick={() => setIsAdminModalOpen(true)}
        className="absolute bottom-4 right-4 w-3 h-3 rounded-full opacity-20 hover:opacity-100 transition-opacity cursor-pointer"
        title=""
      />

      {/* Discreet Admin Login & Unlock Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Administrator Access</h3>
              <button 
                onClick={() => {
                  setIsAdminModalOpen(false);
                  setErrorMessage(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {unlockSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold text-center">
                ✓ Access Restored. Redirecting...
              </div>
            ) : (
              <form onSubmit={handleAdminLoginAndUnlock} className="space-y-3.5">
                {errorMessage && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Username</label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin"
                    autoFocus
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Password</label>
                  <input
                    type="password"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdminModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Authorize & Unlock
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
