import React, { useState, useMemo } from 'react';
import { Job } from '../types';
import { Printer, Calendar, BarChart, Download, FileText, Car, Award, AlertTriangle, Landmark, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ReportsMonthlyViewProps {
  jobs: Job[];
}

const MONTHS_THAI = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function ReportsMonthlyView({ jobs }: ReportsMonthlyViewProps) {
  // Extract unique months (e.g. YYYY-MM)
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(jobs.map(j => j.date.substring(0, 7))));
    return months.sort((a, b) => b.localeCompare(a));
  }, [jobs]);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return availableMonths[0] || new Date().toISOString().substring(0, 7);
  });

  // Filter jobs for selected month
  const monthlyJobs = useMemo(() => {
    return jobs.filter(j => j.date.startsWith(selectedMonth));
  }, [jobs, selectedMonth]);

  // Aggregate stats for the month
  const monthlyStats = useMemo(() => {
    return monthlyJobs.reduce(
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
  }, [monthlyJobs]);

  // Daily rollup for table listing & trend chart
  const dailyRollup = useMemo(() => {
    const dayMap: Record<string, { date: string; trips: number; base: number; tax: number; net: number }> = {};
    monthlyJobs.forEach(j => {
      if (!dayMap[j.date]) {
        dayMap[j.date] = { date: j.date, trips: 0, base: 0, tax: 0, net: 0 };
      }
      dayMap[j.date].trips += 1;
      dayMap[j.date].base += j.baseFare + j.bonus - j.penalty;
      dayMap[j.date].tax += j.tax;
      dayMap[j.date].net += j.netIncome;
    });

    // Sort ascending for chart (chronological) and descending for table
    const sortedList = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
    return sortedList;
  }, [monthlyJobs]);

  const dailyRollupTable = useMemo(() => {
    return [...dailyRollup].sort((a, b) => b.date.localeCompare(a.date));
  }, [dailyRollup]);

  // Format daily rollup for Recharts
  const chartData = useMemo(() => {
    return dailyRollup.map(day => {
      const dayNum = day.date.split('-')[2];
      return {
        dayLabel: `${parseInt(dayNum)}`,
        'รายได้สุทธิ (฿)': parseFloat(day.net.toFixed(2)),
        'เที่ยวงานวิ่ง': day.trips
      };
    });
  }, [dailyRollup]);

  // Vehicle-wise summary for the month
  const vehicleSummary = useMemo(() => {
    const summary: Record<string, { trips: number; net: number }> = {};
    monthlyJobs.forEach(j => {
      if (!summary[j.vehicleCode]) {
        summary[j.vehicleCode] = { trips: 0, net: 0 };
      }
      summary[j.vehicleCode].trips += 1;
      summary[j.vehicleCode].net += j.netIncome;
    });

    return Object.entries(summary)
      .map(([code, data]) => ({
        code,
        trips: data.trips,
        net: parseFloat(data.net.toFixed(2))
      }))
      .sort((a, b) => b.net - a.net);
  }, [monthlyJobs]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (monthlyJobs.length === 0) return;
    const headers = ['วันที่ทำงาน', 'จำนวนเที่ยววิ่ง', 'ยอดเงินดิบ (รวมโบนัสหักค่าปรับ)', 'ภาษีหัก ณ ที่จ่าย 5%', 'รายรับสุทธิ'];
    const rows = dailyRollupTable.map(d => [
      d.date,
      d.trips,
      d.base,
      d.tax,
      d.net
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `รายงานรายได้รายเดือน_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatMonthNameTH = (monthStr: string) => {
    if (!monthStr) return '';
    const parts = monthStr.split('-');
    if (parts.length !== 2) return monthStr;
    const year = parseInt(parts[0]) + 543; // Convert to Buddhist Era
    const monthIndex = parseInt(parts[1]) - 1;
    return `${MONTHS_THAI[monthIndex]} พ.ศ. ${year}`;
  };

  const formatDateTH = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const monthIndex = parseInt(parts[1]) - 1;
    return `${parseInt(parts[2])} ${months[monthIndex]} ${parseInt(parts[0]) + 543}`;
  };

  return (
    <div className="space-y-6">
      {/* Selector Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">เลือกประจำเดือนสรุปรายงาน</span>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 font-mono"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{formatMonthNameTH(m)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            พิมพ์ใบสรุปรายงาน (PDF)
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            ส่งออกไฟล์ Excel
          </button>
        </div>
      </div>

      <div className="printable-report space-y-6">
        {/* Print Header */}
        <div className="hidden print:block text-center pb-6 border-b border-slate-200">
          <h1 className="text-xl font-black text-slate-900">ระบบคำนวณรายได้พนักงานขับรถรับ-ส่งสนามบิน</h1>
          <p className="text-xs text-slate-500 mt-1">รายงานผลการทำงาน และค่าจ้างประจำเดือนรวมสะสมแบบย่อ</p>
          <p className="text-xs font-bold text-indigo-700 mt-2 bg-indigo-50 inline-block px-4 py-1.5 rounded-full">
            รอบบิลประจำเดือน: {formatMonthNameTH(selectedMonth)}
          </p>
        </div>

        {/* Bento stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">เที่ยวงานวิ่งรวมทั้งเดือน</span>
              <span className="text-2xl font-black text-slate-800 font-mono mt-1 block">{monthlyStats.trips} เที่ยว</span>
            </div>
            <div className="mt-3 text-[10px] text-slate-400 font-medium">เที่ยวงานทั้งหมดของพนักงานขับรถ</div>
            <div className="absolute right-3 top-3 p-1.5 bg-indigo-50 text-indigo-500 rounded-lg">
              <Car className="h-4 w-4" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
            <div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider block">รายได้งานดิบรวม (ก่อนหัก)</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                ฿{(monthlyStats.base + monthlyStats.bonus - monthlyStats.penalty).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <Award className="h-3.5 w-3.5" />
              รวมบวกโบนัสพิเศษ ฿{monthlyStats.bonus.toLocaleString()}
            </div>
            <div className="absolute right-3 top-3 p-1.5 bg-emerald-50 text-emerald-500 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
            <div>
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">รวมภาษีหัก ณ ที่จ่าย 5%</span>
              <span className="text-2xl font-black text-rose-500 font-mono mt-1 block">
                ฿{monthlyStats.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 text-[10px] text-rose-500 font-bold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              ค่าปรับเดือนนี้ ฿{monthlyStats.penalty.toLocaleString()}
            </div>
            <div className="absolute right-3 top-3 p-1.5 bg-rose-50 text-rose-400 rounded-lg">
              <Landmark className="h-4 w-4" />
            </div>
          </div>

          <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div>
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider block">รวมยอดเงินรับโอนสุทธิ</span>
              <span className="text-2xl font-black text-indigo-400 font-mono mt-1 block">
                ฿{monthlyStats.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 text-[10px] text-indigo-200/80 font-bold">โอนเงินเข้าพนักงานสุทธิประจำเดือน</div>
            <div className="absolute right-3 top-3 p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Monthly Earnings Chart and Vehicle Performance Row */}
        {monthlyJobs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
            {/* Area Chart: Monthly Trend */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">กราฟแสดงแนวโน้มรายรับสุทธิรายวันในเดือนนี้</h4>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="dayLabel" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="รายได้สุทธิ (฿)" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNet)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Vehicle wise breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Car className="h-4 w-4 text-amber-500" />
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">ผลงานแยกตามรหัสยานพาหนะ</h4>
                </div>
                <div className="space-y-3 max-h-[14rem] overflow-y-auto pr-1">
                  {vehicleSummary.map((veh, idx) => (
                    <div key={veh.code} className="flex items-center justify-between border-b border-slate-50 pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center font-black bg-indigo-50 text-indigo-700 text-[10px] rounded-md font-mono">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-extrabold text-slate-800 font-mono">{veh.code}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{veh.trips} เที่ยววิ่ง</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-800 font-mono">฿{veh.net.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-400">สุทธิสะสม</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-50 text-[10px] text-slate-400 font-medium text-center">
                รวมพนักงานยานพาหนะทั้งหมด {vehicleSummary.length} คัน
              </div>
            </div>
          </div>
        )}

        {/* List Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart className="h-4.5 w-4.5 text-indigo-500" />
              ตารางสรุปรายได้สะสมรายวันประจำเดือน {formatMonthNameTH(selectedMonth)}
            </h4>
            <span className="text-[10.5px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-mono">
              ข้อมูลสะสมรวม {dailyRollupTable.length} วันทำการ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-slate-50/20 text-slate-400 font-bold border-b border-slate-100">
                  <th className="p-3">วันที่ทำงาน</th>
                  <th className="p-3 text-center">จำนวนเที่ยววิ่ง</th>
                  <th className="p-3 text-right">ยอดรวมก่อนภาษี (ค่างานรวมบวกหักปรับ)</th>
                  <th className="p-3 text-right text-rose-500">ภาษีหัก ณ ที่จ่ายสะสม 5%</th>
                  <th className="p-3 text-right text-indigo-600">รวมเงินรับโอนสุทธิของพนักงาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-sans">
                {dailyRollupTable.length > 0 ? (
                  dailyRollupTable.map(day => (
                    <tr key={day.date} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-800">{formatDateTH(day.date)}</td>
                      <td className="p-3 text-center font-bold text-slate-700 font-mono">{day.trips} เที่ยววิ่ง</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-700">
                        ฿{day.base.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">
                        ฿{day.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-600 bg-indigo-50/10">
                        ฿{day.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400">
                      <p className="font-semibold text-slate-500">ไม่พบสถิติงานวิ่งของเดือนที่ระบุ</p>
                      <p className="text-[10px] text-slate-400 mt-1">กรุณานำเข้ารอบบิลประวัติพฤศจิกายน ธันวาคม หรือช่วงเดือนอื่นๆ เพื่อเริ่มตรวจสอบรายงานสรุป</p>
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
