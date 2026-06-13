import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { OutbreakForecast } from './src/types.ts';
import { 
  patients, 
  physicians, 
  diseaseTrends, 
  financialDetails, 
  addPatient, 
  updatePatient, 
  deletePatient,
  appointments,
  beds,
  addAppointment,
  updateAppointment,
  updateBedStatus,
  addPhysician,
  setPhysicianActive
} from './server/data-store.ts';
import {
  telemetryRecords,
  telemetryAlerts,
  getSystemStats,
  startTelemetrySimulation,
  acknowledgeAlert,
  telemetryEmitter,
  incrementActiveClients,
  decrementActiveClients
} from './server/telemetry-store.ts';
import {
  lastSyncedData,
  syncRealWorldDatabase
} from './server/real-data-service.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'MOCK_KEY', // Fallback if not injected yet
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper: Check if Gemini Key is active
const isGeminiEnabled = () => {
  return process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
};

// ==========================================
// 1. DATA AND ANALYTICS ENDPOINTS
// ==========================================

// Get all patients
app.get('/api/patients', (req, res) => {
  res.json(patients);
});

// Add a patient
app.post('/api/patients', (req, res) => {
  try {
    const newRecord = addPatient(req.body);
    res.status(201).json(newRecord);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update a patient
app.patch('/api/patients/:id', (req, res) => {
  const updated = updatePatient(req.params.id, req.body);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Patient not found' });
  }
});

// Delete a patient
app.delete('/api/patients/:id', (req, res) => {
  const deleted = deletePatient(req.params.id);
  if (deleted) {
    res.json(deleted);
  } else {
    res.status(404).json({ error: 'Patient not found' });
  }
});

// Get physicians
app.get('/api/physicians', (req, res) => {
  res.json(physicians);
});

// Get disease trends over time (monthly series)
app.get('/api/trends', (req, res) => {
  res.json(diseaseTrends);
});

// Get real CDC/WHO database sync status
app.get('/api/real-data/status', (req, res) => {
  res.json(lastSyncedData);
});

// Post trigger real CDC/WHO database sync
app.post('/api/real-data/sync', async (req, res) => {
  try {
    const result = await syncRealWorldDatabase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to sync with CDC/WHO databases: ' + err.message });
  }
});

// Get financial details database
app.get('/api/financials', (req, res) => {
  res.json(financialDetails);
});

// GET all appointments
app.get('/api/appointments', (req, res) => {
  res.json(appointments);
});

// POST new appointment
app.post('/api/appointments', (req, res) => {
  try {
    const fresh = addAppointment(req.body);
    res.status(201).json(fresh);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH existing appointment status or wait times
app.patch('/api/appointments/:id', (req, res) => {
  const updated = updateAppointment(req.params.id, req.body);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Appointment not found' });
  }
});

// GET all clinical bed maps
app.get('/api/beds', (req, res) => {
  res.json(beds);
});

// PATCH occupy or clean bed status
app.patch('/api/beds/:id', (req, res) => {
  const updated = updateBedStatus(req.params.id, req.body);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Bed not found' });
  }
});

// POST new active physician practitioner Profile
app.post('/api/physicians', (req, res) => {
  try {
    const newDoc = addPhysician(req.body);
    res.status(201).json(newDoc);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH physician performance indicators
app.patch('/api/physicians/:id', (req, res) => {
  const updated = setPhysicianActive(req.params.id, req.body);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Physician not found' });
  }
});


// ==========================================
// 1B. REAL-TIME VITAL TELEMETRY STREAM ENDPOINTS
// ==========================================

// Get static latest telemetry status
app.get('/api/realtime/telemetry', (req, res) => {
  res.json({
    records: telemetryRecords,
    alerts: telemetryAlerts,
    stats: getSystemStats()
  });
});

// Acknowledge clinical alarm
app.post('/api/realtime/acknowledge/:alertId', (req, res) => {
  acknowledgeAlert(req.params.alertId);
  res.json({ success: true, message: 'Alert acknowledged' });
});

// Serve-Sent Events (SSE) telemetry broadcast stream
app.get('/api/realtime/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Mark client as active
  incrementActiveClients();

  // Send initial load
  res.write(`data: ${JSON.stringify({
    type: 'init',
    records: telemetryRecords,
    alerts: telemetryAlerts,
    stats: getSystemStats()
  })}\n\n`);

  // Listener to broadcast updates
  const onUpdate = (payload: any) => {
    res.write(`data: ${JSON.stringify({
      type: 'update',
      ...payload
    })}\n\n`);
  };

  telemetryEmitter.on('update', onUpdate);

  req.on('close', () => {
    telemetryEmitter.off('update', onUpdate);
    decrementActiveClients();
  });
});


// Comprehensive Dashboard Aggregations endpoint
app.get('/api/dashboard/summary', (req, res) => {
  const total = patients.length;
  if (total === 0) {
    return res.json({
      totalPatients: 0,
      inpatientsCount: 0,
      revenueTotal: 0,
      costsTotal: 0,
      netProfit: 0,
      demographics: { male: 0, female: 0, other: 0 },
      ageGroups: { '15-30': 0, '31-45': 0, '46-60': 0, '61+': 0 },
      diseases: {},
      regional: {},
      successRate: 0,
    });
  }

  const inpatientsCount = patients.filter(p => p.status === 'Inpatient').length;
  const revenueTotal = patients.reduce((sum, p) => sum + p.revenue, 0);
  const costsTotal = patients.reduce((sum, p) => sum + p.treatmentCost, 0);
  const netProfit = revenueTotal - costsTotal;

  // Gender demographics
  const maleCount = patients.filter(p => p.gender === 'Male').length;
  const femaleCount = patients.filter(p => p.gender === 'Female').length;
  const otherCount = patients.filter(p => p.gender === 'Other').length;

  // Age group demographics
  let ageGroups = { '15-30': 0, '31-45': 0, '46-60': 0, '61+': 0 };
  patients.forEach(p => {
    if (p.age <= 30) ageGroups['15-30']++;
    else if (p.age <= 45) ageGroups['31-45']++;
    else if (p.age <= 60) ageGroups['46-60']++;
    else ageGroups['61+']++;
  });

  // Disease distribution
  const diseases: { [key: string]: number } = {};
  patients.forEach(p => {
    diseases[p.primaryDiagnosis] = (diseases[p.primaryDiagnosis] || 0) + 1;
  });

  // Regional patient volume
  const regional: { [key: string]: number } = {};
  patients.forEach(p => {
    regional[p.region] = (regional[p.region] || 0) + 1;
  });

  // Success Rates estimation (% patients with 'Success' or 'Treated')
  const successfulTreatments = patients.filter(p => p.successRate === 'Success' || p.successRate === 'Treated').length;
  const successRate = Math.round((successfulTreatments / total) * 100);

  res.json({
    totalPatients: total,
    inpatientsCount,
    revenueTotal,
    costsTotal,
    netProfit,
    demographics: { Male: maleCount, Female: femaleCount, Other: otherCount },
    ageGroups,
    diseases,
    regional,
    successRate,
  });
});


// ==========================================
// 2. AI PREDICTIVE ANALYTICS ENDPOINTS
// ==========================================

// Predict Patient Readmission risk index using Gemini 3.5 Flash
app.post('/api/predict/readmission', async (req, res) => {
  const { name, age, gender, primaryDiagnosis, laceScore, comorbidities } = req.body;

  if (!laceScore && laceScore !== 0) {
    return res.status(400).json({ error: 'LACE Index score is required for readmission prediction.' });
  }

  // If Gemini API is not fully configured, provide a beautiful, realistic math-model mock
  // representing simulated Machine Learning so the app never stalls
  if (!isGeminiEnabled()) {
    // Generate an intelligent math prediction reflecting actual medical factors
    let riskFactor = laceScore * 4.5 + (comorbidities ? comorbidities.length * 6 : 0);
    if (age > 65) riskFactor += 12;
    if (primaryDiagnosis === 'Heart Disease' || primaryDiagnosis === 'Pneumonia') riskFactor += 10;
    
    // Clamp
    const finalScore = Math.min(Math.max(Math.round(riskFactor), 5), 95);
    const finalLevel = finalScore < 35 ? 'Low' : finalScore < 70 ? 'Moderate' : 'High';

    const keyFactors = [
      `LACE Index is ${laceScore}/19 (A higher LACE score correlates with readmissions)`,
      `${comorbidities?.length || 0} active comorbid conditions detected`,
      age > 65 ? 'Patient is classified in high-risk geriatric cohort' : 'Standard age range baseline factor'
    ];

    const preventiveMeasures = [
      'Schedule a telephone discharge follow-up call within 48 hours.',
      'Provide a clear, written, multi-language plan outlining prescription instructions.',
      'Coordinate home health nursing visits for vital sign evaluation.',
      'Ensure a primary care appointment is booked within 7-10 days.'
    ];

    return res.json({
      riskScore: finalScore,
      riskLevel: finalLevel,
      keyFactors,
      preventiveMeasures,
      explanation: `[Simulated Model] Patient ${name || 'Patient'} exhibits a ${finalLevel.toLowerCase()} risk of 30-day readmission. The score of ${finalScore}% is calculated based on a LACE Index rating of ${laceScore}, combined with diagnostic markers. Note: Set up your GEMINI_API_KEY in the Secrets panel to activate active live clinical Deep-Learning insights.`
    });
  }

  try {
    const prompt = `Conduct a rigorous clinical 30-day readmission risk assessment for the following inpatient record:
    - Name: ${name || 'N/A'}
    - Age: ${age}
    - Gender: ${gender}
    - Primary Diagnosis: ${primaryDiagnosis}
    - LACE score (Length of stay, Acuity of admission, Comorbidities, Emergency visits): ${laceScore}/19
    - Comorbid conditions: ${comorbidities ? comorbidities.join(', ') : 'None'}
    
    Predict the readmission risk percentage (0 to 100), identify the risk factor reasons, and provide active corrective post-discharge wellness protocols to keep the patient safe. Your recommendations must be fully compliant with CMS Hospital Readmissions Reduction Program (HRRP) criteria.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: 'You are an advanced hospital predictive analytics machine learning model specializing in patient readmission risks, clinical flow optimization, and geriatric transitions of care.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.INTEGER, description: 'Percentage probability of 30-day readmission (0-100)' },
            riskLevel: { type: Type.STRING, description: 'Low, Moderate, or High readmission risk classification' },
            keyFactors: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'Key physiological or medical-history factors that led to this risk level'
            },
            preventiveMeasures: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Clear, actionable follow-up plans or post-discharge measures'
            },
            explanation: { type: Type.STRING, description: 'Professional clinical explanation modeling the risks of the diagnosis and comorbidity interactions' }
          },
          required: ['riskScore', 'riskLevel', 'keyFactors', 'preventiveMeasures', 'explanation']
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      res.json(parsed);
    } else {
      throw new Error('Empty response from model');
    }
  } catch (err: any) {
    console.error('Gemini prediction error:', err);
    res.status(500).json({ error: 'AI Prediction model failed: ' + err.message });
  }
});

// Outbreak Forecasting model
app.post('/api/predict/outbreak', async (req, res) => {
  const { currentSeason, regionFilter, activeCaseload } = req.body;

  if (!isGeminiEnabled()) {
    // Elegant regional seasonal math model
    const mockForecasts: OutbreakForecast[] = [
      {
        disease: 'Influenza (Seasonal Flu)',
        currentCases: activeCaseload ? activeCaseload * 0.4 : 45,
        predictedPeakMonth: currentSeason === 'Winter' ? 'December' : 'February',
        riskFactor: currentSeason === 'Winter' ? 'Critical' : 'Low',
        preventativeRecommendations: [
          'Initiate regional community vaccination campaigns.',
          'Secure high-priority antiviral medication stockpiles.',
          'Configure additional outpatient masks and rapid testing kiosks.'
        ]
      },
      {
        disease: 'Covid-19 Variants',
        currentCases: activeCaseload ? activeCaseload * 0.35 : 30,
        predictedPeakMonth: 'November',
        riskFactor: 'Moderate',
        preventativeRecommendations: [
          'Host mobile booster immunization hubs.',
          'Reinforce wastewater genetic surveillance protocols.',
          'Ensure ICU ventilator readiness and testing reagents.'
        ]
      },
      {
        disease: 'Pneumonia Pediatric Load',
        currentCases: activeCaseload ? activeCaseload * 0.15 : 12,
        predictedPeakMonth: currentSeason === 'Winter' ? 'January' : 'November',
        riskFactor: currentSeason === 'Winter' ? 'High' : 'Moderate',
        preventativeRecommendations: [
          'Distribute pediatric clinical guidelines to Emergency Departments.',
          'Establish secondary respiratory isolation bays.',
          'Pre-position pediatric oxygen monitors and nebulizer masks.'
        ]
      }
    ];

    return res.json({ forecasts: mockForecasts });
  }

  try {
    const prompt = `Perform an epidemiological disease outbreak and resource forecasting report.
    Current climate/season parameters: ${currentSeason || 'N/A'}. 
    Active area region: ${regionFilter || 'All'}. 
    Monthly admissions pressure baseline: ${activeCaseload || 'Standard'}.
    
    Predict the most likely disease surges, predicted peak-months, risk factors, and preventative supply recommendations to safeguard resources. Return the output as structured JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: 'You are an advanced epidemiological surveillance model supporting hospital system operations and health departments of national governments.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            forecasts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  disease: { type: Type.STRING, description: 'Disease name' },
                  currentCases: { type: Type.INTEGER, description: 'Estimated active caseload' },
                  predictedPeakMonth: { type: Type.STRING, description: 'Month in which cases are predicted to crest' },
                  riskFactor: { type: Type.STRING, description: 'Risk tier: Low, Moderate, High, Critical' },
                  preventativeRecommendations: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: 'Specific clinical measures, staff adjustments, or medication reserve requirements'
                  }
                },
                required: ['disease', 'currentCases', 'predictedPeakMonth', 'riskFactor', 'preventativeRecommendations']
              }
            }
          },
          required: ['forecasts']
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      res.json(parsed);
    } else {
      throw new Error('Empty response from model');
    }
  } catch (err: any) {
    console.error('Outbreak surge prediction error:', err);
    res.status(500).json({ error: 'Surge forecasting model failed: ' + err.message });
  }
});

// Chief Medical Data Officer Copilot Chat API
app.post('/api/copilot/query', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'A query is required.' });
  }

  // Calculate dynamic metrics for the context
  const total = patients.length;
  const inpatients = patients.filter(p => p.status === 'Inpatient').length;
  const totalRev = patients.reduce((sum, p) => sum + p.revenue, 0);
  const totalCosts = patients.reduce((sum, p) => sum + p.treatmentCost, 0);
  const netProfit = totalRev - totalCosts;

  const averageSuccess = Math.round((patients.filter(p => p.successRate === 'Success' || p.successRate === 'Treated').length / total) * 100);

  // Disease counts
  const diseaseBreakdown: { [key: string]: number } = {};
  patients.forEach(p => {
    diseaseBreakdown[p.primaryDiagnosis] = (diseaseBreakdown[p.primaryDiagnosis] || 0) + 1;
  });

  const activePhysicians = physicians.map(doc => ({
    name: doc.name,
    specialty: doc.department,
    successRate: `${doc.successRate}%`,
    treated: doc.patientsTreated,
    active: doc.activePatients
  }));

  if (!isGeminiEnabled()) {
    // Intelligent local fallback response
    let answer = `### [Simulated Copilot Insight]
Your query: **"${query}"** has been analyzed.

Here is a summary assessment based on our current operational metrics:
- **Total Patient Database**: ${total} active records.
- **Current Bed Occupancy**: ${inpatients} active inpatients.
- **Estimated Group Net Profit**: $${netProfit.toLocaleString()} (Revenue $${totalRev.toLocaleString()} vs. Expense $${totalCosts.toLocaleString()}).
- **Average Success Rating**: ${averageSuccess}% success/stable rate across departments.

#### Diagnostic Load Matrix:
${Object.entries(diseaseBreakdown).map(([name, count]) => `- **${name}**: ${count} patients`).join('\n')}

#### Top Department Success Rate:
- **Pediatrics** (Dr. Robert Chen): 96% success rate
- **Cardiology** (Dr. Sarah Jenkins): 94% success rate

*To activate interactive, cognitive clinical audits and regional correlation mappings, please save your GEMINI_API_KEY inside the AI Studio Secrets panel.*`;

    return res.json({ response: answer });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `The hospital manager or clinician asked: "${query}"
      
      Here is the raw real-time dataset from the local Hospital Information System (HIS):
      --- CORE METRICS ---
      - Total Registered Patients: ${total}
      - Currently Admitted Bed Occupancy: ${inpatients} inpatients
      - Financial Earnings Performance: $${totalRev.toLocaleString()} (Revenue) vs. $${totalCosts.toLocaleString()} (Direct Cost) -> Net margin: $${netProfit.toLocaleString()}
      - Average successful treatments: ${averageSuccess}%
      
      --- REGION DISTRIBUTION ---
      - North: ${patients.filter(p => p.region === 'North').length}
      - South: ${patients.filter(p => p.region === 'South').length}
      - East: ${patients.filter(p => p.region === 'East').length}
      - West: ${patients.filter(p => p.region === 'West').length}
      
      --- PATHOLOGY MAP ---
      ${JSON.stringify(diseaseBreakdown, null, 2)}
      
      --- STAFFING PERFORMANCE DATA ---
      ${JSON.stringify(activePhysicians, null, 2)}
      
      Compile a detailed, elegant, clinically focused analyst response in Markdown. Ensure your response is professional and addresses the specific query using actual stats or smart medical trends suggested by this data. Provide 2-3 bulleted strategic action items for the hospital board at the end of your analysis.`,
      config: {
        systemInstruction: 'You are the Chief Medical Information Officer (CMIO) and advanced healthcare operations intelligence engine for a leading healthcare provider. Your style is highly analytical, professional, supportive, and data-backed.'
      }
    });

    if (response.text) {
      res.json({ response: response.text });
    } else {
      throw new Error('Received empty response from the models endpoint');
    }
  } catch (err: any) {
    console.error('Copilot query error:', err);
    res.status(500).json({ error: 'Healthcare Analytics Copilot encountered an error: ' + err.message });
  }
});


// ==========================================
// 3. VITE AND DIRECTORY STATIC SERVING
// ==========================================

const startServer = async () => {
  // Boot live telemetry stream loop
  startTelemetrySimulation();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Healthcare Analytics Server running live on port ${PORT}`);
  });
};

startServer();
