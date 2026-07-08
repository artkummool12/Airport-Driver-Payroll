import React, { useState, useMemo } from 'react';
import { Job } from '../types';
import { Printer, Calendar, Search, FileText } from 'lucide-react';

interface ReportsDailyViewProps {
  jobs: Job[];
}

export default function ReportsDailyView({ jobs }: ReportsDailyViewProps) {
  // Find all available dates
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(jobs.map(j => j.date)));
    return dates.sort((a, b) => b.localeCompare(a));
  }, [jobs]);

  const [selectedDate, setSelectedDate] = useState(() => {
    return availableDates[0] || new Date().toISOString().split('T')[0];
  });

  // Filter jobs for selected date
  const dailyJobs = useMemo(() => {
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

  const handlePrint = () => {
    window.print();
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">เลือกวันที่สรุปรายงาน</span>
            <div className="flex items-center gap-2 mt-0.5">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
        >
          <Printer className="h-4 w-4 text-slate-500" />
          พิมพ์ใบสรุปรายงานรายวัน (PDF)
        </button>
      </div>

      <div className="printable-report space-y-6">
        {/* Printable Header */}
        <div className="hidden print:block text-center pb-6 border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-900">ระบบคำนวณรายได้พนักงานขับรถรับ-ส่งสนามบิน</h1>
          <p className="text-xs text-slate-500 mt-1">รายงานสรุปงานวิ่งและผลลัพธ์รายวันแบบละเอียด</p>
          <p className="text-xs font-mono font-bold text-slate-800 mt-2 bg-slate-50 inline-block px-3 py-1 rounded">
            ประจำวันที่: {formatDateTH(selectedDate)}
          </p>
        </div>

        {/* Jobs table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4.5 w-4.5 text-indigo-500" />
              ตารางสรุปรายการวิ่ง ประจำวันที่ {formatDateTH(selectedDate)}
            </h4>
            <span className="text-[10.5px] font-bold text-slate-500">
              ทั้งหมด {daySubtotals.trips} เที่ยวงาน
            </span>
          </div>

          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-slate-50/20 text-slate-400 font-bold border-b border-slate-100">
                  <th className="p-3 w-[15%]">รหัสงาน</th>
                  <th className="p-3 w-[12%]">เวลา</th>
                  <th className="p-3 w-[15%]">รหัสรถ</th>
                  <th className="p-3 w-[25%]">เส้นทาง & เที่ยวบิน</th>
                  <th className="p-3 text-right w-[11%]">ค่างาน</th>
                  <th className="p-3 text-right text-emerald-600 w-[11%]">บวกเพิ่ม</th>
                  <th className="p-3 text-right text-rose-500 w-[11%]">ค่าปรับ</th>
                  <th className="p-3 text-right text-rose-600 w-[11%]">หัก ภาษี 5%</th>
                  <th className="p-3 text-right text-indigo-600 w-[12%]">ยอดสุทธิ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dailyJobs.length > 0 ? (
                  dailyJobs.map(job => (
                    <tr key={job.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-800">{job.id}</td>
                      <td className="p-3 font-mono font-bold text-slate-700">{job.time} น.</td>
                      <td className="p-3">
                        <span className="bg-slate-100 font-mono font-bold text-slate-700 px-1.5 py-0.5 rounded">
                          {job.vehicleCode}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{job.route}</p>
                        {job.flight && (
                          <p className="text-[9px] text-slate-400 font-mono">
                            ✈️ เที่ยวบิน: {job.flight}
                          </p>
                        )}
                      </td>
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      ไม่พบข้อมูลเที่ยวงานที่บันทึกในระบบในวันดังกล่าว
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Subtotals Footer panel */}
          <div className="bg-slate-900 text-white p-5 flex flex-wrap justify-between items-center text-xs gap-4 border-t border-slate-800">
            <div className="flex gap-5 font-semibold">
              <span>
                ยอดค่างานดิบต่องาน:{' '}
                <span className="font-mono text-slate-200 font-bold">฿{daySubtotals.base.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </span>
              {daySubtotals.bonus > 0 && (
                <span className="text-emerald-400">
                  โบนัสรวม: <span className="font-mono font-bold">฿{daySubtotals.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </span>
              )}
              {daySubtotals.penalty > 0 && (
                <span className="text-rose-400">
                  ค่าปรับรวม: <span className="font-mono font-bold">฿{daySubtotals.penalty.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </span>
              )}
            </div>

            <div className="flex gap-5 font-bold">
              <span className="text-rose-400">
                ภาษีหัก 5% สะสม: <span className="font-mono">฿{daySubtotals.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </span>
              <span className="text-indigo-300">
                รายรับสุทธิสะสมในวัน:{' '}
                <span className="font-mono text-sm font-extrabold">฿{daySubtotals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
