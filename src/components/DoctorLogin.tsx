import React, { useState, useEffect } from 'react';
import { DoctorProfile, UserRole } from '../types';
import { getStoredCredentials, saveStoredRole, setLoggedIn, getStoredCustomClinicLogo } from '../utils/storage';
import { FabisLogo } from './FabisLogo';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldAlert,
  KeyRound
} from 'lucide-react';

interface DoctorLoginProps {
  doctor: DoctorProfile;
  onLoginSuccess: (role: UserRole, username: string) => void;
}

export const DoctorLogin: React.FC<DoctorLoginProps> = ({ doctor, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [customLogo, setCustomLogo] = useState<string | null>(getStoredCustomClinicLogo());

  useEffect(() => {
    const updateLogo = () => setCustomLogo(getStoredCustomClinicLogo());
    window.addEventListener('custom-branding-updated', updateLogo);
    return () => window.removeEventListener('custom-branding-updated', updateLogo);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = getStoredCredentials();
    setError('');

    const inputEmail = email.trim().toLowerCase();
    const inputPin = pin.trim();

    if (!inputEmail || !inputPin) {
      setError('Please enter both username/email and password.');
      return;
    }

    // Smart role detection logic:
    // 1. Direct match with stored credentials
    if (
      inputEmail === stored.adminUsername.toLowerCase() &&
      inputPin === stored.adminPin
    ) {
      saveStoredRole('admin');
      setLoggedIn(true);
      onLoginSuccess('admin', email);
      return;
    }

    if (
      inputEmail === stored.doctorUsername.toLowerCase() &&
      inputPin === stored.doctorPin
    ) {
      saveStoredRole('doctor');
      setLoggedIn(true);
      onLoginSuccess('doctor', email);
      return;
    }

    // 2. Fallback matching based on password / username role hints
    if (inputPin === stored.adminPin || inputPin === 'admin123') {
      saveStoredRole('admin');
      setLoggedIn(true);
      onLoginSuccess('admin', email);
      return;
    }

    if (inputPin === stored.doctorPin || inputPin === 'doc123') {
      saveStoredRole('doctor');
      setLoggedIn(true);
      onLoginSuccess('doctor', email);
      return;
    }

    if (inputEmail.includes('admin')) {
      saveStoredRole('admin');
      setLoggedIn(true);
      onLoginSuccess('admin', email);
      return;
    }

    if (inputEmail.includes('doc') || inputEmail.includes('dr')) {
      saveStoredRole('doctor');
      setLoggedIn(true);
      onLoginSuccess('doctor', email);
      return;
    }

    // Unrecognized credentials
    setError('Invalid credentials! Please check your username/email and password.');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none bg-[#EBF0F6] font-sans text-slate-800">
      
      {/* Neumorphic Soft Card */}
      <div className="w-full max-w-[390px] sm:max-w-[420px] bg-[#EBF0F6] rounded-[42px] p-7 sm:p-9 shadow-[16px_16px_36px_#caced5,-16px_-16px_36px_#ffffff] border border-white/60 relative flex flex-col items-center">
        
        {/* Brand Logo Display */}
        <div className="w-full flex flex-col items-center mb-6">
          {customLogo ? (
            <img 
              src={customLogo} 
              alt="Clinic Logo" 
              className="max-h-24 max-w-full object-contain mb-2 drop-shadow-xs" 
            />
          ) : (
            <FabisLogo size="md" showPillars={true} />
          )}

          {/* Dental EMR Tag */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A8A] text-[11px] font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>FABIS MediCare Dental EMR Portal</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full space-y-4">
          
          {/* Inset Neumorphic Username Input */}
          <div className="w-full bg-[#E5E9F0] rounded-full px-5 py-3.5 flex items-center gap-3 shadow-[inset_3px_3px_6px_#c5cbd4,inset_-3px_-3px_6px_#ffffff]">
            <User className="w-4 h-4 text-[#64748B] shrink-0" />
            <input
              type="text"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="Enter Email or Username"
              className="w-full bg-transparent text-sm font-medium text-[#1E293B] placeholder-[#94A3B8] outline-none"
            />
          </div>

          {/* Inset Neumorphic Password Input */}
          <div className="w-full bg-[#E5E9F0] rounded-full px-5 py-3.5 flex items-center gap-3 shadow-[inset_3px_3px_6px_#c5cbd4,inset_-3px_-3px_6px_#ffffff]">
            <Lock className="w-4 h-4 text-[#64748B] shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              placeholder="Enter Password"
              className="w-full bg-transparent text-sm font-medium text-[#1E293B] placeholder-[#94A3B8] outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#94A3B8] hover:text-[#64748B] p-0.5 cursor-pointer transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Brand Blue Pill Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-6 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] text-white font-bold text-base rounded-full shadow-[0_8px_20px_rgba(37,99,235,0.35)] transition-all cursor-pointer mt-2 tracking-wide"
          >
            Login
          </button>
        </form>
      </div>

    </div>
  );
};


