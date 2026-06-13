import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { DiseaseTrend, FinancialDetail, PhysicianRecord, PatientRecord } from '../types.ts';
import { TrendingUp, Users, DollarSign, Award } from 'lucide-react';

interface PowerBIChartsProps {
  diseaseTrends: DiseaseTrend[];
  financialDetails: FinancialDetail[];
  physicians: PhysicianRecord[];
  patients: PatientRecord[];
}

export default function PowerBICharts({
  diseaseTrends,
  financialDetails,
  physicians,
  patients
}: PowerBIChartsProps) {
  
  // 1. Compute Gender Distribution from Patients
  const genders = patients.reduce((acc, p) => {
    acc[p.gender] = (acc[p.gender] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const genderData = Object.entries(genders).map(([name, value]) => ({ name, value }));
  const COLORS = ['#3b82f6', '#ec4899', '#8b5cf6'];

  // 2. Compute Disease Distribution for Most Common Diseases
  const diseases = patients.reduce((acc, p) => {
    acc[p.primaryDiagnosis] = (acc[p.primaryDiagnosis] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const diseaseData = Object.entries(diseases)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const DISEASE_COLORS = ['#3bb2f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280', '#06b6d4'];

  return (
    <div className="space-y-6" id="charts-workspace">
      {/* Chart Row 1: Trends and Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Dynamic Monthly Disease Trends */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-xs" id="chart-disease-trends">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold tracking-tight text-[#1A1A1A]">Patient Admission Trends</h3>
              <p className="text-xs text-gray-400">Historical admission load mapped across 6-months</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diseaseTrends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Covid19" name="COVID-19" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Flu" name="Influenza" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Diabetes" name="Diabetes" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Hypertension" name="Hypertension" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="HeartDisease" name="Heart Disease" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Flow analysis */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-xs" id="chart-financial-analytics">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold tracking-tight text-[#1A1A1A]">Financial Performance Details</h3>
              <p className="text-xs text-gray-400">Monthly breakdown of revenues, costs & insurance coverage</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialDetails} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  formatter={(v) => [`$${Number(v).toLocaleString()}`]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="costs" name="Operational Cost" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCosts)" />
                <Line type="monotone" dataKey="claims" name="Insurance Claims" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Chart Row 2: Doctor performance & Demographic breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Doctor and Department success metric */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-xs lg:col-span-2" id="chart-doctors-performance">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold tracking-tight text-[#1A1A1A]">Doctor & Department Success Ledger</h3>
              <p className="text-xs text-gray-400">Treated patients volume vs clinical outcome success rates %</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={physicians} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis yAxisId="left" stroke="#3b82f6" fontSize={11} tickLine={false} label={{ value: 'Patients Treated', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3b82f6', fontSize: '10px' } }} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickLine={false} label={{ value: 'Success %', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#10b981', fontSize: '10px' } }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="patientsTreated" name="Patients Treated" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="right" dataKey="successRate" name="Success Rate (%)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pathology breakdown / Disease distribution */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-xs" id="chart-disease-demographics">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold tracking-tight text-[#1A1A1A]">Common Pathologies</h3>
              <p className="text-xs text-gray-400">Active caseload diagnostic split</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={{ fontSize: '11px' }} />
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend split */}
            <div className="flex justify-center space-x-6 w-full text-xs font-semibold text-gray-500 mt-2 font-mono">
              {genderData.map((d, i) => (
                <div key={d.name} className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span>{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick list of diseases */}
          <div className="mt-5 space-y-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Most Frequent Conditions</div>
            {diseaseData.slice(0, 3).map((d, i) => (
              <div key={d.name} className="flex justify-between items-center text-xs text-[#1A1A1A] bg-gray-50 px-3 py-2 rounded-xl border border-[#E5E7EB] font-medium">
                <span className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DISEASE_COLORS[i % DISEASE_COLORS.length] }} />
                  <span>{d.name}</span>
                </span>
                <span className="font-mono text-gray-400 text-[11px]">{d.count} Cases</span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
