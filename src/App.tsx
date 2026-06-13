import React, { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import KPICard from './components/KPICard.tsx';
import PowerBICharts from './components/PowerBICharts.tsx';
import PredictiveAnalytics from './components/PredictiveAnalytics.tsx';
import PatientManager from './components/PatientManager.tsx';
import AnalyticsCopilot from './components/AnalyticsCopilot.tsx';
import BedOccupancyTracker from './components/BedOccupancyTracker.tsx';
import AppointmentAnalytics from './components/AppointmentAnalytics.tsx';
import AdminReports from './components/AdminReports.tsx';
import TelemetryMonitor from './components/TelemetryMonitor.tsx';
import { PatientRecord, PhysicianRecord, DiseaseTrend, FinancialDetail, PredictionResult, OutbreakForecast, AppointmentRecord, BedRecord } from './types.ts';
import { 
  Users, TrendingUp, DollarSign, Activity, Award, BrainCircuit, 
  Database, FileSpreadsheet, Bot, Sparkles, AlertCircle, LayoutDashboard,
  Shield, CalendarRange
} from 'lucide-react';

export default function App() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [physicians, setPhysicians] = useState<PhysicianRecord[]>([]);
  const [diseaseTrends, setDiseaseTrends] = useState<DiseaseTrend[]>([]);
  const [financialDetails, setFinancialDetails] = useState<FinancialDetail[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [beds, setBeds] = useState<BedRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'predictions' | 'records' | 'copilot' | 'admin'>('dashboard');
  const [dashboardSubTab, setDashboardSubTab] = useState<'charts' | 'beds' | 'appointments' | 'telemetry'>('charts');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [apiKeyStatus, setApiKeyStatus] = useState(false);
  const [userRole, setUserRole] = useState<'cmo' | 'clinician'>('cmo');

  // Real CDC/WHO Public Health Data sync state
  const [realDataStatus, setRealDataStatus] = useState<{
    active: boolean;
    timestamp: string;
    source: string;
    nationalSummary?: {
      totalCasesWeekly: number;
      mainSurgeType: string;
      alertLevel: string;
      vaccineUptake: string;
    };
    textInsights?: string;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch all core datasets from Express backend server
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [pRes, phRes, tRes, fRes, sRes, apptRes, bedRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/physicians'),
        fetch('/api/trends'),
        fetch('/api/financials'),
        fetch('/api/dashboard/summary'),
        fetch('/api/appointments'),
        fetch('/api/beds')
      ]);

      const patientsData = await pRes.json();
      const physiciansData = await phRes.json();
      const trendsData = await tRes.json();
      const financialsData = await fRes.json();
      const summaryData = await sRes.json();
      const apptData = await apptRes.json();
      const bedData = await bedRes.json();

      setPatients(patientsData);
      setPhysicians(physiciansData);
      setDiseaseTrends(trendsData);
      setFinancialDetails(financialsData);
      setSummary(summaryData);
      setAppointments(apptData);
      setBeds(bedData);

      // Probe API key configuration state
      // We check if a prediction assessment operates on live Gemini or defaults to simulation
      const probeRes = await fetch('/api/predict/readmission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ laceScore: 1 })
      });
      const probeData = await probeRes.json();
      if (probeData && probeData.explanation && !probeData.explanation.includes('[Simulated')) {
        setApiKeyStatus(true);
      } else {
        setApiKeyStatus(false);
      }

      // Fetch CDC real dataset sync status
      const statusRes = await fetch('/api/real-data/status');
      const statusData = await statusRes.json();
      setRealDataStatus(statusData);

    } catch (err) {
      console.error('Core data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRealDataSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/real-data/sync', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setRealDataStatus(data.syncSummary);
        if (data.trends && data.trends.length > 0) {
          setDiseaseTrends(data.trends);
        }
        // Keep primary core counts in sync
        const summaryRes = await fetch('/api/dashboard/summary');
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }
    } catch (err) {
      console.error('CDC Real Data Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter patients by active region selections
  const filteredPatients = selectedRegion === 'All' 
    ? patients 
    : patients.filter(p => p.region === selectedRegion);

  // Compute local KPI aggregates reflecting active region filter
  const localSummary = React.useMemo(() => {
    if (filteredPatients.length === 0) return { totalCount: 0, inpatients: 0, revenue: 0, successRate: 0 };
    
    const inpatients = filteredPatients.filter(p => p.status === 'Inpatient').length;
    const revenue = filteredPatients.reduce((sum, p) => sum + p.revenue, 0);
    const successCount = filteredPatients.filter(p => p.successRate === 'Success' || p.successRate === 'Treated').length;
    const successRate = Math.round((successCount / filteredPatients.length) * 100);

    return {
      totalCount: filteredPatients.length,
      inpatients,
      revenue,
      successRate
    };
  }, [filteredPatients]);

  // Actions handlers linked to server mutators
  const handleAddPatient = async (patientData: Omit<PatientRecord, 'id' | 'readmitted'>) => {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    const result = await res.json();
    await fetchAllData(); // Refresh metrics consistent with new row adding
    return result;
  };

  const handleDischargePatient = async (id: string) => {
    const res = await fetch(`/api/patients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Discharged', dischargeDate: new Date().toISOString().split('T')[0] })
    });
    const result = await res.json();
    await fetchAllData();
    return result;
  };

  const handleDeletePatient = async (id: string) => {
    const res = await fetch(`/api/patients/${id}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    await fetchAllData();
    return result;
  };

  const handlePredictReadmission = async (predictionPayload: any): Promise<PredictionResult> => {
    const res = await fetch('/api/predict/readmission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(predictionPayload)
    });
    return await res.json();
  };

  const handleForecastOutbreak = async (forecastPayload: any): Promise<{ forecasts: OutbreakForecast[] }> => {
    const res = await fetch('/api/predict/outbreak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forecastPayload)
    });
    return await res.json();
  };

  const handleSendMessageToCopilot = async (message: string): Promise<string> => {
    const res = await fetch('/api/copilot/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: message })
    });
    const result = await res.json();
    return result.response || 'Co-pilot response error';
  };

  const handleUpdateBed = async (bedId: string, updates: Partial<BedRecord>) => {
    const res = await fetch(`/api/beds/${bedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const result = await res.json();
    await fetchAllData();
    return result;
  };

  const handleAddAppointment = async (apptData: Omit<AppointmentRecord, 'id'>) => {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apptData)
    });
    const result = await res.json();
    await fetchAllData();
    return result;
  };

  const handleUpdateAppointment = async (id: string, updates: Partial<AppointmentRecord>) => {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const result = await res.json();
    await fetchAllData();
    return result;
  };

  const handleAddPhysician = async (physicianData: Omit<PhysicianRecord, 'id'>) => {
    const res = await fetch('/api/physicians', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(physicianData)
    });
    const result = await res.json();
    await fetchAllData();
    return result;
  };


  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#1A1A1A] flex flex-col font-sans" id="app-workspace-root">
      
      {/* Header Banner */}
      <Header 
        onRefresh={fetchAllData} 
        isLoading={isLoading} 
        selectedRegion={selectedRegion} 
        setSelectedRegion={setSelectedRegion}
        apiKeyStatus={apiKeyStatus}
        beds={beds}
        patients={patients}
        userRole={userRole}
        onChangeUserRole={setUserRole}
      />

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        
        {/* Banner Explaining Project Strengths */}
        <div className="bg-[#1A1A1A] border border-[#1A1A1A] p-6 rounded-3xl text-white shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6" id="project-overview-panel">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center space-x-2 bg-white/10 border border-white/20 text-white text-[9px] font-bold tracking-widest uppercase py-1 px-3 rounded-full w-max">
              <Sparkles className="h-3 w-3" />
              <span>Full-Stack Final Year Project (FYP) Reference</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white font-sans">Clinical Decision Support & Health Analytics Engine</h2>
            <p className="text-sm text-gray-400 max-w-2xl font-sans font-semibold leading-relaxed">
              Combines modular databases, live patient records manipulation, and advanced analytical reporting boards with <strong>Gemini AI Predictive Learning models</strong> for readmissions risk score tracking and epidemiology surge forecasting.
            </p>
          </div>
          <div className="flex md:flex-col lg:flex-row gap-3 relative z-10 shrink-0 select-none font-sans font-semibold">
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl flex items-center space-x-2.5">
              <Database className="h-4.5 w-4.5 text-gray-300" />
              <div className="text-left leading-none">
                <div className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider">Database Source</div>
                <div className="text-xs font-bold font-sans text-white mt-1">Stateful HIS Memory</div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl flex items-center space-x-2.5">
              <BrainCircuit className="h-4.5 w-4.5 text-gray-300 animate-pulse" />
              <div className="text-left leading-none">
                <div className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider">Prediction AI</div>
                <div className="text-xs font-bold font-sans text-white mt-1">Gemini 3.5 Deep Insights</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex border border-[#E5E7EB] bg-white p-1 rounded-full shadow-3xs" id="workspace-navigator">
          <nav className="flex flex-1 space-x-1">
            <button
              id="tab-trigger-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 font-extrabold text-white shadow-3xs'
                  : 'text-gray-450 hover:text-[#1A1A1A] hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Analytical Dashboard Layout</span>
            </button>
            <button
              id="tab-trigger-predictions"
              onClick={() => setActiveTab('predictions')}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'predictions'
                  ? 'bg-blue-600 font-extrabold text-white shadow-3xs'
                  : 'text-gray-450 hover:text-[#1A1A1A] hover:bg-gray-50'
              }`}
            >
              <BrainCircuit className="h-4 w-4" />
              <span>Predictive ML Calculator</span>
            </button>
            <button
              id="tab-trigger-records"
              onClick={() => setActiveTab('records')}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'records'
                  ? 'bg-blue-600 font-extrabold text-white shadow-3xs'
                  : 'text-gray-450 hover:text-[#1A1A1A] hover:bg-gray-50'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Interactive Patient Sandbox</span>
            </button>
            <button
              id="tab-trigger-copilot"
              onClick={() => setActiveTab('copilot')}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'copilot'
                  ? 'bg-blue-600 font-extrabold text-white shadow-3xs'
                  : 'text-gray-450 hover:text-[#1A1A1A] hover:bg-gray-50'
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>Clinical Insights Copilot</span>
            </button>
            <button
              id="tab-trigger-admin"
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-blue-600 font-extrabold text-white shadow-3xs'
                  : 'text-gray-450 hover:text-[#1A1A1A] hover:bg-gray-50'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Admin Panel & Reports</span>
            </button>
          </nav>
        </div>

        {/* Content Renderers */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3" id="main-spinner">
            <Activity className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-xs font-semibold text-gray-500 animate-pulse uppercase tracking-widest">Querying Hospital Datastore Systems...</p>
          </div>
        ) : (
          <div className="space-y-6" id="active-tab-panel">
            
            {/* TAB 1: Clinical Analytics Power BI Grid */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in" id="dashboard-tab-content">
                
                {/* Dashboard layout subviews selector */}
                <div className="flex bg-white border border-[#E5E7EB] p-2 rounded-2xl md:items-center justify-between flex-wrap gap-4 text-left shadow-3xs">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 font-bold">Monitor:</span>
                    <div className="flex bg-gray-50 border border-[#E5E7EB] rounded-full p-1 space-x-1">
                      <button
                        onClick={() => setDashboardSubTab('charts')}
                        className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                          dashboardSubTab === 'charts' 
                            ? 'bg-[#1A1A1A] text-white shadow-3xs' 
                            : 'text-gray-400 hover:text-[#1A1A1A]'
                        }`}
                      >
                        📊 Clinical Core Charts
                      </button>
                      <button
                        onClick={() => setDashboardSubTab('beds')}
                        className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                          dashboardSubTab === 'beds' 
                            ? 'bg-[#1A1A1A] text-white shadow-3xs' 
                            : 'text-gray-400 hover:text-[#1A1A1A]'
                        }`}
                      >
                        🛏️ Bed Occupancy Logistics
                      </button>
                      <button
                        onClick={() => setDashboardSubTab('appointments')}
                        className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                          dashboardSubTab === 'appointments' 
                            ? 'bg-[#1A1A1A] text-white shadow-3xs' 
                            : 'text-gray-400 hover:text-[#1A1A1A]'
                        }`}
                      >
                        📅 Wait Times & Schedules
                      </button>
                      <button
                        onClick={() => setDashboardSubTab('telemetry')}
                        className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                          dashboardSubTab === 'telemetry' 
                            ? 'bg-[#1A1A1A] text-white shadow-3xs' 
                            : 'text-gray-400 hover:text-[#1A1A1A]'
                        }`}
                      >
                        📡 ICU Live Telemetry
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase font-mono bg-gray-50 border border-[#E5E7EB] px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shrink-0 select-none">
                    <Database className="w-3.5 h-3.5 text-blue-600" />
                    <span>Selected Region: {selectedRegion === 'All' ? 'Whole Network' : selectedRegion}</span>
                  </div>
                </div>

                {/* Active Public Health Data Sync Banner */}
                <div className="bg-[#f9fafb] border border-[#E5E7EB] p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-3xs" id="cdc-live-sync-banner">
                  <div className="flex items-start space-x-3.5 text-left">
                    <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0 mt-0.5">
                      <TrendingUp className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <h4 className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider font-mono">Epidemic Data Feed Connection</h4>
                        <span className={`text-[10px] px-2.5 py-0.5 font-bold rounded-full ${
                          realDataStatus?.active 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {realDataStatus?.active ? '🛰️ Active CDC/WHO Datastream' : '📊 Simulated Dataset Mode'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 max-w-xl">
                        {realDataStatus?.active 
                          ? `Currently visualizing live country and weekly regional clinical outcomes. Fed via ${realDataStatus.source}.`
                          : 'Currently reading optimized outpatient metrics reflecting seasonal baselines. Connect to the national open disease registry to query live CDC averages.'
                        }
                      </p>
                      {realDataStatus?.textInsights && (
                        <div className="mt-2.5 bg-white border border-[#E5E7EB] p-3 rounded-2xl text-[11px] text-gray-600 italic leading-relaxed shadow-3xs max-w-2xl">
                          <strong>Clinical Advisory:</strong> {realDataStatus.textInsights}
                        </div>
                      )}
                      {realDataStatus?.active && (
                        <p className="text-[10px] text-gray-400 font-mono mt-1.5 font-bold">
                          Last Updated & Synced: {realDataStatus.timestamp}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={handleRealDataSync}
                      disabled={isSyncing}
                      className={`text-xs font-bold px-4 py-2.5 rounded-2xl border flex items-center space-x-2 transition-all cursor-pointer ${
                        isSyncing
                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white hover:bg-gray-50 border-[#E5E7EB] text-gray-700 shadow-3xs hover:shadow-2xs active:bg-gray-100'
                      }`}
                    >
                      <Database className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Synchronizing Live Records...' : 'Sync Live CDC/WHO Database'}</span>
                    </button>
                  </div>
                </div>

                {dashboardSubTab === 'charts' && (
                  <>
                    {/* KPI Cards Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <KPICard 
                        title="Total Area Admissions" 
                        value={localSummary.totalCount} 
                        subtitle={`Registered caseload in ${selectedRegion === 'All' ? 'all regional' : `${selectedRegion} sector`} clinics`}
                        icon={Users}
                        colorClass="text-blue-600"
                        bgClass="bg-blue-50"
                      />
                      <KPICard 
                        title="Clinic Success Rating" 
                        value={`${localSummary.successRate}%`} 
                        subtitle="Discharged stable / Success index ratio"
                        icon={Award}
                        colorClass="text-emerald-600"
                        bgClass="bg-emerald-50"
                      />
                      <KPICard 
                        title="Active Bed Occupancy" 
                        value={localSummary.inpatients} 
                        subtitle="Active admitted inpatient census"
                        icon={Activity}
                        colorClass="text-amber-600"
                        bgClass="bg-amber-50"
                      />
                      <KPICard 
                        title="Total Billed Revenue" 
                        value={`$${localSummary.revenue.toLocaleString()}`} 
                        subtitle={`Generated overall in ${selectedRegion} sector`}
                        icon={DollarSign}
                        colorClass="text-indigo-600"
                        bgClass="bg-indigo-50"
                      />
                    </div>

                    {/* Dashboard Visualization Panels */}
                    <PowerBICharts 
                      diseaseTrends={diseaseTrends}
                      financialDetails={financialDetails}
                      physicians={physicians}
                      patients={filteredPatients}
                    />
                  </>
                )}

                {dashboardSubTab === 'beds' && (
                  <BedOccupancyTracker 
                    beds={beds}
                    patients={patients}
                    userRole={userRole}
                    onUpdateBed={handleUpdateBed}
                  />
                )}

                {dashboardSubTab === 'appointments' && (
                  <AppointmentAnalytics 
                    appointments={appointments}
                    physicians={physicians}
                    userRole={userRole}
                    onAddAppointment={handleAddAppointment}
                    onUpdateAppointment={handleUpdateAppointment}
                  />
                )}

                {dashboardSubTab === 'telemetry' && (
                  <TelemetryMonitor 
                    userRole={userRole}
                  />
                )}
              </div>
            )}

            {/* TAB 2: AI ML Predictive Playground */}
            {activeTab === 'predictions' && (
              <div className="animate-fade-in" id="predictions-tab-content">
                <PredictiveAnalytics 
                  patients={filteredPatients}
                  onPredictReadmission={handlePredictReadmission}
                  onForecastOutbreak={handleForecastOutbreak}
                />
              </div>
            )}

            {/* TAB 3: Patients Records management Sandbox */}
            {activeTab === 'records' && (
              <div className="animate-fade-in" id="records-tab-content bg-white">
                <div className="mb-4 bg-white border border-[#E5E7EB] p-4 rounded-3xl text-gray-500 text-xs flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="font-semibold font-sans leading-relaxed">
                    <strong className="text-[#1A1A1A]">Stateful In-Memory Sandbox:</strong> Modifications here (Admitting new patient case profiles, Discharging current inpatients, deleting old folders) updates the Power BI charts and live stats totals in real-time. Feel free to interactively audit outcomes.
                  </p>
                </div>
                <PatientManager 
                  patients={filteredPatients}
                  onAddPatient={handleAddPatient}
                  onDischargePatient={handleDischargePatient}
                  onDeletePatient={handleDeletePatient}
                />
              </div>
            )}

            {/* TAB 4: Chief Medical Information Officer (Copilot Assistant) */}
            {activeTab === 'copilot' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="copilot-tab-content">
                <div className="lg:col-span-8">
                  <AnalyticsCopilot 
                    onSendMessage={handleSendMessageToCopilot}
                    apiKeyStatus={apiKeyStatus}
                  />
                </div>
                <div className="lg:col-span-4 bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-5 shadow-3xs flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A] pb-2 border-b border-[#E5E7EB]">Assistant System Brief</h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-white rounded-2xl border border-[#E5E7EB] text-gray-500 font-semibold text-xs leading-relaxed">
                        <strong className="text-blue-600 block mb-1">Interactive Dataset Binding & Parsing</strong> The Assistant has a dynamic local parser that binds to the core Hospital database records. When you make modifications inside the <em>Interactive Patient Sandbox</em> tab, your chat answers adapt instantly!
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-[#E5E7EB] text-gray-500 font-semibold text-xs leading-relaxed">
                        <strong className="text-[#1A1A1A] block mb-1">Live Academic Guardrails</strong> Under Sandbox rules, the assistant analyzes diagnostic distributions, billing parameters, regional trends, and patient counts accurately.
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-[#E5E7EB] pt-4 text-[9px] text-[#1A1A1A] font-mono leading-normal uppercase tracking-wider font-bold">
                    Designed for FYP Demonstrations • Healthcare Decision Support Engine
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: System Admin Panel & Reports */}
            {activeTab === 'admin' && (
              <div className="animate-fade-in text-left" id="admin-tab-content">
                <AdminReports 
                  physicians={physicians}
                  patients={patients}
                  financials={financialDetails}
                  userRole={userRole}
                  onChangeUserRole={setUserRole}
                  onAddPhysician={handleAddPhysician}
                />
              </div>
            )}

          </div>
        )}

      </main>

      {/* Hospital System Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-8 text-center text-xs text-gray-400 font-sans font-semibold" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="text-gray-500">© 2026 Hospital Informatics Group. Developed as a Computer Science Final Year Project (Health-tech Systems).</p>
          <p className="text-[9px] text-gray-400 font-mono font-bold uppercase tracking-wider">Operational Status • Sandboxed Local Memory Store Integration</p>
        </div>
      </footer>

    </div>
  );
}
