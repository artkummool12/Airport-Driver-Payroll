import React, { useState, useMemo } from 'react';
import { Job, VehicleRate } from '../types';
import ReportsDailyView from './ReportsDailyView';
import ReportsWeeklyView, { getPayrollWeekRange } from './ReportsWeeklyView';
import ReportsMonthlyView from './ReportsMonthlyView';
import { FileText, Calendar, BarChart, Sparkles } from 'lucide-react';

interface ReportsViewProps {
  jobs: Job[];
  rates: VehicleRate[];
}

export default function ReportsView({ jobs, rates }: ReportsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'weekly' | 'daily' | 'monthly'>('weekly');

  // 1. Available dates and latest day stats
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(jobs.map(j => j.date)));
    return dates.sort((a, b) => b.localeCompare(a));
  }, [jobs]);

  const latestDate = availableDates[0] || '';

  const latestDayStats = useMemo(() => {
    if (!latestDate) return { trips: 0, net: 0, dateStr: '' };
    const dayJobs = jobs.filter(j => j.date === latestDate);
    const net = dayJobs.reduce((sum, j) => sum + j.netIncome, 0);
    return { trips: dayJobs.length, net, dateStr: latestDate };
  }, [jobs, latestDate]);

  // 2. Weekly range and latest week stats
  const payrollWeeks = useMemo(() => {
    const weeksMap: Record<string, { start: string; end: string }> = {};
    jobs.forEach(j => {
      const range = getPayrollWeekRange(j.date);
      const key = `${range.start}_${range.end}`;
      weeksMap[key] = range;
    });
    return Object.values(weeksMap).sort((a, b) => b.start.localeCompare(a.start));
  }, [jobs]);

  const latestWeek = payrollWeeks[0] || null;

  const latestWeekStats = useMemo(() => {
    if (!latestWeek) return { trips: 0, net: 0 };
    const weekJobs = jobs.filter(j => j.date >= latestWeek.start && j.date <= latestWeek.end);
    const net = weekJobs.reduce((sum, j) => sum + j.netIncome, 0);
    return { trips: weekJobs.length, net };
  }, [jobs, latestWeek]);

  // 3. Available months and latest month stats
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(jobs.map(j => j.date.substring(0, 7))));
    return months.sort((a, b) => b.localeCompare(a));
  }, [jobs]);

  const latestMonth = availableMonths[0] || '';

  const latestMonthStats = useMemo(() => {
    if (!latestMonth) return { trips: 0, net: 0, monthStr: '' };
    const monthJobs = jobs.filter(j => j.date.startsWith(latestMonth));
    const net = monthJobs.reduce((sum, j) => sum + j.netIncome, 0);
    return { trips: monthJobs.length, net, monthStr: latestMonth };
  }, [jobs, latestMonth]);

  // Thai Date Formatting Helpers
  const formatDateTHShort = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parseInt(parts[0]) + 543 - 2500}`;
  };

  const formatMonthNameTHShort = (monthStr: string) => {
    if (!monthStr) return '';
    const parts = monthStr.split('-');
    if (parts.length !== 2) return monthStr;
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[0]) + 543}`;
  };

  return (
    <div className="space-y-6">
      {/* 100% Custom Premium Summary Boxes (Daily, Weekly, Monthly Overview) */}
      <div className="bg-slate-50/40 p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            สรุปภาพรวมรายได้สะสมล่าสุด (เลือกคลิกกล่องเพื่อเปลี่ยนแทบรายงาน)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Daily Card */}
          <button
            onClick={() => setActiveSubTab('daily')}
            className={`text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              activeSubTab === 'daily'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-600 shadow-sm scale-[1.01]'
                : 'bg-white hover:bg-slate-50/50 border-slate-100 text-slate-800'
            }`}
            id="overview-card-daily"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider block ${
                  activeSubTab === 'daily' ? 'text-emerald-100' : 'text-slate-400'
                }`}>
                  สรุปรายวันล่าสุด (Daily)
                </span>
                <span className={`text-xs font-black mt-1 block ${
                  activeSubTab === 'daily' ? 'text-teal-50' : 'text-indigo-600'
                }`}>
                  {latestDayStats.dateStr ? `วันที่ ${formatDateTHShort(latestDayStats.dateStr)}` : 'ไม่มีข้อมูลงานวิ่ง'}
                </span>
              </div>
              <div className={`p-2 rounded-xl transition-colors ${
                activeSubTab === 'daily' ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-600'
              }`}>
                <FileText className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5">
              <span className={`text-[10px] block font-bold ${activeSubTab === 'daily' ? 'text-emerald-100/85' : 'text-slate-500'}`}>
                รายรับสุทธิสะสมรายวัน
              </span>
              <span className="text-2xl font-black font-mono block mt-0.5">
                ฿{latestDayStats.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3 border-current/10 text-[10px]">
              <span className="font-bold">วิ่งรวมสะสม: {latestDayStats.trips} เที่ยว</span>
              <span className={`font-black px-2 py-0.5 rounded-full text-[9px] ${
                activeSubTab === 'daily' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {activeSubTab === 'daily' ? 'กำลังแสดงตาราง' : 'คลิกเพื่อเปิดตาราง'}
              </span>
            </div>
          </button>

          {/* Weekly Card */}
          <button
            onClick={() => setActiveSubTab('weekly')}
            className={`text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              activeSubTab === 'weekly'
                ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-indigo-600 shadow-sm scale-[1.01]'
                : 'bg-white hover:bg-slate-50/50 border-slate-100 text-slate-800'
            }`}
            id="overview-card-weekly"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider block ${
                  activeSubTab === 'weekly' ? 'text-indigo-100' : 'text-slate-400'
                }`}>
                  สรุปรายสัปดาห์รอบบิล (Weekly)
                </span>
                <span className={`text-xs font-black mt-1 block ${
                  activeSubTab === 'weekly' ? 'text-blue-50' : 'text-indigo-600'
                }`}>
                  {latestWeek ? `${formatDateTHShort(latestWeek.start)} — ${formatDateTHShort(latestWeek.end)}` : 'ไม่มีข้อมูลงานวิ่ง'}
                </span>
              </div>
              <div className={`p-2 rounded-xl transition-colors ${
                activeSubTab === 'weekly' ? 'bg-white/10 text-white' : 'bg-indigo-50 text-indigo-600'
              }`}>
                <Calendar className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5">
              <span className={`text-[10px] block font-bold ${activeSubTab === 'weekly' ? 'text-indigo-100/85' : 'text-slate-500'}`}>
                รายรับสุทธิสะสมสัปดาห์นี้
              </span>
              <span className="text-2xl font-black font-mono block mt-0.5">
                ฿{latestWeekStats.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3 border-current/10 text-[10px]">
              <span className="font-bold">วิ่งรวมสะสม: {latestWeekStats.trips} เที่ยว</span>
              <span className={`font-black px-2 py-0.5 rounded-full text-[9px] ${
                activeSubTab === 'weekly' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
              }`}>
                {activeSubTab === 'weekly' ? 'กำลังแสดงตาราง' : 'คลิกเพื่อเปิดตาราง'}
              </span>
            </div>
          </button>

          {/* Monthly Card */}
          <button
            onClick={() => setActiveSubTab('monthly')}
            className={`text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              activeSubTab === 'monthly'
                ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white border-purple-600 shadow-sm scale-[1.01]'
                : 'bg-white hover:bg-slate-50/50 border-slate-100 text-slate-800'
            }`}
            id="overview-card-monthly"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider block ${
                  activeSubTab === 'monthly' ? 'text-purple-100' : 'text-slate-400'
                }`}>
                  สรุปรายเดือนภาพรวม (Monthly)
                </span>
                <span className={`text-xs font-black mt-1 block ${
                  activeSubTab === 'monthly' ? 'text-pink-50' : 'text-indigo-600'
                }`}>
                  {latestMonthStats.monthStr ? formatMonthNameTHShort(latestMonthStats.monthStr) : 'ไม่มีข้อมูลงานวิ่ง'}
                </span>
              </div>
              <div className={`p-2 rounded-xl transition-colors ${
                activeSubTab === 'monthly' ? 'bg-white/10 text-white' : 'bg-purple-50 text-purple-600'
              }`}>
                <BarChart className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5">
              <span className={`text-[10px] block font-bold ${activeSubTab === 'monthly' ? 'text-purple-100/85' : 'text-slate-500'}`}>
                รายรับสุทธิสะสมเดือนนี้
              </span>
              <span className="text-2xl font-black font-mono block mt-0.5">
                ฿{latestMonthStats.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3 border-current/10 text-[10px]">
              <span className="font-bold">วิ่งรวมสะสม: {latestMonthStats.trips} เที่ยว</span>
              <span className={`font-black px-2 py-0.5 rounded-full text-[9px] ${
                activeSubTab === 'monthly' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-700'
              }`}>
                {activeSubTab === 'monthly' ? 'กำลังแสดงตาราง' : 'คลิกเพื่อเปิดตาราง'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Navigation header */}
      <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => setActiveSubTab('weekly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
