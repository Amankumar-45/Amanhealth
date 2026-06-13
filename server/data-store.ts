import { PatientRecord, PhysicianRecord, DiseaseTrend, FinancialDetail } from '../src/types.ts';

// Initial state for doctors
export let physicians: PhysicianRecord[] = [
  { id: 'p1', name: 'Dr. Sarah Jenkins', department: 'Cardiology', patientsTreated: 124, successRate: 94, avgConsultationTime: 22, activePatients: 12 },
  { id: 'p2', name: 'Dr. Marcus Vance', department: 'Endocrinology', patientsTreated: 98, successRate: 88, avgConsultationTime: 18, activePatients: 15 },
  { id: 'p3', name: 'Dr. Elena Rostova', department: 'General Medicine', patientsTreated: 310, successRate: 91, avgConsultationTime: 14, activePatients: 28 },
  { id: 'p4', name: 'Dr. Robert Chen', department: 'Pediatrics', patientsTreated: 185, successRate: 96, avgConsultationTime: 15, activePatients: 8 },
  { id: 'p5', name: 'Dr. Amira Patel', department: 'Emergency', patientsTreated: 420, successRate: 85, avgConsultationTime: 12, activePatients: 5 },
  { id: 'p6', name: 'Dr. Thomas Warren', department: 'Neurology', patientsTreated: 76, successRate: 92, avgConsultationTime: 25, activePatients: 9 },
];

// Initial state for monthly trends
export const diseaseTrends: DiseaseTrend[] = [
  { month: 'Jan', Flu: 120, Covid19: 85, Diabetes: 64, Hypertension: 110, HeartDisease: 42 },
  { month: 'Feb', Flu: 145, Covid19: 98, Diabetes: 68, Hypertension: 115, HeartDisease: 40 },
  { month: 'Mar', Flu: 95, Covid19: 72, Diabetes: 70, Hypertension: 120, HeartDisease: 45 },
  { month: 'Apr', Flu: 40, Covid19: 55, Diabetes: 72, Hypertension: 118, HeartDisease: 43 },
  { month: 'May', Flu: 25, Covid19: 42, Diabetes: 75, Hypertension: 122, HeartDisease: 48 },
  { month: 'Jun', Flu: 15, Covid19: 30, Diabetes: 78, Hypertension: 125, HeartDisease: 50 },
];

// Initial state for financial dashboard
export const financialDetails: FinancialDetail[] = [
  { month: 'Jan', revenue: 154000, costs: 112000, claims: 98000 },
  { month: 'Feb', revenue: 168000, costs: 125000, claims: 110000 },
  { month: 'Mar', revenue: 162000, costs: 119000, claims: 104000 },
  { month: 'Apr', revenue: 145000, costs: 105000, claims: 89000 },
  { month: 'May', revenue: 159000, costs: 114000, claims: 95000 },
  { month: 'Jun', revenue: 175000, costs: 128000, claims: 112000 },
];

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const diagnoses = [
  { disease: 'Flu', cost: 1200, revenue: 1500, claim: 1300 },
  { disease: 'Covid-19', cost: 4500, revenue: 5800, claim: 5200 },
  { disease: 'Diabetes', cost: 2500, revenue: 3200, claim: 2800 },
  { disease: 'Hypertension', cost: 1800, revenue: 2400, claim: 2100 },
  { disease: 'Heart Disease', cost: 12000, revenue: 15500, claim: 14000 },
  { disease: 'Pneumonia', cost: 6000, revenue: 7800, claim: 7000 },
  { disease: 'Asthma', cost: 1500, revenue: 2000, claim: 1800 },
];

const regions = ['North', 'South', 'East', 'West'] as const;
const genders = ['Male', 'Female'] as const;
const outcomes = ['Success', 'Treated', 'Chronic', 'Critical'] as const;

// Generate realistic mock records
function generateMockPatients(count: number): PatientRecord[] {
  const records: PatientRecord[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const age = Math.floor(Math.random() * 65) + 15; // 15 to 80
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    
    // Select disease
    const diagObj = diagnoses[Math.floor(Math.random() * diagnoses.length)];
    
    // Choose admission & discharge date
    const daysAgo = Math.floor(Math.random() * 150) + 10;
    const adminDateObj = new Date(now);
    adminDateObj.setDate(now.getDate() - daysAgo);
    
    const status = Math.random() > 0.15 ? 'Discharged' : 'Inpatient';
    let dischargeDateObj: Date | null = null;
    let dischargeStr = null;
    
    if (status === 'Discharged') {
      dischargeDateObj = new Date(adminDateObj);
      dischargeDateObj.setDate(adminDateObj.getDate() + Math.floor(Math.random() * 14) + 1);
      dischargeStr = dischargeDateObj.toISOString().split('T')[0];
    }

    const laceScore = Math.floor(Math.random() * 15); // LACE risk score
    
    // Find comorbidities
    const possibleComorb = ['Obesity', 'Smoking History', 'Chronic Kidney Disease', 'COPD', 'Prior Stroke', 'Anemia'];
    const comorbCount = Math.floor(Math.random() * 3);
    const comorbidities: string[] = [];
    while (comorbidities.length < comorbCount) {
      const c = possibleComorb[Math.floor(Math.random() * possibleComorb.length)];
      if (!comorbidities.includes(c)) comorbidities.push(c);
    }

    // Determine if readmitted randomly based on LACE score (higher score -> higher chance)
    const readmissionChance = laceScore / 20 + (comorbidities.length * 0.1);
    const readmitted = status === 'Discharged' && Math.random() < readmissionChance;

    records.push({
      id: `pat-${1000 + i}`,
      name: `${fn} ${ln}`,
      age,
      gender,
      region,
      admissionDate: adminDateObj.toISOString().split('T')[0],
      dischargeDate: dischargeStr,
      primaryDiagnosis: diagObj.disease,
      status,
      successRate: outcomes[Math.floor(Math.random() * outcomes.length)],
      treatmentCost: diagObj.cost + Math.floor(Math.random() * 500) - 250,
      revenue: diagObj.revenue + Math.floor(Math.random() * 800) - 400,
      insuranceClaimAmount: diagObj.claim + Math.floor(Math.random() * 600) - 300,
      laceScore,
      comorbidities,
      readmitted
    });
  }

  return records;
}

export let patients: PatientRecord[] = generateMockPatients(85);

export function addPatient(patient: Omit<PatientRecord, 'id' | 'readmitted'>) {
  const id = `pat-${1000 + patients.length + 1}`;
  
  // Calculate readmitted chance based on laceScore
  const readmissionChance = patient.laceScore / 20 + (patient.comorbidities.length * 0.1);
  const readmitted = patient.status === 'Discharged' && Math.random() < readmissionChance;

  const newRecord: PatientRecord = {
    ...patient,
    id,
    readmitted
  };
  patients.unshift(newRecord); // Add to the front

  // Optionally update physician treated stats
  const deptMap: { [key: string]: string } = {
    'Cardiology': 'Cardiology',
    'Diabetes': 'Endocrinology',
    'Hypertension': 'General Medicine',
    'Flu': 'General Medicine',
    'Covid-19': 'General Medicine',
    'Pneumonia': 'Emergency',
    'Asthma': 'Pediatrics'
  };
  const targetDept = deptMap[patient.primaryDiagnosis] || 'General Medicine';
  const doc = physicians.find(p => p.department === targetDept);
  if (doc) {
    doc.patientsTreated += 1;
    if (patient.status === 'Inpatient') {
      doc.activePatients += 1;
    }
  }

  return newRecord;
}

export function updatePatient(id: string, updates: Partial<PatientRecord>) {
  const index = patients.findIndex(p => p.id === id);
  if (index !== -1) {
    patients[index] = { ...patients[index], ...updates };
    return patients[index];
  }
  return null;
}

export function deletePatient(id: string) {
  const index = patients.findIndex(p => p.id === id);
  if (index !== -1) {
    const removed = patients[index];
    patients.splice(index, 1);
    return removed;
  }
  return null;
}

// Stateful Appointment Records
import { AppointmentRecord, BedRecord } from '../src/types.ts';

const appointmentStatuses: ('Completed' | 'Cancelled' | 'Scheduled' | 'No-Show')[] = [
  'Completed', 'Cancelled', 'Scheduled', 'No-Show', 'Completed', 'Completed', 'Scheduled'
];

function generateMockAppointments(): AppointmentRecord[] {
  const list: AppointmentRecord[] = [];
  const doctorsList = physicians.map(d => d.name);
  const deptList = physicians.map(d => d.department);
  const now = new Date();

  for (let i = 0; i < 45; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const docIdx = Math.floor(Math.random() * physicians.length);
    const doc = physicians[docIdx];
    
    // Appointment dynamic date (some past, some future)
    const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days
    const apptDate = new Date(now);
    apptDate.setDate(now.getDate() + daysOffset);
    apptDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 4) * 15, 0, 0);

    const status = daysOffset < 0 
      ? (Math.random() > 0.15 ? 'Completed' : 'Cancelled')
      : (Math.random() > 0.2 ? 'Scheduled' : 'No-Show');

    // Wait time: completed appointments have actual wait times (e.g., 5 to 75 minutes)
    const waitTimeMin = status === 'Completed' ? Math.floor(Math.random() * 55) + 10 : 0;

    list.push({
      id: `apt-${2000 + i}`,
      patientName: `${fn} ${ln}`,
      doctorName: doc.name,
      department: doc.department,
      dateTime: apptDate.toISOString(),
      status,
      waitTimeMin
    });
  }
  // Sort by date descending
  return list.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

export let appointments: AppointmentRecord[] = generateMockAppointments();

export function addAppointment(appt: Omit<AppointmentRecord, 'id'>) {
  const id = `apt-${2000 + appointments.length + 1}`;
  const newAppt: AppointmentRecord = { ...appt, id };
  appointments.unshift(newAppt);
  
  // Update physician patientsTreated if Completed
  if (appt.status === 'Completed') {
    const doc = physicians.find(p => p.name === appt.doctorName);
    if (doc) doc.patientsTreated += 1;
  }
  return newAppt;
}

export function updateAppointment(id: string, updates: Partial<AppointmentRecord>) {
  const index = appointments.findIndex(a => a.id === id);
  if (index !== -1) {
    const old = appointments[index];
    appointments[index] = { ...old, ...updates };
    
    // Dynamic effects on doctor stats
    if (updates.status === 'Completed' && old.status !== 'Completed') {
      const doc = physicians.find(p => p.name === appointments[index].doctorName);
      if (doc) doc.patientsTreated += 1;
    }
    return appointments[index];
  }
  return null;
}

// Bed Mapping Setup (45 physical beds)
function generateMockBeds(): BedRecord[] {
  const list: BedRecord[] = [];
  const wards = ['Intensive Care Unit', 'Pediatrics Ward', 'Cardiology Division', 'General Medical Wing', 'Emergency Room'];
  const totalBeds = 32;

  // Let's seed with some patient links from our live in-memory patient database
  const activeInpatients = patients.filter(p => p.status === 'Inpatient');

  for (let i = 0; i < totalBeds; i++) {
    const roomNum = 100 + Math.floor(i / 3) + 1;
    const letter = ['A', 'B', 'C'][i % 3];
    const ward = wards[i % wards.length];
    
    let status: 'Available' | 'Occupied' | 'Cleaning' = 'Available';
    let patientId = null;
    let patientName = null;

    // Link live inpatient if available
    if (i < activeInpatients.length) {
      status = 'Occupied';
      patientId = activeInpatients[i].id;
      patientName = activeInpatients[i].name;
    } else if (Math.random() < 0.1) {
      status = 'Cleaning';
    }

    list.push({
      id: `bed-${100 + i}`,
      ward,
      roomNumber: `${roomNum}${letter}`,
      status,
      patientId,
      patientName
    });
  }
  return list;
}

export let beds: BedRecord[] = generateMockBeds();

export function updateBedStatus(id: string, updates: Partial<BedRecord>) {
  const idx = beds.findIndex(b => b.id === id);
  if (idx !== -1) {
    beds[idx] = { ...beds[idx], ...updates };
    return beds[idx];
  }
  return null;
}

export function setPhysicianActive(id: string, updates: Partial<PhysicianRecord>) {
  const idx = physicians.findIndex(d => d.id === id);
  if (idx !== -1) {
    physicians[idx] = { ...physicians[idx], ...updates };
    return physicians[idx];
  }
  return null;
}

export function addPhysician(doc: Omit<PhysicianRecord, 'id'>) {
  const id = `p${physicians.length + 1}`;
  const newDoc: PhysicianRecord = { ...doc, id };
  physicians.push(newDoc);
  return newDoc;
}

