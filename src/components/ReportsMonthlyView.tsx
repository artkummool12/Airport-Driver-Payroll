import React, { useState, useMemo } from 'react';
import { Job } from '../types';
import { Printer, Calendar, BarChart, Download, FileText } from 'lucide-react';

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

  // Daily rollup for table listing
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

    return Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));
  }, [monthlyJobs]);

  const handlePrint = () => {
    window.print();
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
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
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
                className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{formatMonthNameTH(m)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
        >
          <Printer className="h-4 w-4 text-slate-500" />
          พิมพ์ใบสรุปรายงานประจำเดือน (PDF)
        </button>
      </div>

      <div className="printable-report space-y-6">
        {/* Print Header */}
        <div className="hidden print:block text-center pb-6 border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-900">ระบบคำนวณรายได้พนักงานขับรถรับ-ส่งสนามบิน</h1>
          <p className="text-xs text-slate-500 mt-1">รายงานผลการทำงาน และค่าจ้างประจำเดือน</p>
          <p className="text-xs font-bold text-slate-800 mt-2 bg-slate-50 inline-block px-3 py-1 rounded">
            รอบบิลประจำเดือน: {formatMonthNameTH(selectedMonth)}
          </p>
        </div>

        {/* Bento stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-100/70 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">จำนวนเที่ยวงานสะสม</span>
            <p className="text-lg font-black text-slate-800 font-mono mt-1">{monthlyStats.trips} เที่ยว</p>
          </div>
          <div className="bg-slate-50 border border-slate-100/70 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รวมค่างานดิบ (ก่อนภาษี)</span>
            <p className="text-lg font-black text-emerald-600 font-mono mt-1">฿{(monthlyStats.base + monthlyStats.bonus - monthlyStats.penalty).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100/70 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">หัก ภาษี ณ ที่จ่าย (5%)</span>
            <p className="text-lg font-black text-rose-500 font-mono mt-1">฿{monthlyStats.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">รายจ่ายพนักงานขับสุทธิ</span>
            <p className="text-lg font-black text-indigo-400 font-mono mt-1">฿{monthlyStats.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* List Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart className="h-4.5 w-4.5 text-indigo-500" />
              สรุปภาพรวมรายวัน ประจำเดือน {formatMonthNameTH(selectedMonth)}
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/20 text-slate-400 font-bold border-b border-slate-100">
                  <th className="p-3">วันที่ทำงาน</th>
                  <th className="p-3 text-center">จำนวนเที่ยววิ่ง</th>
                  <th className="p-3 text-right">ยอดรวมค่าบริการ (รวมโบนัส/หักค่าปรับ)</th>
                  <th className="p-3 text-right text-rose-500">รวมภาษีหัก ณ ที่จ่าย 5%</th>
                  <th className="p-3 text-right text-indigo-600">รวมยอดเงินรับสุทธิของคนขับ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-sans">
                {dailyRollup.length > 0 ? (
                  dailyRollup.map(day => (
                    <tr key={day.date} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-800">{formatDateTH(day.date)}</td>
                      <td className="p-3 text-center font-bold text-slate-700 font-mono">{day.trips} เที่ยว</td>
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
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      ไม่พบข้อมูลผลการทำงานรายเดือนที่ระบุในฐานข้อมูลสเปรดชีต
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
