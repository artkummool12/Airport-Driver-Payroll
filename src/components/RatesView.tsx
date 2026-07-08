import React, { useState } from 'react';
import { VehicleRate } from '../types';
import { Plus, Edit2, Trash2, Car, Search, X, Info } from 'lucide-react';

interface RatesViewProps {
  rates: VehicleRate[];
  onSaveRate: (rate: VehicleRate) => Promise<void>;
  onDeleteRate: (vehicleCode: string) => Promise<void>;
}

export default function RatesView({ rates, onSaveRate, onDeleteRate }: RatesViewProps) {
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<VehicleRate | null>(null);

  // Form Fields
  const [vehicleCode, setVehicleCode] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');

  const filteredRates = rates.filter(r =>
    r.vehicleCode.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAddForm = () => {
    setEditingRate(null);
    setVehicleCode('');
    setDescription('');
    setPrice('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (rate: VehicleRate) => {
    setEditingRate(rate);
    setVehicleCode(rate.vehicleCode);
    setDescription(rate.description);
    setPrice(rate.price);
    setIsFormOpen(true);
  };

  const handleDelete = async (code: string) => {
    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ที่จะลบรหัสอัตราค่ารถ ${code}?`);
    if (confirmed) {
      await onDeleteRate(code);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleCode.trim()) {
      alert('กรุณากรอกรหัสรุ่นรถ');
      return;
    }

    const finalRate: VehicleRate = {
      vehicleCode: vehicleCode.trim(),
      description: description.trim(),
      price: Number(price) || 0,
    };

    await onSaveRate(finalRate);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Search and control bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">อัตราค่าบริการแบ่งตามรหัสรุ่นรถ (Vehicle Rate Management)</h3>
            <p className="text-xs text-slate-500 mt-0.5">กำหนดค่าจ้างงานต่องานสำหรับรุ่นหรือรหัสรถแต่ละคัน เพื่อใช้คำนวณรายได้คนขับโดยอัตโนมัติ</p>
          </div>
          <button
            onClick={handleOpenAddForm}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto"
            id="btn-add-rate"
          >
            <Plus className="h-4 w-4" />
            เพิ่มอัตราค่ารถใหม่
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาตามรหัสรถ หรือคำอธิบายรุ่น..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3.5 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            id="input-search-rates"
          />
        </div>
      </div>

      {/* Table of rates */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-sans">
            <thead className="bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th scope="col" className="px-6 py-3.5 w-24">ลำดับ</th>
                <th scope="col" className="px-6 py-3.5 w-48">รหัสรุ่นรถ (Vehicle Code)</th>
                <th scope="col" className="px-6 py-3.5">รายละเอียดหรือรุ่นรถ (Description)</th>
                <th scope="col" className="px-6 py-3.5 text-right w-48">อัตราค่างานต่อเที่ยว (Price)</th>
                <th scope="col" className="px-6 py-3.5 text-center w-28">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRates.length > 0 ? (
                filteredRates.map((rate, index) => (
                  <tr key={rate.vehicleCode} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {(index + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                          <Car className="h-4 w-4" />
                        </div>
                        <span className="font-mono font-bold text-slate-800 tracking-wider">
                          {rate.vehicleCode}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium max-w-xs md:max-w-md truncate" title={rate.description}>
                      {rate.description || <span className="text-slate-300 italic">ไม่มีคำอธิบาย</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-800 text-sm">
                      <span className="text-[10px] text-slate-400 font-sans mr-0.5">฿</span>
                      {rate.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditForm(rate)}
                          className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 rounded-lg transition-colors"
                          title="แก้ไขอัตรา"
                          id={`btn-edit-rate-${rate.vehicleCode}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rate.vehicleCode)}
                          className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors"
                          title="ลบอัตรา"
                          id={`btn-delete-rate-${rate.vehicleCode}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Car className="h-8 w-8 text-slate-300" />
                      <p className="text-xs font-medium text-slate-500">ไม่พบรหัสอัตราค่ารถตรงตามคำค้นหา</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                  {editingRate ? 'แก้ไขพิกัดอัตราค่าจ้าง' : 'เพิ่มรหัสอัตราค่าจ้างใหม่'}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {editingRate ? `แก้ไขรหัส: ${editingRate.vehicleCode}` : 'เพิ่มรายการอัตราค่ารถในระบบคลาวด์'}
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                id="btn-close-rate-form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">รหัสรุ่นหรือรหัสรถ (Vehicle Code)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingRate}
                  placeholder="เช่น Cam7BK-S, 5BK-S"
                  value={vehicleCode}
                  onChange={(e) => setVehicleCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
                  id="form-rate-code"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">รายละเอียดหรือคำอธิบายรุ่นรถ (Description)</label>
                <input
                  type="text"
                  placeholder="เช่น Toyota Camry Black Standard 7-Seater"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  id="form-rate-desc"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ค่างานต่องาน (บาท)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="เช่น 500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  id="form-rate-price"
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                  id="btn-save-rate"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
