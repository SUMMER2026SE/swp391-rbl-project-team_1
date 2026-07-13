"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { patientProfileService, PatientProfile } from "@/services/patient-profile.service";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import { Plus, Edit2, Trash2, UserCircle2, User as UserIcon } from "lucide-react";

export default function PatientProfilesTab() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PatientProfile>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // === VALIDATION ===
  const validateProfileForm = (data: Partial<PatientProfile>): Record<string, string> => {
    const errors: Record<string, string> = {};

    const nameVal = (data.fullName || "").trim();
    if (!nameVal) {
      errors.fullName = "Ho va ten khong duoc de trong.";
    } else if (/[0-9!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/.test(nameVal)) {
      errors.fullName = "Ho va ten khong duoc chua so hoac ky hieu dac biet.";
    } else if (nameVal.length < 2) {
      errors.fullName = "Ho va ten phai co it nhat 2 ky tu.";
    }

    const phoneVal = (data.phoneNumber || "").trim();
    if (!phoneVal) {
      errors.phoneNumber = "So dien thoai khong duoc de trong.";
    } else if (!/^0[0-9]{9}$/.test(phoneVal)) {
      errors.phoneNumber = "So dien thoai phai co dung 10 chu so va bat dau bang 0.";
    }

    if (!data.dateOfBirth) {
      errors.dateOfBirth = "Ngay sinh khong duoc de trong.";
    } else {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 120);
      if (isNaN(dob.getTime())) errors.dateOfBirth = "Ngay sinh khong hop le.";
      else if (dob > today) errors.dateOfBirth = "Ngay sinh khong duoc la ngay tuong lai.";
      else if (dob < minDate) errors.dateOfBirth = "Ngay sinh vuot qua gioi han (120 tuoi).";
    }

    if (!data.gender) {
      errors.gender = "Vui long chon gioi tinh.";
    }

    const cccdVal = (data.cccd || "").trim();
    if (cccdVal && !/^[0-9]{9}$|^[0-9]{12}$/.test(cccdVal)) {
      errors.cccd = "CCCD/CMND phai co dung 9 hoac 12 chu so.";
    }

    return errors;
  };

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const data = await patientProfileService.getMyProfiles();
      setProfiles(data);
    } catch (err: any) {
      setError(err.message || "Khong the tai danh sach ho so.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (profile?: PatientProfile) => {
    if (profile) { setEditingId(profile.id); setFormData(profile); }
    else { setEditingId(null); setFormData({ isPrimary: profiles.length === 0 }); }
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false); setEditingId(null); setFormData({}); setFormErrors({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateProfileForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      setSubmitting(true);
      if (editingId) await patientProfileService.updateProfile(editingId, formData);
      else await patientProfileService.createProfile(formData);
      handleCloseForm();
      fetchProfiles();
    } catch (err: any) {
      alert(err.message || "Da xay ra loi khi luu ho so.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ban co chac chan muon xoa ho so nay?")) return;
    try { await patientProfileService.deleteProfile(id); fetchProfiles(); }
    catch (err: any) { alert(err.message || "Khong the xoa ho so nay."); }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  const fc = (field: string) =>
    `w-full border p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${
      formErrors[field] ? "border-red-400 focus:ring-red-200 bg-red-50/30" : "border-slate-200 focus:ring-teal-200"
    }`;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-teal-600" />
          <span>Ho so nguoi kham</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${profiles.length >= 3 ? "bg-orange-100 text-orange-600" : "bg-teal-100 text-teal-600"}`}>
            {profiles.length}/3
          </span>
        </h3>
        <Button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 py-2 px-4"
          disabled={profiles.length >= 3}
          title={profiles.length >= 3 ? "Da dat toi da 3 ho so" : ""}
        >
          <Plus className="w-4 h-4" /> Them ho so moi
        </Button>
      </div>

      {error && <Alert type="error" message={error} className="mb-6" />}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-xl font-bold mb-5">{editingId ? "Sua ho so" : "Them ho so moi"}</h2>
            <form onSubmit={handleSave} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Ho va ten */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    Ho va ten <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName || ""}
                    placeholder="Nguyen Van An"
                    onChange={e => { setFormData({...formData, fullName: e.target.value}); setFormErrors(p => ({...p, fullName: ""})); }}
                    className={fc("fullName")}
                  />
                  {formErrors.fullName && <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>}
                </div>

                {/* So dien thoai */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    So dien thoai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber || ""}
                    placeholder="0987654321"
                    maxLength={10}
                    onChange={e => { const v = e.target.value.replace(/[^0-9]/g,""); setFormData({...formData, phoneNumber: v}); setFormErrors(p => ({...p, phoneNumber: ""})); }}
                    className={fc("phoneNumber")}
                  />
                  {formErrors.phoneNumber && <p className="text-xs text-red-500 mt-1">{formErrors.phoneNumber}</p>}
                </div>

                {/* Ngay sinh */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    Ngay sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split("T")[0] : ""}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={e => { setFormData({...formData, dateOfBirth: e.target.value}); setFormErrors(p => ({...p, dateOfBirth: ""})); }}
                    className={fc("dateOfBirth")}
                  />
                  {formErrors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{formErrors.dateOfBirth}</p>}
                </div>

                {/* Gioi tinh */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    Gioi tinh <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender || ""}
                    onChange={e => { setFormData({...formData, gender: e.target.value}); setFormErrors(p => ({...p, gender: ""})); }}
                    className={fc("gender")}
                  >
                    <option value="">Chon gioi tinh</option>
                    <option value="NAM">Nam</option>
                    <option value="NU">Nu</option>
                    <option value="KHAC">Khac</option>
                  </select>
                  {formErrors.gender && <p className="text-xs text-red-500 mt-1">{formErrors.gender}</p>}
                </div>

                {/* CCCD */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1.5">CCCD / CMND</label>
                  <input
                    type="text"
                    value={formData.cccd || ""}
                    placeholder="9 hoac 12 chu so"
                    maxLength={12}
                    onChange={e => { const v = e.target.value.replace(/[^0-9]/g,""); setFormData({...formData, cccd: v}); setFormErrors(p => ({...p, cccd: ""})); }}
                    className={fc("cccd")}
                  />
                  {formErrors.cccd && <p className="text-xs text-red-500 mt-1">{formErrors.cccd}</p>}
                </div>
              </div>

              {/* Thong tin y te */}
              <div className="pt-4 border-t mt-4">
                <h3 className="font-semibold mb-3">Thong tin y te (Tuy chon)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Nhom mau</label>
                    <input type="text" value={formData.bloodType || ""} placeholder="A+, O-..."
                      onChange={e => setFormData({...formData, bloodType: e.target.value})}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Di ung</label>
                    <input type="text" value={formData.allergies || ""}
                      onChange={e => setFormData({...formData, allergies: e.target.value})}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1.5">Tien su benh ly</label>
                    <textarea value={formData.personalHistory || ""}
                      onChange={e => setFormData({...formData, personalHistory: e.target.value})}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200" rows={2} />
                  </div>
                </div>
              </div>

              <div className="flex items-center mt-4">
                <input type="checkbox" id="isPrimary" checked={formData.isPrimary || false}
                  onChange={e => setFormData({...formData, isPrimary: e.target.checked})}
                  className="mr-2 accent-teal-600 w-4 h-4" />
                <label htmlFor="isPrimary" className="text-sm font-medium cursor-pointer">Dat lam ho so mac dinh</label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={handleCloseForm}>Huy</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Dang luu..." : "Luu ho so"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
          <UserCircle2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">Ban chua co ho so kham benh nao.</p>
          <Button onClick={() => handleOpenForm()}>Tao ho so dau tien</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map(profile => (
            <div key={profile.id} className={`p-5 rounded-xl border ${profile.isPrimary ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white"}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{profile.fullName}</h3>
                  {profile.isPrimary && (
                    <span className="bg-teal-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Mac dinh</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenForm(profile)} className="text-slate-400 hover:text-blue-500 transition"><Edit2 className="w-4 h-4" /></button>
                  {!profile.isPrimary && (
                    <button onClick={() => handleDelete(profile.id)} className="text-slate-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">SDT: {profile.phoneNumber || "Chua cap nhat"}</p>
              <p className="text-sm text-slate-600 mb-1">Gioi tinh: {profile.gender || "Chua cap nhat"}</p>
              <p className="text-sm text-slate-600">CCCD: {profile.cccd || "Chua cap nhat"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
