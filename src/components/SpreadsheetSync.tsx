import React, { useState } from 'react';
import { Database, ShieldCheck, RefreshCw } from 'lucide-react';

interface SpreadsheetSyncProps {
  isSyncing?: boolean;
  onResetSeedData?: () => void;
  dbError?: string | null;
}

export default function SpreadsheetSync({
  isSyncing = false,
  onResetSeedData,
  dbError = null,
}: SpreadsheetSyncProps) {
  const [resetting, setResetting] = useState(false);

  const handleResetClick = async () => {
    if (!onResetSeedData) return;
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตล้างตารางทั้งหมดบนคลาวด์ Supabase และโหลด 29 เที่ยววิ่งทดสอบใหม่?')) {
      setResetting(true);
      try {
        await onResetSeedData();
      } finally {
        setTimeout(() => setResetting(false), 800);
      }
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 rounded-2xl shadow-md border border-emerald-500/20 p-5 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/20 shrink-0 mt-0.5">
              <Database className="h-5.5 w-5.5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex flex-wrap items-center gap-2">
                ระบบจัดการฐานข้อมูล Supabase (100% Cloud Connected)
                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" /> เชื่อมต่อคลาวด์แบบเรียลไทม์
                </span>
                {isSyncing && (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-slate-800 text-indigo-300 px-2.5 py-0.5 rounded-full font-bold border border-indigo-500/20 animate-pulse">
                    <RefreshCw className="h-3 w-3 text-indigo-400 animate-spin" /> กำลังบันทึกข้อมูล...
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mt-1 max-w-3xl">
                ระบบเชื่อมต่อโดยตรงกับฐานข้อมูล <span className="font-semibold text-emerald-400">Supabase SQL Cloud</span> เรียบร้อยแล้ว ข้อมูลทั้งหมด (เที่ยววิ่งงาน, อัตราจ้างพนักงาน, รายการโบนัส/ค่าปรับ, ทะเบียนรถ) ถูกจัดเก็บลงฐานข้อมูลคลาวด์โดยตรง ปลอดภัยและรวดเร็ว
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            {onResetSeedData && (
              <button
                onClick={handleResetClick}
                disabled={resetting || isSyncing}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 disabled:text-emerald-400 text-slate-950 text-xs font-black rounded-xl border border-emerald-400 shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
                id="btn-reset-sandbox-data"
              >
                {resetting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-950" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 text-slate-950" />
                )}
                รีเซ็ตข้อมูลคลาวด์ (Reset Seed)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
