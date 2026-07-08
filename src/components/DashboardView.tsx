import React, { useMemo } from 'react';
import { Job, VehicleRate } from '../types';
import {
  TrendingUp,
  Coins,
  AlertOctagon,
  Percent,
  Calendar,
  Briefcase,
  PlaneTakeoff,
  Award,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface DashboardViewProps {
  jobs: Job[];
  rates: VehicleRate[];
  onNavigateToTab: (tab: any) => void;
}

export default function DashboardView({ jobs, rates, onNavigateToTab }: DashboardViewProps) {
  const stats = useMemo(() => {
    const totalJobs = jobs.length;
    const totalFare = jobs.reduce((sum, j) => sum + j.baseFare, 0);
    const totalBonus = jobs.reduce((sum, j) => sum + j.bonus, 0);
    const totalPenalty = jobs.reduce((sum, j) => sum + j.penalty, 0);
    const totalTax = jobs.reduce((sum, j) => sum + j.tax, 0);
    const totalNet = jobs.reduce((sum, j) => sum + j.netIncome, 0);

    return {
      totalJobs,
      totalFare,
      totalBonus,
      totalPenalty,
      totalTax,
      totalNet,
    };
  }, [jobs]);

  // Chart data: Vehicle code distribution
  const vehicleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    jobs.forEach(j => {
      counts[j.vehicleCode] = (counts[j.vehicleCode] || 0) + 1;
    });

    return Object.entries(counts).map(([code, count]) => ({
      name: code,
      count,
    })).sort((a, b) => b.count - a.count);
  }, [jobs]);

  // Chart data: Earnings timeline
  const earningsTimeline = useMemo(() => {
    const dailyMap: Record<string, { date: string; base: number; net: number; jobs: number }> = {};
    const sorted = [...jobs].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach(j => {
      if (!dailyMap[j.date]) {
        dailyMap[j.date] = { date: j.date, base: 0, net: 0, jobs: 0 };
      }
      dailyMap[j.date].base += j.baseFare;
      dailyMap[j.date].net += j.netIncome;
      dailyMap[j.date].jobs += 1;
    });

    return Object.values(dailyMap).slice(-10); // Last 10 days of activity
  }, [jobs]);

  // Top routes count
  const popularRoutes = useMemo(() => {
    const counts: Record<string, number> = {};
    jobs.forEach(j => {
      counts[j.route] = (counts[j.route] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [jobs]);

  // Recent 5 dispatches
  const recentDispatches = useMemo(() => {
    return [...jobs]
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
      .slice(0, 5);
  }, [jobs]);

  return (
    <div className="space-y-6">
      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Trips */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">จำนวนงานขับทั้งหมด</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalJobs.toLocaleString()} งาน</h3>
            <p className="text-[10px] text-slate-500 mt-1">บริการวิ่งรถรับ-ส่งสนามบินสะสม</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Briefcase className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Total Base Fare */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">รายได้ค่างานสะสม</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">฿{stats.totalFare.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">
              โบนัสบวกเพิ่มสะสม: ฿{stats.totalBonus.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Coins className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Tax Withheld */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">หัก ภาษี ณ ที่จ่าย (5%)</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">฿{stats.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <p className="text-[10px] text-rose-500 font-bold mt-1">หักภาษีเข้าระบบอัตโนมัติ 5%</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Percent className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Net Grand Total */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">รายรับสุทธิพนักงานขับรถ</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">฿{stats.totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <p className="text-[10px] text-indigo-400 mt-1">ยอดรวมหลังจากคำนวณโบนัส หักค่าปรับ และหักภาษี 5%</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Bonus & Penalty Quick Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-700">รายการบวกเพิ่มสะสม (Bonus)</p>
            <p className="text-lg font-black text-emerald-950">฿{stats.totalBonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 text-rose-800 rounded-lg">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-rose-700">รายการหักค่าปรับสะสม (Penalty)</p>
            <p className="text-lg font-black text-rose-950">฿{stats.totalPenalty.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Analytics Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue timeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-500" />
            เส้นแนวโน้มรายรับสะสมและยอดสุทธิ (10 วันล่าสุด)
          </h4>
          <div className="h-64 w-full">
            {earningsTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsTimeline} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [`฿${value}`, '']} contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" name="ยอดเงินรับสุทธิ (บาท)" dataKey="net" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNet)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                ไม่มีข้อมูลประวัติการทำงานเพียงพอสำหรับการแสดงกราฟ
              </div>
            )}
          </div>
        </div>

        {/* Vehicle distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <PlaneTakeoff className="h-4 w-4 text-indigo-500" />
            สัดส่วนการใช้รหัสรถ (เที่ยวงานทั้งหมด)
          </h4>
          <div className="h-48 w-full flex items-center justify-center">
            {vehicleDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {vehicleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 3 === 0 ? '#4f46e5' : index % 3 === 1 ? '#818cf8' : '#a5b4fc'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '11px' }} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs">ไม่มีข้อมูลเที่ยวงาน</div>
            )}
          </div>
          <div className="mt-4 text-center text-[10px] text-slate-500 bg-slate-50 py-1.5 rounded-lg border border-slate-100">
            รหัสรถที่ใช้งานบ่อยที่สุด: <span className="font-bold text-indigo-600">{vehicleDistribution[0]?.name || '-'}</span> ({vehicleDistribution[0]?.count || 0} เที่ยว)
          </div>
        </div>
      </div>

      {/* Bottom Grid: Popular routes & Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Routes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">เส้นทางที่นิยมวิ่งที่สุด 5 อันดับแรก</h4>
          <div className="space-y-3">
            {popularRoutes.length > 0 ? (
              popularRoutes.map((r, i) => (
                <div key={r.route} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100/50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-mono text-[10px]">{i + 1}</span>
                    <span className="font-medium text-slate-700 max-w-[160px] truncate">{r.route}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px] font-bold">{r.count} เที่ยวงาน</span>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-xs py-8 text-center">ไม่มีข้อมูลเส้นทาง</div>
            )}
          </div>
        </div>

        {/* Recent Dispatches table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">รายการงานวิ่งรับ-ส่งล่าสุด</h4>
            <button
              onClick={() => onNavigateToTab('jobs')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
              id="btn-nav-jobs"
            >
              ดูงานวิ่งทั้งหมด →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2">รหัสงาน / วันที่</th>
                  <th className="pb-2">รหัสรถ</th>
                  <th className="pb-2">เส้นทาง & เที่ยวบิน</th>
                  <th className="pb-2 text-right">รายรับรวม</th>
                  <th className="pb-2 text-right">ยอดสุทธิ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentDispatches.length > 0 ? (
                  recentDispatches.map(job => (
                    <tr key={job.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-2.5">
                        <p className="font-bold text-slate-800">{job.id}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{job.date} {job.time}</p>
                      </td>
                      <td className="py-2.5">
                        <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                          {job.vehicleCode}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <p className="text-slate-800 font-medium truncate max-w-[150px]">{job.route}</p>
                        {job.flight && (
                          <p className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5">
                            ✈️ {job.flight}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-700">
                        ฿{job.baseFare.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-indigo-600">
                        ฿{job.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      ยังไม่มีข้อมูลงานวิ่งในระบบในขณะนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
