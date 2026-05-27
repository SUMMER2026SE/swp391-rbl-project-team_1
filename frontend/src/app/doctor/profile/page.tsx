"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import toast from "react-hot-toast";

interface Specialty { id: string; name: string; }
interface Clinic { id: string; name: string; }

interface DoctorProfileData {
  name: string;
  experience: number;
  avatar: string;
  specialtyId: string;
  clinicId: string;
  price: number;
  phone: string;
  description: string;
}

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  
  const [formData, setFormData] = useState<DoctorProfileData>({
    name: "", experience: 0, avatar: "", specialtyId: "", clinicId: "", price: 0, phone: "", description: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metaRes, profileRes] = await Promise.all([
          api.get("/doctor/metadata/options"),
          api.get("/doctor/profile")
        ]);
        
        setSpecialties(metaRes.data.specialties);
        setClinics(metaRes.data.clinics);
        
        const p = profileRes.data;
        setFormData({
          name: p.name || "",
          experience: p.experience || 0,
          avatar: p.avatar || "",
          specialtyId: p.specialtyId || "",
          clinicId: p.clinicId || "",
          price: p.price || 0,
          phone: p.phone || "",
          description: p.description || ""
        });
      } catch (err: any) {
        setError("Không thể tải dữ liệu hồ sơ.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/doctor/profile", formData);
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (err) {
      toast.error("Lỗi khi cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner className="w-8 h-8 text-teal-600" /></div>;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Hồ sơ cá nhân</h2>
        <p className="text-slate-500">Cập nhật thông tin công khai của bạn để bệnh nhân có thể tìm thấy.</p>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
            <div className="w-24 h-24 rounded-full bg-teal-100 overflow-hidden ring-4 ring-teal-50">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-teal-600 text-3xl font-bold">
                  {formData.name.charAt(0) || "D"}
                </div>
              )}
            </div>
            <div className="flex-1">
              <Input
                label="URL Ảnh đại diện"
                id="avatar"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Họ và Tên (kèm học hàm/học vị)"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              label="Số điện thoại"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0912345678"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Chuyên khoa</label>
              <select
                name="specialtyId"
                value={formData.specialtyId}
                onChange={handleChange}
                required
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
              >
                <option value="">-- Chọn chuyên khoa --</option>
                {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Phòng khám / Bệnh viện</label>
              <select
                name="clinicId"
                value={formData.clinicId}
                onChange={handleChange}
                required
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
              >
                <option value="">-- Chọn phòng khám --</option>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Số năm kinh nghiệm"
              id="experience"
              name="experience"
              type="number"
              value={formData.experience}
              onChange={handleChange}
              required
            />
            <Input
              label="Giá khám (VNĐ)"
              id="price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              placeholder="Ví dụ: 300000"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">Giới thiệu chi tiết</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Quá trình công tác, kinh nghiệm chuyên môn..."
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" variant="teal" isLoading={saving} className="px-8 py-3 rounded-xl font-bold">
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
