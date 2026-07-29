import React, { useEffect, useState } from 'react';
import { User, Activity, AlertCircle, Droplet, Clock, FileText } from 'lucide-react';
import api from '@/services/api';
import Link from 'next/link';

export default function PatientInfoColumn({ appointment }: { appointment: any }) {
  // patientInfo is a JSON snapshot; fall back to user fields
  const profile = (appointment.patientInfo as any) || {};
  const user = appointment.user || {};
  
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user.id) return;
      setLoading(true);
      try {
        const res = await api.get(`/doctor/patients/${user.id}`);
        if (res.data?.pastAppointments) {
          // Filter out the current appointment
          setPastAppointments(res.data.pastAppointments.filter((a: any) => a.id !== appointment.id));
        }
      } catch (err) {
        console.error('Failed to fetch patient history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user.id, appointment.id]);

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
          {loading ? (
            <p className="text-xs text-slate-500 text-center py-4">Đang tải...</p>
          ) : pastAppointments.length > 0 ? (
            pastAppointments.map((appt) => (
              <div key={appt.id} className="p-3 border border-slate-100 rounded-xl hover:border-teal-100 hover:bg-teal-50/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-700">Khám bệnh</span>
                  <span className="text-xs text-slate-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> 
                    {new Date(appt.appointmentDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {appt.medicalRecord?.status === 'COMPLETED' ? (
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-xs text-slate-500 line-clamp-2 pr-2">
                      Đã có bệnh án
                    </p>
                    <Link href={`/doctor/examination/${appt.id}?viewOnly=true`} target="_blank">
                      <button className="text-[10px] bg-teal-50 text-teal-600 px-2 py-1 rounded hover:bg-teal-100 font-semibold flex items-center gap-1 shrink-0">
                        <FileText className="w-3 h-3" /> Xem
                      </button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-2">Chưa có bệnh án hoàn chỉnh</p>
                )}
              </div>
            ))
          ) : (
            <div className="p-3 border border-slate-100 rounded-xl bg-slate-50 text-center">
               <p className="text-xs text-slate-500">Chưa có dữ liệu khám</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
