"use client";

import React, { useEffect, useState } from "react";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Link from "next/link";
import { Search, User, FileText, ChevronRight } from "lucide-react";

interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  avatar: string;
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/doctor/patients");
        setPatients(res.data);
      } catch (err) {
        setError("Không thể tải danh sách bệnh nhân.");
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner className="w-8 h-8 text-teal-600" /></div>;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Bệnh nhân của tôi</h2>
        <p className="text-slate-500">Quản lý hồ sơ và lịch sử khám bệnh của các bệnh nhân.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Không tìm thấy bệnh nhân nào.</p>
          </div>
        ) : (
          filteredPatients.map(patient => (
            <Link href={`/doctor/patients/${patient.id}`} key={patient.id}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-teal-300 hover:shadow-md transition-all group cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xl overflow-hidden shrink-0">
                    {patient.avatar ? (
                      <img src={patient.avatar} alt={patient.fullName} className="w-full h-full object-cover" />
                    ) : (
                      patient.fullName?.charAt(0) || "U"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate group-hover:text-teal-600 transition-colors">
                      {patient.fullName}
                    </h3>
                    <p className="text-sm text-slate-500 truncate">{patient.email}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs font-medium text-slate-500">
                      <span className="bg-slate-100 px-2 py-1 rounded-md">{patient.gender || "N/A"}</span>
                      <span>Sinh năm: {patient.dateOfBirth ? new Date(patient.dateOfBirth).getFullYear() : "N/A"}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-teal-600 text-sm font-semibold">
                  <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> Xem hồ sơ</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
