import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Bell, Wifi, WifiOff, Cpu, Database, Check, 
  AlertTriangle, Heart, Info, RefreshCw, Zap, BellRing, ClipboardList
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { VitalsTelemetry, TelemetryAlert, SystemStats } from '../types.ts';

interface TelemetryMonitorProps {
  userRole: 'cmo' | 'clinician';
}

export default function TelemetryMonitor({ userRole }: TelemetryMonitorProps) {
  const [records, setRecords] = useState<VitalsTelemetry[]>([]);
  const [alerts, setAlerts] = useState<TelemetryAlert[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    activeStreamsCount: 1,
    messageThroughput: 1.2,
    cpuUtilization: 14,
    networkIndex: 'Optimal (HTTP-SSE)',
    clinicalBufferLoad: 6
  });
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [ackInProgress, setAckInProgress] = useState<string | null>(null);
  
  // Reference for the EventSource connection
  const sseRef = useRef<EventSource | null>(null);
  
  // Polling fallback interval reference
  const pollIntervalRef = useRef<any>(null);

  // Initialize and connect stream
  const connectSSE = () => {
    // Clear any existing connection
    disconnectSSE();

    try {
      setConnectionError(false);
      const sse = new EventSource('/api/realtime/stream');
      sseRef.current = sse;

      sse.onopen = () => {
        setIsStreaming(true);
        setConnectionError(false);
      };

      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'init' || payload.type === 'update') {
            if (payload.records) {
              setRecords(payload.records);
              // Auto-select the first patient if nothing is selected
              if (payload.records.length > 0 && !selectedPatientId) {
                setSelectedPatientId(prev => prev || payload.records[0].patientId);
              }
            }
            if (payload.alerts) setAlerts(payload.alerts);
            if (payload.stats) setStats(payload.stats);
          }
        } catch (err) {
          console.error('Error parsing SSE telemetry message:', err);
        }
      };

      sse.onerror = (err) => {
        console.warn('SSE encountered a connection error, falling back to REST poll...', err);
        setIsStreaming(false);
        setConnectionError(true);
        // Trigger fallback REST polling immediately
        startPollingFallback();
      };
    } catch (e) {
      console.error('Failed to instantiate EventSource:', e);
      setIsStreaming(false);
      setConnectionError(true);
      startPollingFallback();
    }
  };

  const disconnectSSE = () => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    setIsStreaming(false);
  };

  // Fallback REST querying if EventSource stream is unavailable/blocked by browser sandbox
  const queryFallbackTelemetry = async () => {
    try {
      const res = await fetch('/api/realtime/telemetry');
      if (!res.ok) throw new Error('Query fallback returned error');
      const data = await res.json();
      
      if (data.records) {
        setRecords(data.records);
        if (data.records.length > 0 && !selectedPatientId) {
          setSelectedPatientId(prev => prev || data.records[0].patientId);
        }
      }
      if (data.alerts) setAlerts(data.alerts);
      if (data.stats) setStats(data.stats);
      setConnectionError(false);
    } catch (err) {
      console.error('Failed fallback querying:', err);
      setConnectionError(true);
    }
  };

  const startPollingFallback = () => {
    if (pollIntervalRef.current) return;
    // Initial immediate fetch
    queryFallbackTelemetry();
    pollIntervalRef.current = setInterval(queryFallbackTelemetry, 3000);
  };

  const stopPollingFallback = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    // Connect SSE stream on component mount
    connectSSE();

    return () => {
      disconnectSSE();
      stopPollingFallback();
    };
  }, []);

  const handleAcknowledgeAlert = async (alertId: string) => {
    if (ackInProgress) return;
    setAckInProgress(alertId);
    try {
      const res = await fetch(`/api/realtime/acknowledge/${alertId}`, {
        method: 'POST'
      });
      if (res.ok) {
        // Optimistically update or fetch latest fallback
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
      }
    } catch (err) {
      console.error('Could not acknowledge alarm:', err);
    } finally {
      setAckInProgress(null);
    }
  };

  const handleManualRefresh = async () => {
    await queryFallbackTelemetry();
  };

  // Find currently selected patient telemetry record
  const selectedRecord = records.find(r => r.patientId === selectedPatientId);

  // Helper colors for status
  const getStatusBorder = (status: 'Normal' | 'Warning' | 'Critical') => {
    if (status === 'Critical') return 'border-l-4 border-l-red-600 border-[#E5E7EB] bg-red-50/20';
    if (status === 'Warning') return 'border-l-4 border-l-amber-500 border-[#E5E7EB] bg-amber-50/20';
    return 'border-l-4 border-l-emerald-500 border-[#E5E7EB]';
  };

  const getStatusBadge = (status: 'Normal' | 'Warning' | 'Critical') => {
    if (status === 'Critical') return 'bg-red-100 text-red-700 animate-pulse font-extrabold';
    if (status === 'Warning') return 'bg-amber-100 text-amber-700 font-extrabold';
    return 'bg-emerald-100 text-emerald-700';
  };

  const getVitalLabelColor = (val: number, type: 'hr' | 'spo2' | 'rr' | 'temp') => {
    if (type === 'hr') {
      if (val > 120 || val < 45) return 'text-red-600 font-extrabold';
      if (val > 100 || val < 55) return 'text-amber-600 font-semibold';
      return 'text-emerald-700';
    }
    if (type === 'spo2') {
      if (val < 90) return 'text-red-600 font-extrabold';
      if (val < 94) return 'text-amber-600 font-semibold';
      return 'text-emerald-700';
    }
    if (type === 'rr') {
      if (val > 28 || val < 10) return 'text-red-500 font-extrabold';
      return 'text-gray-700';
    }
    if (type === 'temp') {
      if (val > 38.3 || val < 35.5) return 'text-red-500 font-extrabold';
      return 'text-gray-700';
    }
    return 'text-gray-700';
  };

  return (
    <div className="space-y-6" id="telemetry-monitor-panel">
      
      {/* Telemetry Stream Dashboard Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Connection Widget */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl flex items-center justify-between shadow-3xs" id="network-stat-card">
          <div className="flex items-center space-x-3 text-left">
            <div className={`p-3 rounded-full ${isStreaming ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
              {isStreaming ? (
                <Wifi className="h-5 w-5 animate-bounce" />
              ) : (
                <WifiOff className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Stream Status</p>
              <h4 className="text-sm font-extrabold text-[#1A1A1A] flex items-center">
                {isStreaming ? (
                  <>
                    <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2 animate-ping" />
                    Live SSE Pushing
                  </>
                ) : connectionError ? (
                  <>
                    <span className="inline-block w-2.5 h-2.5 bg-amber-500 rounded-full mr-2 animate-pulse" />
                    REST Poll Fallback
                  </>
                ) : (
                  'Connecting...'
                )}
              </h4>
            </div>
          </div>
          
          <button 
            onClick={isStreaming ? disconnectSSE : connectSSE}
            className="text-xs border border-[#E5E7EB] hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
          >
            {isStreaming ? 'Pause' : 'Re-connect'}
          </button>
        </div>

        {/* Messaging Throughput Widget */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl flex items-center space-x-3 text-left shadow-3xs">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Telemetry Throughput</p>
            <h4 className="text-base font-extrabold text-[#1A1A1A]">{stats.messageThroughput} ups/sec</h4>
            <p className="text-[10px] text-gray-450">Active feeds: {records.length} beds</p>
          </div>
        </div>

        {/* Server Process load widget */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl flex items-center space-x-3 text-left shadow-3xs">
          <div className="p-3 rounded-full bg-indigo-50 text-indigo-600">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Buffer CPU Strain</p>
            <h4 className="text-base font-extrabold text-[#1A1A1A]">{stats.cpuUtilization}%</h4>
            <p className="text-[10px] text-gray-450">Egress method: Keep-Alive Caching</p>
          </div>
        </div>

        {/* Active patients monitored count */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl flex items-center space-x-3 text-left shadow-3xs">
          <div className="p-3 rounded-full bg-[#1A1A1A]/5 text-[#1A1A1A]">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Linked Beds Load</p>
            <h4 className="text-base font-extrabold text-[#1A1A1A]">{stats.clinicalBufferLoad} Patients</h4>
            <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold font-mono uppercase">
              {stats.networkIndex}
            </span>
          </div>
        </div>

      </div>

      {/* Main split work dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Active beds stream index list (6 width) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#1A1A1A] uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-red-600 animate-pulse" />
              <span>Streaming Clinical Bed Boards</span>
            </h3>
            
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-1 rounded">
                Refreshes automated every 2.5s
              </span>
              <button 
                onClick={handleManualRefresh}
                className="p-1.5 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                title="Force Query REST telemetry"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {records.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center text-gray-400">
                <p className="text-sm font-semibold mb-2">No active inpatient telemetry detected</p>
                <p className="text-xs text-gray-450">Ensure beds have patients registered as "Inpatient" in the Patients sandbox.</p>
              </div>
            ) : (
              records.map(record => (
                <div 
                  key={record.patientId}
                  onClick={() => setSelectedPatientId(record.patientId)}
                  className={`bg-white border border-[#E5E7EB] hover:border-gray-300 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all text-left ${
                    selectedPatientId === record.patientId 
                      ? 'ring-2 ring-blue-600 border-transparent shadow-xs' 
                      : 'shadow-3xs'
                  } ${getStatusBorder(record.status)}`}
                >
                  
                  {/* Personal ID and room tags */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-xs font-bold text-[#1A1A1A] truncate">{record.patientName}</span>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-bold font-mono uppercase">
                      <span className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                        {record.roomNumber}
                      </span>
                      <span className="truncate">{record.ward}</span>
                    </div>
                  </div>

                  {/* High Frequency vitals stats block */}
                  <div className="grid grid-cols-4 gap-2 text-center md:text-right shrink-0 md:w-80">
                    
                    {/* HR */}
                    <div className="bg-gray-50 border border-gray-100 p-1.5 rounded-xl">
                      <div className="text-[9px] text-gray-400 uppercase font-mono font-bold flex items-center justify-center md:justify-end space-x-0.5">
                        <Heart className="w-3 h-3 text-red-500 fill-red-500 mr-0.5" />
                        <span>HR</span>
                      </div>
                      <div className={`text-sm font-extrabold ${getVitalLabelColor(record.heartRate, 'hr')}`}>
                        {record.heartRate}
                      </div>
                      <span className="text-[8px] text-gray-400 font-bold font-mono">bpm</span>
                    </div>

                    {/* SpO2 */}
                    <div className="bg-gray-50 border border-gray-100 p-1.5 rounded-xl">
                      <div className="text-[9px] text-gray-400 uppercase font-mono font-bold text-center md:text-right">
                        SpO2
                      </div>
                      <div className={`text-sm font-extrabold ${getVitalLabelColor(record.spO2, 'spo2')}`}>
                        {record.spO2}%
                      </div>
                      <span className="text-[8px] text-gray-400 font-bold font-mono">Oxygen</span>
                    </div>

                    {/* BP */}
                    <div className="bg-gray-50 border border-gray-100 p-1.5 rounded-xl">
                      <div className="text-[9px] text-gray-400 uppercase font-mono font-bold text-center md:text-right">
                        BP
                      </div>
                      <div className="text-xs font-extrabold text-gray-700 mt-0.5">
                        {record.bloodPressure}
                      </div>
                      <span className="text-[8px] text-gray-400 font-bold font-mono">mmHg</span>
                    </div>

                    {/* Temp & Resp */}
                    <div className="bg-gray-50 border border-gray-100 p-1.5 rounded-xl">
                      <div className="text-[9px] text-gray-400 uppercase font-mono font-bold text-center md:text-right">
                        Temp
                      </div>
                      <div className="text-xs font-extrabold text-gray-700 mt-0.5">
                        {record.temperature}°C
                      </div>
                      <span className="text-[8px] text-gray-400 font-bold font-mono">Resp: {record.respRate}</span>
                    </div>

                  </div>

                </div>
              ))
            )}
          </div>

          {/* Clinical Notifications Board */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-3xs overflow-hidden text-left" id="clinical-alarms-panel">
            <div className="bg-[#1A1A1A] text-white px-4 py-3 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
                <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Live Acute Alerts & Alarms Ring ({alerts.filter(a => !a.acknowledged).length})</span>
              </h4>
              <span className="text-[10px] text-gray-400 font-mono font-bold uppercase">Telemetry Sinks Log</span>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-5 text-center text-gray-400 text-xs">
                  Zero systemic clinical warnings triggered in current session. Vitals stable.
                </div>
              ) : (
                alerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`p-3.5 flex items-start justify-between gap-3 text-xs transition-colors ${
                      alert.acknowledged 
                        ? 'bg-gray-50/50 opacity-60' 
                        : alert.severity === 'Critical' 
                          ? 'bg-red-50/50 border-l-2 border-l-red-600' 
                          : 'bg-amber-50/50 border-l-2 border-l-amber-500'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded font-mono ${
                          alert.severity === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="font-bold text-[#1A1A1A]">{alert.patientName}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{alert.timestamp}</span>
                      </div>
                      <p className="text-gray-600 leading-normal font-sans">{alert.message}</p>
                    </div>

                    {!alert.acknowledged && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledgeAlert(alert.id);
                        }}
                        disabled={ackInProgress === alert.id}
                        className="text-[10px] shrink-0 font-bold bg-[#1A1A1A] hover:bg-blue-600 hover:text-white border border-[#E5E7EB] text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        {ackInProgress === alert.id ? (
                          <span>Processing...</span>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Ack</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Active Patient Telemetry Console & Real Time Charts (5 width) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-3xs p-5 space-y-5 text-left" id="active-telemetry-console">
            
            {/* Console Header */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex bg-gray-50 border border-gray-200 text-blue-800 text-[9px] font-bold tracking-widest uppercase py-1 px-2.5 rounded-full w-max mb-2">
                <ClipboardList className="h-3 w-3 mr-1" />
                <span>Primary Console Feed</span>
              </div>
              
              {selectedRecord ? (
                <div>
                  <h3 className="text-base font-extrabold text-[#1A1A1A]">{selectedRecord.patientName}</h3>
                  <div className="flex items-center space-x-3 text-[11px] text-gray-400 font-bold font-mono mt-1">
                    <span className="bg-[#1A1A1A] text-white text-[10px] font-semibold px-2 py-0.5 rounded font-mono uppercase">
                      {selectedRecord.roomNumber}
                    </span>
                    <span>{selectedRecord.ward}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-bold text-gray-450">Select a bed patient to open telemetry stream graphs</h3>
                </div>
              )}
            </div>

            {selectedRecord ? (
              <div className="space-y-6">
                
                {/* Visual Line Chart waveform simulator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-mono flex items-center">
                      <Activity className="w-3.5 h-3.5 text-red-500 mr-1.5 animate-pulse" />
                      Dynamic Waveform Tracker (ECG vs SpO2)
                    </span>
                    <span className="text-[9px] font-bold font-mono uppercase text-gray-450 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                      Live Series Interval 5000ms
                    </span>
                  </div>

                  {/* High quality recharts visual monitor */}
                  <div className="h-60 bg-[#1A1A1A] border border-[#1A1A1A] rounded-xl p-3 flex flex-col justify-between relative overflow-hidden font-mono text-white">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold border-b border-white/5 pb-1.5 uppercase select-none tracking-widest z-10">
                      <span>Telemetry Feed Graph</span>
                      <span className="text-emerald-400 font-bold flex items-center">
                        <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full mr-1.5 animate-ping" />
                        Active Stream
                      </span>
                    </div>

                    <div className="flex-1 w-full min-h-0 mt-2 text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedRecord.vitalsHistory} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
                          <XAxis 
                            dataKey="timestamp" 
                            stroke="#4B5563" 
                            fontSize={9} 
                            tickLine={false}
                          />
                          <YAxis 
                            stroke="#4B5563" 
                            fontSize={9} 
                            domain={[30, 160]} 
                            tickCount={6}
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="heartRate" 
                            stroke="#EF4444" 
                            strokeWidth={2.5} 
                            dot={false}
                            name="Pulses (BPM)"
                            activeDot={{ r: 4 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="spO2" 
                            stroke="#10B981" 
                            strokeWidth={2} 
                            dot={false} 
                            name="O2 Sat (%)"
                            activeDot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Waveform footer metrics */}
                    <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px] text-gray-400 font-medium font-mono">
                      <div className="flex items-center space-x-3.5">
                        <span className="flex items-center">
                          <span className="w-2.5 h-1 bg-[#EF4444] inline-block mr-1.5" /> HR: {selectedRecord.heartRate} bpm
                        </span>
                        <span className="flex items-center">
                          <span className="w-2.5 h-1 bg-[#10B981] inline-block mr-1.5" /> SpO2: {selectedRecord.spO2}%
                        </span>
                      </div>
                      <span className="text-gray-500">Node egress: Cloud Run IP</span>
                    </div>

                  </div>
                </div>

                {/* Vitals diagnostics index grid details */}
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans">
                    Secondary Clinical Assessments
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed text-[#1A1A1A]">
                    
                    <div className="border border-gray-150 p-3 rounded-xl bg-gray-50/50">
                      <span className="block text-[10px] text-gray-400 uppercase font-mono font-bold">Respiration Rate</span>
                      <p className="mt-0.5 text-sm font-extrabold text-gray-800">{selectedRecord.respRate} breaths/min</p>
                      <span className="text-[9px] text-gray-450 block leading-tight mt-0.5">Target: 12 - 20 range</span>
                    </div>

                    <div className="border border-gray-150 p-3 rounded-xl bg-gray-50/50">
                      <span className="block text-[10px] text-gray-400 uppercase font-mono font-bold">Normal Temperature</span>
                      <p className="mt-0.5 text-sm font-extrabold text-gray-800">{selectedRecord.temperature} °C</p>
                      <span className="text-[9px] text-gray-450 block leading-tight mt-0.5">Target: 36.5 - 37.5 range</span>
                    </div>

                    <div className="border border-gray-150 p-3 rounded-xl bg-gray-50/50 col-span-2">
                      <span className="block text-[10px] text-gray-400 uppercase font-mono font-bold">Ward Clearance & Protocol</span>
                      <p className="mt-1 text-xs text-gray-600 font-medium">
                        {selectedRecord.status === 'Critical' ? (
                          <span className="text-red-600 font-bold flex items-center">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-600 animate-pulse" />
                            CRITICAL: Dispatch clinical alert & notify {userRole === 'cmo' ? 'CMO On Duty' : 'Ward Clinician'} immediately.
                          </span>
                        ) : selectedRecord.status === 'Warning' ? (
                          <span className="text-amber-600 font-semibold flex items-center">
                            <Info className="w-3.5 h-3.5 mr-1" />
                            WARNING: Monitor symptoms, check IV alignment & baseline metrics.
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">
                            NORMAL: Vitals within standard physiological limits. Routine observation.
                          </span>
                        )}
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            ) : (
              <div className="py-16 text-center text-gray-400 text-xs">
                Select an inpatient bed row to load detailed waveform charts & secondary assessments.
              </div>
            )}

          </div>

          {/* Quick info sheet */}
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start space-x-3 text-left">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 leading-relaxed font-sans font-medium">
              <strong className="font-bold">Real-Time Dataset Architecture:</strong> 
              <p className="mt-0.5">
                Powered by a backend Event-Stream server (`/api/realtime/stream`) pushing structured updates over HTTP SSE standard. Client utilizes clean reconnection fallbacks on sandbox runtime hurdles.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
