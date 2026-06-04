"use client";

import React, { useEffect, useState } from "react";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import toast from "react-hot-toast";
import { Trash2, PlusCircle, Clock, CalendarDays, Zap } from "lucide-react";

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const daysOfWeek = [
  { value: 1, label: "Thứ Hai" },
  { value: 2, label: "Thứ Ba" },
  { value: 3, label: "Thứ Tư" },
  { value: 4, label: "Thứ Năm" },
  { value: 5, label: "Thứ Sáu" },
  { value: 6, label: "Thứ Bảy" },
  { value: 0, label: "Chủ Nhật" },
];

const timeToMinutes = (t: string): number => {
  const parts = t.split(":");
  const hh = parseInt(parts[0] ?? "0", 10);
  const mm = parseInt(parts[1] ?? "0", 10);
  return hh * 60 + mm;
};

export default function DoctorSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: 1, startTime: "08:00", endTime: "12:00", isAvailable: true
  });
  const [adding, setAdding] = useState(false);

  const fetchSchedules = async () => {
    try {
      const res = await api.get("/doctor/schedules");
      setSchedules(res.data);
    } catch (err) {
      setError("Không thể tải lịch trực.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const selectPreset = (start: string, end: string) => {
    setNewSchedule(prev => ({ ...prev, startTime: start, endTime: end }));
    toast.success(`Đã chọn nhanh khung giờ: ${start} - ${end}`);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate client side
    const startMin = timeToMinutes(newSchedule.startTime);
    const endMin = timeToMinutes(newSchedule.endTime);
    if (startMin >= endMin) {
      toast.error("Giờ bắt đầu phải trước giờ kết thúc.");
      return;
    }

    setAdding(true);
    try {
      await api.post("/doctor/schedules", newSchedule);
      toast.success("Thêm lịch thành công");
      fetchSchedules();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Thêm lịch thất bại";
      toast.error(errMsg);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa khung giờ này?")) return;
    try {
      await api.delete(`/doctor/schedules/${id}`);
      toast.success("Xóa lịch thành công");
      fetchSchedules();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Xóa lịch thất bại";
      toast.error(errMsg);
    }
  };

  const groupedSchedules = schedules.reduce((acc, sch) => {
    if (!acc[sch.dayOfWeek]) acc[sch.dayOfWeek] = [];
    acc[sch.dayOfWeek].push(sch);
    return acc;
  }, {} as Record<number, Schedule[]>);

  // Sort slots inside day groups by start time
  Object.keys(groupedSchedules).forEach(key => {
    groupedSchedules[Number(key)].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  });

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner className="w-8 h-8 text-teal-600" /></div>;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
          <CalendarDays className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý lịch làm việc</h2>
          <p className="text-slate-500 text-sm">Thiết lập các khung giờ rảnh để bệnh nhân có thể đặt lịch khám trực tuyến.</p>
        </div>
      </div>

      {/* Add Schedule Form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100/80 transition-all hover:shadow-md">
        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-teal-600" /> Thiết lập khung giờ trực mới
        </h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4">
            <div className="w-full space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Thứ trong tuần</label>
              <select
                value={newSchedule.dayOfWeek}
                onChange={(e) => setNewSchedule({ ...newSchedule, dayOfWeek: Number(e.target.value) })}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-teal-500 focus:bg-white transition-all text-sm font-medium text-slate-700"
              >
                {daysOfWeek.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="w-full">
              <Input
                label="Giờ bắt đầu"
                id="startTime"
                type="time"
                value={newSchedule.startTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                required
              />
            </div>
            <div className="w-full">
              <Input
                label="Giờ kết thúc"
                id="endTime"
                type="time"
                value={newSchedule.endTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-50">
            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Chọn nhanh ca trực:
              </span>
              <button
                type="button"
                onClick={() => selectPreset("08:00", "12:00")}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-100 hover:border-teal-200 transition-all"
              >
                Ca Sáng (08:00 - 12:00)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("13:30", "17:30")}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-100 hover:border-teal-200 transition-all"
              >
                Ca Chiều (13:30 - 17:30)
              </button>
              <button
                type="button"
                onClick={() => selectPreset("08:00", "17:00")}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-100 hover:border-teal-200 transition-all"
              >
                Cả Ngày (08:00 - 17:00)
              </button>
            </div>

            <Button type="submit" variant="teal" isLoading={adding} className="h-11 px-8 rounded-xl font-bold self-end whitespace-nowrap shadow-sm shadow-teal-600/10">
              Thêm Khung Giờ
            </Button>
          </div>
        </form>
      </div>

      {/* Schedules List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {daysOfWeek.map(day => {
          const slots = groupedSchedules[day.value] || [];
          if (slots.length === 0) return null;
          
          return (
            <div key={day.value} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-slate-200/60">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-slate-800 text-base">
                  {day.label}
                </h3>
                <span className="px-2.5 py-1 text-xs font-bold bg-teal-50 text-teal-700 rounded-lg">
                  {slots.length} ca trực
                </span>
              </div>
              <div className="space-y-3">
                {slots.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/80 hover:border-teal-200 hover:bg-teal-50/20 transition-all group">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                      <Clock className="w-4 h-4 text-teal-600" />
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-80 group-hover:opacity-100"
                      title="Xóa khung giờ trực này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(groupedSchedules).length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 border-dashed">
          <Clock className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h4 className="font-bold text-slate-700 mb-1">Chưa thiết lập lịch trực</h4>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">Vui lòng thiết lập ít nhất một khung giờ rảnh ở form trên để bệnh nhân có thể thấy và đặt lịch hẹn.</p>
        </div>
      )}
    </div>
  );
}
