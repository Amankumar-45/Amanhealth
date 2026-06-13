import React, { useState } from 'react';
import { PatientRecord, PredictionResult, OutbreakForecast } from '../types.ts';
import { 
  Calculator, BrainCircuit, Activity, Heart, ShieldCheck, 
  Sparkles, Layers, RefreshCw, ChevronRight, AlertTriangle 
} from 'lucide-react';

interface PredictiveAnalyticsProps {
  patients: PatientRecord[];
  onPredictReadmission: (data: any) => Promise<PredictionResult>;
  onForecastOutbreak: (data: any) => Promise<{ forecasts: OutbreakForecast[] }>;
}

export default function PredictiveAnalytics({
  patients,
  onPredictReadmission,
  onForecastOutbreak
}: PredictiveAnalyticsProps) {
  // Readmission calculator state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientName, setPatientName] = useState('John Doe');
  const [age, setAge] = useState(62);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [diagnosis, setDiagnosis] = useState('Heart Failure');
  const [laceScore, setLaceScore] = useState(10);
  const [comorbidities, setComorbidities] = useState<string[]>(['Obesity', 'Smoking History']);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  // Outbreak surveillance state
  const [currentSeason, setCurrentSeason] = useState('Winter');
  const [baseload, setBaseload] = useState(100);
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecasts, setForecasts] = useState<OutbreakForecast[] | null>(null);

  // Available comorbidities listed in standard systems
  const availableComorbidities = ['Obesity', 'Smoking History', 'Chronic Kidney Disease', 'COPD', 'Prior Stroke', 'Anemia', 'Hypertension', 'Diabetes'];

  const handlePatientSelect = (id: string) => {
    setSelectedPatientId(id);
    const pat = patients.find(p => p.id === id);
    if (pat) {
      setPatientName(pat.name);
      setAge(pat.age);
      setGender(pat.gender);
      setDiagnosis(pat.primaryDiagnosis);
      setLaceScore(pat.laceScore);
      setComorbidities(pat.comorbidities);
    }
  };

  const toggleComorbidity = (item: string) => {
    if (comorbidities.includes(item)) {
      setComorbidities(comorbidities.filter(c => c !== item));
    } else {
      setComorbidities([...comorbidities, item]);
    }
  };

  const runReadmissionPrediction = async () => {
    setIsPredicting(true);
    try {
      const res = await onPredictReadmission({
        name: patientName,
        age,
        gender,
        primaryDiagnosis: diagnosis,
        laceScore,
        comorbidities
      });
      setPrediction(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPredicting(false);
    }
  };

  const runOutbreakForecast = async () => {
    setIsForecasting(true);
    try {
      const res = await onForecastOutbreak({
        currentSeason,
        activeCaseload: baseload
      });
      setForecasts(res.forecasts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsForecasting(false);
    }
  };

  return (
    <div className="space-y-6" id="predictive-analytics-desk">
      
      {/* SECTION 1: 30-Day Readmission Risk ML Simulator */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xs overflow-hidden" id="readmission-predictor">
        <div className="p-6 border-b border-[#E5E7EB] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <BrainCircuit className="h-4.5 w-4.5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-[#1A1A1A]">30-Day Patient Readmission Risk Assessment</h3>
              <p className="text-xs text-gray-400">ML clinical modeling based on diagnostics, comorbidities & LACE Index metrics</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="prefill-patient-select" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Prefill Inpatient:</label>
            <select
              id="prefill-patient-select"
              value={selectedPatientId}
              onChange={(e) => handlePatientSelect(e.target.value)}
              className="bg-white border border-[#E5E7EB] text-[#1A1A1A] text-xs rounded-full font-medium px-3.5 py-1.5 focus:ring-1 focus:ring-blue-600 hover:border-gray-300 outline-hidden cursor-pointer"
            >
              <option value="">-- Choose Patient Case --</option>
              {patients.slice(0, 10).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.primaryDiagnosis})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Calculator Inputs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="patient-name-input" className="text-xs font-semibold text-[#1A1A1A]">Patient Name</label>
                <input
                  id="patient-name-input"
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-gray-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-medium focus:bg-white focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="patient-age-input" className="text-xs font-semibold text-[#1A1A1A]">Age</label>
                <input
                  id="patient-age-input"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-medium focus:bg-white focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="patient-gender-select" className="text-xs font-semibold text-[#1A1A1A]">Gender</label>
                <select
                  id="patient-gender-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-gray-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-medium focus:bg-white focus:ring-1 focus:ring-blue-600 outline-hidden cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="patient-diagnosis-select" className="text-xs font-semibold text-[#1A1A1A]">Primary Diagnosis</label>
                <select
                  id="patient-diagnosis-select"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full bg-gray-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-medium focus:bg-white focus:ring-1 focus:ring-blue-600 outline-hidden cursor-pointer"
                >
                  <option value="Heart Disease">Heart Disease</option>
                  <option value="Covid-19">Covid-19</option>
                  <option value="Diabetes">Diabetes</option>
                  <option value="Hypertension">Hypertension</option>
                  <option value="Pneumonia">Pneumonia</option>
                  <option value="Asthma">Asthma</option>
                  <option value="Flu">Influenza (Flu)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5 bg-gray-50 p-4 rounded-2xl border border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="lace-score-range" className="text-xs font-semibold text-[#1A1A1A]">LACE Score Index: <span className="font-mono text-blue-600 font-bold">{laceScore}</span></label>
                <span className="text-[10px] text-gray-400 font-medium">Range 0 to 19</span>
              </div>
              <input
                id="lace-score-range"
                type="range"
                min="0"
                max="19"
                value={laceScore}
                onChange={(e) => setLaceScore(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1 bg-gray-200 rounded-lg appearance-none"
              />
              <p className="text-[10px] text-gray-400 leading-normal pt-1">LACE index scales points across Length, Acuity, Comorbidities, and past Emergency admissions.</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#1A1A1A] block">Comorbid Conditions</span>
              <div className="grid grid-cols-2 gap-2">
                {availableComorbidities.map(c => {
                  const isChecked = comorbidities.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleComorbidity(c)}
                      className={`text-left text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isChecked 
                        ? 'bg-blue-50 text-blue-700 border-[#E5E7EB] shadow-3xs font-bold' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span>{c}</span>
                      {isChecked && <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              id="predict-readmit-btn"
              onClick={runReadmissionPrediction}
              disabled={isPredicting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-3xs"
            >
              {isPredicting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing ML Deep Learning Model...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="h-3.5 w-3.5" />
                  <span>Execute AI Readmission Evaluation</span>
                </>
              )}
            </button>
          </div>

          {/* Diagnosis Outputs */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E5E7EB] p-6 flex flex-col justify-center min-h-[300px]">
            {prediction ? (
              <div className="space-y-5">
                {/* Score Widget */}
                <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-[#E5E7EB] pb-5">
                  <div className="relative flex items-center justify-center">
                    {/* Circle SVG meter */}
                    <svg className="w-24 h-24">
                      <circle cx="48" cy="48" r="40" stroke="#f3f4f6" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="48" 
                        cy="48" 
                        r="40" 
                        stroke={prediction.riskScore < 35 ? '#10b981' : prediction.riskScore < 70 ? '#f59e0b' : '#ef4444'} 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - prediction.riskScore / 100)}
                        strokeLinecap="round"
                        transform="rotate(-90 48 48)"
                      />
                    </svg>
                    <span className="absolute text-xl font-bold text-[#1A1A1A] font-mono">{prediction.riskScore}%</span>
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Classification Level</span>
                    <div className="flex items-center space-x-2 justify-center sm:justify-start">
                      <h4 className={`text-lg font-bold uppercase ${
                        prediction.riskLevel === 'Low' ? 'text-emerald-600' : prediction.riskLevel === 'Moderate' ? 'text-amber-500' : 'text-red-500'
                      }`}>{prediction.riskLevel} Case Risk</h4>
                      <Activity className={`h-4 w-4 ${prediction.riskLevel === 'High' ? 'text-red-500 animate-pulse' : 'text-gray-440'}`} />
                    </div>
                    <p className="text-xs text-gray-400 max-w-sm">Assessed compared to the peer clinical cohort under standard patient demographic metrics.</p>
                  </div>
                </div>

                {/* Driving Factors */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#1A1A1A] flex items-center space-x-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span>Primary Readmission Drivers:</span>
                  </span>
                  <ul className="grid grid-cols-1 gap-1.5 pl-1">
                    {prediction.keyFactors.map((f, i) => (
                      <li key={i} className="text-xs text-gray-700 bg-gray-50 border border-[#E5E7EB] px-3 py-2 rounded-xl flex items-center space-x-2">
                        <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="font-semibold">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions Preventive measures */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#1A1A1A] flex items-center space-x-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Actionable Intervention Protocol (HRRP-Compliant):</span>
                  </span>
                  <ul className="grid grid-cols-1 gap-1.5 pl-1">
                    {prediction.preventiveMeasures.slice(0, 3).map((m, i) => (
                      <li key={i} className="text-xs text-[#1A1A1A] bg-emerald-50/50 border border-emerald-100 px-3 py-2 rounded-xl flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-semibold text-emerald-900">{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Rationale explanation */}
                <div className="bg-blue-50/40 border border-[#E5E7EB] rounded-2xl p-4 text-xs text-blue-900 leading-relaxed font-sans">
                  <span className="font-bold text-blue-950 block mb-0.5">Clinical Rationale Report:</span>
                  {prediction.explanation}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center border border-[#E5E7EB]">
                  <Calculator className="h-5 w-5 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-455 uppercase tracking-widest">Awaiting Parameter Execution</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">Click "Execute AI Readmission Evaluation" to output dynamic, deep learning risk models for this patient file.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Bed Occupancy Forecasting & Epidemic Disease Outbreaks tracker */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xs overflow-hidden" id="outbreak-forecaster">
        <div className="p-6 border-b border-[#E5E7EB] bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Layers className="h-4.5 w-4.5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-[#1A1A1A]">Hospital Outbreak Forecasting & Bed Capacity Planning</h3>
              <p className="text-xs text-gray-400">Epidemiological supply forecasts and resource pressure analysis</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="forecast-season-select" className="text-xs font-semibold text-[#1A1A1A]">Active Climate / Season</label>
              <select
                id="forecast-season-select"
                value={currentSeason}
                onChange={(e) => setCurrentSeason(e.target.value)}
                className="w-full bg-gray-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-medium focus:bg-white focus:ring-1 focus:ring-blue-500 outline-hidden cursor-pointer"
              >
                <option value="Winter">Winter Season (Flu/COVID Spikes)</option>
                <option value="Spring">Spring Season (Asthma/Allergies)</option>
                <option value="Summer">Summer Season (Gastro / Heat Exhaustion)</option>
                <option value="Autumn">Autumn Season (Respiratory Syncytial Virus)</option>
              </select>
            </div>

            <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="admissions-slider" className="text-xs font-semibold text-[#1A1A1A]">Baseline Active Admissions: <span className="font-mono text-emerald-600 font-bold">{baseload} cases</span></label>
              </div>
              <input
                id="admissions-slider"
                type="range"
                min="30"
                max="250"
                value={baseload}
                onChange={(e) => setBaseload(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1 bg-gray-200 rounded-lg appearance-none"
              />
              <p className="text-[10px] text-gray-400">Controls estimated baseline bed load to evaluate staff stress levels.</p>
            </div>

            <button
              id="forecast-outbreak-btn"
              onClick={runOutbreakForecast}
              disabled={isForecasting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-3xs"
            >
              {isForecasting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Generating Epidemic Models...</span>
                </>
              ) : (
                <>
                  <Activity className="h-3.5 w-3.5" />
                  <span>Execute Capacity & Surge Forecast</span>
                </>
              )}
            </button>
          </div>

          {/* Forecasting lists */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E5E7EB] p-6 flex flex-col justify-center min-h-[250px]">
            {forecasts ? (
              <div className="space-y-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-[#E5E7EB] pb-2">Surge Outbreak Alert Matrix</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {forecasts.map((f, i) => (
                    <div key={i} className="bg-white border border-[#E5E7EB] rounded-3xl p-5 flex flex-col justify-between space-y-3 shadow-3xs hover:border-emerald-500 transition-all">
                      <div className="space-y-1">
                        <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-full inline-block ${
                          f.riskFactor === 'Critical' ? 'bg-red-50 text-red-700 border border-red-100 animate-pulse' :
                          f.riskFactor === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {f.riskFactor} Risk
                        </span>
                        <h4 className="text-xs font-bold text-[#1A1A1A] leading-tight pt-1">{f.disease}</h4>
                        <div className="text-xs text-gray-400 font-medium pt-1">Est Caseload: <strong className="font-mono text-[#1A1A1A] font-semibold">{f.currentCases}</strong></div>
                      </div>

                      <div className="space-y-1.5 border-t border-gray-100 pt-3 text-[11px]">
                        <div className="font-bold text-[9.5px] text-gray-400 uppercase tracking-wider">Preventative Strategy</div>
                        <ul className="space-y-1">
                          {f.preventativeRecommendations.slice(0, 2).map((rec, ind) => (
                            <li key={ind} className="flex items-start space-x-1 font-semibold leading-normal text-gray-500">
                              <span className="text-emerald-500 font-bold shrink-0">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 border border-[#E5E7EB] text-gray-400 flex items-center justify-center">
                  <Activity className="h-5 w-5 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-450 uppercase tracking-widest">Awaiting Forecast Computation</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">Click "Execute Capacity & Surge Forecast" to map out disease surge curves based on seasonal data variables.</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
