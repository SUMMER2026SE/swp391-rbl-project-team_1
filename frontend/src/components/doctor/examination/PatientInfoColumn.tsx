import React from 'react';
import { User, Activity, AlertCircle, Droplet, Clock } from 'lucide-react';

export default function PatientInfoColumn({ appointment }: { appointment: any }) {
  // patientInfo is a JSON snapshot; fall back to user fields
  const profile = (appointment.patientInfo as any) || {};
  const user = appointment.user || {};
  
  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-3xl font-bold mb-4 shadow-sm border-4 border-white">
          {profile.fullName?.charAt(0) || user.fullName?.charAt(0) || 'U'}
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">{profile.fullName || user.fullName || 'N/A'}</h2>
        {appointment.patientProfileType === "OTHER" && (
          <p className="text-xs text-slate-400 mb-2 font-medium">Đặt bởi: {user.email}</p>
        )}
        <div className="flex items-center space-x-3 text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
          <span className="flex items-center"><User className="w-4 h-4 mr-1" /> {profile.gender || user.gender || 'N/A'}</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <span>{calculateAge(profile.dateOfBirth || user.dateOfBirth)} tuổi</span>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {/* Medical Background */}
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Thông tin y tế cơ bản</h3>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-start">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center mr-3 shrink-0">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Nhóm máu</p>
              <p className="text-sm font-medium text-slate-800">{profile.bloodType || user.bloodType || 'Chưa cập nhật'}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center mr-3 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Dị ứng</p>
              <p className="text-sm font-medium text-slate-800">{profile.allergies || user.allergies || 'Không ghi nhận'}</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mr-3 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Bệnh nền</p>
              <p className="text-sm font-medium text-slate-800">{profile.chronicDiseases || user.chronicDiseases || 'Không ghi nhận'}</p>
            </div>
          </div>
        </div>

        {/* History (Mock for now, could fetch real history later) */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Lịch sử khám (Gần đây)</h3>
          <button className="text-xs text-teal-600 hover:text-teal-700 font-medium">Xem tất cả</button>
        </div>
        
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-3 border border-slate-100 rounded-xl hover:border-teal-100 hover:bg-teal-50/30 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-slate-700">Khám tổng quát</span>
                <span className="text-xs text-slate-400 flex items-center"><Clock className="w-3 h-3 mr-1" /> 12/05/2026</span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">Viêm họng hạt, có triệu chứng ho khan về đêm. Kê đơn thuốc 5 ngày.</p>
            </div>
          ))}
          <div className="p-3 border border-slate-100 rounded-xl bg-slate-50 text-center">
             <p className="text-xs text-slate-500">Không còn dữ liệu cũ hơn</p>
          </div>
        </div>
      </div>
    </div>
  );
}
