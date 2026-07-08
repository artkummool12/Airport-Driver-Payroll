import React, { useState } from 'react';
import { BonusEntry, Job, getCleanJobId } from '../types';
import { Plus, Edit2, Trash2, Award, Search, X } from 'lucide-react';

interface BonusViewProps {
  bonuses: BonusEntry[];
  jobs: Job[];
  onSaveBonus: (bonus: BonusEntry) => Promise<void>;
  onDeleteBonus: (id: string) => Promise<void>;
}

export default function BonusView({ bonuses, jobs, onSaveBonus, onDeleteBonus }: BonusViewProps) {
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBonus, setEditingBonus] = useState<BonusEntry | null>(null);

  // Form Fields
  const [id, setId] = useState('');
  const [jobId, setJobId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [remark, setRemark] = useState('');

  const filteredBonuses = bonuses.filter(b =>
    b.jobId.toLowerCase().includes(search.toLowerCase()) ||
    b.remark.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAddForm = () => {
    setEditingBonus(null);
    setId(`BNS-${Math.floor(1000 + Math.random() * 9000)}`);
    setJobId(jobs[0]?.id || '');
    setAmount('');
    setRemark('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (bonus: BonusEntry) => {
    setEditingBonus(bonus);
    setId(bonus.id);
    setJobId(bonus.jobId);
    setAmount(bonus.amount);
    setRemark(bonus.remark);
    setIsFormOpen(true);
  };

  const handleDelete = async (bonusId: string) => {
    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ที่จะลบรายการบวกเพิ่มนี้ ${bonusId}?`);
    if (confirmed) {
      await onDeleteBonus(bonusId);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) {
      alert('กรุณาเลือกรหัสงานที่ต้องการให้โบนัส');
      return;
    }

    const finalBonus: BonusEntry = {
      id,
      jobId,
      amount: Number(amount) || 0,
      remark: remark.trim(),
    };

    await onSaveBonus(finalBonus);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">รายการเงินบวกเพิ่มพนักงานขับรถ (Bonus Directory)</h3>
            <p className="text-xs text-slate-500 mt-0.5">บวกค่าเพิ่มกรณีพิเศษ เช่น วิ่งงานระยะไกล, งานด่วน หรืออื่นๆ เพื่อกระตุ้นและเป็นโบนัสคนวิ่งงาน</p>
          </div>
          <button
            onClick={handleOpenAddForm}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto"
            id="btn-add-bonus"
          >
            <Plus className="h-4 w-4" />
            เพิ่มรายรับพิเศษ (Bonus)
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาตามรหัสงาน หรือหมายเหตุ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3.5 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            id="input-search-bonus"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBonuses.length > 0 ? (
          filteredBonuses.map(bonus => (
            <div key={bonus.id} className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between gap-4 hover:border-slate-200 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">{bonus.id}</span>
                    <h4 className="text-xs font-black text-slate-800 font-mono mt-0.5">รหัสงาน: {getCleanJobId(bonus.jobId)}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditForm(bonus)}
                    className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 rounded-lg transition-colors"
                    title="แก้ไขโบนัส"
                    id={`btn-edit-bonus-${bonus.id}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(bonus.id)}
                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors"
                    title="ลบโบนัส"
                    id={`btn-delete-bonus-${bonus.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">โบนัสบวกเพิ่ม:</span>
                  <span className="font-mono font-bold text-emerald-600">฿{bonus.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 font-bold">หมายเหตุ:</span>
                  <span className="text-slate-700 font-semibold text-right max-w-[150px] truncate" title={bonus.remark}>{bonus.remark || '-'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Award className="h-8 w-8 text-slate-300" />
            <p className="text-xs font-medium text-slate-500">ไม่มีรายการโบนัสบวกเพิ่มใดๆ ในระบบ</p>
          </div>
        )}
      </div>

      {/* Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                  {editingBonus ? 'แก้ไขรายการบวกเพิ่ม' : 'เพิ่มรายการบวกเพิ่มใหม่'}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ID: {id}
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                id="btn-close-bonus-form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">รหัสงานอ้างอิง (Job Number)</label>
                <select
                  required
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  id="form-bonus-job"
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {getCleanJobId(j.id)} ({j.route} - {j.vehicleCode} - {j.date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ยอดเงินบวกเพิ่ม (บาท)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="เช่น 50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  id="form-bonus-amount"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">หมายเหตุประกอบรายการ (Remark)</label>
                <input
                  type="text"
                  placeholder="เช่น วิ่งงานรอบดึกพิเศษ, วิ่งระยะทางเกินพิกัด"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  id="form-bonus-remark"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                  id="btn-save-bonus"
                >
                  บันทึกโบนัส
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
