"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import userService from "@/services/user.service";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AddressInput from "@/components/common/AddressInput";
import { User, Activity, MapPin, Calendar, Mail, Shield, Camera } from "lucide-react";

export default function PersonalInfoTab() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [street, setStreet] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [chronicDiseases, setChronicDiseases] = useState("");
  const [personalHistory, setPersonalHistory] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");

  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [infoSuccess, setInfoSuccess] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setGender(user.gender || "");
      setProvince(user.province || "");
      setDistrict(user.district || "");
      setWard(user.ward || "");
      setStreet(user.street || "");
      if (user.dateOfBirth) {
        const d = new Date(user.dateOfBirth);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setDateOfBirth(`${yyyy}-${mm}-${dd}`);
      }
      setBloodType(user.bloodType || "");
      setAllergies(user.allergies || "");
      setChronicDiseases(user.chronicDiseases || "");
      setPersonalHistory(user.personalHistory || "");
      setFamilyHistory(user.familyHistory || "");
    }
  }, [user]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoError("");
    setInfoSuccess("");
    setIsUpdatingInfo(true);

    try {
      const response = await userService.updateProfile({
        fullName: fullName || null,
        gender: gender || null,
        province: province || null,
        district: district || null,
        ward: ward || null,
        street: street || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        bloodType: bloodType || null,
        allergies: allergies || null,
        chronicDiseases: chronicDiseases || null,
        personalHistory: personalHistory || null,
        familyHistory: familyHistory || null,
      });
      updateUser(response.data);
      setInfoSuccess("Cập nhật thông tin thành công!");
      setTimeout(() => setInfoSuccess(""), 3000);
    } catch (err: any) {
      setInfoError(err.message || "Đã xảy ra lỗi khi cập nhật.");
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Kích thước ảnh không được vượt quá 2MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setAvatarError("Chỉ chấp nhận định dạng ảnh.");
      return;
    }

    try {
      setIsUploading(true);
      setAvatarError("");
      const res = await userService.uploadAvatar(file);
      updateUser(res.data);
      setAvatarSuccess("Cập nhật ảnh đại diện thành công!");
      setTimeout(() => setAvatarSuccess(""), 3000);
    } catch (err: any) {
      setAvatarError(err.message || "Lỗi khi tải ảnh lên.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-in fade-in duration-500">
      
      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-slate-100">
        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center transition-transform group-hover:scale-105">
            {isUploading ? (
              <LoadingSpinner className="text-teal-600 w-8 h-8" />
            ) : user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-slate-300" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-white border border-slate-200 p-1.5 rounded-full shadow-sm text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-4 h-4" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileChange}
          />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">Ảnh đại diện</h3>
          <p className="text-slate-500 text-sm mb-2">Ảnh vuông, định dạng PNG, JPG, tối đa 2MB.</p>
          {avatarError && <p className="text-rose-500 text-sm">{avatarError}</p>}
          {avatarSuccess && <p className="text-teal-600 text-sm">{avatarSuccess}</p>}
        </div>
      </div>

      {infoError && <Alert type="error" message={infoError} className="mb-6" />}
      {infoSuccess && <Alert type="success" message={infoSuccess} className="mb-6" />}

      <form onSubmit={handleUpdateInfo} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <Input
              label="Họ và tên"
              placeholder="Nhập họ tên của bạn"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Giới tính</label>
            <div className="relative">
              <select
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Chưa xác định</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
              <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div className="relative">
            <Input
              label="Ngày sinh"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          <div className="relative">
            <Input
              label="Email"
              type="email"
              value={user.email}
              disabled
              className="bg-slate-50 cursor-not-allowed text-slate-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Địa chỉ hiện tại</label>
          <AddressInput
            value={`${street ? street + ", " : ""}${ward ? ward + ", " : ""}${district ? district + ", " : ""}${province || ""}`.replace(/(^, )|(, $)/g, "")}
            onChange={(val) => {}}
            onAddressChange={(parts) => {
              setProvince(parts.province);
              setDistrict(parts.district);
              setWard(parts.ward);
              setStreet(parts.street);
            }}
            existingAddress={user.address || ""}
          />
        </div>

        {/* Health Information - Patients Only */}
        {user.role === "USER" && (
          <div className="pt-8 mt-8 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-bold text-slate-800">Thông tin sức khỏe cơ bản</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Nhóm máu</label>
                <select
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                >
                  <option value="">-- Chưa chọn --</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="O">O</option>
                  <option value="AB">AB</option>
                  <option value="Không rõ">Không rõ</option>
                </select>
              </div>

              <Input
                label="Tiền sử dị ứng"
                placeholder="Ví dụ: Dị ứng penicillin, hải sản..."
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <Input
                label="Bệnh lý nền / Mãn tính"
                placeholder="Ví dụ: Tiểu đường type 2, cao huyết áp..."
                value={chronicDiseases}
                onChange={(e) => setChronicDiseases(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Tiền sử phẫu thuật / Cá nhân</label>
                <textarea
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none min-h-[100px]"
                  placeholder="Ghi chú về tiền sử bệnh lý cá nhân..."
                  value={personalHistory}
                  onChange={(e) => setPersonalHistory(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Tiền sử bệnh gia đình</label>
                <textarea
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none min-h-[100px]"
                  placeholder="Ghi chú về bệnh lý di truyền trong gia đình..."
                  value={familyHistory}
                  onChange={(e) => setFamilyHistory(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-6 flex justify-end">
          <Button 
            type="submit" 
            isLoading={isUpdatingInfo}
            className="min-w-[160px] bg-teal-600 hover:bg-teal-700 text-white"
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
