"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { appointmentService } from "@/services/appointment.service";
import { bookingProfileService, BookingProfile } from "@/services/booking-profile.service";
import { Appointment } from "@/types/appointment";
import { FileText, UserPlus, Activity, CalendarDays, Eye, Edit, Trash2 } from "lucide-react";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";

export default function MedicalRecordsTab() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profiles, setProfiles] = useState<BookingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeProfileId, setActiveProfileId] = useState<string | "MAIN">("MAIN");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apptsRes, profsRes] = await Promise.all([
        appointmentService.getMyAppointments(),
        bookingProfileService.getMyProfiles()
      ]);
      setAppointments(apptsRes.appointments || []);
      setProfiles(profsRes || []);
    } catch (err: any) {
      setError(err.message || "Lỗi tải dữ liệu hồ sơ");;
    } finally {
      setLoading(false);
    }
  };

  const completedAppts = appointments
    .filter(a => a.status === "COMPLETED")
    .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());

  const displayedAppts = completedAppts.filter(a => {
    if (activeProfileId === "MAIN") {
      return a.patientProfileType === "SELF";
    }
    const profile = profiles.find(p => p.id === activeProfileId);
    return a.patientProfileType === "OTHER" && a.patientProfileName === profile?.fullName;
  });

  const handleDeleteProfile = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa hồ sơ này?")) return;
    try {
      await bookingProfileService.deleteProfile(id);
      setProfiles(prev => prev.filter(p => p.id !== id));
      if (activeProfileId === id) setActiveProfileId("MAIN");
    } catch (err: any) {
      alert("Lỗi khi xóa hồ sơ: " + (err.message || "Unknown error"));
    }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner className="text-teal-600 w-8 h-8" /></div>;

  return (
    <div className="animate-in fade-in duration-500">
      {error && <Alert type="error" message={error} className="mb-6" />}
      
      {/* Selector Hồ sơ */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-6 hide-scrollbar">
        {/* Main Profile Card */}
        <div 
          onClick={() => setActiveProfileId("MAIN")}
          className={`flex-shrink-0 w-[300px] rounded-2xl p-5 cursor-pointer transition-all border-2 relative overflow-hidden ${
            activeProfileId === "MAIN" 
              ? "border-teal-500 bg-teal-50 shadow-md shadow-teal-500/10" 
              : "border-slate-200 bg-white hover:border-teal-300"
          }`}
        >
          <div className="absolute top-0 right-0 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">Hồ sơ chính</div>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeProfileId === "MAIN" ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-500"}`}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">{user?.fullName || "Chưa cập nhật tên"}</h4>
              <p className="text-sm text-slate-500">Bản thân</p>
            </div>
          </div>
        </div>

        {/* Relative Profiles */}
        {profiles.map(p => (
          <div 
            key={p.id}
            onClick={() => setActiveProfileId(p.id)}
            className={`flex-shrink-0 w-[300px] rounded-2xl p-5 cursor-pointer transition-all border-2 relative overflow-hidden group ${
              activeProfileId === p.id 
                ? "border-teal-500 bg-teal-50 shadow-md shadow-teal-500/10" 
                : "border-slate-200 bg-white hover:border-teal-300"
            }`}
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); /* TODO: Edit */ }}
                className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-teal-600 hover:border-teal-600"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteProfile(p.id); }}
                className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-rose-500 hover:text-rose-600 hover:border-rose-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeProfileId === p.id ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{p.fullName}</h4>
                <p className="text-sm text-slate-500">{p.relationship}</p>
              </div>
            </div>
          </div>
        ))}

        {profiles.length < 3 && (
          <div 
            onClick={() => { /* TODO: Open add relative modal */ }}
            className="flex-shrink-0 w-[300px] rounded-2xl p-5 cursor-pointer transition-all border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-teal-50 hover:border-teal-400 hover:text-teal-600 flex flex-col items-center justify-center gap-2 text-slate-500"
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">Thêm hồ sơ người thân ({profiles.length}/3)</span>
          </div>
        )}
      </div>

      {/* Lịch sử khám */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-teal-600" />
          Lịch Sử Khám Bệnh ({displayedAppts.length})
        </h3>
        
        {displayedAppts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
            <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Chưa có lịch sử khám bệnh nào.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedAppts.map(appt => (
              <div key={appt.id} className="flex flex-col md:flex-row items-center justify-between p-4 md:p-5 rounded-xl border border-slate-100 bg-white hover:border-teal-100 hover:shadow-sm transition-all gap-4">
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="w-12 h-12 rounded-full bg-teal-50 flex flex-col items-center justify-center text-teal-700 shrink-0">
                    <span className="text-xs font-semibold">{new Date(appt.appointmentDate).getDate()}</span>
                    <span className="text-[10px]">Thg {new Date(appt.appointmentDate).getMonth() + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">
                      Bác sĩ {appt.doctor?.name || "N/A"}
                    </h4>
                    <p className="text-sm text-slate-500">
                      Chuyên khoa: {appt.doctor?.specialty?.name || "N/A"}
                    </p>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full md:w-auto flex items-center justify-center gap-2 text-teal-600 border-teal-200 hover:bg-teal-50"
                  onClick={() => { /* TODO: Open medical record modal */ }}
                >
                  <Eye className="w-4 h-4" />
                  Xem bệnh án
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
