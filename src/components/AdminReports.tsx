import React, { useState } from 'react';
import { PhysicianRecord, PatientRecord, FinancialDetail } from '../types.ts';
import { 
  ShieldCheck, ShieldAlert, Award, UserCheck, UserPlus, 
  FileSpreadsheet, FileText, Download, CheckCircle, RefreshCw, Printer 
} from 'lucide-react';

interface AdminReportsProps {
  physicians: PhysicianRecord[];
  patients: PatientRecord[];
  financials: FinancialDetail[];
  userRole: 'cmo' | 'clinician';
  onChangeUserRole: (role: 'cmo' | 'clinician') => void;
  onAddPhysician: (doc: Omit<PhysicianRecord, 'id'>) => Promise<any>;
}

export default function AdminReports({
  physicians,
  patients,
  financials,
  userRole,
  onChangeUserRole,
  onAddPhysician
}: AdminReportsProps) {
  // Staff practitioner form states
  const [docName, setDocName] = useState('');
  const [docDept, setDocDept] = useState('General Medicine');
  const [docSuccess, setDocSuccess] = useState(90);
  const [docConsultTime, setDocConsultTime] = useState(15);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  // Report generator states
  const [reportType, setReportType] = useState<'epidemiology' | 'readmissions' | 'financials'>('epidemiology');
  const [reportFormat, setReportFormat] = useState<'csv' | 'pdf'>('csv');
  const [reportRegion, setReportRegion] = useState('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [reportPreviewHtml, setReportPreviewHtml] = useState<string | null>(null);

  const depts = ['Cardiology', 'Endocrinology', 'General Medicine', 'Pediatrics', 'Emergency', 'Neurology'];

  const handleCreatePhysician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    setIsSubmittingDoc(true);
    try {
      await onAddPhysician({
        name: `Dr. ${docName}`,
        department: docDept,
        patientsTreated: 0,
        successRate: docSuccess,
        avgConsultationTime: docConsultTime,
        activePatients: 0
      });
      setDocName('');
      setDocSuccess(90);
      setDocConsultTime(15);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  // Convert array to CSV and download
  const downloadCSV = (title: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationSuccess(false);
    setReportPreviewHtml(null);

    setTimeout(() => {
      setIsGenerating(false);
      setGenerationSuccess(true);

      // Create a markdown/text review of what is in the report
      let textContent = '';
      if (reportType === 'epidemiology') {
        const matchingPatients = reportRegion === 'All' ? patients : patients.filter(p => p.region === reportRegion);
        const diseases = matchingPatients.reduce((acc, p) => {
          acc[p.primaryDiagnosis] = (acc[p.primaryDiagnosis] || 0) + 1;
          return acc;
        }, {} as { [k: string]: number });

        textContent = `MEDPULSE HEALTHCARE SYSTEMS - EPIDEMIOLOGY SURVEILLANCE AUDIT
============================================================
Generated Time: ${new Date().toLocaleString()}
Scope Region Filter: ${reportRegion} Sector Clinic Node
Total Cases Evaluated: ${matchingPatients.length} Patients
------------------------------------------------------------
Diagnostic Abundances Mapping:
${Object.entries(diseases).map(([name, val]) => ` - [${name}]: ${val} verified cases (${Math.round(val / (matchingPatients.length || 1) * 100)}% of local load)`).join('\n')}
============================================================
Strategic Recommendations:
1. Increase immunization and vaccine stockpiles in region: ${reportRegion === 'All' ? 'Whole Areas' : reportRegion} clinic nodes.
2. Initiate clinical tracing protocol for common pathologies.`;

        if (reportFormat === 'csv') {
          // Build patients CSV
          let csv = 'Patient ID,Name,Age,Gender,Region,Diagnosis,Status,OutcomeRate,TreatmentCost,Revenue\n';
          matchingPatients.forEach(p => {
            csv += `"${p.id}","${p.name}",${p.age},"${p.gender}","${p.region}","${p.primaryDiagnosis}","${p.status}","${p.successRate}",${p.treatmentCost},${p.revenue}\n`;
          });
          downloadCSV(`epidemiology_surveillance_${reportRegion}`, csv);
        } else {
          // Download simulated pdf in a text file
          const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `epidemiology_report_${reportRegion}.txt`);
          link.click();
        }

      } else if (reportType === 'readmissions') {
        const matchingPatients = reportRegion === 'All' ? patients : patients.filter(p => p.region === reportRegion);
        const readmitted = matchingPatients.filter(p => p.readmitted);
        const highLace = matchingPatients.filter(p => p.laceScore >= 10);

        textContent = `MEDPULSE CLINICAL QUALITY INSIGHTS - INPATIENT READMISSIONS OUTCOMES REPORT
=========================================================================================
Generated Time: ${new Date().toLocaleString()}
Scope Region Filter: ${reportRegion} Sector
Active Inpatient Database Evaluated: ${matchingPatients.length} patient records
Readmissions Tracked (30-Day limit): ${readmitted.length} Patients (${Math.round(readmitted.length / (matchingPatients.length || 1) * 100)}% rate)
Geriatric Watchlist Candidates (LACE >= 10): ${highLace.length} Patients
=========================================================================================
Case Details Matrix:
${readmitted.map(p => ` - Patient ID: ${p.id} | Name: ${p.name} | Diagnosis: ${p.primaryDiagnosis} | LACE Score: ${p.laceScore}/19`).join('\n')}
-----------------------------------------------------------------------------------------
Recommendations:
1. Activate CMS-compliant transition protocols for high-LACE cohort.
2. Ensure pharmacy verification and discharge planning validation is audited before release.`;

        if (reportFormat === 'csv') {
          let csv = 'Patient ID,Name,Age,Gender,Region,Diagnosis,LaceScore,Comorbidities,Readmitted\n';
          readmitted.forEach(p => {
            csv += `"${p.id}","${p.name}",${p.age},"${p.gender}","${p.region}","${p.primaryDiagnosis}",${p.laceScore},"${p.comorbidities.join('; ')}",${p.readmitted}\n`;
          });
          downloadCSV(`readmissions_tracking_${reportRegion}`, csv);
        } else {
          const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `readmissions_analysis_${reportRegion}.txt`);
          link.click();
        }

      } else if (reportType === 'financials') {
        const matchingPatients = reportRegion === 'All' ? patients : patients.filter(p => p.region === reportRegion);
        const revenue = matchingPatients.reduce((sum, p) => sum + p.revenue, 0);
        const costs = matchingPatients.reduce((sum, p) => sum + p.treatmentCost, 0);
        const claims = matchingPatients.reduce((sum, p) => sum + p.insuranceClaimAmount, 0);
        const earnings = revenue - costs;

        textContent = `MEDPULSE HEALTH OPERATIONS REPORT - FINANCIAL LEDGER BY PATIENT DISCHARGE
========================================================================================
Generated Time: ${new Date().toLocaleString()}
Scope Region: ${reportRegion} Sector Clinic Core
Gross Earnings Volume: $${revenue.toLocaleString()}
Operating Expenditure: $${costs.toLocaleString()}
Audited Net Profit Margin: $${earnings.toLocaleString()}
Insurance Claims Pending Reconciled: $${claims.toLocaleString()}
========================================================================================
Breakdown by Diagnosis Revenue Contribution:
${Array.from(new Set(matchingPatients.map(p => p.primaryDiagnosis))).map(diag => {
  const ds = matchingPatients.filter(p => p.primaryDiagnosis === diag);
  const dr = ds.reduce((sum, p) => sum + p.revenue, 0);
  const dc = ds.reduce((sum, p) => sum + p.treatmentCost, 0);
  return ` - [${diag}]: $${dr.toLocaleString()} Revenue vs. $${dc.toLocaleString()} Costs (Margin: $${(dr - dc).toLocaleString()})`;
}).join('\n')}
========================================================================================`;

        if (reportFormat === 'csv') {
          let csv = 'Month,Clinics Revenue,Operational Costs,Insurance Claims Approved\n';
          financials.forEach(f => {
            csv += `"${f.month}",${f.revenue},${f.costs},${f.claims}\n`;
          });
          downloadCSV(`financial_ledger_${reportRegion}`, csv);
        } else {
          const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `financials_report_${reportRegion}.txt`);
          link.click();
        }
      }

      setReportPreviewHtml(textContent);
    }, 1200);
  };

  return (
    <div className="space-y-6" id="admin-reports-workspace">
      
      {/* ACCESS & PERMISSIONS SECTION */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6" id="access-permissions-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 text-left">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">System Identity Guard</span>
            <h3 className="text-sm font-bold text-[#1A1A1A]">Dashboard Access Level & Privileges</h3>
            <p className="text-xs text-gray-400">Manage operational governance and restrict editing or destructive capabilities across clinic endpoints</p>
          </div>
          
          <div className="flex items-center space-x-3.5 bg-gray-50 border border-[#E5E7EB] px-4 py-3 rounded-2xl select-none shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userRole === 'cmo' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
              {userRole === 'cmo' ? <ShieldCheck className="h-4.5 w-4.5" /> : <ShieldAlert className="h-4.5 w-4.5" />}
            </div>
            
            <div className="text-left font-sans font-semibold">
              <div className="text-[10px] text-gray-400 font-mono uppercase leading-none mb-1">Active Staff Role</div>
              <div className="text-xs font-bold font-sans text-[#1A1A1A]">
                {userRole === 'cmo' ? 'Chief Medical Officer (Administrator)' : 'Attending Clinician (Read-only Sandbox)'}
              </div>
            </div>

            <button
              onClick={() => onChangeUserRole(userRole === 'cmo' ? 'clinician' : 'cmo')}
              className="text-[10px] bg-white border border-[#E5E7EB] hover:border-blue-600 text-[#1A1A1A] hover:text-blue-600 font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-3xs"
            >
              Toggle Role Switch
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* REPORT GENERATION PANEL */}
        <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-5 text-left" id="report-generator-widget">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Core compliance outputs</span>
            <h4 className="text-sm font-bold text-[#1A1A1A]">Medical Report Export System</h4>
            <p className="text-xs text-gray-400">Generate high-contrast CSV datasets or plaintext clinician audit reports compliant with the HIS database structure.</p>
          </div>

          <form onSubmit={handleGenerateReport} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sys-report-type" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Audit Category</label>
                <select
                  id="sys-report-type"
                  value={reportType}
                  onChange={(e: any) => setReportType(e.target.value)}
                  className="w-full bg-gray-50 border border-[#E5E7EB] text-xs font-semibold rounded-xl px-3 py-2.5 text-[#1A1A1A] focus:bg-white outline-none cursor-pointer"
                >
                  <option value="epidemiology">Epidemiology Outbreaks & Diagnostic Distribution</option>
                  <option value="readmissions">LACE Transitions & Inpatient Readmissions Watchlist</option>
                  <option value="financials">Financial Billing Reconciliations ledger</option>
                </select>
              </div>

              <div>
                <label htmlFor="sys-report-region" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Target Geographic Scope</label>
                <select
                  id="sys-report-region"
                  value={reportRegion}
                  onChange={(e) => setReportRegion(e.target.value)}
                  className="w-full bg-gray-50 border border-[#E5E7EB] text-xs font-semibold rounded-xl px-3 py-2.5 text-[#1A1A1A] focus:bg-white outline-none cursor-pointer"
                >
                  <option value="All">All Area Clinics</option>
                  <option value="North">North Sector Nodes Only</option>
                  <option value="South">South Sector Nodes Only</option>
                  <option value="East">East Sector Nodes Only</option>
                  <option value="West">West Sector Nodes Only</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#E5E7EB]">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Output Format</span>
                <div className="flex space-x-3 text-xs font-bold font-sans">
                  <label className="flex items-center space-x-1.5 cursor-pointer text-[#1A1A1A]">
                    <input 
                      type="radio" 
                      name="format" 
                      value="csv" 
                      checked={reportFormat === 'csv'}
                      onChange={() => setReportFormat('csv')}
                      className="text-blue-600 focus:ring-blue-600 focus:ring-1"
                    />
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Excel Spreadsheet CSV</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer text-[#1A1A1A]">
                    <input 
                      type="radio" 
                      name="format" 
                      value="pdf" 
                      checked={reportFormat === 'pdf'}
                      onChange={() => setReportFormat('pdf')}
                      className="text-blue-600 focus:ring-blue-600 focus:ring-1"
                    />
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    <span>Clinician Document text</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shrink-0"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Structuring ledger...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Compile & Trigger Download</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Report Preview */}
          {reportPreviewHtml && (
            <div className="space-y-2 pt-4 border-t border-[#E5E7EB]" id="report-download-preview">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Export Preview</div>
              <pre className="p-4 bg-gray-50 border border-[#E5E7EB] text-[9.5px] font-mono text-gray-600 rounded-2xl overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64">
                {reportPreviewHtml}
              </pre>
              <div className="flex items-center space-x-2 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Export generated successfully! Compiled dataset down-streamed securely in the browser.</span>
              </div>
            </div>
          )}

        </div>

        {/* STAFF PRACTITIONERS MANAGER */}
        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-3xl p-6 space-y-5 text-left" id="doctor-staff-widget">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Staff governance manager</span>
            <h4 className="text-sm font-bold text-[#1A1A1A]">Active Physician Staffing Profiles</h4>
            <p className="text-xs text-gray-400">Add physicians, manage medical licensing departments, and audit caseload efficiency parameters.</p>
          </div>

          {/* Add staff form */}
          {userRole !== 'cmo' ? (
            <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl text-xs text-orange-950 font-medium leading-relaxed">
              <strong>Administrative Form Locked</strong> Attending clinician permissions are active. To register or license new doctors, switch identity mode to <strong>Chief Medical Officer</strong> inside the Identity Guard panel above.
            </div>
          ) : (
            <form onSubmit={handleCreatePhysician} className="bg-gray-50 border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
              <span className="text-[9px] font-extrabold text-[#1A1A1A] uppercase tracking-wider block border-b border-[#E5E7EB] pb-1">Appoint New Practitioner</span>
              
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="new-doc-name" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Sur-name</label>
                  <input
                    id="new-doc-name"
                    type="text"
                    required
                    placeholder="e.g. Samuel Green"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] text-xs font-semibold rounded-lg px-2.5 py-1.5 text-[#1A1A1A] outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="new-doc-dept" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Department</label>
                  <select
                    id="new-doc-dept"
                    value={docDept}
                    onChange={(e) => setDocDept(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] text-xs font-semibold rounded-lg px-2 py-1.5 text-[#1A1A1A] outline-none cursor-pointer"
                  >
                    {depts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="new-doc-success" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Success Target (%)</label>
                  <input
                    id="new-doc-success"
                    type="number"
                    min="50"
                    max="100"
                    required
                    value={docSuccess}
                    onChange={(e) => setDocSuccess(parseInt(e.target.value) || 90)}
                    className="w-full bg-white border border-[#E5E7EB] text-xs font-semibold rounded-lg px-2.5 py-1.5 text-[#1A1A1A] outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="new-doc-time" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Avg Consultation Delays (mins)</label>
                  <input
                    id="new-doc-time"
                    type="number"
                    min="5"
                    max="60"
                    required
                    value={docConsultTime}
                    onChange={(e) => setDocConsultTime(parseInt(e.target.value) || 15)}
                    className="w-full bg-white border border-[#E5E7EB] text-xs font-semibold rounded-lg px-2.5 py-1.5 text-[#1A1A1A] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingDoc || !docName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                {isSubmittingDoc ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
                <span>Publish Practitioner License</span>
              </button>
            </form>
          )}

          {/* Roster list */}
          <div className="space-y-2 mt-4">
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block pl-0.5">Attending Doctors Clinical Profile Ledger</span>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {physicians.map(d => (
                <div key={d.id} className="flex justify-between items-center bg-gray-50 border border-[#E5E7EB] p-3 rounded-2xl">
                  <div className="text-left">
                    <div className="text-xs font-bold text-blue-900">{d.name}</div>
                    <div className="text-[9px] font-bold font-mono text-gray-400 uppercase mt-0.5">{d.department} • Active caseload: {d.activePatients} Patients</div>
                  </div>
                  <div className="text-right flex items-center space-x-2.5">
                    <div className="text-left font-sans leading-none">
                      <div className="text-[8px] text-gray-400 font-bold uppercase">Success</div>
                      <div className="text-xs font-extrabold text-emerald-700 mt-1">{d.successRate}%</div>
                    </div>
                    <div className="text-left font-sans leading-none border-l border-[#E5E7EB] pl-2.5">
                      <div className="text-[8px] text-gray-400 font-bold uppercase">Cons. Time</div>
                      <div className="text-xs font-extrabold text-indigo-700 mt-1">{d.avgConsultationTime} m</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
