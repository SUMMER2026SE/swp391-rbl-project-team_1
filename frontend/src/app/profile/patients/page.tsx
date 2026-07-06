"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { patientProfileService, PatientProfile } from "@/services/patient-profile.service";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import { Plus, Edit2, Trash2, UserCircle2, User as UserIcon } from "lucide-react";

export default function PatientsPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PatientProfile>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const data = await patientProfileService.getMyProfiles();
      setProfiles(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (profile?: PatientProfile) => {
    if (profile) {
      setEditingId(profile.id);
      setFormData(profile);
    } else {
      setEditingId(null);
      setFormData({ isPrimary: profiles.length === 0 });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName) {
      alert("Vui lòng nhập họ tên.");
      return;
    }
    
    try {
      setSubmitting(true);
      if (editingId) {
        await patientProfileService.updateProfile(editingId, formData);
      } else {
        await patientProfileService.createProfile(formData);
      }
      handleCloseForm();
      fetchProfiles();
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi lưu hồ sơ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa hồ sơ này?")) return;
    try {
      await patientProfileService.deleteProfile(id);
      fetchProfiles();
    } catch (err: any) {
      alert(err.message || "Không thể xóa hồ sơ này.");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-teal-600" />
          Hồ sơ người khám
        </h1>
        <Button onClick={() => handleOpenForm()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm hồ sơ mới
        </Button>
      </div>

      {error && <Alert type="error" message={error} className="mb-6" />}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingId ? "Sửa hồ sơ" : "Thêm hồ sơ mới"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Họ và tên *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.fullName || ""}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                  <input 
                    type="tel" 
                    value={formData.phoneNumber || ""}
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày sinh</label>
                  <input 
                    type="date" 
                    value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ""}
                    onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giới tính</label>
                  <select 
                    value={formData.gender || ""}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                    className="w-full border p-2 rounded-lg"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="NAM">Nam</option>
                    <option value="NỮ">Nữ</option>
                    <option value="KHÁC">Khác</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">CCCD / CMND</label>
                  <input 
                    type="text" 
                    value={formData.cccd || ""}
                    onChange={e => setFormData({...formData, cccd: e.target.value})}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t mt-4">
                <h3 className="font-semibold mb-3">Thông tin y tế (Tùy chọn)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nhóm máu</label>
                    <input 
                      type="text" 
                      value={formData.bloodType || ""}
                      onChange={e => setFormData({...formData, bloodType: e.target.value})}
                      className="w-full border p-2 rounded-lg"
                      placeholder="A+, O-..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dị ứng</label>
                    <input 
                      type="text" 
                      value={formData.allergies || ""}
                      onChange={e => setFormData({...formData, allergies: e.target.value})}
                      className="w-full border p-2 rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Tiền sử bệnh lý</label>
                    <textarea 
                      value={formData.personalHistory || ""}
                      onChange={e => setFormData({...formData, personalHistory: e.target.value})}
                      className="w-full border p-2 rounded-lg"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center mt-4">
                <input 
                  type="checkbox" 
                  id="isPrimary"
                  checked={formData.isPrimary || false}
                  onChange={e => setFormData({...formData, isPrimary: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="isPrimary" className="text-sm font-medium cursor-pointer">
                  Đặt làm hồ sơ mặc định
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={handleCloseForm}>Hủy</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Đang lưu..." : "Lưu hồ sơ"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
          <UserCircle2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Bạn chưa có hồ sơ khám bệnh nào.</p>
          <Button onClick={() => handleOpenForm()}>Tạo hồ sơ đầu tiên</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map(profile => (
            <div key={profile.id} className={`p-5 rounded-xl border ${profile.isPrimary ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{profile.fullName}</h3>
                  {profile.isPrimary && (
                    <span className="bg-teal-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      Mặc định
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenForm(profile)} className="text-slate-400 hover:text-blue-500 transition">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!profile.isPrimary && (
                    <button onClick={() => handleDelete(profile.id)} className="text-slate-400 hover:text-red-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">SĐT: {profile.phoneNumber || "Chưa cập nhật"}</p>
              <p className="text-sm text-slate-600 mb-1">Giới tính: {profile.gender || "Chưa cập nhật"}</p>
              <p className="text-sm text-slate-600">CCCD: {profile.cccd || "Chưa cập nhật"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
