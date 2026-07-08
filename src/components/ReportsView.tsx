import React, { useState } from 'react';
import { Job, VehicleRate } from '../types';
import ReportsDailyView from './ReportsDailyView';
import ReportsWeeklyView from './ReportsWeeklyView';
import ReportsMonthlyView from './ReportsMonthlyView';
import { FileText, Calendar, BarChart, TrendingUp } from 'lucide-react';

interface ReportsViewProps {
  jobs: Job[];
  rates: VehicleRate[];
}

export default function ReportsView({ jobs, rates }: ReportsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'weekly' | 'daily' | 'monthly'>('weekly');

  return (
    <div className="space-y-6">
      {/* Tab Navigation header */}
      <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => setActiveSubTab('weekly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeSubTab === 'weekly'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          id="btn-subtab-weekly"
        >
          <Calendar className="h-4 w-4" />
          เครื่องคำนวณงานวิ่งรายสัปดาห์ (พุธ - อังคาร)
        </button>

        <button
          onClick={() => setActiveSubTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeSubTab === 'daily'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          id="btn-subtab-daily"
        >
          <FileText className="h-4 w-4" />
          รายงานรายวันแยกแผ่น (Daily Sheet)
        </button>

        <button
          onClick={() => setActiveSubTab('monthly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeSubTab === 'monthly'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
          id="btn-subtab-monthly"
        >
          <BarChart className="h-4 w-4" />
          สรุปภาพรวมรายเดือน (Monthly Rollup)
        </button>
      </div>

      {/* Render selected report */}
      <div className="transition-all duration-300">
        {activeSubTab === 'weekly' && <ReportsWeeklyView jobs={jobs} rates={rates} />}
        {activeSubTab === 'daily' && <ReportsDailyView jobs={jobs} />}
        {activeSubTab === 'monthly' && <ReportsMonthlyView jobs={jobs} />}
      </div>
    </div>
  );
}
