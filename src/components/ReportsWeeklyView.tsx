import React, { useState, useMemo } from 'react';
import { Job, VehicleRate, getCleanJobId } from '../types';
import { Printer, Calendar, Download, FileText, ChevronLeft, ChevronRight, Car, TrendingUp, AlertTriangle, Landmark, Award } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface ReportsWeeklyViewProps {
  jobs: Job[];
  rates: VehicleRate[];
}

// Thai day names translation helper
const DAY_NAMES_THAI = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์'
];

// Re-ordered payroll days (Wed to Tue)
const PAYROLL_DAYS_ORDER = [3, 4, 5, 6, 0, 1, 2]; // 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun, 1=Mon, 2=Tue

// Helper to find the start (Wednesday) and end (Tuesday) of a payroll week
export function getPayrollWeekRange(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0-6

  // Calculate difference to last Wednesday
  // If Wednesday(3), diff=0. If Thursday(4), diff=1. If Tuesday(2), diff=6.
  const diffToWednesday = (day - 3 + 7) % 7;
  const wednesdayDate = new Date(d);
  wednesdayDate.setDate(d.getDate() - diffToWednesday);

  const tuesdayDate = new Date(wednesdayDate);
  tuesdayDate.setDate(wednesdayDate.getDate() + 6);

  const startStr = wednesdayDate.toISOString().split('T')[0];
  const endStr = tuesdayDate.toISOString().split('T')[0];

  return { start: startStr, end: endStr };
}

export default function ReportsWeeklyView({ jobs, rates }: ReportsWeeklyViewProps) {
  // Find all available payroll weeks in the database
  const payrollWeeks = useMemo(() => {
    const weeksMap: Record<string, { start: string; end: string }> = {};
    jobs.forEach(j => {
      const range = getPayrollWeekRange(j.date);
      const key = `${range.start}_${range.end}`;
      weeksMap[key] = range;
    });

    const list = Object.values(weeksMap).sort((a, b) => b.start.localeCompare(a.start));
    return list;
  }, [jobs]);

  // Active week state
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);

  const activeWeek = useMemo(() => {
    if (payrollWeeks.length === 0) return null;
    return payrollWeeks[selectedWeekIdx] || payrollWeeks[0];
  }, [payrollWeeks, selectedWeekIdx]);

  // Filter jobs for the selected week
  const filteredJobs = useMemo(() => {
    if (!activeWeek) return [];
    return jobs.filter(j => j.date >= activeWeek.start && j.date <= activeWeek.end);
  }, [jobs, activeWeek]);

  // Group filtered jobs by day of week (Wed to Tue)
  const groupedJobsByDay = useMemo(() => {
    // Initialize empty arrays for Wednesday to Tuesday
    const groups: Record<number, { dayNum: number; dateStr: string; items: Job[] }> = {};
    PAYROLL_DAYS_ORDER.forEach(dayNum => {
      groups[dayNum] = { dayNum, dateStr: '', items: [] };
    });

    filteredJobs.forEach(j => {
      const d = new Date(j.date);
      const dayNum = d.getDay();
      if (groups[dayNum]) {
        groups[dayNum].items.push(j);
        if (!groups[dayNum].dateStr) {
          groups[dayNum].dateStr = j.date;
        }
      }
    });

    // If an item doesn't have an explicit dateStr in database, calculate it from active week start
    PAYROLL_DAYS_ORDER.forEach((dayNum, index) => {
      if (activeWeek && !groups[dayNum].dateStr) {
        const start = new Date(activeWeek.start);
        start.setDate(start.getDate() + index);
        groups[dayNum].dateStr = start.toISOString().split('T')[0];
      }
      // Sort day jobs by time
      groups[dayNum].items.sort((a, b) => a.time.localeCompare(b.time));
    });

    return PAYROLL_DAYS_ORDER.map(dNum => groups[dNum]);
  }, [filteredJobs, activeWeek]);

  // Grand totals
  const grandTotals = useMemo(() => {
    return filteredJobs.reduce(
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
  }, [filteredJobs]);

  // Recharts Chart Data: Net Income & Trips by Day
  const weeklyChartData = useMemo(() => {
    const dayNamesAbbr = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    return groupedJobsByDay.map(dayGroup => {
      const dayNet = dayGroup.items.reduce((sum, j) => sum + j.netIncome, 0);
      const dayTrips = dayGroup.items.length;
      return {
        name: dayNamesAbbr[dayGroup.dayNum],
        fullName: DAY_NAMES_THAI[dayGroup.dayNum],
        'รายรับสุทธิ (฿)': parseFloat(dayNet.toFixed(2)),
        'จำนวนงานวิ่ง': dayTrips
      };
    });
  }, [groupedJobsByDay]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (filteredJobs.length === 0) return;
    const headers = ['วันที่', 'รหัสรถ', 'รหัสงาน', 'เวลา', 'เส้นทาง', 'สนามบิน', 'ค่างาน', 'บวกเพิ่ม', 'ค่าปรับ', 'ภาษี 5%', 'สุทธิ'];
    const rows = filteredJobs.map(j => [
      j.date,
      j.vehicleCode,
      j.id,
      j.time,
      j.route,
      j.airport,
      j.baseFare,
      j.bonus,
      j.penalty,
      j.tax,
      j.netIncome
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `รายงานเงินรายสัปดาห์_${activeWeek?.start || 'payroll'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!activeWeek) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 text-slate-400">
        ยังไม่มีข้อมูลงานวิ่งรถสำหรับจัดกลุ่มรายสัปดาห์ กรุณานำเข้าข้อมูลดิบจาก LINE หรือเพิ่มงานวิ่งก่อน
      </div>
    );
  }

  // Format date helper (DD/MM/YYYY)
  const formatDateTH = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0]) + 543;
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const monthIndex = parseInt(parts[1]) - 1;
    return `${parseInt(parts[2])} ${months[monthIndex]} ${year.toString().substring(2)}`;
  };

  const formatDateTHLong = (dateStr: string) => {
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
      {/* Week Selector Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รอบคำนวณเงินเดือนพนักงานขับรถรายสัปดาห์ (พุธ - อังคาร)</span>
            <h3 className="text-sm font-black text-slate-800">
              สัปดาห์: {formatDateTHLong(activeWeek.start)} — {formatDateTHLong(activeWeek.end)}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
            <button
              onClick={() => setSelectedWeekIdx(prev => Math.min(payrollWeeks.length - 1, prev + 1))}
              disabled={selectedWeekIdx >= payrollWeeks.length - 1}
              className="p-1 hover:bg-slate-200 rounded-md disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <span className="text-xs font-black text-slate-700 font-mono">
              สัปดาห์ {selectedWeekIdx + 1} / {payrollWeeks.length}
            </span>
            <button
              onClick={() => setSelectedWeekIdx(prev => Math.max(0, prev - 1))}
              disabled={selectedWeekIdx <= 0}
              className="p-1 hover:bg-slate-200 rounded-md disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            พิมพ์รายงาน (PDF)
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            ส่งออก Excel (CSV)
          </button>
        </div>
      </div>

      {/* Printable Area Wrapper */}
      <div className="printable-report space-y-6">
        {/* Weekly Header for Print */}
        <div className="hidden print:block text-center pb-6 border-b border-slate-200">
          <h1 className="text-xl font-black text-slate-900">ระบบคำนวณรายได้พนักงานขับรถรับ-ส่งสนามบิน</h1>
          <p className="text-xs text-slate-500 mt-1">รายงานสรุปผลการทำงานและค่าจ้างรายสัปดาห์ (รอบวันพุธ - วันอังคาร)</p>
          <p className="text-xs font-mono text-indigo-700 mt-2 bg-indigo-50 inline-block px-4 py-1.5 rounded-full font-bold">
            รอบบิลวันที่: {formatDateTHLong(activeWeek.start)} — {formatDateTHLong(activeWeek.end)}
          </p>
        </div>

        {/* Bento Box Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">เที่ยววิ่งรวมสัปดาห์</span>
              <span className="text-2xl font-black text-slate-800 font-mono mt-1 block">{grandTotals.trips} งานวิ่ง</span>
            </div>
            <div className="mt-3 text-[10px] text-slate-400 font-medium">รวมทั้งสิ้นในรอบ 7 วัน</div>
            <div className="absolute right-3 top-3 p-1.5 bg-indigo-50 text-indigo-500 rounded-lg">
              <Car className="h-4 w-4" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
            <div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider block">ยอดค่างาน + โบนัสรวม</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                ฿{(grandTotals.base + grandTotals.bonus).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <Award className="h-3.5 w-3.5" />
              โบนัสบวกเพิ่มสัปดาห์นี้ ฿{grandTotals.bonus.toLocaleString()}
            </div>
            <div className="absolute right-3 top-3 p-1.5 bg-emerald-50 text-emerald-500 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
            <div>
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block">รวมภาษีหัก และค่าปรับ</span>
              <span className="text-2xl font-black text-rose-500 font-mono mt-1 block">
                ฿{(grandTotals.penalty + grandTotals.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 text-[10px] text-rose-500 font-bold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              ภาษีสะสม ฿{grandTotals.tax.toLocaleString()} | ปรับ ฿{grandTotals.penalty.toLocaleString()}
            </div>
            <div className="absolute right-3 top-3 p-1.5 bg-rose-50 text-rose-400 rounded-lg">
              <Landmark className="h-4 w-4" />
            </div>
          </div>

          <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div>
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider block">รวมสุทธิสุทธิที่โอนให้</span>
              <span className="text-2xl font-black text-indigo-400 font-mono mt-1 block">
                ฿{grandTotals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 text-[10px] text-indigo-200/80 font-bold">ยอดโอนสุทธิประจำรอบสัปดาห์นี้</div>
            <div className="absolute right-3 top-3 p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Visual Earnings Chart across the week */}
        {filteredJobs.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs print:hidden">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">แนวโน้มรายรับสุทธิพนักงานขับรถรายวัน (พุธ - อังคาร)</h4>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(226, 232, 240, 0.3)' }} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="รายรับสุทธิ (฿)" fill="#6366f1" radius={[6, 6, 0, 0]}>
                    {weeklyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'อา.' ? '#ef4444' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* List of Days (Wednesday to Tuesday) */}
        <div className="space-y-6">
          {groupedJobsByDay.map(dayGroup => {
            const hasJobs = dayGroup.items.length > 0;
            const daySubtotal = dayGroup.items.reduce(
              (acc, j) => {
                acc.tax += j.tax;
                acc.net += j.netIncome;
                acc.base += j.baseFare;
                acc.bonus += j.bonus;
                acc.penalty += j.penalty;
                return acc;
              },
              { tax: 0, net: 0, base: 0, bonus: 0, penalty: 0 }
            );

            // Skip rendering days with no jobs if in print mode to save space
            if (!hasJobs) {
              return (
                <div key={dayGroup.dayNum} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 print:hidden flex items-center justify-between transition-colors hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">{DAY_NAMES_THAI[dayGroup.dayNum]}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">({formatDateTH(dayGroup.dateStr)})</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ไม่มีรอบวิ่งในวันนี้</span>
                </div>
              );
            }

            return (
              <div key={dayGroup.dayNum} className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                {/* Day title bar */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      {DAY_NAMES_THAI[dayGroup.dayNum]}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {formatDateTHLong(dayGroup.dateStr)}
                    </span>
                  </div>
                  <span className="text-[10.5px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    ทั้งหมด {dayGroup.items.length} รอบวิ่ง
                  </span>
                </div>

                {/* Day Job Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10.5px]">
                    <thead>
                      <tr className="bg-slate-50/30 text-slate-400 font-bold border-b border-slate-100">
                        <th className="p-3 w-[12%]">วันที่</th>
                        <th className="p-3 w-[10%]">รหัสรถ</th>
                        <th className="p-3 w-[12%]">รหัสงาน</th>
                        <th className="p-3 w-[8%]">เวลา</th>
                        <th className="p-3 w-[26%]">เส้นทาง & เที่ยวบิน</th>
                        <th className="p-3 text-center w-[6%]">เที่ยววิ่ง</th>
                        <th className="p-3 text-right w-[10%]">ค่างานดิบ</th>
                        <th className="p-3 text-right text-emerald-600 w-[8%]">บวกพิเศษ</th>
                        <th className="p-3 text-right text-rose-500 w-[8%]">ค่าปรับ</th>
                        <th className="p-3 text-right text-rose-600 w-[10%]">หัก 5%</th>
                        <th className="p-3 text-right text-indigo-600 w-[11%]">ยอดสุทธิ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {dayGroup.items.map(job => (
                        <tr key={job.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-3 font-mono text-slate-500">{formatDateTH(job.date)}</td>
                          <td className="p-3">
                            <span className="bg-slate-100 font-mono font-bold text-slate-700 px-1.5 py-0.5 rounded">
                              {job.vehicleCode}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">{getCleanJobId(job.id)}</td>
                          <td className="p-3 font-mono font-bold text-slate-700">{job.time} น.</td>
                          <td className="p-3">
                            <p className="font-semibold text-slate-800">{job.route}</p>
                            {job.flight && (
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                                ✈️ เที่ยวบิน: {job.flight}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold">1</td>
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
                          <td className="p-3 text-right font-mono font-bold text-indigo-600 bg-indigo-50/10">
                            ฿{job.netIncome.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Day Subtotal Bar */}
                <div className="bg-indigo-50/10 px-5 py-3.5 border-t border-slate-100 flex flex-wrap justify-between items-center text-xs gap-4">
                  <div className="flex gap-4 font-semibold text-slate-600">
                    <span>
                      รวมค่างานดิบประจำวัน:{' '}
                      <span className="font-mono text-slate-800 font-bold">฿{daySubtotal.base.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </span>
                    {daySubtotal.bonus > 0 && (
                      <span className="text-emerald-700">
                        รวมโบนัส: <span className="font-mono font-bold">฿{daySubtotal.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </span>
                    )}
                    {daySubtotal.penalty > 0 && (
                      <span className="text-rose-700">
                        รวมหักค่าปรับ: <span className="font-mono font-bold">฿{daySubtotal.penalty.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex gap-4 font-bold">
                    <span className="text-rose-600">
                      หัก ภาษี 5%: <span className="font-mono">฿{daySubtotal.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </span>
                    <span className="text-indigo-600">
                      ยอดสุทธิประจำวัน: <span className="font-mono text-sm font-extrabold text-indigo-700">฿{daySubtotal.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Grand Summary Footer Panel */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-indigo-400" />
            <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wider">เอกสารสรุปยอดรวมสุทธิพนักงานขับรายสัปดาห์ (Weekly Rollup Receipt)</h4>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">จำนวนเที่ยววิ่งรวมทั้งสิ้น</p>
              <p className="text-2xl font-black font-mono text-white">{grandTotals.trips} เที่ยวงาน</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">รายรับงานดิบ + โบนัส</p>
              <p className="text-2xl font-black font-mono text-emerald-400">
                ฿{(grandTotals.base + grandTotals.bonus).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold">รวมภาษี หัก ณ ที่จ่าย (5%) และค่าปรับ</p>
              <p className="text-2xl font-black font-mono text-rose-400">
                ฿{(grandTotals.tax + grandTotals.penalty).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-indigo-300 uppercase tracking-wider font-semibold">ยอดจ่ายเงินโอนสุทธิรวม</p>
              <p className="text-2xl font-black font-mono text-indigo-400">
                ฿{grandTotals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
            <span>จัดเตรียมโดย: ระบบบัญชีเงินพนักงานขับรถรับ-ส่งสนามบิน</span>
            <span>พิมพ์รายงานสรุปความเมื่อ: {new Date().toLocaleString('th-TH')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
