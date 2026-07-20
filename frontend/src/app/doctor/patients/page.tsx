"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "@/services/api";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Users, Search, FileText, ChevronRight, Calendar,
  Stethoscope, Pill, Activity, AlertCircle, Clock
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/doctor/patients");
        setPatients(res.data.patients || res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        p.fullName?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phoneNumber?.includes(q)
    );
  }, [patients, search]);

  const handleSelectPatient = async (patient: any) => {
    setSelectedPatient(patient);
    setRecords([]);
    setExpandedRecord(null);
    setLoadingRecords(true);
    try {
      const res = await api.get(`/doctor/patients/${patient.id}/records`);
      setRecords(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecords(false);
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Bệnh án bệnh nhân</h2>
        <p className="text-slate-500 mt-1">Xem lại lịch sử bệnh án của từng bệnh nhân đã khám.</p>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* Left — Patient list */}
        <div className="w-72 shrink-0 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bệnh nhân..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-slate-50"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loadingPatients ? (
              <div className="flex justify-center p-8">
                <LoadingSpinner className="w-6 h-6 text-teal-600" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center p-8 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Không có bệnh nhân</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left ${
                    selectedPatient?.id === patient.id ? "bg-teal-50 border-l-4 border-l-teal-500" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-teal-100 overflow-hidden shrink-0">
                    {patient.avatar ? (
                      <img src={patient.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-teal-700 font-bold text-base">
                        {patient.fullName?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{patient.fullName || "Bệnh nhân"}</p>
                    <p className="text-xs text-slate-400 truncate">{patient.email}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 ml-auto" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right — Records */}
        <div className="flex-1 min-w-0">
          {!selectedPatient ? (
            <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Users className="w-16 h-16 text-slate-200" />
              <p className="font-medium">Chọn một bệnh nhân để xem bệnh án</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
              {/* Patient header */}
              <div className="p-5 border-b border-slate-100 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-100 overflow-hidden shrink-0">
                  {selectedPatient.avatar ? (
                    <img src={selectedPatient.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-teal-700 font-bold text-xl">
                      {selectedPatient.fullName?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{selectedPatient.fullName}</h3>
                  <p className="text-sm text-slate-500">{selectedPatient.email}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    {selectedPatient.gender && <span>{selectedPatient.gender}</span>}
                    {selectedPatient.dateOfBirth && (
                      <span>
                        {new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()} tuổi
                      </span>
                    )}
                    {selectedPatient.bloodType && (
                      <span className="text-red-600 font-semibold">Nhóm máu: {selectedPatient.bloodType}</span>
                    )}
                  </div>
                </div>
                <div className="ml-auto">
                  <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-xl">
                    {records.length} bệnh án
                  </span>
                </div>
              </div>

              {/* Allergy / Chronic diseases warning */}
              {(selectedPatient.allergies || selectedPatient.chronicDiseases) && (
                <div className="mx-5 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    {selectedPatient.allergies && <p><span className="font-bold">Dị ứng:</span> {selectedPatient.allergies}</p>}
                    {selectedPatient.chronicDiseases && <p className="mt-0.5"><span className="font-bold">Bệnh nền:</span> {selectedPatient.chronicDiseases}</p>}
                  </div>
                </div>
              )}

              {/* Records list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {loadingRecords ? (
                  <div className="flex justify-center p-8">
                    <LoadingSpinner className="w-6 h-6 text-teal-600" />
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-slate-200" />
                    <p className="text-sm">Chưa có bệnh án nào được lưu</p>
                  </div>
                ) : (
                  records.map((record) => {
                    const isExpanded = expandedRecord === record.id;
                    const apptDate = new Date(record.appointment?.appointmentDate);

                    return (
                      <div
                        key={record.id}
                        className="border border-slate-100 rounded-xl overflow-hidden hover:border-teal-100 transition-colors"
                      >
                        {/* Record summary row */}
                        <div
                          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50"
                          onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                        >
                          <div className="w-10 h-10 rounded-xl bg-teal-50 flex flex-col items-center justify-center text-teal-700 shrink-0">
                            <span className="text-xs font-bold">{apptDate.getDate()}</span>
                            <span className="text-[9px]">T{apptDate.getMonth() + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm">
                              {record.finalDiagnosis || record.preliminaryDiagnosis || "Chẩn đoán chưa ghi rõ"}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {format(apptDate, "dd/MM/yyyy HH:mm", { locale: vi })}
                              {record.icd10Code && (
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                  {record.icd10Code}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {record.prescriptions?.length > 0 && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Pill className="w-2.5 h-2.5" /> {record.prescriptions.length} thuốc
                              </span>
                            )}
                            <Link
                              href={`/doctor/examination/${record.appointmentId}?viewOnly=true`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] bg-teal-50 text-teal-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-teal-100 transition-colors flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" /> Xem
                            </Link>
                            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 p-4 bg-slate-50 grid sm:grid-cols-2 gap-3">
                            {record.symptoms && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Triệu chứng</p>
                                <p className="text-sm text-slate-700">{record.symptoms}</p>
                              </div>
                            )}
                            {record.treatmentPlan && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Điều trị</p>
                                <p className="text-sm text-slate-700">{record.treatmentPlan}</p>
                              </div>
                            )}
                            {record.doctorNotes && (
                              <div className="sm:col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lời dặn</p>
                                <p className="text-sm text-slate-700">{record.doctorNotes}</p>
                              </div>
                            )}
                            {record.followUpDate && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tái khám</p>
                                <p className="text-sm text-teal-700 font-semibold">
                                  {new Date(record.followUpDate).toLocaleDateString("vi-VN")}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
