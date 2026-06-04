"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import { HeartPulse, CheckCircle2, AlertCircle, X } from "lucide-react";
import toast from "react-hot-toast";

interface OnboardingSurveyModalProps {
    onClose: () => void;
}

export default function OnboardingSurveyModal({ onClose }: OnboardingSurveyModalProps) {
    const { user, updateUser } = useAuth();

    // Form fields
    const [bloodType, setBloodType] = useState("");
    const [allergies, setAllergies] = useState("");
    const [chronicDiseases, setChronicDiseases] = useState("");
    const [personalHistory, setPersonalHistory] = useState("");
    const [familyHistory, setFamilyHistory] = useState("");

    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await api.put("/users/profile", {
                bloodType: bloodType || "Không rõ",
                allergies: allergies.trim() || "Không có",
                chronicDiseases: chronicDiseases.trim() || "Không có",
                personalHistory: personalHistory.trim() || "Không có",
                familyHistory: familyHistory.trim() || "Không có"
            });

            // Update user in local storage & Auth context
            if (res.data && res.data.data) {
                updateUser(res.data.data);
            }

            toast.success("Cập nhật hồ sơ sức khỏe ban đầu thành công!");
            onClose();
        } catch (err: any) {
            console.error("Failed to save survey:", err);
            toast.error(err.response?.data?.message || "Lưu thông tin thất bại. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = () => {
        // Set sessionStorage so we don't prompt them again in this session
        sessionStorage.setItem("skipped_health_survey", "true");
        toast("Bạn đã bỏ qua khảo sát. Có thể điền lại sau trong trang cá nhân.", { icon: "ℹ️" });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 py-8 md:py-12">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row animate-fade-in max-h-[85vh] my-auto">

                {/* Left panel - Decorative */}
                <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white p-6 md:p-10 flex flex-col justify-between md:w-[240px] shrink-0">
                    <div className="space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-teal-200">
                            <HeartPulse className="w-6 h-6 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold leading-tight">Khảo Sát Sức Khỏe Ban Đầu</h3>
                        <p className="text-xs text-teal-100/80 leading-relaxed">
                            Cung cấp các thông tin sức khỏe cơ bản giúp các Bác sĩ của MedBooking chuẩn bị chẩn đoán y tế và kê đơn thuốc chính xác, nhanh chóng hơn khi bạn tư vấn trực tuyến.
                        </p>
                    </div>

                    <div className="text-[10px] text-teal-200/50 mt-8 md:mt-0">
                        Thông tin của bạn được bảo mật tuyệt đối theo tiêu chuẩn y khoa.
                    </div>
                </div>

                {/* Right panel - Form */}
                <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto max-h-[calc(85vh-300px)] md:max-h-[85vh]">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h4 className="text-lg font-bold text-slate-800">Thông tin y tế nền</h4>
                            <p className="text-xs text-slate-500">Vui lòng hoàn thành các thông tin sức khỏe dưới đây.</p>
                        </div>
                        <button
                            onClick={handleSkip}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                        {/* Nhóm máu */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Nhóm máu</label>
                            <select
                                value={bloodType}
                                onChange={(e) => setBloodType(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-xs bg-slate-50 text-slate-700"
                            >
                                <option value="">-- Chọn nhóm máu --</option>
                                <option value="A">Nhóm máu A</option>
                                <option value="B">Nhóm máu B</option>
                                <option value="O">Nhóm máu O</option>
                                <option value="AB">Nhóm máu AB</option>
                                <option value="Không rõ">Chưa xác định / Không rõ</option>
                            </select>
                        </div>

                        {/* Dị ứng */}
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold text-slate-600 uppercase">Tiền sử dị ứng</label>
                                <span className="text-[10px] text-slate-400 font-medium">VD: Penicillin, hải sản, phấn hoa...</span>
                            </div>
                            <input
                                type="text"
                                value={allergies}
                                onChange={(e) => setAllergies(e.target.value)}
                                placeholder="Ghi chú chi tiết hoặc ghi 'Không có'"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-xs text-slate-700"
                            />
                        </div>

                        {/* Bệnh mãn tính */}
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold text-slate-600 uppercase">Bệnh lý nền / Mãn tính</label>
                                <span className="text-[10px] text-slate-400 font-medium">VD: Tiểu đường, Cao huyết áp...</span>
                            </div>
                            <input
                                type="text"
                                value={chronicDiseases}
                                onChange={(e) => setChronicDiseases(e.target.value)}
                                placeholder="Tình trạng bệnh hiện tại hoặc ghi 'Không có'"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-xs text-slate-700"
                            />
                        </div>

                        {/* Tiền sử bản thân */}
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold text-slate-600 uppercase">Tiền sử phẫu thuật / Chấn thương</label>
                                <span className="text-[10px] text-slate-400 font-medium">VD: Mổ ruột thừa năm 2022...</span>
                            </div>
                            <textarea
                                value={personalHistory}
                                onChange={(e) => setPersonalHistory(e.target.value)}
                                placeholder="Tiền sử bệnh án của bản thân hoặc ghi 'Không có'"
                                className="w-full min-h-[60px] px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-xs text-slate-700 resize-none"
                            />
                        </div>

                        {/* Tiền sử gia đình */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Tiền sử bệnh gia đình</label>
                            <textarea
                                value={familyHistory}
                                onChange={(e) => setFamilyHistory(e.target.value)}
                                placeholder="Gia đình có ai mắc bệnh di truyền hay bệnh mãn tính nặng không?"
                                className="w-full min-h-[60px] px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-xs text-slate-700 resize-none"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            >
                                Bỏ qua
                            </button>
                            <Button
                                type="submit"
                                variant="teal"
                                disabled={submitting}
                                className="rounded-xl text-xs font-semibold px-6 py-2.5 shadow-md shadow-teal-500/10 flex items-center gap-1.5"
                            >
                                {submitting ? (
                                    <>
                                        <LoadingSpinner className="w-3.5 h-3.5 text-white" />
                                        Đang lưu thông tin...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Lưu hồ sơ sức khỏe
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
