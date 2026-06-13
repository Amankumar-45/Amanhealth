/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  region: 'North' | 'South' | 'East' | 'West';
  admissionDate: string;
  dischargeDate: string | null;
  primaryDiagnosis: string;
  status: 'Inpatient' | 'Discharged';
  successRate: 'Success' | 'Treated' | 'Chronic' | 'Critical';
  treatmentCost: number;
  revenue: number;
  insuranceClaimAmount: number;
  laceScore: number; // LACE Index (0-19) for risk assessment
  comorbidities: string[];
  readmitted: boolean;
}

export interface PhysicianRecord {
  id: string;
  name: string;
  department: string;
  patientsTreated: number;
  successRate: number; // % success
  avgConsultationTime: number; // minutes
  activePatients: number;
}

export interface DiseaseTrend {
  month: string;
  Flu: number;
  Covid19: number;
  Diabetes: number;
  Hypertension: number;
  HeartDisease: number;
}

export interface FinancialDetail {
  month: string;
  revenue: number;
  costs: number;
  claims: number;
}

export interface PredictionResult {
  riskScore: number; // 0 to 100
  riskLevel: 'Low' | 'Moderate' | 'High';
  keyFactors: string[];
  preventiveMeasures: string[];
  explanation: string;
}

export interface OutbreakForecast {
  disease: string;
  currentCases: number;
  predictedPeakMonth: string;
  riskFactor: 'Low' | 'Moderate' | 'High' | 'Critical';
  preventativeRecommendations: string[];
}

export interface AppointmentRecord {
  id: string;
  patientName: string;
  doctorName: string;
  department: string;
  dateTime: string;
  status: 'Completed' | 'Cancelled' | 'Scheduled' | 'No-Show';
  waitTimeMin: number; // wait time in minutes
}

export interface BedRecord {
  id: string; // e.g., Bed-101A
  ward: string; // e.g., Intensive Care, Pediatrics
  roomNumber: string;
  status: 'Available' | 'Occupied' | 'Cleaning';
  patientId: string | null;
  patientName: string | null;
}

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

export interface SystemStats {
  activeStreamsCount: number;
  messageThroughput: number;
  cpuUtilization: number;
  networkIndex: string;
  clinicalBufferLoad: number;
}

