import React from 'react';
import { Calendar } from 'lucide-react';

interface ConclusionTabProps {
  formData: any;
  onUpdate: (field: string, value: any) => void;
  disabled: boolean;
}

export default function ConclusionTab({ formData, onUpdate, disabled }: ConclusionTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Kết luận Chẩn đoán</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Chẩn đoán xác định <span className="text-red-500">*</span></label>
              <textarea 
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
                value={formData.finalDiagnosis}
                onChange={(e) => onUpdate('finalDiagnosis', e.target.value)}
                disabled={disabled}
                placeholder="Ghi rõ bệnh chính, bệnh kèm theo..."
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mã ICD-10</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 h-[72px]"
                value={formData.icd10Code}
                onChange={(e) => onUpdate('icd10Code', e.target.value)}
                disabled={disabled}
                placeholder="VD: J02.9"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mức độ bệnh</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
                value={formData.severity}
                onChange={(e) => onUpdate('severity', e.target.value)}
                disabled={disabled}
              >
                <option value="MILD">Nhẹ (Điều trị ngoại trú)</option>
                <option value="MODERATE">Trung bình (Theo dõi)</option>
                <option value="SEVERE">Nặng (Cân nhắc nhập viện)</option>
                <option value="EMERGENCY">Cấp cứu</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Hướng điều trị</label>
              <input 
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
                value={formData.treatmentPlan}
                onChange={(e) => onUpdate('treatmentPlan', e.target.value)}
                disabled={disabled}
                placeholder="VD: Dùng thuốc, tiểu phẫu..."
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Dặn dò & Tái khám</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Lời dặn của Bác sĩ</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
              value={formData.doctorNotes}
              onChange={(e) => onUpdate('doctorNotes', e.target.value)}
              disabled={disabled}
              placeholder="Chế độ ăn uống, sinh hoạt, kiêng cữ..."
            />
          </div>
          
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày tái khám đề nghị</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="date"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
                value={formData.followUpDate}
                onChange={(e) => onUpdate('followUpDate', e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
