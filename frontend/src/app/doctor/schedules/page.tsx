"use client";

import React, { useEffect, useState } from "react";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import toast from "react-hot-toast";
import { Trash2, PlusCircle, Clock } from "lucide-react";

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/doctor/schedules", newSchedule);
      toast.success("Thêm lịch thành công");
      fetchSchedules();
    } catch (err) {
      toast.error("Thêm lịch thất bại");
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
    } catch (err) {
      toast.error("Xóa lịch thất bại");
    }
  };

  const groupedSchedules = schedules.reduce((acc, sch) => {
    if (!acc[sch.dayOfWeek]) acc[sch.dayOfWeek] = [];
    acc[sch.dayOfWeek].push(sch);
    return acc;
  }, {} as Record<number, Schedule[]>);

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner className="w-8 h-8 text-teal-600" /></div>;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Quản lý lịch khám</h2>
        <p className="text-slate-500">Thiết lập các khung giờ rảnh để bệnh nhân có thể đặt lịch.</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-teal-500" /> Thêm khung giờ mới
        </h3>
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full space-y-1">
            <label className="block text-sm font-semibold text-slate-700">Thứ trong tuần</label>
            <select
              value={newSchedule.dayOfWeek}
              onChange={(e) => setNewSchedule({ ...newSchedule, dayOfWeek: Number(e.target.value) })}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-teal-500 transition-all text-sm"
            >
              {daysOfWeek.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="w-full md:w-32">
            <Input
              label="Giờ bắt đầu"
              id="startTime"
              type="time"
              value={newSchedule.startTime}
              onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
              required
            />
          </div>
          <div className="w-full md:w-32">
            <Input
              label="Giờ kết thúc"
              id="endTime"
              type="time"
              value={newSchedule.endTime}
              onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
              required
            />
          </div>
          <Button type="submit" variant="teal" isLoading={adding} className="h-11 px-6 rounded-xl whitespace-nowrap">
            Thêm lịch
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {daysOfWeek.map(day => {
          const slots = groupedSchedules[day.value] || [];
          if (slots.length === 0) return null;
          
          return (
            <div key={day.value} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
                {day.label}
              </h3>
              <div className="space-y-3">
                {slots.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-100 transition-colors">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Clock className="w-4 h-4 text-teal-500" />
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
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
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 border-dashed">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Chưa có lịch trực nào được thiết lập.</p>
        </div>
      )}
    </div>
  );
}
