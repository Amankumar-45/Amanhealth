import React, { useState } from 'react';
import { BedRecord, PatientRecord } from '../types.ts';
import { ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, UserPlus, Trash2 } from 'lucide-react';

interface BedOccupancyTrackerProps {
  beds: BedRecord[];
  patients: PatientRecord[];
  userRole: 'cmo' | 'clinician';
  onUpdateBed: (bedId: string, updates: Partial<BedRecord>) => Promise<any>;
}

export default function BedOccupancyTracker({
  beds,
  patients,
  userRole,
  onUpdateBed
}: BedOccupancyTrackerProps) {
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [assigningBedId, setAssigningBedId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const wards = ['All', 'Intensive Care Unit', 'Pediatrics Ward', 'Cardiology Division', 'General Medical Wing', 'Emergency Room'];

  // Filter beds
  const filteredBeds = selectedWard === 'All' 
    ? beds 
    : beds.filter(b => b.ward === selectedWard);

  // Compute logistics
  const totalCount = filteredBeds.length;
  const occupiedCount = filteredBeds.filter(b => b.status === 'Occupied').length;
  const cleaningCount = filteredBeds.filter(b => b.status === 'Cleaning').length;
  const availableCount = filteredBeds.filter(b => b.status === 'Available').length;
  const occupancyRate = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0;

  // Filter patients that are currently "Inpatient" but DO NOT have an assigned bed already
  const waitingPatients = patients.filter(p => {
    if (p.status !== 'Inpatient') return false;
    // Check if patient already occupies a bed
    const hasBed = beds.some(b => b.patientId === p.id);
    return !hasBed;
  });

  const handleBedAction = async (bed: BedRecord) => {
    setIsUpdating(bed.id);
    try {
      if (bed.status === 'Occupied') {
        // Discharge/Free the bed and set to cleaning
        await onUpdateBed(bed.id, {
          status: 'Cleaning',
          patientId: null,
          patientName: null
        });
      } else if (bed.status === 'Cleaning') {
        // Set to available
        await onUpdateBed(bed.id, {
          status: 'Available'
        });
      } else if (bed.status === 'Available') {
        // Trigger assignment selection modal/form
        setAssigningBedId(bed.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(null);
    }
  };

  const submitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningBedId || !selectedPatientId) return;

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    setIsUpdating(assigningBedId);
    try {
      await onUpdateBed(assigningBedId, {
        status: 'Occupied',
        patientId: patient.id,
        patientName: patient.name
      });
      setAssigningBedId(null);
      setSelectedPatientId('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 space-y-6" id="bed-occupancy-tracker">
      {/* Tracker Header Logistics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-[#1A1A1A]">Smart Bed Allocation & Logistics</h3>
          <p className="text-xs text-gray-400">Manage triage wards, bed status changes, and real-time inpatient assignments</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {wards.map(w => (
            <button
              key={w}
              onClick={() => setSelectedWard(w)}
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                selectedWard === w 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-50 text-gray-400 hover:text-[#1A1A1A] border border-[#E5E7EB]'
              }`}
            >
              {w === 'All' ? 'All Wards' : w.replace(' Ward', '').replace(' Division', '').replace(' Wing', '')}
            </button>
          ))}
        </div>
      </div>

      {/* KPI stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 border border-[#E5E7EB] p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Occupancy Rate</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-xl font-extrabold text-[#1A1A1A]">{occupancyRate}%</span>
            <span className="text-[10px] text-gray-400 font-medium">calculated</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyRate > 85 ? 'bg-red-500' : occupancyRate > 65 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Available Beds</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-xl font-extrabold text-emerald-800">{availableCount}</span>
            <span className="text-[10px] text-emerald-600 font-medium">Beds ready</span>
          </div>
          <span className="text-[9px] text-emerald-600 font-semibold mt-2 block">Direct intake capable</span>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Cleaning & Sanitizing</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-xl font-extrabold text-amber-800">{cleaningCount}</span>
            <span className="text-[10px] text-amber-600 font-medium">Beds offline</span>
          </div>
          <span className="text-[9px] text-amber-600 font-semibold mt-2 block">Turnaround protocol active</span>
        </div>

        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Active Occupied</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-xl font-extrabold text-blue-800">{occupiedCount}</span>
            <span className="text-[10px] text-blue-600 font-medium">patients admitted</span>
          </div>
          <span className="text-[9px] text-blue-600 font-semibold mt-2 block">Inward census matched</span>
        </div>
      </div>

      {occupancyRate > 85 && (
        <div className="bg-red-50 border border-red-100 p-3.5 rounded-2xl flex items-start space-x-2.5 text-red-900 text-xs text-left">
          <ShieldAlert className="h-4.5 w-4.5 text-red-500 mt-0.5 shrink-0 animate-bounce" />
          <div className="space-y-0.5">
            <strong className="font-bold">CRITICAL SYSTEM CAPACITY TRIGGER:</strong>
            <p className="text-red-700 font-medium leading-relaxed">
              Occupancy rate for {selectedWard === 'All' ? 'the entire hospital' : selectedWard} has exceeded <strong>85%</strong>. Consider diverting emergency admissions to secondary care networks or expediting pending safe discharge workflows.
            </p>
          </div>
        </div>
      )}

      {/* Grid Floor Map of Beds */}
      <div className="space-y-3.5">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Clinical Floor Layout Grid</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filteredBeds.map(b => {
            const isSelected = assigningBedId === b.id;
            return (
              <div 
                key={b.id} 
                className={`relative rounded-2xl p-3 border transition-all text-left flex flex-col text-xs font-semibold justify-between h-28 ${
                  b.status === 'Occupied' 
                    ? 'bg-blue-50/40 border-blue-200 text-blue-900' 
                    : b.status === 'Cleaning'
                    ? 'bg-amber-50/40 border-amber-200 text-amber-900' 
                    : 'bg-white border-[#E5E7EB] text-[#1A1A1A] hover:border-blue-400'
                } ${isSelected ? 'ring-2 ring-blue-600 scale-95 shadow-xs' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] font-bold tracking-tight text-gray-400">{b.roomNumber}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      b.status === 'Occupied' ? 'bg-blue-600 animate-pulse' : b.status === 'Cleaning' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  </div>
                  <div className="text-[10px] text-gray-400 leading-tight truncate" title={b.ward}>
                    {b.ward.replace('Intensive Care Unit', 'ICU').replace('Division', '').replace('Ward', '').replace('Medical Wing', 'Med-Wing')}
                  </div>
                </div>

                <div className="mt-2.5">
                  {b.status === 'Occupied' ? (
                    <div className="space-y-1">
                      <div className="text-[10px] text-blue-800 font-extrabold truncate" title={b.patientName || ''}>
                        {b.patientName}
                      </div>
                      <span className="text-[9px] text-blue-500 font-mono tracking-tight block truncate uppercase">
                        ID: {b.patientId}
                      </span>
                    </div>
                  ) : b.status === 'Cleaning' ? (
                    <div className="text-[9px] text-amber-700 italic flex items-center space-x-1 font-medium">
                      <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                      <span>Sanitizing...</span>
                    </div>
                  ) : (
                    <div className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">
                      Ready For Intake
                    </div>
                  )}
                </div>

                {/* Overlaid Actions */}
                <div className="mt-2.5 pt-2 border-t border-dashed border-[#E5E7EB] flex items-center justify-between">
                  {userRole === 'clinician' ? (
                    <span className="text-[8px] text-gray-400 italic">authorized only</span>
                  ) : (
                    <button
                      onClick={() => handleBedAction(b)}
                      disabled={isUpdating === b.id}
                      className="text-[9px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center space-x-1 font-bold"
                    >
                      {isUpdating === b.id ? (
                        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                      ) : b.status === 'Occupied' ? (
                        <span>Mark Empty</span>
                      ) : b.status === 'Cleaning' ? (
                        <span>Set Active</span>
                      ) : (
                        <span className="text-emerald-700 hover:text-emerald-800">Assign Patient</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assigning Patient Dropdown Sheet */}
      {assigningBedId && (
        <form onSubmit={submitAssignment} className="bg-gray-50 border border-[#E5E7EB] p-4 rounded-2xl text-left space-y-3.5 max-w-lg">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#1A1A1A]">Assign Inpatient to Bed: {beds.find(b => b.id === assigningBedId)?.roomNumber}</h4>
            <button 
              type="button" 
              onClick={() => setAssigningBedId(null)}
              className="text-xs text-gray-400 hover:text-[#1A1A1A] font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-2">
            <label htmlFor="patient-bed-select" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Choose Unassigned Inpatient Case</label>
            {waitingPatients.length === 0 ? (
              <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-gray-500">
                ⚠️ No unassigned active Inpatients in the datastore. Admit a new inpatient via the Interactive Patient Sandbox first!
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  id="patient-bed-select"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="flex-1 bg-white border border-[#E5E7EB] text-xs font-semibold rounded-xl p-2.5 text-[#1A1A1A] outline-none"
                  required
                >
                  <option value="">-- Choose patient --</option>
                  {waitingPatients.map(wp => (
                    <option key={wp.id} value={wp.id}>
                      {wp.name} ({wp.age} | {wp.primaryDiagnosis} | LACE {wp.laceScore})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!selectedPatientId || isUpdating !== null}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Assign</span>
                </button>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
