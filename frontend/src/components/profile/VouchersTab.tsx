"use client";

import React, { useEffect, useState } from "react";
import { voucherService, Voucher } from "@/services/voucher.service";
import { Ticket, Search, Clock } from "lucide-react";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";

export default function VouchersTab() {
  const [savedVouchers, setSavedVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveCode, setSaveCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await voucherService.getSavedVouchers();
      setSavedVouchers(res.saved || []);
    } catch (err: any) {
      setError(err.message || "Lỗi tải voucher");;
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveCode.trim()) return;
    
    setSaving(true);
    setError("");
    try {
      await voucherService.saveVoucher(saveCode.trim());
      setSaveCode("");
      fetchVouchers();
      alert("Lưu voucher thành công!");
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu voucher");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner className="text-teal-600 w-8 h-8" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-teal-600" />
            Voucher Đã Lưu
          </h3>
          <p className="text-sm text-slate-500 mt-1">Lưu trữ các mã giảm giá để sử dụng khi đặt khám.</p>
        </div>
        
        <form onSubmit={handleSave} className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Nhập mã voucher..." 
            value={saveCode}
            onChange={(e) => setSaveCode(e.target.value)}
            className="flex-1 md:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 uppercase"
          />
          <Button type="submit" isLoading={saving} className="whitespace-nowrap px-6">
            Lưu
          </Button>
        </form>
      </div>

      {error && <Alert type="error" message={error} className="mb-6" />}

      {savedVouchers.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
          <Ticket className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Bạn chưa lưu voucher nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedVouchers.map(v => (
            <div key={v.id} className="relative bg-white border border-teal-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-teal-300 transition-all">
              {/* Decorative zigzag edge */}
              <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-slate-50 rotate-45 -ml-1 mt-1"></div>
                ))}
              </div>
              
              <div className="p-5 pl-6 border-l-[6px] border-l-teal-500 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-teal-50 text-teal-700 font-bold px-3 py-1 rounded-md text-sm border border-teal-100 uppercase tracking-wider">
                      {v.code}
                    </span>
                    {v.type === "PERCENT" ? (
                      <span className="text-xl font-black text-rose-600">-{v.discountValue}%</span>
                    ) : (
                      <span className="text-xl font-black text-rose-600">-{v.discountValue.toLocaleString()}đ</span>
                    )}
                  </div>
                  
                  <p className="text-sm font-medium text-slate-700 mt-3">
                    {v.applyTo === "ALL" ? "Áp dụng cho mọi dịch vụ" : v.applyTo === "SPECIALTY" ? `Áp dụng: ${v.specialty?.name}` : "Áp dụng cho gói khám"}
                  </p>
                  
                  <p className="text-xs text-slate-500 mt-1">
                    Đơn tối thiểu: {v.minDepositAmount.toLocaleString()}đ
                  </p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-100 border-dashed flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    HSD: {new Date(v.endDate).toLocaleDateString('vi-VN')}
                  </div>
                  {(v.maxUses && v.usedCount >= v.maxUses) ? (
                    <span className="text-rose-500 font-medium">Hết lượt</span>
                  ) : (
                    <span className="text-teal-600 font-medium cursor-pointer hover:underline">Sử dụng</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
