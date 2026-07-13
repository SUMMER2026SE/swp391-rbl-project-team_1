import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PrescriptionTabProps {
  prescriptions: any[];
  setPrescriptions: React.Dispatch<React.SetStateAction<any[]>>;
  disabled: boolean;
}

export default function PrescriptionTab({ prescriptions, setPrescriptions, disabled }: PrescriptionTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);

  // Form for new prescription
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [instructions, setInstructions] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 1) {
        searchMedicines(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchMedicines = async (query: string) => {
    try {
      setIsSearching(true);
      const res = await fetch(`/api/medicines?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Error searching medicines', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectMedicine = (medicine: any) => {
    setSelectedMedicine(medicine);
    setSearchQuery('');
    setSearchResults([]);
    setDosage('');
    setFrequency('');
    setDurationDays('');
    setInstructions(medicine.defaultInstructions || '');
    setQuantity('');
  };

  const handleAddPrescription = () => {
    if (!selectedMedicine || !dosage || !frequency || !durationDays || !quantity) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    // Prevent duplicate medicine
    if (prescriptions.some(p => p.medicineId === selectedMedicine.id)) {
      toast.error('Thuốc này đã có trong đơn');
      return;
    }

    const newPrescription = {
      medicineId: selectedMedicine.id,
      medicine: selectedMedicine, // Store temporarily for UI display
      dosage,
      frequency,
      durationDays: parseInt(durationDays),
      instructions,
      quantity: parseInt(quantity)
    };

    setPrescriptions([...prescriptions, newPrescription]);
    setSelectedMedicine(null);
  };

  const removePrescription = (idx: number) => {
    if (disabled) return;
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {!disabled && (
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Thêm thuốc vào đơn</h3>
          
          {!selectedMedicine ? (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Tìm kiếm theo tên thuốc hoặc hoạt chất..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              {/* Search Results Dropdown */}
              {searchQuery.length > 1 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-slate-500">Đang tìm...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(med => (
                      <div 
                        key={med.id} 
                        onClick={() => selectMedicine(med)}
                        className="p-3 hover:bg-teal-50 cursor-pointer border-b border-slate-50 last:border-0"
                      >
                        <p className="font-semibold text-sm text-slate-800">{med.name} <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-2">{med.form}</span></p>
                        <p className="text-xs text-slate-500 mt-1">{med.activeIngredient}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">Không tìm thấy thuốc phù hợp</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-teal-800 text-lg">{selectedMedicine.name}</h4>
                  <p className="text-xs text-teal-600">{selectedMedicine.activeIngredient} • Dạng: {selectedMedicine.form} • Đơn vị: {selectedMedicine.unit}</p>
                </div>
                <button onClick={() => setSelectedMedicine(null)} className="text-xs text-slate-400 hover:text-slate-600 underline">Chọn thuốc khác</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Liều dùng <span className="text-red-500">*</span></label>
                  <input type="text" value={dosage} onChange={e => setDosage(e.target.value)} placeholder="VD: 1 viên" className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tần suất <span className="text-red-500">*</span></label>
                  <input type="text" value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="VD: 2 lần/ngày" className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Số ngày <span className="text-red-500">*</span></label>
                  <input type="number" value={durationDays} onChange={e => setDurationDays(e.target.value)} placeholder="VD: 7" className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tổng SL <span className="text-red-500">*</span></label>
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder={`VD: 14 (${selectedMedicine.unit})`} className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
                <div className="col-span-2 md:col-span-5">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú</label>
                  <input type="text" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="VD: Uống sau ăn no" className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleAddPrescription}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg flex items-center hover:bg-teal-700 transition-colors font-medium text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" /> Thêm vào đơn
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Đơn thuốc đã kê ({prescriptions.length})</h3>
        {prescriptions.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
            <p className="text-sm text-slate-500">Chưa có thuốc nào trong đơn.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((p, idx) => (
              <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-800">{idx + 1}. {p.medicine?.name || p.medicineId}</p>
                  <div className="flex flex-wrap items-center mt-1 text-xs text-slate-500 space-x-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">{p.dosage}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">{p.frequency}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">{p.durationDays} ngày</span>
                    <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-medium">SL: {p.quantity} {p.medicine?.unit || 'viên'}</span>
                  </div>
                  {p.instructions && (
                    <p className="text-xs text-slate-400 mt-2 italic">Ghi chú: {p.instructions}</p>
                  )}
                </div>
                {!disabled && (
                  <button onClick={() => removePrescription(idx)} className="mt-3 md:mt-0 ml-0 md:ml-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 self-end md:self-auto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
