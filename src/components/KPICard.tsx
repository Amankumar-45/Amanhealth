import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  bgClass
}: KPICardProps) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-xs flex items-start justify-between transition-all hover:border-gray-300" id={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="space-y-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
        <div className="text-3xl font-light text-[#1A1A1A] tracking-tight">{value}</div>
        <p className="text-[11px] text-gray-400 font-medium pt-1.5">{subtitle}</p>
      </div>
      <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass}`}>
        <Icon className="h-4.5 w-4.5 stroke-[2]" />
      </div>
    </div>
  );
}
