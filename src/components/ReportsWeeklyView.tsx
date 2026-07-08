import React, { useState, useMemo } from 'react';
import { Job, VehicleRate } from '../types';
import { Printer, Calendar, Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

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
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div className="space-y-6">
      {/* Week Selector Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">สัปดาห์การคำนวณเงิน</span>
            <h3 className="text-sm font-bold text-slate-800">
              {formatDateTH(activeWeek.start)} ถึง {formatDateTH(activeWeek.end)}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedWeekIdx(prev => Math.min(payrollWeeks.length - 1, prev + 1))}
            disabled={selectedWeekIdx >= payrollWeeks.length - 1}
            className="p-1.5 hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-slate-600 font-mono">
            {selectedWeekIdx + 1} / {payrollWeeks.length} สัปดาห์
          </span>
          <button
            onClick={() => setSelectedWeekIdx(prev => Math.max(0, prev - 1))}
            disabled={selectedWeekIdx <= 0}
            className="p-1.5 hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            onClick={handlePrint}
            className="ml-2 px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            พิมพ์ PDF (พิมพ์รายงาน)
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            ส่งออก Excel
          </button>
        </div>
      </div>

      {/* Printable Area Wrapper */}
      <div className="printable-report space-y-6">
        {/* Weekly Header for Print */}
        <div className="hidden print:block text-center pb-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">ระบบคำนวณรายได้พนักงานขับรถรับ-ส่งสนามบิน</h1>
          <p className="text-xs text-slate-500 mt-1">รายงานสรุปผลการทำงานและค่าจ้างรายสัปดาห์ (วันพุธ - วันอังคาร)</p>
          <p className="text-xs font-mono text-slate-800 mt-2 bg-slate-50 inline-block px-3 py-1 rounded">
            รอบบิลวันที่: {formatDateTH(activeWeek.start)} — {formatDateTH(activeWeek.end)}
          </p>
        </div>

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
                <div key={dayGroup.dayNum} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 print:hidden flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">{DAY_NAMES_THAI[dayGroup.dayNum]}</span>
                    <span className="text-[10px] font-mono text-slate-400">{formatDateTH(dayGroup.dateStr)}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">ไม่มีรอบวิ่งในวันนี้</span>
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
                      {formatDateTH(dayGroup.dateStr)}
                    </span>
                  </div>
                  <span className="text-[10.5px] font-bold text-slate-500">
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
                        <th className="p-3 w-[10%]">รหัสงาน</th>
                        <th className="p-3 w-[8%]">เวลา</th>
                        <th className="p-3 w-[25%]">เส้นทาง & เที่ยวบิน</th>
                        <th className="p-3 text-center w-[8%]">จำนวนงาน</th>
                        <th className="p-3 text-right w-[10%]">ค่างาน</th>
                        <th className="p-3 text-right text-emerald-600 w-[8%]">บวกเพิ่ม</th>
                        <th className="p-3 text-right text-rose-500 w-[8%]">ค่าปรับ</th>
                        <th className="p-3 text-right text-rose-600 w-[10%]">หัก ภาษี 5%</th>
                        <th className="p-3 text-right text-indigo-600 w-[11%]">ยอดสุทธิ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {dayGroup.items.map(job => (
                        <tr key={job.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-3 font-mono text-slate-600">{formatDateTH(job.date)}</td>
                          <td className="p-3">
                            <span className="bg-slate-100 font-mono font-bold text-slate-700 px-1.5 py-0.5 rounded">
                              {job.vehicleCode}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">{job.id}</td>
                          <td className="p-3 font-mono font-bold text-slate-700">{job.time} น.</td>
                          <td className="p-3">
                            <p className="font-semibold text-slate-800">{job.route}</p>
                            {job.flight && (
                              <p className="text-[9px] text-slate-400 font-mono">
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
                <div className="bg-indigo-50/20 px-5 py-3.5 border-t border-slate-100 flex flex-wrap justify-between items-center text-xs gap-4">
                  <div className="flex gap-4 font-semibold text-slate-700">
                    <span>
                      รวม {DAY_NAMES_THAI[dayGroup.dayNum]} (ค่างาน):{' '}
                      <span className="font-mono text-slate-800 font-bold">฿{daySubtotal.base.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </span>
                    {daySubtotal.bonus > 0 && (
                      <span className="text-emerald-700">
                        บวกเพิ่มสะสม: <span className="font-mono font-bold">฿{daySubtotal.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </span>
                    )}
                    {daySubtotal.penalty > 0 && (
                      <span className="text-rose-700">
                        ค่าปรับสะสม: <span className="font-mono font-bold">฿{daySubtotal.penalty.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex gap-4 font-bold">
                    <span className="text-rose-600">
                      หัก ภาษี 5%: <span className="font-mono">฿{daySubtotal.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </span>
                    <span className="text-indigo-600">
                      ยอดสุทธิรวม: <span className="font-mono text-sm font-extrabold">฿{daySubtotal.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">สรุปยอดรวมสุทธิรายสัปดาห์ (Weekly Grand Summary)</h4>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">จำนวนงานรวมทั้งสิ้น</p>
              <p className="text-2xl font-black font-mono text-slate-100">{grandTotals.trips} เที่ยวงาน</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">รายรับค่างาน + โบนัส</p>
              <p className="text-2xl font-black font-mono text-emerald-400">
                ฿{(grandTotals.base + grandTotals.bonus).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold">ภาษีหัก ณ ที่จ่าย รวม (5%)</p>
              <p className="text-2xl font-black font-mono text-rose-400">
                ฿{grandTotals.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-indigo-300 uppercase tracking-wider font-semibold">ยอดสุทธิที่ได้รับรวม</p>
              <p className="text-2xl font-black font-mono text-indigo-300">
                ฿{grandTotals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
            <span>พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</span>
            <span>ใบงานสรุปการเงินพนักงานขับรถรับส่งสนามบินสุวรรณภูมิและดอนเมืองอย่างเป็นทางการ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
