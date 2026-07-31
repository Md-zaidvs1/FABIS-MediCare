import React, { useState, useEffect } from 'react';
import { ChairStatus, Patient } from '../../types';
import { INITIAL_CHAIR_STATUSES } from '../../data/initialData';
import { formatTodayISO } from '../../utils/formatters';
import { Activity, Clock, RefreshCw, User, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

interface ChairManagementGridProps {
  patients: Patient[];
  onSelectPatient?: (patientId: string) => void;
}

export const ChairManagementGrid: React.FC<ChairManagementGridProps> = ({
  patients,
  onSelectPatient,
}) => {
  const [chairs, setChairs] = useState<ChairStatus[]>(INITIAL_CHAIR_STATUSES);

  useEffect(() => {
    const todayStr = formatTodayISO();
    const activeInChairApts: { chair: string; patientId: string; patientName: string; procedure: string; timeSlot: string }[] = [];
    patients.forEach((p) => {
      p.appointments.forEach((apt) => {
        if (apt.date === todayStr && apt.status === 'In-Chair') {
          activeInChairApts.push({
            chair: apt.chair,
            patientId: p.id,
            patientName: p.name,
            procedure: apt.procedure,
            timeSlot: apt.timeSlot,
          });
        }
      });
    });

    if (activeInChairApts.length > 0) {
      setChairs((prev) =>
        prev.map((c) => {
          const matchingApt = activeInChairApts.find(
            (a) => a.chair === c.id || c.id.startsWith(a.chair) || c.name.includes(a.chair.split(' ')[0])
          );
          if (matchingApt) {
            return {
              ...c,
              status: 'Occupied',
              currentPatientId: matchingApt.patientId,
              currentPatientName: matchingApt.patientName,
              currentProcedure: matchingApt.procedure,
              startTime: matchingApt.timeSlot,
            };
          }
          return c;
        })
      );
    }
  }, [patients]);

  const handleUpdateStatus = (chairId: string, newStatus: ChairStatus['status']) => {
    setChairs((prev) =>
      prev.map((c) => {
        if (c.id === chairId) {
          if (newStatus === 'Available' || newStatus === 'Sanitizing') {
            return {
              ...c,
              status: newStatus,
              currentPatientId: undefined,
              currentPatientName: undefined,
              currentProcedure: undefined,
            };
          }
          return { ...c, status: newStatus };
        }
        return c;
      })
    );
  };

  const statusColors: Record<ChairStatus['status'], { bg: string; border: string; text: string; dot: string }> = {
    Available: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    Occupied: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-900', dot: 'bg-amber-500' },
    Sanitizing: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-800', dot: 'bg-sky-500' },
    Reserved: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' },
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#9a7814] flex items-center justify-center font-black text-sm">
            💺
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
              <span>Dental Chairs & Operatory Management</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                Live Status
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500">Real-time occupancy tracking for Chair 1, Chair 2, & Surgical Suite</p>
          </div>
        </div>
      </div>

      {/* Grid of Chairs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {chairs.map((chair) => {
          const cfg = statusColors[chair.status];

          return (
            <div
              key={chair.id}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 ${cfg.bg} ${cfg.border} shadow-2xs hover:shadow-xs overflow-hidden flex flex-col justify-between`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-zinc-900 flex items-center gap-1.5 break-words">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} animate-pulse shrink-0`} />
                  <span className="break-words">{chair.name}</span>
                </span>

                <select
                  value={chair.status}
                  onChange={(e) => handleUpdateStatus(chair.id, e.target.value as any)}
                  className={`w-fit shrink-0 whitespace-nowrap text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${cfg.text} bg-white shadow-2xs font-bold outline-none`}
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied (In-Chair)</option>
                  <option value="Sanitizing">Sanitizing / Cleaning</option>
                  <option value="Reserved">Reserved</option>
                </select>
              </div>

              {/* Occupant Info */}
              {chair.status === 'Occupied' && chair.currentPatientName ? (
                <div className="p-3 bg-white rounded-xl border border-zinc-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-extrabold text-zinc-900 flex items-center gap-1 min-w-0 break-words">
                      <User className="w-3.5 h-3.5 text-[#3BA7F5] shrink-0" />
                      <span className="break-words">{chair.currentPatientName}</span>
                    </span>

                    {chair.currentPatientId && onSelectPatient && (
                      <button
                        type="button"
                        onClick={() => onSelectPatient(chair.currentPatientId!)}
                        className="text-[10px] font-bold text-[#3BA7F5] hover:underline cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        Open EMR →
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] text-zinc-600 font-medium break-words">
                    Procedure: <span className="font-bold text-zinc-800">{chair.currentProcedure}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-100 flex-wrap gap-x-2 gap-y-0.5">
                    <span className="whitespace-nowrap">Started: {chair.startTime || '10:15 AM'}</span>
                    <span className="whitespace-nowrap">Doctor: {chair.doctorName}</span>
                  </div>
                </div>
              ) : chair.status === 'Sanitizing' ? (
                <div className="p-3 bg-white/80 rounded-xl border border-sky-200 text-xs text-sky-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-medium">
                  <span className="flex items-center gap-1.5 min-w-0 break-words">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-sky-600" />
                    <span className="break-words">Sanitation Protocol Active</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(chair.id, 'Available')}
                    className="w-fit shrink-0 whitespace-nowrap text-[10px] font-bold text-sky-900 underline cursor-pointer"
                  >
                    Mark Ready
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-medium">
                  <span className="break-words">✓ Clean & Ready for Patient</span>
                  <span className="w-fit shrink-0 whitespace-nowrap text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full border border-emerald-300">
                    Ready
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
