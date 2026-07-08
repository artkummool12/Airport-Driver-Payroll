import React, { useState, useMemo } from 'react';
import { Job, getCleanJobId } from '../types';
import { Printer, Calendar, FileText, Award, AlertTriangle, Landmark, Car, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

interface ReportsDailyViewProps {
  jobs: Job[];
}

const DAY_NAMES_THAI = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์'
];

const getThaiDayName = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const day = d.getDay();
  return DAY_NAMES_THAI[day] || '';
};

const formatDateDMY = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parseInt(parts[2])}/${parseInt(parts[1])}/${parts[0]}`;
};

export default function ReportsDailyView({ jobs }: ReportsDailyViewProps) {
  // Find all available dates
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(jobs.map(j => j.date)));
    return dates.sort((a, b) => b.localeCompare(a));
  }, [jobs]);

  const [selectedDate, setSelectedDate] = useState(() => {
    return '';
  });

  // Filter jobs for selected date
  const dailyJobs = useMemo(() => {
    if (!selectedDate) {
      return [...jobs].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
    }
    return jobs
      .filter(j => j.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [jobs, selectedDate]);

  // Calculate day subtotals
  const daySubtotals = useMemo(() => {
    return dailyJobs.reduce(
      (acc, j) => {
        acc.trips += 1;
        acc.base += j.baseFare;
        acc.bonus += j.bonus;
        acc.penalty += j.penalty;
        acc.tax += j.tax;
        acc.net += j.netIncome;
        return acc;
      },
      { trips: 0, base: 0, bonus: 0, penalty: 0, tax: 0, net: 0 }
    );
  }, [dailyJobs]);

  // Group daily jobs by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Job[]> = {};
    dailyJobs.forEach(job => {
      if (!groups[job.date]) {
        groups[job.date] = [];
      }
      groups[job.date].push(job);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a)); // Latest date first
    return sortedDates.map(date => {
      const sortedJobs = groups[date].sort((a, b) => a.time.localeCompare(b.time));
      const totals = sortedJobs.reduce(
        (acc, j) => {
          acc.trips += 1;
          acc.base += j.baseFare;
          acc.bonus += j.bonus;
          acc.penalty += j.penalty;
          acc.tax += j.tax;
          acc.net += j.netIncome;
          return acc;
        },
        { trips: 0, base: 0, bonus: 0, penalty: 0, tax: 0, net: 0 }
      );
      return {
        date,
        jobs: sortedJobs,
        dayName: getThaiDayName(date),
        totals
      };
    });
  }, [dailyJobs]);

  // Recharts Airport distribution data
  const airportChartData = useMemo(() => {
    const counts = { BKK: 0, DMK: 0 };
    dailyJobs.forEach(j => {
      if (j.airport === 'BKK' || j.airport === 'DMK') {
        counts[j.airport] += 1;
      } else {
        // Fallback guess from route
        const rUpper = j.route.toUpperCase();
        if (rUpper.includes('BKK') || j.route.includes('สุวรรณภูมิ')) counts.BKK += 1;
        else if (rUpper.includes('DMK') || j.route.includes('ดอนเมือง')) counts.DMK += 1;
        else counts.BKK += 1; // Default
      }
    });

    return [
      { name: 'สุวรรณภูมิ (BKK)', value: counts.BKK, color: '#6366f1' },
      { name: 'ดอนเมือง (DMK)', value: counts.DMK, color: '#f59e0b' }
    ].filter(d => d.value > 0);
  }, [dailyJobs]);

  // Recharts Vehicle distribution data
  const vehicleChartData = useMemo(() => {
    const map: Record<string, number> = {};
    dailyJobs.forEach(j => {
      map[j.vehicleCode] = (map[j.vehicleCode] || 0) + 1;
    });
    return Object.entries(map).map(([code, count]) => ({
      name: code,
      trips: count
    })).sort((a, b) => b.trips - a.trips);
  }, [dailyJobs]);

  const handlePrint = () => {
    window.print();
  };

  const formatDateTH = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0]) + 543;
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthIndex = parseInt(parts[1]) - 1;
    return `${parseInt(parts[2])} ${months[monthIndex]} พ.ศ. ${year}`;
  };

  return (
    <div className="space-y-6">
      {/* Selector Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">เลือกสรุปข้อมูลแบบด่วน</span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 font-sans cursor-pointer"
              >
                <option value="">📁 — แสดงทั้งหมด (ทุกวัน) —</option>
                {availableDates.map(d => (
                  <option key={d} value={d}>📅 {formatDateTH(d)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-px sm:h-8 w-full sm:w-px bg-slate-200"></div>

          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">ระบุวันที่ละเอียด</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 font-mono cursor-pointer"
            />
          </div>

          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="mt-4 sm:mt-5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              แสดงทั้งหมด
            </button>
          )}
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Printer className="h-4 w-4" />
          พิมพ์ใบสรุปรายงานรายวัน (PDF)
        </button>
      </div>

      {/* 100% Premium Dashboard Summary Box (Weekly Grand Summary) */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden" id="weekly-grand-summary">
        {/* Decorative background glow */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Landmark className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-wider text-slate-300 uppercase">
                สรุปยอดรวมสุทธิรายสัปดาห์ (Weekly Grand Summary)
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">รวมผลประกอบการวิ่งรถสะสมจากวันปฏิบัติงานที่แสดงผล</p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold font-mono">
            {selectedDate ? `1 วัน` : `${availableDates.length} วันทำการ`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Total Trips */}
          <div className="pt-4 md:pt-0 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              จำนวนงานรวมทั้งสิ้น
            </span>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-white">
                {daySubtotals.trips}
              </span>
              <span className="text-xs font-bold text-slate-400">งานวิ่ง</span>
            </div>
          </div>

          {/* Total Tax */}
          <div className="pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              ภาษีหัก ณ ที่จ่าย รวม
            </span>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-rose-400">
                ฿{daySubtotals.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Total Net Income */}
          <div className="pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-indigo-300 block uppercase tracking-wider">
              ยอดสุทธิที่ได้รับรวม
            </span>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-emerald-400">
                ฿{daySubtotals.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="printable-report space-y-6">
        {/* Printable Header */}
        <div className="hidden print:block text-center pb-6 border-b border-slate-200">
          <h1 className="text-xl font-black text-slate-900">ระบบคำนวณรายได้พนักงานขับรถรับ-ส่งสนามบิน</h1>
          <p className="text-xs text-slate-500 mt-1">รายงานสรุปงานวิ่งและค่าเที่ยวสะสมรายวันแบบละเอียด</p>
          <p className="text-xs font-mono font-bold text-indigo-700 mt-2 bg-indigo-50 inline-block px-4 py-1.5 rounded-full">
            ประจำวันที่: {selectedDate ? formatDateTH(selectedDate) : 'ทั้งหมด (ทุกวัน)'}
          </p>
        </div>

        {/* Visual Charts Row */}
        {dailyJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
            {/* Pie Chart: Airports */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <PieIcon className="h-4 w-4 text-indigo-500" />
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">สัดส่วนตามสนามบินต้นทาง-ปลายทาง</h4>
              </div>
              <div className="h-40 flex items-center justify-center">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={airportChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {airportChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2 text-xs">
                  {airportChartData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                      <span className="text-slate-500 font-medium text-[11px]">{entry.name}:</span>
                      <span className="font-bold text-slate-800 font-mono text-[11px]">{entry.value} งาน</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar Chart: Vehicle Productivity */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Car className="h-4 w-4 text-amber-500" />
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">จำนวนรอบวิ่งของแต่ละรหัสรถ</h4>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vehicleChartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(226, 232, 240, 0.3)' }} contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    <Bar dataKey="trips" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      {vehicleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#a855f7'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Grouped Jobs Table - Separated by Day */}
        <div className="space-y-8">
          {groupedByDate.length > 0 ? (
            groupedByDate.map(group => (
              <div key={group.date} className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden" id={`day-table-${group.date}`}>
                {/* Day Header - Blue Header bar */}
                <div className="bg-[#244270]/10 p-4 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-indigo-600" />
                    {group.dayName} ที่ {formatDateDMY(group.date)}
                  </h4>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full font-mono">
                    {group.totals.trips} เที่ยววิ่ง
                  </span>
                </div>

                <div className="overflow-x-auto font-sans">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-[#244270] text-white font-bold border-b border-slate-100 uppercase tracking-wider text-[9.5px]">
                        <th className="p-3 w-[10%]">วันที่</th>
                        <th className="p-3 w-[11%]">รหัสรถ</th>
                        <th className="p-3 w-[11%]">รหัสงาน</th>
                        <th className="p-3 w-[8%]">เวลา</th>
                        <th className="p-3 w-[26%]">เส้นทาง & เที่ยวบิน</th>
                        <th className="p-3 text-center w-[8%]">จำนวนงาน</th>
                        <th className="p-3 text-right w-[9%]">ค่างานต่องาน</th>
                        <th className="p-3 text-right text-emerald-100 w-[9%]">บวกเพิ่ม</th>
                        <th className="p-3 text-right text-rose-100 w-[9%]">ค่าปรับ</th>
                        <th className="p-3 text-right text-rose-100 w-[9%]">หัก ภาษี 5%</th>
                        <th className="p-3 text-right text-indigo-100 w-[10%]">ยอดสุทธิ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.jobs.map(job => (
                        <tr key={job.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-600">{formatDateDMY(job.date)}</td>
                          <td className="p-3">
                            <span className="bg-slate-100 font-mono font-bold text-slate-700 px-1.5 py-0.5 rounded text-[9.5px]">
                              {job.vehicleCode}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">{getCleanJobId(job.id)}</td>
                          <td className="p-3 font-mono font-bold text-slate-700">{job.time} น.</td>
                          <td className="p-3">
                            <p className="font-semibold text-slate-800">{job.route}</p>
                            {job.flight && (
                              <p className="text-[8.5px] text-indigo-600 font-mono mt-0.5">
                                ✈️ เที่ยวบิน: {job.flight}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700">1</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-700">
                            ฿{job.baseFare.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            {job.bonus > 0 ? `฿${job.bonus.toFixed(2)}` : '0.00'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-500">
                            {job.penalty > 0 ? `฿${job.penalty.toFixed(2)}` : '0.00'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-600">
                            ฿{job.tax.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-indigo-600 bg-indigo-50/5">
                            ฿{job.netIncome.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      {/* Sum Row styled matching the spreadsheet double underlines */}
                      <tr className="bg-slate-50/80 font-bold border-t-2 border-slate-200 border-b-4 border-double border-slate-900 text-slate-800">
                        <td colSpan={5} className="p-3 text-left font-black text-slate-900">
                          รวม {group.dayName}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-slate-900">
                          {group.totals.trips}
                        </td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="p-3 text-right font-mono font-black text-rose-600">
                          ฿{group.totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-indigo-700 bg-indigo-100/10">
                          ฿{group.totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
              <p className="font-medium text-slate-500">ไม่พบบันทึกเที่ยวงานวิ่งรถในวันที่ระบุ</p>
              <p className="text-[10px] text-slate-400 mt-1">กรุณาวางรายงานสรุปผลจาก LINE หรือบันทึกเที่ยววิ่งแมนนวลเพื่อเริ่มต้นคำนวณ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
