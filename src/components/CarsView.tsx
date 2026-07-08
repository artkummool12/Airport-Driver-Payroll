import React, { useState } from 'react';
import { Car } from '../types';
import { Plus, Edit2, Trash2, Car as CarIcon, Search, X, Image as ImageIcon, Upload, AlertCircle, Check } from 'lucide-react';

interface CarsViewProps {
  cars: Car[];
  onSaveCar: (car: Car) => Promise<void>;
  onDeleteCar: (id: string) => Promise<void>;
}

export default function CarsView({ cars, onSaveCar, onDeleteCar }: CarsViewProps) {
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [brand, setBrand] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const filteredCars = cars.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.brand.toLowerCase().includes(search.toLowerCase()) ||
    c.licensePlate.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAddForm = () => {
    setEditingCar(null);
    setCode('');
    setBrand('');
    setLicensePlate('');
    setImageUrl('');
    setImagePreview(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (car: Car) => {
    setEditingCar(car);
    setCode(car.code);
    setBrand(car.brand);
    setLicensePlate(car.licensePlate);
    setImageUrl(car.imageUrl || '');
    setImagePreview(car.imageUrl || null);
    setIsFormOpen(true);
  };

  const handleDelete = async (car: Car) => {
    const confirmed = window.confirm(`คุณแน่ใจว่าต้องการลบข้อมูลรถรหัส ${car.code} (${car.brand}) หรือไม่?`);
    if (confirmed) {
      await onDeleteCar(car.id);
    }
  };

  // Convert uploaded image to Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 2MB เพื่อประสิทธิภาพในการบันทึกข้อมูล');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      setImageUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      alert('กรุณากรอกรหัสรถ (เช่น D1299)');
      return;
    }
    if (!brand.trim()) {
      alert('กรุณากรอกยี่ห้อและรุ่นรถ');
      return;
    }
    if (!licensePlate.trim()) {
      alert('กรุณากรอกเลขทะเบียนรถจริง');
      return;
    }

    const finalCar: Car = {
      id: editingCar ? editingCar.id : `CAR-${Math.floor(1000 + Math.random() * 9000)}`,
      code: code.trim().toUpperCase(),
      brand: brand.trim(),
      licensePlate: licensePlate.trim(),
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=60' // Default fallback car photo
    };

    await onSaveCar(finalCar);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Control bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">จัดการข้อมูลยานพาหนะ (Vehicle Management)</h3>
            <p className="text-xs text-slate-500 mt-0.5">บันทึกรูปภาพ ยี่ห้อ รุ่น และเลขทะเบียนรถเพื่อใช้จับคู่กับเที่ยววิ่งงานรับส่งสนามบิน</p>
          </div>
          <button
            onClick={handleOpenAddForm}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
            id="btn-add-car"
          >
            <Plus className="h-4 w-4" />
            เพิ่มรถยนต์ใหม่
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาตามรหัสรถ ยี่ห้อ หรือทะเบียนรถจริง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3.5 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            id="input-search-cars"
          />
        </div>
      </div>

      {/* Grid List of Cars */}
      {filteredCars.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => (
            <div key={car.id} className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden hover:shadow-md transition-all flex flex-col group">
              {/* Car Image Header */}
              <div className="relative h-44 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-50">
                {car.imageUrl ? (
                  <img
                    src={car.imageUrl}
                    alt={car.brand}
                    className="object-cover w-full h-full group-hover:scale-105 transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <CarIcon className="h-12 w-12 stroke-1" />
                    <span className="text-[10px] mt-1">ไม่มีรูปภาพประกอบ</span>
                  </div>
                )}
                {/* Float Badge for Code */}
                <span className="absolute top-3 left-3 bg-indigo-600 text-white font-mono font-black text-xs px-2.5 py-1 rounded-lg shadow-sm">
                  {car.code}
                </span>
              </div>

              {/* Car Body Content */}
              <div className="p-5 flex-grow space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm tracking-tight">{car.brand}</h4>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">ทะเบียน:</span>
                    <span className="font-semibold text-slate-700">{car.licensePlate}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => handleOpenEditForm(car)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-xs flex items-center gap-1 cursor-pointer font-bold"
                    title="แก้ไขข้อมูลรถ"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    onClick={() => handleDelete(car)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all text-xs flex items-center gap-1 cursor-pointer font-bold"
                    title="ลบข้อมูลรถ"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>ลบ</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
          ไม่พบข้อมูลยานพาหนะตามเงื่อนไขที่ค้นหาข้างต้น
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {editingCar ? 'แก้ไขข้อมูลรถยนต์' : 'เพิ่มรถยนต์คันใหม่'}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-sans">ระบุรายละเอียดรหัสรถ ยี่ห้อ และเลขทะเบียนจริง</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">รหัสอ้างอิงรถในระบบ (Code) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น D1299, D6662, D6762"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={editingCar !== null} // Lock code on edit to preserve references
                  className="px-3.5 py-2 w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono font-bold"
                />
                {editingCar && (
                  <p className="text-[10px] text-slate-400">ไม่สามารถแก้ไขรหัสอ้างอิงรถได้ เนื่องจากมีการเชื่อมโยงกับเที่ยววิ่งงาน</p>
                )}
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">ยี่ห้อและรุ่นรถ (Brand & Model) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Toyota Camry, Toyota Fortuner"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="px-3.5 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* License Plate */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">เลขทะเบียนจริง (License Plate) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 3กข 1299 กรุงเทพฯ"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="px-3.5 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold"
                />
              </div>

              {/* Image Upload Option */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">รูปถ่ายรถยนต์ (Car Photo)</label>
                
                {/* Preview Box */}
                {imagePreview ? (
                  <div className="relative h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageUrl('');
                      }}
                      className="absolute top-2 right-2 bg-slate-900/60 hover:bg-slate-900 text-white p-1 rounded-full shadow-xs transition-all"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all relative">
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="text-xs text-slate-600 font-bold mt-1.5">คลิกเพื่อเลือกไฟล์รูปภาพ</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">รองรับไฟล์ PNG, JPG ไม่เกิน 2MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                )}

                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 text-indigo-500" />
                  <span>หรือ วางลิงก์รูปภาพสาธารณะด้านล่างนี้ได้เช่นกัน:</span>
                </div>

                <input
                  type="text"
                  placeholder="เช่น https://example.com/car.jpg"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value || null);
                  }}
                  className="px-3.5 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
