import React, { useState, useMemo } from 'react';
import { BedRecord, PatientRecord } from '../types.ts';
import { 
  Activity, ShieldAlert, Calendar, RefreshCcw, AlertCircle, 
  Bell, Shield, Users 
} from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  selectedRegion: string;
  setSelectedRegion: (val: string) => void;
  apiKeyStatus: boolean;
  beds: BedRecord[];
  patients: PatientRecord[];
  userRole: 'cmo' | 'clinician';
  onChangeUserRole: (role: 'cmo' | 'clinician') => void;
}

export default function Header({
  onRefresh,
  isLoading,
  selectedRegion,
  setSelectedRegion,
  apiKeyStatus,
  beds,
  patients,
  userRole,
  onChangeUserRole
}: HeaderProps) {
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Dynamic warnings tracking
  const alerts = useMemo(() => {
    const list = [];
    
    // Inpatient occupancy tracking alert
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'Occupied').length;
    const rate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    
    if (rate > 85) {
      list.push({
        id: 'occupancy-crit',
        title: 'Bed Capacity Alert',
        message: `High bed occupancy warning: logistics load is critical at ${rate}% (${occupiedBeds}/${totalBeds} occupied).`,
        level: 'Critical'
      });
    } else if (rate > 65) {
      list.push({
        id: 'occupancy-warn',
        title: 'Active Bed Load',
        message: `Beds occupancy is moderately elevated at ${rate}%.`,
        level: 'Normal'
      });
    }

    // Epidemiology disease caseload trigger surveillance
    const diagnosisCounts: { [k: string]: number } = {};
    patients.forEach(p => {
      diagnosisCounts[p.primaryDiagnosis] = (diagnosisCounts[p.primaryDiagnosis] || 0) + 1;
    });

    Object.entries(diagnosisCounts).forEach(([diag, count]) => {
      if (count > 14) {
        list.push({
          id: `outbreak-${diag}`,
          title: `Diagnostic Intake Surge: ${diag}`,
          message: `Epidemic surveillance detected elevated active load of ${count} confirmed ${diag} admissions.`,
          level: 'Critical'
        });
      }
    });

    // Geriatric readmissions risks limits
    const riskyGeriatric = patients.filter(p => p.age > 65 && p.laceScore >= 11 && p.status === 'Inpatient');
    if (riskyGeriatric.length > 0) {
      list.push({
        id: 'geriatric-lace',
        title: 'Geriatric Risk Audit',
        message: `${riskyGeriatric.length} high-risk geriatric inpatient cases (LACE index >= 11) flagged for post-discharge transitional planning.`,
        level: 'Warning'
      });
    }

    return list;
  }, [beds, patients]);

  return (
    <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-xs" id="dashboard-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Activity className="h-4.5 w-4.5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-[#1A1A1A]">MedPulse</h1>
              <p className="text-[10px] text-gray-400 font-medium">Regional Monitoring Node • Project Reference</p>
            </div>
          </div>

          {/* Quick Actions & Filters */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Role Select (Discoverable Accessibility) */}
            <div className="flex items-center space-x-1.5 border-r border-[#E5E7EB] pr-3 select-none">
              <span className="text-[10px] text-gray-400 font-bold uppercase font-mono">Role:</span>
              <select
                id="header-role-select"
                value={userRole}
                onChange={(e: any) => onChangeUserRole(e.target.value)}
                className="bg-gray-50 border border-[#E5E7EB] text-[#1A1A1A] text-[11px] rounded-full font-bold px-2.5 py-1 focus:ring-1 focus:ring-blue-600 transition-all outline-none cursor-pointer"
              >
                <option value="cmo">CMO Admin</option>
                <option value="clinician">Clinician (View-Only)</option>
              </select>
            </div>

            {/* Region Filter */}
            <div className="flex items-center space-x-1.5">
              <label htmlFor="header-region-select" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Region:</label>
              <select
                id="header-region-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-gray-50 border border-[#E5E7EB] text-[#1A1A1A] text-xs rounded-full font-medium px-3 py-1 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all outline-hidden cursor-pointer"
              >
                <option value="All">All Regions</option>
                <option value="North">North Sector</option>
                <option value="South">South Sector</option>
                <option value="East">East Sector</option>
                <option value="West">West Sector</option>
              </select>
            </div>

            {/* AI Status Badge */}
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              apiKeyStatus 
              ? 'bg-blue-50 text-blue-700 border-[#E5E7EB]' 
              : 'bg-orange-50 text-orange-700 border-[#E5E7EB]'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${apiKeyStatus ? 'bg-blue-600 animate-pulse' : 'bg-orange-500'}`} />
              <span className="font-sans text-[11px]">{apiKeyStatus ? 'Gemini AI Engaged' : 'Simulated Analytics'}</span>
            </div>

            {/* Dynamic Alarm Bell Trigger */}
            <div className="relative">
              <button
                id="header-alerts-bell"
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-full border border-[#E5E7EB] transition-all cursor-pointer relative"
                title="Clinical Alerts Center"
              >
                <Bell className="h-3.5 w-3.5" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-[9px] font-bold text-white flex items-center justify-center animate-pulse scale-90">
                    {alerts.length}
                  </span>
                )}
              </button>

              {/* Notification Popup Deck */}
              {showNotificationPanel && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl z-50 p-4 space-y-3" id="alerts-popup-center">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold text-[#1A1A1A] flex items-center space-x-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-blue-600" />
                      <span>Surveillance Notifications</span>
                    </span>
                    <button 
                      onClick={() => setShowNotificationPanel(false)}
                      className="text-[10px] text-gray-400 font-bold hover:text-[#1A1A1A]"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="py-5 text-center text-xs text-gray-400 italic">
                        🏥 All clinical systems operating within normal parameters.
                      </div>
                    ) : (
                      alerts.map((al, idx) => (
                        <div 
                          key={al.id || idx} 
                          className={`p-2.5 rounded-xl border text-left text-xs space-y-1 ${
                            al.level === 'Critical' 
                              ? 'bg-red-50/50 border-red-100 text-red-950' 
                              : al.level === 'Warning'
                              ? 'bg-amber-50/50 border-amber-100 text-amber-900'
                              : 'bg-blue-50/50 border-blue-100 text-blue-950'
                          }`}
                        >
                          <div className="flex justify-between items-center font-bold">
                            <span>{al.title}</span>
                            <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.2 rounded-sm ${
                              al.level === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {al.level}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-gray-500 font-medium leading-normal">{al.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-2 text-center text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                    Automatic Refreshes active
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Trigger */}
            <button
              id="refresh-btn"
              onClick={onRefresh}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-full border border-[#E5E7EB] transition-all cursor-pointer"
              title="Refresh Core Insights"
              disabled={isLoading}
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

