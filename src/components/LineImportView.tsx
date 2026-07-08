import React, { useState, useMemo } from 'react';
import { Clipboard, ArrowDownToLine, Check, FileText, Info, AlertCircle, Edit2 } from 'lucide-react';
import { Job, VehicleRate } from '../types';

interface LineImportViewProps {
  rates: VehicleRate[];
  onImportJobs: (jobs: Job[]) => Promise<void>;
  currentUserEmail: string;
}

export default function LineImportView({ rates, onImportJobs, currentUserEmail }: LineImportViewProps) {
  const [rawText, setRawText] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Helper to format date as DD/MM/YYYY
  const formatDateTH = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Parse function
  const parsedJobs = useMemo(() => {
    if (!rawText.trim()) return [];

    const lines = rawText.split('\n').map(l => l.trim());
    const tempJobs: Job[] = [];
    let currentActiveDate = ''; // e.g. YYYY-MM-DD

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Clean line from double quotes and other wrapping symbols
      const cleanedLine = line.replace(/["'“’”]+/g, '').trim();

      // 1. Look for Date: DD/MM/YYYY or D/M/YYYY
      const dateMatch = cleanedLine.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        const year = dateMatch[3];
        currentActiveDate = `${year}-${month}-${day}`;
        continue;
      }

      // 2. Look for Job Code line: [CODE]//[TIME]//#[VEHICLE]
      // e.g. D6762-02//09:00//#Cam7BK-S
      if (cleanedLine.includes('//')) {
        const parts = cleanedLine.split('//').map(p => p.trim());
        if (parts.length >= 2) {
          const jobId = parts[0];
          const time = parts[1];
          let vehicleCode = '';
          if (parts[2]) {
            const hashIndex = parts[2].indexOf('#');
            if (hashIndex !== -1) {
              vehicleCode = parts[2].substring(hashIndex + 1).trim();
            } else {
              vehicleCode = parts[2].trim();
            }
          }

          // Route line is usually the very next non-empty line
          let route = '';
          let flight = '';
          let searchIndex = i + 1;
          while (searchIndex < lines.length) {
            const nextCleaned = lines[searchIndex].replace(/["'“’”]+/g, '').trim();
            if (nextCleaned && !nextCleaned.includes('//') && !nextCleaned.match(/^[=\s]+$/)) {
              route = nextCleaned;
              break;
            }
            if (nextCleaned.includes('//')) {
              break;
            }
            searchIndex++;
          }

          // Try to parse Flight (e.g. ✈️TG312 or ✈️ TG312)
          if (route) {
            const flightMatch = route.match(/✈️\s*([A-Za-z0-9]+)/);
            if (flightMatch) {
              flight = flightMatch[1];
            }
          }

          // Detect Airport
          let airport = 'อื่นๆ';
          if (route.includes('แอร์สุ') || route.toLowerCase().includes('bkk')) {
            airport = 'สุวรรณภูมิ';
          } else if (route.includes('แอร์ดอน') || route.toLowerCase().includes('dmk')) {
            airport = 'ดอนเมือง';
          }

          // Base rate price resolution based on user's custom formula:
          // If vehicleCode contains 7s, 7bk, cam, 7p (case insensitive) -> 500
          // If vehicleCode contains 5s, 5p, 5bk (case insensitive) -> 400
          // Else fall back to matching rates or 0
          const lowerCode = vehicleCode.toLowerCase();
          let baseFare = 0;
          if (
            lowerCode.includes('7s') ||
            lowerCode.includes('7bk') ||
            lowerCode.includes('cam') ||
            lowerCode.includes('7p')
          ) {
            baseFare = 500;
          } else if (
            lowerCode.includes('5s') ||
            lowerCode.includes('5p') ||
            lowerCode.includes('5bk')
          ) {
            baseFare = 400;
          } else {
            const matchedRate = rates.find(r => r.vehicleCode.toLowerCase() === lowerCode);
            if (matchedRate) {
              baseFare = matchedRate.price;
            }
          }

          // Bonus calculation based on user's custom formula:
          // Part 1: route contains "คลองสาน", "เจริญนคร", "บางนา" -> +50
          // Part 2: route contains "เมืองทอง", "หลักสี่" or contains BOTH "แอร์สุ" and "ดอน" -> +100
          let bonus = 0;
          if (
            route.includes('คลองสาน') ||
            route.includes('เจริญนคร') ||
            route.includes('บางนา')
          ) {
            bonus += 50;
          }
          if (
            route.includes('เมืองทอง') ||
            route.includes('หลักสี่') ||
            (route.includes('แอร์สุ') && route.includes('ดอน'))
          ) {
            bonus += 100;
          }

          const penalty = 0;
          const tax = parseFloat(((baseFare + bonus - penalty) * 0.05).toFixed(2));
          const netIncome = parseFloat(((baseFare + bonus - penalty) - tax).toFixed(2));

          // Generate unique sub-id helper for import listing
          const uniqueId = `${jobId}_${currentActiveDate || 'NODATE'}_${time.replace(':', '')}`;

          tempJobs.push({
            id: jobId,
            id_temp: uniqueId,
            date: currentActiveDate || new Date().toISOString().split('T')[0],
            time,
            vehicleCode,
            route,
            airport,
            flight,
            baseFare,
            bonus,
            penalty,
            tax,
            netIncome,
            createdBy: currentUserEmail,
            createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
          } as any);
        }
      }
    }

    return tempJobs;
  }, [rawText, rates, currentUserEmail]);

  // Handle saving the parsed jobs
  const handleImport = async () => {
    if (parsedJobs.length === 0) return;
    try {
      // Clean temp fields and save
      const cleaned = parsedJobs.map(({ id_temp, ...rest }: any) => rest as Job);
      await onImportJobs(cleaned);
      setSuccessMsg(`นำเข้าข้อมูลสำเร็จแล้ว! เพิ่มจำนวนงานวิ่งทั้งหมด ${parsedJobs.length} งาน เข้าระบบคลาวด์เรียบร้อย`);
      setRawText('');
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      alert(`นำเข้าไม่สำเร็จ: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/85 p-6 rounded-2xl border border-slate-100 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-2">
          <Clipboard className="h-5 w-5 text-indigo-600" />
          ระบบรับข้อมูลดิบจากการคัดลอก LINE (Raw Text Auto Parser)
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          เพียงคัดลอกข้อความสรุปงานจากกรุ๊ป LINE วางในกล่องข้อความด้านล่าง ระบบจะทำการจำแนก วันที่, รหัสงาน, เวลา, รหัสรุ่นรถ, เส้นทาง และเที่ยวบิน พร้อมดึงอัตราค่างานต่องานมาคำนวณภาษี 5% และ ยอดรับสุทธิ ให้อัตโนมัติทันที!
        </p>

        {successMsg && (
          <div className="p-4 mb-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-100 flex items-center gap-2.5 shadow-xs">
            <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                วางข้อความจากแอป LINE ที่นี่:
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full h-80 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all leading-relaxed"
                placeholder={`ตัวอย่างการวางข้อมูล:
02/07/2026

D6762-02//09:00//#Cam7BK-S
เพลินจิต–แอร์สุ

D6762-03//10:55//#5S-BK
แอร์สุ–กทม ✈️VJ801`}
              />
            </div>

            <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[10.5px] text-slate-600 space-y-2 leading-relaxed">
              <h5 className="font-bold text-indigo-950 flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-indigo-500" />
                เคล็ดลับการแปลงข้อมูล:
              </h5>
              <ul className="list-disc pl-4 space-y-1">
                <li>บรรทัดวันที่ต้องมีรูปแบบ <span className="font-bold font-mono">วัน/เดือน/ปี</span> (เช่น 02/07/2026)</li>
                <li>บรรทัดสรุปงานต้องคั่นด้วย <span className="font-bold font-mono">//</span> และจบด้วยรหัสรถหลังเครื่องหมาย <span className="font-bold font-mono">#</span></li>
                <li>บรรทัดถัดไปเป็นเส้นทาง และใส่เที่ยวบินหลังสัญลักษณ์ <span className="font-bold font-mono">✈️</span></li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-slate-400" />
                ตารางพรีวิวก่อนนำเข้า ({parsedJobs.length} รายการที่ตรวจพบ)
              </h4>

              {parsedJobs.length > 0 && (
                <button
                  onClick={handleImport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  บันทึกข้อมูลทั้งหมดเข้าระบบคลาวด์
                </button>
              )}
            </div>

            {parsedJobs.length > 0 ? (
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs bg-white">
                <div className="overflow-x-auto max-h-[360px] scrollbar-thin">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                      <tr className="text-slate-500 font-bold">
                        <th className="p-3">วันที่</th>
                        <th className="p-3">รหัสรถ</th>
                        <th className="p-3">รหัสงาน</th>
                        <th className="p-3">เวลา</th>
                        <th className="p-3">เส้นทาง&เที่ยวบิน</th>
                        <th className="p-3 text-center">จำนวนงาน</th>
                        <th className="p-3 text-right">ค่างานต่องาน</th>
                        <th className="p-3 text-right text-emerald-600">บวกเพิ่ม</th>
                        <th className="p-3 text-right text-slate-500">ค่าปรับ</th>
                        <th className="p-3 text-right text-rose-500">หัก ภาษี 5%</th>
                        <th className="p-3 text-right text-indigo-600">ยอดสุทธิ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {parsedJobs.map((j) => (
                        <tr key={j.id_temp} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-semibold text-slate-800 font-mono">{formatDateTH(j.date)}</td>
                          <td className="p-3 font-mono font-bold text-slate-700">{j.vehicleCode}</td>
                          <td className="p-3 font-mono font-bold text-indigo-950">{j.id}</td>
                          <td className="p-3 font-mono font-medium text-slate-600">{j.time}</td>
                          <td className="p-3 font-semibold text-slate-800">{j.route}</td>
                          <td className="p-3 text-center font-mono">1</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-700">
                            ฿{j.baseFare.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            ฿{j.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-400">
                            ฿{j.penalty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-600">
                            ฿{j.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-indigo-600">
                            ฿{j.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex gap-4">
                    <div>
                      <span className="text-slate-400 font-medium">ค่างานต่องาน:</span>{' '}
                      <span className="font-bold text-slate-800 font-mono">
                        ฿{parsedJobs.reduce((sum, j) => sum + j.baseFare, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-500 font-medium">บวกเพิ่ม:</span>{' '}
                      <span className="font-bold text-emerald-600 font-mono">
                        ฿{parsedJobs.reduce((sum, j) => sum + j.bonus, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-rose-400 font-medium font-bold">หัก ภาษี 5%:</span>{' '}
                      <span className="font-bold text-rose-600 font-mono">
                        ฿{parsedJobs.reduce((sum, j) => sum + j.tax, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-indigo-500 font-bold">รวมสุทธิทั้งหมด:</span>{' '}
                    <span className="font-extrabold text-indigo-700 font-mono text-sm">
                      ฿{parsedJobs.reduce((sum, j) => sum + j.netIncome, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-slate-100 border-dashed rounded-2xl py-16 flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50/40 gap-2">
                <AlertCircle className="h-8 w-8 text-slate-300" />
                <span className="font-medium text-slate-500">ยังไม่พบบันทึกงานวิ่งรถที่ตรวจพบ</span>
                <span className="text-[10px] text-slate-400 max-w-[280px] text-center leading-normal">
                  ลองวางข้อความสรุปรายงาน LINE ลงในช่องกรอกซ้ายมือ เพื่อเริ่มแปลงข้อมูลเป็นแบบตารางอัตโนมัติ
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
