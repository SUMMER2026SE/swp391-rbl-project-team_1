import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, MessageSquare, Plus, RefreshCw, X } from "lucide-react";

interface Complaint {
    id: string;
    type: "SYSTEM" | "SERVICE";
    subject?: string;
    message: string;
    status: "PENDING" | "RESOLVED" | "REJECTED";
    adminResponse?: string;
    createdAt: string;
    appointment?: any;
}

export default function SupportTab() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ subject: "", message: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/complaints", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setComplaints(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!formData.subject || !formData.message) {
            setError("Vui lòng điền đầy đủ tiêu đề và nội dung.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("http://localhost:5000/api/complaints", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    type: "SYSTEM",
                    subject: formData.subject,
                    message: formData.message,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Gửi khiếu nại thất bại");
            }

            setSuccess("Gửi khiếu nại thành công! Chúng tôi sẽ phản hồi sớm nhất.");
            setFormData({ subject: "", message: "" });
            setShowForm(false);
            fetchComplaints();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-teal-600" /> Trung tâm hỗ trợ
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Gửi báo cáo lỗi app, sự cố thanh toán hoặc góp ý hệ thống
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Tạo phiếu hỗ trợ
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-700">Tạo phiếu hỗ trợ mới</h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-rose-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {error && (
                        <div className="bg-rose-50 text-rose-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Chủ đề <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="VD: Báo lỗi không thanh toán được bằng ZaloPay"
                                className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả chi tiết <span className="text-rose-500">*</span></label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Mô tả rõ vấn đề bạn đang gặp phải..."
                                rows={4}
                                className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                            ></textarea>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                                Gửi yêu cầu
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div>
                <h3 className="font-bold text-slate-800 mb-4">Lịch sử phiếu hỗ trợ</h3>
                {loading ? (
                    <div className="flex justify-center py-10">
                        <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
                    </div>
                ) : complaints.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                        Bạn chưa có yêu cầu hỗ trợ nào.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {complaints.map((c) => (
                            <div key={c.id} className="border border-slate-200 rounded-2xl p-5 hover:border-teal-300 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                                                c.type === 'SYSTEM' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                                {c.type === 'SYSTEM' ? 'HỆ THỐNG' : 'DỊCH VỤ KHÁM'}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide ${
                                                c.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-rose-100 text-rose-700'
                                            }`}>
                                                {c.status === 'PENDING' ? 'ĐANG CHỜ XỬ LÝ' :
                                                 c.status === 'RESOLVED' ? 'ĐÃ XỬ LÝ' : 'TỪ CHỐI'}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-800">{c.subject || "Phản hồi/Khiếu nại"}</h4>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                                    "{c.message}"
                                </p>
                                {c.adminResponse && (
                                    <div className="mt-3 bg-teal-50 border border-teal-100 p-4 rounded-xl relative">
                                        <div className="absolute top-0 left-4 -mt-2 bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            Admin phản hồi
                                        </div>
                                        <p className="text-sm text-slate-700">{c.adminResponse}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
