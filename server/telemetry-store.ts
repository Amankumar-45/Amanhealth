import { patients } from './data-store.ts';
import { EventEmitter } from 'events';

export interface VitalsTelemetry {
  patientId: string;
  patientName: string;
  ward: string;
  roomNumber: string;
  heartRate: number;
  bloodPressure: string;
  spO2: number;
  respRate: number;
  temperature: number;
  status: 'Normal' | 'Warning' | 'Critical';
  vitalsHistory: {
    timestamp: string;
    heartRate: number;
    spO2: number;
  }[];
}

export interface TelemetryAlert {
  id: string;
  timestamp: string;
  patientId: string;
  patientName: string;
  message: string;
  severity: 'Warning' | 'Critical';
  acknowledged: boolean;
}

export const telemetryEmitter = new EventEmitter();

// Initial active telemetry records
export let telemetryRecords: VitalsTelemetry[] = [];
export let telemetryAlerts: TelemetryAlert[] = [];

// Track clients running
let activeClients = 0;

export function incrementActiveClients() {
  activeClients++;
  telemetryEmitter.emit('stats_update', getSystemStats());
}

export function decrementActiveClients() {
  activeClients = Math.max(0, activeClients - 1);
  telemetryEmitter.emit('stats_update', getSystemStats());
}

export function getSystemStats() {
  const liveInpatientCount = patients.filter(p => p.status === 'Inpatient').length;
  return {
    activeStreamsCount: activeClients || 1, // At least 1 simulated dashboard subscriber
    messageThroughput: Number((1.2 + Math.random() * 0.6).toFixed(1)),
    cpuUtilization: Math.floor(14 + Math.random() * 6),
    networkIndex: 'Optimal (HTTP-SSE)',
    clinicalBufferLoad: liveInpatientCount
  };
}

// Map of baseline values for each patient to stay realistic
const patientBaselines: { [key: string]: { hr: number; bp: number; spo2: number; rr: number; temp: number } } = {};

export function initializeTelemetry() {
  const activeInpatients = patients.filter(p => p.status === 'Inpatient').slice(0, 6);
  
  const defaultWards = [
    'Emergency Bay Room', 
    'ICU Isolation Unit', 
    'Cardiology Division', 
    'Respiratory Ward 4', 
    'Pediatric ICU Block', 
    'Neurological Care Unit'
  ];
  
  telemetryRecords = activeInpatients.map((p, idx) => {
    // Generate static baselines
    let baseHR = 70 + Math.floor(Math.random() * 15);
    let baseBP = 112 + Math.floor(Math.random() * 15);
    let baseSpO2 = 96 + Math.floor(Math.random() * 4);
    let baseRR = 14 + Math.floor(Math.random() * 4);
    let baseTemp = 36.6 + parseFloat((Math.random() * 0.6).toFixed(1));

    if (p.primaryDiagnosis === 'Heart Disease') {
      baseHR = 84; 
      baseBP = 138; 
    } else if (p.primaryDiagnosis === 'Pneumonia' || p.primaryDiagnosis === 'Asthma') {
      baseSpO2 = 94; 
      baseRR = 18;
    }

    patientBaselines[p.id] = { hr: baseHR, bp: baseBP, spo2: baseSpO2, rr: baseRR, temp: baseTemp };

    // Generate history back-filled with slightly varied readings
    const history = [];
    const now = new Date();
    for (let h = 12; h >= 0; h--) {
      const timeStr = new Date(now.getTime() - h * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      history.push({
        timestamp: timeStr,
        heartRate: Math.round(baseHR + (Math.random() * 6 - 3)),
        spO2: Math.min(100, Math.round(baseSpO2 + (Math.random() * 2 - 1)))
      });
    }

    const roomNum = 200 + (idx * 3) + 1;
    const roomChar = ['A', 'B'][idx % 2];

    return {
      patientId: p.id,
      patientName: p.name,
      ward: defaultWards[idx % defaultWards.length],
      roomNumber: `${roomNum}${roomChar}`,
      heartRate: baseHR,
      bloodPressure: `${baseBP}/${Math.round(baseBP * 0.65)}`,
      spO2: baseSpO2,
      respRate: baseRR,
      temperature: baseTemp,
      status: 'Normal',
      vitalsHistory: history
    };
  });

  // Seed with initial telemetry system boots alerts
  if (activeInpatients.length > 0) {
    telemetryAlerts = [
      {
        id: `alert-init-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        patientId: activeInpatients[0].id,
        patientName: activeInpatients[0].name,
        message: `Vitals Stream online. Linked in-memory hospital patient matrix successfully.`,
        severity: 'Warning',
        acknowledged: false
      }
    ];
  }
}

// Periodically update vitals simulation
export function updateTelemetryVitals() {
  if (telemetryRecords.length === 0) {
    initializeTelemetry();
    return;
  }

  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  telemetryRecords = telemetryRecords.map(item => {
    const baseline = patientBaselines[item.patientId] || { hr: 75, bp: 120, spo2: 98, rr: 16, temp: 36.8 };
    
    // Fluctuations
    let hrChange = Math.floor(Math.random() * 5) - 2; // -2 to +2
    let spo2Change = Math.floor(Math.random() * 3) - 1; // -1 to +1
    let rrChange = Math.floor(Math.random() * 3) - 1; // -1 to +1
    let tempChange = parseFloat((Math.random() * 0.14 - 0.07).toFixed(2)); // -0.07 to +0.07

    // Introduce telemetry event/spike on 12% probability
    if (Math.random() < 0.12) {
      if (Math.random() > 0.5) {
        // Pulse rate hike
        hrChange = Math.random() > 0.4 ? 20 : -12;
      } else {
        // Drop oxygen
        spo2Change = -3;
      }
    }

    const finalHR = Math.min(Math.max(item.heartRate + hrChange, 40), 160);
    const finalSpO2 = Math.min(Math.max(item.spO2 + spo2Change, 84), 100);
    const finalRR = Math.min(Math.max(item.respRate + rrChange, 8), 32);
    const finalTemp = parseFloat((item.temperature + tempChange).toFixed(1));

    // Calculate Dynamic Blood Pressure relative to heart rate
    const sBP = Math.min(Math.max(Math.round(baseline.bp + (finalHR - baseline.hr) * 0.35 + (Math.random() * 4 - 2)), 80), 180);
    const dBP = Math.round(sBP * 0.64 + (Math.random() * 4 - 2));

    // Identify Status Level
    let status: 'Normal' | 'Warning' | 'Critical' = 'Normal';
    if (finalHR > 120 || finalHR < 45 || finalSpO2 < 90) {
      status = 'Critical';
    } else if (finalHR > 100 || finalHR < 55 || finalSpO2 < 93 || finalTemp > 38.1) {
      status = 'Warning';
    }

    // Trigger alert if status is not safe
    if (status !== 'Normal' && item.status !== status && Math.random() < 0.8) {
      let message = '';
      if (finalHR > 120) message = `Tachycardia detected: Heart rate peaked at ${finalHR} bpm (critical range).`;
      else if (finalHR < 45) message = `Bradycardia event: Pulse slowed to ${finalHR} bpm in CCU unit.`;
      else if (finalSpO2 < 90) message = `Respiratory Distress: Oxygen saturation dropped critically to ${finalSpO2}%.`;
      else if (finalTemp > 38.1) message = `Fever Alert: Body temperature elevated at ${finalTemp}°C.`;
      else message = `Anomalous stats: Active evaluation suggested for ${item.patientName}.`;

      const newAlert: TelemetryAlert = {
        id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString(),
        patientId: item.patientId,
        patientName: item.patientName,
        message,
        severity: status === 'Critical' ? 'Critical' : 'Warning',
        acknowledged: false
      };
      
      telemetryAlerts.unshift(newAlert);
      if (telemetryAlerts.length > 20) {
        telemetryAlerts.pop();
      }

      telemetryEmitter.emit('alert', newAlert);
    }

    const newHistory = [...item.vitalsHistory, { timestamp: nowStr, heartRate: finalHR, spO2: finalSpO2 }];
    if (newHistory.length > 15) {
      newHistory.shift();
    }

    return {
      ...item,
      heartRate: finalHR,
      bloodPressure: `${sBP}/${dBP}`,
      spO2: finalSpO2,
      respRate: finalRR,
      temperature: finalTemp,
      status,
      vitalsHistory: newHistory
    };
  });

  // Broadcast update to all listeners
  telemetryEmitter.emit('update', {
    records: telemetryRecords,
    alerts: telemetryAlerts,
    stats: getSystemStats()
  });
}

let simulationRef: any = null;

export function startTelemetrySimulation() {
  if (simulationRef) return;
  initializeTelemetry();
  // Call immediately, then schedule
  updateTelemetryVitals();
  simulationRef = setInterval(updateTelemetryVitals, 2500);
}

export function stopTelemetrySimulation() {
  if (simulationRef) {
    clearInterval(simulationRef);
    simulationRef = null;
  }
}

export function acknowledgeAlert(alertId: string) {
  const alert = telemetryAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    telemetryEmitter.emit('update', {
      records: telemetryRecords,
      alerts: telemetryAlerts,
      stats: getSystemStats()
    });
  }
}
