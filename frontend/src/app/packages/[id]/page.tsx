"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { packageService, MedicalPackage } from "@/services/package.service";
import { voucherService } from "@/services/voucher.service";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { MapPin, ArrowRight, Clock, CheckCircle2, Info, AlertTriangle, ShieldAlert, Check, Tag } from "lucide-react";
import Link from "next/link";

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  const [pkg, setPkg] = useState<MedicalPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Voucher preview state
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [voucherResult, setVoucherResult] = useState<{
    valid: boolean;
    discountAmount?: number;
    finalDeposit?: number;
    voucher?: any;
    message?: string;
  } | null>(null);

  useEffect(() => {
    async function fetchPackage() {
      try {
        setLoading(true);
        const data = await packageService.getPackageById(id);
        setPkg(data);
      } catch (err) {
        console.error("Failed to load package:", err);
        setError("Không thể tải thông tin gói khám. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchPackage();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 space-y-4">
        <Alert
          type="error"
          message={error || "Không tìm thấy gói khám."}
        />
        <div className="flex justify-center mt-4">
            <Link href="/packages" className="text-[#017a86] font-medium hover:underline flex items-center gap-2">
                Quay lại danh sách
            </Link>
        </div>
      </div>
    );
  }

  // Calculate deposit
  const defaultDepositAmount = Math.round((pkg.price * (pkg.depositPercentage || 100)) / 100);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      setVoucherLoading(true);
      setVoucherError("");
      const result = await voucherService.validateVoucher(voucherCode.trim(), defaultDepositAmount, undefined, pkg.id); // packageId passed
      if (result.valid) {
        setVoucherResult(result);
      } else {
        setVoucherError(result.message);
        setVoucherResult(null);
      }
    } catch (err: any) {
      setVoucherError(err.message || "Lỗi khi áp dụng mã");
      setVoucherResult(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const currentDeposit = voucherResult?.finalDeposit ?? defaultDepositAmount;
  const bookingFee = 5000;

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-teal-50 to-teal-100 py-12 border-b border-teal-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="space-y-4">
                {pkg.isRecommended && (
                  <span className="inline-block bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide border border-orange-200">
                    🔥 Gói Khám Nổi Bật
                  </span>
                )}
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#017a86] leading-tight">
                    {pkg.name}
                </h1>
                <div className="flex items-center gap-4 text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-5 h-5 text-teal-600" />
                    {pkg.hospital}
                  </div>
                  <div className="flex items-center gap-1.5 border-l border-slate-300 pl-4">
                    <Clock className="w-5 h-5 text-teal-600" />
                    ~{pkg.estimatedDuration} phút
                  </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-teal-50 min-w-[300px]">
                {/* Voucher Input */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-teal-600" /> Mã giảm giá
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Nhập mã voucher..." 
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 uppercase"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    />
                    <button 
                      onClick={handleApplyVoucher}
                      disabled={voucherLoading || !voucherCode.trim()}
                      className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                      {voucherLoading ? "..." : "Áp dụng"}
                    </button>
                  </div>
                  {voucherError && <p className="text-rose-500 text-xs mt-2 font-medium">{voucherError}</p>}
                  {voucherResult?.valid && (
                    <div className="mt-2 flex items-start gap-1.5 text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                      <Check className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="text-xs font-medium">
                        {voucherResult.message || `Đã áp dụng mã ${voucherResult.voucher?.code}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 bg-teal-50/50 p-4 rounded-xl border border-teal-100 mb-6">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">Giá gói khám:</span>
                        <span className="font-bold text-slate-800">{pkg.price.toLocaleString('vi-VN')}đ</span>
                    </div>
                    
                    {voucherResult?.valid && voucherResult.discountAmount && (
                      <>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-emerald-600 font-bold">Voucher {voucherResult.voucher?.code}:</span>
                            <span className="font-bold text-emerald-600">- {voucherResult.discountAmount.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 font-medium">Giá sau giảm:</span>
                            <span className="font-bold text-slate-800">{(pkg.price - voucherResult.discountAmount).toLocaleString('vi-VN')}đ</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-teal-200">
                        <span className="text-teal-800">Tiền cọc ({pkg.depositPercentage}%):</span>
                        <span className="text-teal-900 text-lg">{currentDeposit.toLocaleString('vi-VN')}đ</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 mt-3 flex justify-between items-center text-xs text-slate-500 group relative cursor-help">
                        <span>Phí đặt lịch (demo):</span>
                        <span className="font-medium">{bookingFee.toLocaleString('vi-VN')}đ</span>
                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 text-white text-[11px] p-2 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          Đây là phí đặt lịch demo. Tiền cọc thực tế sẽ được thu tại quầy.
                          <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                        </div>
                    </div>
                </div>

                <Link 
                    href={`/packages/${pkg.id}/booking${voucherResult?.valid ? `?voucherCode=${voucherCode}` : ''}`} 
                    className="w-full bg-[#017a86] hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                >
                    <span>Đặt Lịch Ngay</span>
                    <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            
            <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Info className="w-6 h-6 text-teal-600" />
                Giới thiệu chung
              </h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {pkg.description || "Chưa có thông tin mô tả."}
              </p>
              
              {pkg.suitableFor && (
                  <div className="mt-4 p-4 bg-teal-50/50 rounded-xl border border-teal-100">
                      <span className="font-bold text-teal-800 block mb-1">Đối tượng phù hợp:</span>
                      <p className="text-teal-700 text-sm">{pkg.suitableFor}</p>
                  </div>
              )}
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-7 h-7 text-teal-500" />
                Dịch vụ bao gồm
              </h2>
              {pkg.includedServices && pkg.includedServices.length > 0 ? (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pkg.includedServices.map((service, idx) => (
                          <li key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition-colors shadow-sm">
                              <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                              <span className="text-slate-700 font-medium">{service}</span>
                          </li>
                      ))}
                  </ul>
              ) : (
                  <p className="text-slate-500 italic">Chi tiết dịch vụ đang được cập nhật.</p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
              <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Hướng dẫn chuẩn bị
              </h3>
              {pkg.preparationGuide ? (
                <div className="text-sm text-amber-800 leading-relaxed whitespace-pre-line">
                  {pkg.preparationGuide}
                </div>
              ) : (
                <p className="text-sm text-amber-700 italic">Vui lòng tuân thủ hướng dẫn chung của bác sĩ trước khi đến khám.</p>
              )}
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-slate-500" />
                Chính sách hoàn/hủy cọc
              </h3>
              {pkg.cancellationPolicy ? (
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {pkg.cancellationPolicy}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Chưa có thông tin chính sách cụ thể.</p>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
