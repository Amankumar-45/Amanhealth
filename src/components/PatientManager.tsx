import React, { useState } from 'react';
import { PatientRecord } from '../types.ts';
import { 
  Plus, Search, SlidersHorizontal, Trash2, Heart, UserMinus, 
  Activity, CheckCircle, Clock, AlertTriangle, X 
} from 'lucide-react';

interface PatientManagerProps {
  patients: PatientRecord[];
  onAddPatient: (data: Omit<PatientRecord, 'id' | 'readmitted'>) => Promise<PatientRecord>;
  onDischargePatient: (id: string) => Promise<PatientRecord>;
  onDeletePatient: (id: string) => Promise<any>;
}

export default function PatientManager({
  patients,
  onAddPatient,
  onDischargePatient,
  onDeletePatient
}: PatientManagerProps) {
  const [search, setSearch] = useState('');
  const [filterDiagnosis, setFilterDiagnosis] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);

  // New patient state inputs
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState(48);
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newRegion, setNewRegion] = useState<'North' | 'South' | 'East' | 'West'>('North');
  const [newDiagnosis, setNewDiagnosis] = useState('Diabetes');
  const [newStatus, setNewStatus] = useState<'Inpatient' | 'Discharged'>('Inpatient');
  const [newLace, setNewLace] = useState(8);
  const [newComorbidities, setNewComorbidities] = useState<string[]>([]);

  // Filter diagnostics list
  const uniqueDiagnoses = ['All', ...Array.from(new Set(patients.map(p => p.primaryDiagnosis)))];

  // Comorb option list
  const comorbOptions = ['Obesity', 'Smoking History', 'Chronic Kidney Disease', 'COPD', 'Prior Stroke', 'Anemia'];

  const handleComorbToggle = (item: string) => {
    if (newComorbidities.includes(item)) {
      setNewComorbidities(newComorbidities.filter(c => c !== item));
    } else {
      setNewComorbidities([...newComorbidities, item]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await onAddPatient({
        name: newName,
        age: newAge,
        gender: newGender,
        region: newRegion,
        admissionDate: new Date().toISOString().split('T')[0],
        dischargeDate: newStatus === 'Discharged' ? new Date().toISOString().split('T')[0] : null,
        primaryDiagnosis: newDiagnosis,
        status: newStatus,
        successRate: newStatus === 'Discharged' ? 'Success' : 'Treated',
        treatmentCost: 1800,
        revenue: 2300,
        insuranceClaimAmount: 2000,
        laceScore: newLace,
        comorbidities: newComorbidities
      });

      // Clear out fields
      setNewName('');
      setNewAge(48);
      setNewLace(8);
      setNewComorbidities([]);
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.id.toLowerCase().includes(search.toLowerCase());
    const matchesDiagnosis = filterDiagnosis === 'All' || p.primaryDiagnosis === filterDiagnosis;
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchesSearch && matchesDiagnosis && matchesStatus;
  });

  return (
    <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-xs overflow-hidden" id="patient-admissions-manager">
      
      {/* Search and Filters bar */}
      <div className="p-6 border-b border-[#E5E7EB] bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            id="patient-search-input"
            type="text"
            placeholder="Search patient record by Name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50/50 border border-[#E5E7EB] pl-10 pr-4 py-2.5 rounded-full text-xs font-semibold focus:ring-1 focus:ring-blue-600 focus:bg-white outline-hidden transition-all text-[#1A1A1A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Diagnosis */}
          <div className="flex items-center space-x-1.5">
            <label htmlFor="diag-filter-select" className="text-xs font-bold text-gray-400 uppercase tracking-wider">Diagnosis:</label>
            <select
              id="diag-filter-select"
              value={filterDiagnosis}
              onChange={(e) => setFilterDiagnosis(e.target.value)}
              className="bg-white border border-[#E5E7EB] text-[#1A1A1A] text-xs rounded-full font-semibold px-3.5 py-1.5 focus:ring-1 focus:ring-blue-600 outline-hidden cursor-pointer"
            >
              {uniqueDiagnoses.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center space-x-1.5">
            <label htmlFor="status-filter-select" className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status:</label>
            <select
              id="status-filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-[#E5E7EB] text-[#1A1A1A] text-xs rounded-full font-semibold px-3.5 py-1.5 focus:ring-1 focus:ring-blue-600 outline-hidden cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Inpatient">Inpatients</option>
              <option value="Discharged">Discharged</option>
            </select>
          </div>

          {/* Add patient button */}
          <button
            id="add-patient-btn"
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4.5 py-2.5 rounded-full flex items-center space-x-1.5 transition-colors cursor-pointer shadow-3xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Admit Clinical Patient</span>
          </button>
        </div>
      </div>

      {/* Slide-over custom add patient form inside wrapper modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex justify-end z-50 animate-fade-in" id="add-patient-modal-bg">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-y-auto" id="add-patient-modal-content border-l border-[#E5E7EB]">
            <div className="p-6">
              <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-[#1A1A1A] flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span>Clinical Admission Portal</span>
                  </h3>
                  <p className="text-xs text-gray-400">Register new active medical record entry</p>
                </div>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-650 hover:bg-gray-50 rounded-full transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="modal-patient-name" className="text-xs font-semibold text-[#1A1A1A] block">Patient Name</label>
                  <input
                    id="modal-patient-name"
                    type="text"
                    required
                    placeholder="E.g., Alexander Mercer"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-gray-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="modal-patient-age" className="text-xs font-semibold text-[#1A1A1A] block">Age</label>
                    <input
                      id="modal-patient-age"
                      type="number"
                      min="1"
                      max="125"
                      value={newAge}
                      onChange={(e) => setNewAge(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-blue-600 outline-hidden"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="modal-patient-gender" className="text-xs font-semibold text-[#1A1A1A] block">Gender</label>
                    <select
                      id="modal-patient-gender"
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value as any)}
                      className="w-full bg-gray-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-blue-600 outline-hidden"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="modal-patient-region" className="text-xs font-semibold text-[#1A1A1A] block">Region Sector</label>
                    <select
                      id="modal-patient-region"
                      value={newRegion}
                      onChange={(e) => setNewRegion(e.target.value as any)}
                      className="w-full bg-gray-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-blue-600 outline-hidden"
                    >
                      <option value="North">North Sector</option>
                      <option value="South">South Sector</option>
                      <option value="East">East Sector</option>
                      <option value="West">West Sector</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="modal-patient-diagnosis" className="text-xs font-semibold text-[#1A1A1A] block">Admitting Pathology</label>
                    <select
                      id="modal-patient-diagnosis"
                      value={newDiagnosis}
                      onChange={(e) => setNewDiagnosis(e.target.value)}
                      className="w-full bg-gray-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-blue-600 outline-hidden"
                    >
                      <option value="Diabetes">Diabetes</option>
                      <option value="Covid-19">Covid-19</option>
                      <option value="Hypertension">Hypertension</option>
                      <option value="Heart Disease">Heart Disease</option>
                      <option value="Pneumonia">Pneumonia</option>
                      <option value="Asthma">Asthma</option>
                      <option value="Flu">Influenza (Flu)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="modal-patient-status" className="text-xs font-semibold text-[#1A1A1A] block">Admission Status</label>
                    <select
                      id="modal-patient-status"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full bg-gray-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-blue-600 outline-hidden"
                    >
                      <option value="Inpatient">Inpatient (Occupies Bed)</option>
                      <option value="Discharged">Directly Discharged</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="modal-patient-lace" className="text-xs font-semibold text-[#1A1A1A] block">Initial LACE Index (0-19)</label>
                    <input
                      id="modal-patient-lace"
                      type="number"
                      min="0"
                      max="19"
                      value={newLace}
                      onChange={(e) => setNewLace(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-blue-600 outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-[#1A1A1A] block">Co-existing Comorbidities</label>
                  <div className="grid grid-cols-2 gap-2">
                    {comorbOptions.map(opt => {
                      const active = newComorbidities.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleComorbToggle(opt)}
                          className={`text-left text-xs p-2.5 rounded-xl border font-semibold transition-all cursor-pointer ${
                            active 
                            ? 'bg-blue-50 text-blue-700 border-[#E5E7EB]' 
                            : 'bg-gray-50 text-gray-500 border-gray-150 hover:bg-gray-100'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-3xs transition-colors cursor-pointer"
                  >
                    Commit Admission to Clinic
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Patients Ledger Tables */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" id="patients-data-table">
          <thead>
            <tr className="bg-white border-b border-[#E5E7EB] text-[10px] font-bold text-gray-400 uppercase tracking-widest font-sans">
              <th className="py-4 px-5">ID & Name</th>
              <th className="py-4 px-5">Demographics</th>
              <th className="py-4 px-5">Primary Pathology</th>
              <th className="py-4 px-5">Clinical Region</th>
              <th className="py-4 px-5">LACE/Comorbidity</th>
              <th className="py-4 px-5">Status</th>
              <th className="py-4 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] text-xs text-[#1A1A1A]">
            {filteredPatients.length > 0 ? (
              filteredPatients.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/20 transition-colors font-sans" id={`patient-row-${p.id}`}>
                  
                  {/* ID and Patient Name */}
                  <td className="py-4 px-5">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[#1A1A1A]">{p.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono font-bold uppercase">{p.id}</div>
                    </div>
                  </td>

                  {/* Demographics details */}
                  <td className="py-4 px-5 whitespace-nowrap text-gray-400">
                    <div className="flex items-center space-x-2 font-semibold">
                      <span>{p.age} yrs</span>
                      <span className="text-gray-200">/</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.gender === 'Male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                      }`}>{p.gender}</span>
                    </div>
                  </td>

                  {/* Diagnosed pathologies */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    <div className="flex items-center space-x-2 font-bold text-[#1A1A1A]">
                      <Heart className="h-3.5 w-3.5 text-rose-500" />
                      <span>{p.primaryDiagnosis}</span>
                    </div>
                  </td>

                  {/* Clinical sector/region focus */}
                  <td className="py-4 px-5 text-gray-400 font-semibold">
                    Sector {p.region}
                  </td>

                  {/* Comorbidity loads */}
                  <td className="py-4 px-5">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">LACE Score:</span>
                        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full ${
                          p.laceScore >= 12 ? 'bg-red-50 text-red-700' : p.laceScore >= 7 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>{p.laceScore}</span>
                      </div>
                      {p.comorbidities.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {p.comorbidities.map(c => (
                            <span key={c} className="text-[9px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full font-bold border border-[#E5E7EB]">{c}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-semibold italic">No comorbidities</span>
                      )}
                    </div>
                  </td>

                  {/* Inpatient / Bed Discharge state */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      {p.status === 'Inpatient' ? (
                        <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-150">
                          <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                          <span>Inpatient</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-150">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span>Discharged</span>
                        </span>
                      )}
                      
                      {/* Readmission flag */}
                      {p.readmitted && (
                        <span className="flex items-center space-x-0.5 px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-[9px] font-bold uppercase tracking-wider">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          <span>Readmit Risk</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Custom mutation actions */}
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      {p.status === 'Inpatient' && (
                        <button
                          id={`discharge-btn-${p.id}`}
                          onClick={() => onDischargePatient(p.id)}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 hover:text-emerald-850 border border-emerald-100 text-[10px] font-bold py-1.5 px-3 rounded-full flex items-center space-x-1 transition-all cursor-pointer"
                          title="Discharge Inpatient"
                        >
                          <UserMinus className="h-3 w-3" />
                          <span>Discharge</span>
                        </button>
                      )}
                      <button
                        id={`delete-btn-${p.id}`}
                        onClick={() => onDeletePatient(p.id)}
                        className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all cursor-pointer"
                        title="Delete Medical Record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400 italic font-semibold">
                  No patient records found matching search filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
