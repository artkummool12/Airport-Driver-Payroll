import React, { useState } from 'react';
import { PenaltyEntry, Job, getCleanJobId } from '../types';
import { Plus, Edit2, Trash2, AlertOctagon, Search, X } from 'lucide-react';

interface PenaltyViewProps {
  penalties: PenaltyEntry[];
  jobs: Job[];
  onSavePenalty: (penalty: PenaltyEntry) => Promise<void>;
  onDeletePenalty: (id: string) => Promise<void>;
}

export default function PenaltyView({ penalties, jobs, onSavePenalty, onDeletePenalty }: PenaltyViewProps) {
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPenalty, setEditingPenalty] = useState<PenaltyEntry | null>(null);

  // Form Fields
  const [id, setId] = useState('');
  const [jobId, setJobId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');

  const filteredPenalties = penalties.filter(p =>
    p.jobId.toLowerCase().includes(search.toLowerCase()) ||
    p.reason.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAddForm = () => {
    setEditingPenalty(null);
    setId(`PNL-${Math.floor(1000 + Math.random() * 9000)}`);
    setJobId(jobs[0]?.id || '');
    setAmount('');
    setReason('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (penalty: PenaltyEntry) => {
    setEditingPenalty(penalty);
    setId(penalty.id);
    setJobId(penalty.jobId);
    setAmount(penalty.amount);
    setReason(penalty.reason);
    setIsFormOpen(true);
  };

  const handleDelete = async (penaltyId: string) => {
    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ที่จะลบรายการปรับเงินคนขับนี้ ${penaltyId}?`);
    if (confirmed) {
      await onDeletePenalty(penaltyId);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) {
      alert('กรุณาเลือกรหัสงานที่ต้องการระบุค่าปรับ');
      return;
    }

    const finalPenalty: PenaltyEntry = {
      id,
      jobId,
      amount: Number(amount) || 0,
      reason: reason.trim(),
    };

    await onSavePenalty(finalPenalty);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">รายการหักเงินค่าปรับพนักงานขับรถ (Penalty Directory)</h3>
            <p className="text-xs text-slate-500 mt-0.5">หักค่าปรับกรณีพนักงานไม่ปฏิบัติตามกฏระเบียบ เช่น มาสายเกินกำหนด, ยกเลิกงานกะทันหัน หรือทำความสะอาดรถไม่ได้มาตรฐาน</p>
          </div>
          <button
            onClick={handleOpenAddForm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto"
            id="btn-add-penalty"
          >
            <Plus className="h-4 w-4" />
            เพิ่มรายการหักเงิน (Penalty)
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาตามรหัสงาน หรือเหตุผล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3.5 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            id="input-search-penalty"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPenalties.length > 0 ? (
          filteredPenalties.map(penalty => (
            <div key={penalty.id} className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between gap-4 hover:border-slate-200 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                    <AlertOctagon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">{penalty.id}</span>
                    <h4 className="text-xs font-black text-slate-800 font-mono mt-0.5">รหัสงาน: {getCleanJobId(penalty.jobId)}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditForm(penalty)}
                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors"
                    title="แก้ไขค่าปรับ"
                    id={`btn-edit-penalty-${penalty.id}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(penalty.id)}
                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors"
                    title="ลบคะแนน/ค่าปรับ"
                    id={`btn-delete-penalty-${penalty.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">ยอดเงินหักค่าปรับ:</span>
                  <span className="font-mono font-bold text-rose-600">฿{penalty.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 font-bold">เหตุผล:</span>
                  <span className="text-slate-700 font-semibold text-right max-w-[150px] truncate" title={penalty.reason}>{penalty.reason || '-'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <AlertOctagon className="h-8 w-8 text-slate-300" />
            <p className="text-xs font-medium text-slate-500">ไม่มีประวัติค่าปรับคนขับในระบบสเปรดชีต</p>
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
                  {editingPenalty ? 'แก้ไขรายการหักค่าปรับ' : 'เพิ่มรายการหักค่าปรับใหม่'}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ID: {id}
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                id="btn-close-penalty-form"
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
                  id="form-penalty-job"
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {getCleanJobId(j.id)} ({j.route} - {j.vehicleCode} - {j.date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ยอดเงินหักค่าปรับ (บาท)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="เช่น 100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  id="form-penalty-amount"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">เหตุผลการระบุค่าปรับ (Reason)</label>
                <input
                  type="text"
                  placeholder="เช่น ไม่ทำความสะอาดรถ, รายงานตัวสาย 30 นาที"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  id="form-penalty-reason"
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                  id="btn-save-penalty"
                >
                  บันทึกค่าปรับ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
