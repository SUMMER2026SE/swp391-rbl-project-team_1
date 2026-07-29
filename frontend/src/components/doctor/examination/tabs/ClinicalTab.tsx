import React from 'react';

interface ClinicalTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  disabled: boolean;
}

export default function ClinicalTab({ formData, onUpdate, disabled }: ClinicalTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Chỉ số sinh tồn</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Chiều cao (cm)</label>
            <input 
              type="number" 
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
              value={formData.height}
              onChange={(e) => onUpdate('height', e.target.value)}
              disabled={disabled}
              placeholder="VD: 170"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Cân nặng (kg)</label>
            <input 
              type="number" 
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
              value={formData.weight}
              onChange={(e) => onUpdate('weight', e.target.value)}
              disabled={disabled}
              placeholder="VD: 65"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Huyết áp (mmHg)</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
              value={formData.bloodPressure}
              onChange={(e) => onUpdate('bloodPressure', e.target.value)}
              disabled={disabled}
              placeholder="VD: 120/80"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nhịp tim (lần/phút)</label>
            <input 
              type="number" 
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
              value={formData.heartRate}
              onChange={(e) => onUpdate('heartRate', e.target.value)}
              disabled={disabled}
              placeholder="VD: 80"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nhiệt độ (°C)</label>
            <input 
              type="number" step="0.1"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
              value={formData.temperature}
              onChange={(e) => onUpdate('temperature', e.target.value)}
              disabled={disabled}
              placeholder="VD: 37.0"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">SpO2 (%)</label>
            <input 
              type="number" 
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
              value={formData.spo2}
              onChange={(e) => onUpdate('spo2', e.target.value)}
              disabled={disabled}
              placeholder="VD: 98"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Khám lâm sàng</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Lý do khám / Triệu chứng chính <span className="text-red-500">*</span></label>
            <textarea 
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
              value={formData.symptoms}
              onChange={(e) => onUpdate('symptoms', e.target.value)}
              disabled={disabled}
              placeholder="Mô tả các triệu chứng khiến bệnh nhân đi khám..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Khám thực thể</label>
            <textarea 
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
              value={formData.physicalExam}
              onChange={(e) => onUpdate('physicalExam', e.target.value)}
              disabled={disabled}
              placeholder="Ghi nhận các dấu hiệu bất thường khi thăm khám (Tim, Phổi, Bụng...)"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Chẩn đoán sơ bộ</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
              value={formData.preliminaryDiagnosis}
              onChange={(e) => onUpdate('preliminaryDiagnosis', e.target.value)}
              disabled={disabled}
              placeholder="Chẩn đoán sơ bộ ban đầu..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
