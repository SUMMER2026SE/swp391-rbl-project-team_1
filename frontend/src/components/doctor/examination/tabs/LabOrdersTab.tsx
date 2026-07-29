import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface LabOrdersTabProps {
  labOrders: any[];
  setLabOrders: React.Dispatch<React.SetStateAction<any[]>>;
  disabled: boolean;
}

const COMMON_TESTS = [
  { type: 'Máu', name: 'Công thức máu (CBC)' },
  { type: 'Máu', name: 'Sinh hóa máu (Glucose, Ure, Creatinin...)' },
  { type: 'Nước tiểu', name: 'Tổng phân tích nước tiểu' },
  { type: 'Chẩn đoán hình ảnh', name: 'X-quang ngực thẳng' },
  { type: 'Chẩn đoán hình ảnh', name: 'Siêu âm ổ bụng' },
  { type: 'Điện tim', name: 'Điện tâm đồ (ECG)' },
];

export default function LabOrdersTab({ labOrders, setLabOrders, disabled }: LabOrdersTabProps) {
  const [customTest, setCustomTest] = useState('');
  const [customType, setCustomType] = useState('Khác');

  const addTest = (testType: string, testName: string) => {
    if (disabled) return;
    // Prevent duplicate
    if (labOrders.some(lo => lo.testName === testName)) return;
    setLabOrders([...labOrders, { testType, testName, notes: '', status: 'PENDING' }]);
  };

  const removeTest = (idx: number) => {
    if (disabled) return;
    setLabOrders(labOrders.filter((_, i) => i !== idx));
  };

  const updateNote = (idx: number, note: string) => {
    if (disabled) return;
    const newOrders = [...labOrders];
    newOrders[idx].notes = note;
    setLabOrders(newOrders);
  };

  const handleAddCustom = () => {
    if (disabled || !customTest.trim()) return;
    addTest(customType, customTest);
    setCustomTest('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Chỉ định Xét nghiệm & CLS thường quy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMMON_TESTS.map((test, idx) => {
            const isSelected = labOrders.some(lo => lo.testName === test.name);
            return (
              <div 
                key={idx}
                onClick={() => isSelected ? removeTest(labOrders.findIndex(lo => lo.testName === test.name)) : addTest(test.type, test.name)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-sm' 
                    : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-slate-50'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start">
                  <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 shrink-0 mt-0.5 ${
                    isSelected ? 'bg-teal-500 text-white' : 'border-2 border-slate-300'
                  }`}>
                    {isSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div>
                    <p className="font-medium text-sm leading-tight">{test.name}</p>
                    <p className="text-xs opacity-70 mt-1">{test.type}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Thêm chỉ định khác</h3>
        <div className="flex space-x-3">
          <select 
            value={customType} 
            onChange={e => setCustomType(e.target.value)}
            disabled={disabled}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
          >
            <option value="Máu">Máu</option>
            <option value="Nước tiểu">Nước tiểu</option>
            <option value="Chẩn đoán hình ảnh">Chẩn đoán hình ảnh</option>
            <option value="Sinh thiết/GPB">Sinh thiết/GPB</option>
            <option value="Khác">Khác</option>
          </select>
          <input 
            type="text" 
            value={customTest}
            onChange={e => setCustomTest(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
            disabled={disabled}
            placeholder="Tên xét nghiệm / CLS..."
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
          />
          <button 
            onClick={handleAddCustom}
            disabled={disabled || !customTest.trim()}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">Thêm</span>
          </button>
        </div>
      </div>

      {labOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Danh sách đã chỉ định ({labOrders.length})</h3>
          <div className="space-y-3">
            {labOrders.map((order, idx) => (
              <div key={idx} className="flex items-start p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex-1 flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-800">{order.testName}</p>
                    <p className="text-xs text-slate-500">{order.testType}</p>
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={order.notes}
                      onChange={e => updateNote(idx, e.target.value)}
                      disabled={disabled}
                      placeholder="Ghi chú (VD: Lấy máu lúc đói...)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-60"
                    />
                  </div>
                </div>
                {!disabled && (
                  <button onClick={() => removeTest(idx)} className="ml-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
