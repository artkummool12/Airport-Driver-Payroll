import React, { useState, useMemo } from 'react';
import { Job, getCleanJobId } from '../types';
import { Printer, Calendar, FileText, Award, AlertTriangle, Landmark, Car, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

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
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          พิมพ์ใบสรุปรายงานรายวัน (PDF)
        </button>
      </div>

      <div className="printable-report space-y-6">
        {/* Printable Header */}
        <div className="hidden print:block text-center pb-6 border-b border-slate-200">
          <h1 className="text-xl font-black text-slate-900">ระบบคำนวณรายได้พนักงานขับรถรับ-ส่งสนามบิน</h1>
          <p className="text-xs text-slate-500 mt-1">รายงานสรุปงานวิ่งและค่าเที่ยวสะสมรายวันแบบละเอียด</p>
          <p className="text-xs font-mono font-bold text-indigo-700 mt-2 bg-indigo-50 inline-block px-4 py-1.5 rounded-full">
            ประจำวันที่: {formatDateTH(selectedDate)}
          </p>
        </div>

        {/* Bento Stats Display */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">เที่ยวงานวิ่งสะสม</span>
              <span className="text-2xl font-black text-slate-800 font-mono mt-1 block">{daySubtotals.trips} เที่ยว</span>
            </div>
            <div className="mt-3 text-[10px] text-slate-400 font-medium">รวมรอบวิ่งจริงของวันนี้</div>
            <div className="absolute right-3 top-3 p-1.5 bg-indigo-50 text-indigo-500 rounded-lg">
              <Car className="h-4 w-4" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
            <div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider block">ค่างาน + โบนัสสะสม</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                ฿{(daySubtotals.base + daySubtotals.bonus).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <Award className="h-3.5 w-3.5" />
              โบนัสบวกเพิ่ม ฿{daySubtotals.bonus.toLocaleString()}
            </div>
            <div className="absolute right-3 top-3 p-1.5 bg-emerald-50 text-emerald-500 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
            <div>
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block">หักภาษี 5% และค่าปรับ</span>
              <span className="text-2xl font-black text-rose-500 font-mono mt-1 block">
                ฿{(daySubtotals.penalty + daySubtotals.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 text-[10px] text-rose-500 font-bold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              ภาษี ฿{daySubtotals.tax.toLocaleString()} | ปรับ ฿{daySubtotals.penalty.toLocaleString()}
            </div>
            <div className="absolute right-3 top-3 p-1.5 bg-rose-50 text-rose-400 rounded-lg">
              <Landmark className="h-4 w-4" />
            </div>
          </div>

          <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div>
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider block">รายรับสุทธิพนักงานขับ</span>
              <span className="text-2xl font-black text-indigo-400 font-mono mt-1 block">
                ฿{daySubtotals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 text-[10px] text-indigo-200/80 font-bold">สุทธิหลังหักภาษีและหักปรับ</div>
            <div className="absolute right-3 top-3 p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
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

        {/* Jobs table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4.5 w-4.5 text-indigo-500" />
              รายการปฏิบัติงานวิ่งรถ ประจำวันที่ {formatDateTH(selectedDate)}
            </h4>
            <span className="text-[10.5px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full font-mono">
              {daySubtotals.trips} เที่ยววิ่ง
            </span>
          </div>

          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-slate-50/20 text-slate-400 font-bold border-b border-slate-100">
                  <th className="p-3 w-[12%]">รหัสงาน</th>
                  <th className="p-3 w-[10%]">เวลา</th>
                  <th className="p-3 w-[12%]">รหัสรถ</th>
                  <th className="p-3 w-[26%]">เส้นทาง & เที่ยวบิน</th>
                  <th className="p-3 text-right w-[10%]">ค่างานดิบ</th>
                  <th className="p-3 text-right text-emerald-600 w-[10%]">บวกเพิ่ม (โบนัส)</th>
                  <th className="p-3 text-right text-rose-500 w-[10%]">ค่าปรับหัก</th>
                  <th className="p-3 text-right text-rose-600 w-[10%]">ภาษีหัก 5%</th>
                  <th className="p-3 text-right text-indigo-600 w-[10%]">สุทธิ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dailyJobs.length > 0 ? (
                  dailyJobs.map(job => (
                    <tr key={job.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-800">{getCleanJobId(job.id)}</td>
                      <td className="p-3 font-mono font-bold text-slate-700">{job.time} น.</td>
                      <td className="p-3">
                        <span className="bg-slate-100 font-mono font-bold text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                          {job.vehicleCode}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{job.route}</p>
                        {job.flight && (
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">
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
                    <td colSpan={9} className="py-16 text-center text-slate-400">
                      <p className="font-medium text-slate-500">ไม่พบบันทึกเที่ยวงานวิ่งรถในวันที่ระบุ</p>
                      <p className="text-[10px] text-slate-400 mt-1">กรุณาวางรายงานสรุปผลจาก LINE หรือบันทึกเที่ยววิ่งแมนนวลเพื่อเริ่มต้นคำนวณ</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Subtotals Footer panel */}
          <div className="bg-slate-900 text-white p-5 flex flex-wrap justify-between items-center text-xs gap-4 border-t border-slate-800">
            <div className="flex gap-5 font-semibold text-slate-300">
              <span>
                ยอดงานดิบรวม:{' '}
                <span className="font-mono text-white font-bold">฿{daySubtotals.base.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </span>
              {daySubtotals.bonus > 0 && (
                <span className="text-emerald-400">
                  โบนัสสะสม: <span className="font-mono font-bold text-white">฿{daySubtotals.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </span>
              )}
              {daySubtotals.penalty > 0 && (
                <span className="text-rose-400">
                  ค่าปรับรวม: <span className="font-mono font-bold text-white">฿{daySubtotals.penalty.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </span>
              )}
            </div>

            <div className="flex gap-5 font-bold">
              <span className="text-rose-400">
                ภาษีหัก ณ ที่จ่าย 5%: <span className="font-mono text-white">฿{daySubtotals.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </span>
              <span className="text-indigo-300">
                รวมสุทธิรับสุทธิประจำวัน:{' '}
                <span className="font-mono text-sm font-extrabold text-indigo-400">฿{daySubtotals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
