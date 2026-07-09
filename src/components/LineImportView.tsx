import React, { useState, useMemo } from 'react';
import { Clipboard, ArrowDownToLine, Check, FileText, Info, AlertCircle, Trash2, Plus, RefreshCw } from 'lucide-react';
import { Job, VehicleRate, getCleanJobId } from '../types';

interface LineImportViewProps {
  rates: VehicleRate[];
  onImportJobs: (jobs: Job[]) => Promise<void>;
  currentUserEmail: string;
}

export default function LineImportView({ rates, onImportJobs, currentUserEmail }: LineImportViewProps) {
  const [rawText, setRawText] = useState('');
  
  // Load cumulative jobs from localStorage to persist data across tab switches or page reloads
  const [cumulativeJobs, setCumulativeJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem('airport_transfer_cumulative_jobs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error parsing cumulative jobs from localStorage:', e);
      return [];
    }
  });

  // Sync to localStorage whenever cumulativeJobs changes
  React.useEffect(() => {
    try {
      localStorage.setItem('airport_transfer_cumulative_jobs', JSON.stringify(cumulativeJobs));
    } catch (e) {
      console.error('Error saving cumulative jobs to localStorage:', e);
    }
  }, [cumulativeJobs]);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // Helper to format date as DD/MM/YYYY
  const formatDateTH = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Parser logic extracted as a reusable function
  const parseText = (textToParse: string): Job[] => {
    if (!textToParse.trim()) return [];

    const lines = textToParse.split('\n').map(l => l.trim());
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
          // 1. First prioritize matching registered rates (exact or case-insensitive)
          // 2. Next, apply standard category heuristics
          // 3. Fallback to loose substring matches to ensure no missing prices (0)
          const lowerCode = vehicleCode.toLowerCase();
          let baseFare = 0;
          const matchedRate = rates.find(r => r.vehicleCode.toLowerCase() === lowerCode);
          if (matchedRate) {
            baseFare = matchedRate.price;
          } else if (
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
            const looseMatch = rates.find(r => 
              lowerCode.includes(r.vehicleCode.toLowerCase()) || 
              r.vehicleCode.toLowerCase().includes(lowerCode)
            );
            if (looseMatch) {
              baseFare = looseMatch.price;
            } else {
              // Standard safe defaults based on vehicle prefix/suffix or default to 400
              baseFare = lowerCode.includes('7') ? 500 : 400;
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

          // Generate unique sub-id helper for duplicate checking
          const uniqueId = `${jobId}_${(currentActiveDate || 'NODATE').replace(/-/g, '')}_${time.replace(':', '')}`;
          // Generate actual DB id with random suffix to avoid clashing
          const dbId = `${uniqueId}_${Math.floor(100 + Math.random() * 900)}`;

          tempJobs.push({
            id: dbId,
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
  };

  // Live parsed jobs from current input box
  const currentlyParsedJobs = useMemo(() => {
    return parseText(rawText);
  }, [rawText, rates, currentUserEmail]);

  // Function to add parsed jobs from current input to the cumulative table
  const handleAddToCumulative = () => {
    if (currentlyParsedJobs.length === 0) return;

    // Filter out duplicates that already exist in cumulative table by id_temp
    const existingIds = new Set(cumulativeJobs.map(j => j.id_temp));
    const newJobsToAdd = currentlyParsedJobs.filter(j => !existingIds.has(j.id_temp));
    const duplicateCount = currentlyParsedJobs.length - newJobsToAdd.length;

    if (newJobsToAdd.length > 0) {
      setCumulativeJobs(prev => [...prev, ...newJobsToAdd]);
      setNoticeMsg(`เพิ่มงานใหม่สำเร็จ ${newJobsToAdd.length} รายการ` + (duplicateCount > 0 ? ` (ข้ามงานที่ซ้ำซ้อนกัน ${duplicateCount} รายการ)` : ''));
      setRawText('');
      setTimeout(() => setNoticeMsg(null), 4000);
    } else {
      setNoticeMsg(`⚠️ งานวิ่งที่พบคัดลอกมา ซ้ำกับรายการในตารางสะสมทั้งหมดแล้ว (${duplicateCount} รายการ)`);
      setTimeout(() => setNoticeMsg(null), 4000);
    }
  };

  // Delete a specific job from cumulative list
  const handleDeleteCumulativeRow = (idTemp: string) => {
    setCumulativeJobs(prev => prev.filter(j => j.id_temp !== idTemp));
  };

  // Clear all cumulative jobs
  const handleClearCumulative = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างตารางสะสมนี้ทั้งหมด?')) {
      setCumulativeJobs([]);
    }
  };

  // Handle saving the accumulated jobs to Supabase
  const handleImport = async () => {
    if (cumulativeJobs.length === 0) return;
    try {
      // Clean temp fields and save
      const cleaned = cumulativeJobs.map(({ id_temp, ...rest }: any) => rest as Job);
      await onImportJobs(cleaned);
      setSuccessMsg(`นำเข้าข้อมูลสำเร็จแล้ว! เพิ่มจำนวนงานวิ่งสะสมทั้งหมด ${cumulativeJobs.length} งาน เข้าระบบคลาวด์เรียบร้อย`);
      setCumulativeJobs([]);
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
          ระบบรับข้อมูลดิบจากการคัดลอก LINE (Raw Text Auto Parser - สะสมต่อเนื่อง)
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          คัดลอกข้อความสรุปงานจากกรุ๊ป LINE วางลงช่องกรอก จากนั้นกดปุ่ม <span className="text-indigo-600 font-bold">"เพิ่มลงตารางสะสม"</span> เพื่อรวมข้อมูลได้เรื่อยๆ โดยระบบจะเก็บสะสมข้อมูลเก่าไว้ในตารางด้านขวา เพื่อให้คุณสามารถคัดลอกงานวันอื่นหรือห้องอื่นมาวางเพิ่มต่อได้จนครบ แล้วค่อยกดบันทึกขึ้นระบบคลาวด์ทีเดียว!
        </p>

        {successMsg && (
          <div className="p-4 mb-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-100 flex items-center gap-2.5 shadow-xs animate-pulse">
            <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}

        {noticeMsg && (
          <div className="p-3 mb-4 bg-indigo-50 text-indigo-800 text-xs rounded-xl border border-indigo-100 flex items-center gap-2 shadow-xs">
            <Info className="h-4 w-4 text-indigo-500 shrink-0" />
            <span className="font-medium">{noticeMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Input Box & Current Detection status */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  วางข้อความจากแอป LINE:
                </label>
                {rawText && (
                  <button 
                    onClick={() => setRawText('')}
                    className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                  >
                    ล้างข้อความที่วาง
                  </button>
                )}
              </div>
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

            {/* Current Text Parser Indicator */}
            {rawText.trim() && (
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-indigo-600" />
                    ตรวจพบ {currentlyParsedJobs.length} รายการในขณะนี้
                  </span>
                </div>
                <button
                  onClick={handleAddToCumulative}
                  disabled={currentlyParsedJobs.length === 0}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่ม {currentlyParsedJobs.length} รายการลงตารางสะสมด้านขวา
                </button>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-[10.5px] text-slate-600 space-y-2 leading-relaxed">
              <h5 className="font-bold text-slate-800 flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-indigo-500" />
                ขั้นตอนการใช้งานแบบสะสม:
              </h5>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>คัดลอกสรุปงานชุดที่ 1 จาก LINE มาวาง</li>
                <li>ระบบจะแสดงจำนวนงานที่ตรวจพบ ให้กด <strong className="text-indigo-600">"เพิ่มลงตารางสะสม"</strong></li>
                <li>ช่องข้อความจะถูกล้างว่างเปล่า ให้คัดลอกสรุปงานชุดที่ 2 มาวางเพิ่มต่อได้ทันที</li>
                <li>ตรวจสอบ ตารางรวมสะสม ด้านขวามือ และกด <strong className="text-emerald-600">"บันทึกข้อมูลทั้งหมดขึ้นคลาวด์"</strong></li>
              </ol>
            </div>
          </div>

          {/* Right Column: Cumulative Preview Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                ตารางรวมสะสมงานวิ่งรอการบันทึก ({cumulativeJobs.length} รายการในตาราง)
              </h4>

              <div className="flex items-center gap-2">
                {cumulativeJobs.length > 0 && (
                  <>
                    <button
                      onClick={handleClearCumulative}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      ล้างตารางสะสม
                    </button>
                    <button
                      onClick={handleImport}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-slate-950 text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                      บันทึกสะสมทั้งหมดเข้าระบบคลาวด์
                    </button>
                  </>
                )}
              </div>
            </div>

            {cumulativeJobs.length > 0 ? (
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs bg-white">
                <div className="overflow-x-auto max-h-[380px] scrollbar-thin">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                      <tr className="text-slate-500 font-bold">
                        <th className="p-3 w-8">ลำดับ</th>
                        <th className="p-3">วันที่</th>
                        <th className="p-3">รหัสรถ</th>
                        <th className="p-3">รหัสงาน</th>
                        <th className="p-3">เวลา</th>
                        <th className="p-3">เส้นทาง&เที่ยวบิน</th>
                        <th className="p-3 text-right">ค่างานต่องาน</th>
                        <th className="p-3 text-right text-emerald-600">บวกเพิ่ม</th>
                        <th className="p-3 text-right text-rose-500">ภาษี 5%</th>
                        <th className="p-3 text-right text-indigo-600">ยอดสุทธิ</th>
                        <th className="p-3 text-center w-10">ลบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {cumulativeJobs.map((j, idx) => (
                        <tr key={j.id_temp} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="p-3 font-mono text-slate-400 text-center">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-800 font-mono">{formatDateTH(j.date)}</td>
                          <td className="p-3 font-mono font-bold text-slate-700">{j.vehicleCode}</td>
                          <td className="p-3 font-mono font-bold text-indigo-950">{getCleanJobId(j.id)}</td>
                          <td className="p-3 font-mono font-medium text-slate-600">{j.time}</td>
                          <td className="p-3 font-semibold text-slate-800">{j.route}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-700">
                            ฿{j.baseFare.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            ฿{j.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-600">
                            ฿{j.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-indigo-600">
                            ฿{j.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteCumulativeRow(j.id_temp)}
                              className="p-1 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded transition-colors cursor-pointer"
                              title="ลบแถวนี้ออก"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex gap-4 flex-wrap">
                    <div>
                      <span className="text-slate-400 font-medium">รวมค่างาน:</span>{' '}
                      <span className="font-bold text-slate-800 font-mono">
                        ฿{cumulativeJobs.reduce((sum, j) => sum + j.baseFare, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-500 font-medium">รวมเงินบวกเพิ่ม:</span>{' '}
                      <span className="font-bold text-emerald-600 font-mono">
                        ฿{cumulativeJobs.reduce((sum, j) => sum + j.bonus, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-rose-400 font-medium font-bold">รวมหัก ภาษี 5%:</span>{' '}
                      <span className="font-bold text-rose-600 font-mono">
                        ฿{cumulativeJobs.reduce((sum, j) => sum + j.tax, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-indigo-500 font-bold">รวมสุทธิสะสมทั้งหมด:</span>{' '}
                    <span className="font-extrabold text-indigo-700 font-mono text-sm">
                      ฿{cumulativeJobs.reduce((sum, j) => sum + j.netIncome, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-slate-100 border-dashed rounded-2xl py-16 flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50/40 gap-2">
                <AlertCircle className="h-8 w-8 text-slate-300" />
                <span className="font-medium text-slate-500">ตารางสะสมของคุณยังว่างอยู่</span>
                <span className="text-[10px] text-slate-400 max-w-[280px] text-center leading-normal">
                  ป้อนหรือคัดลอกสรุปข้อความทางซ้ายมือ และกด "เพิ่มลงตารางสะสม" เพื่อเริ่มต้นสะสมงานสำหรับบันทึกพร้อมกัน
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
