"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { packageService, MedicalPackage } from "@/services/package.service";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  const [pkg, setPkg] = useState<MedicalPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Dummy structured data for SWP391 UI mockup
  const tableData = [
    { stt: 1, name: "Khám Nội tổng quát", basic: true, advanced: true },
    { stt: 2, name: "Chụp Xquang ngực thẳng", basic: false, advanced: true },
    { stt: 3, name: "Chụp cộng hưởng từ sọ não", basic: true, advanced: true },
    { stt: 4, name: "(T) Siêu âm Doppler các khối u trong ổ bụng", basic: false, advanced: true },
    { stt: 5, name: "Doppler động mạch cảnh, Doppler xuyên sọ", basic: false, advanced: true },
    { stt: 6, name: "Siêu âm Doppler tim", basic: false, advanced: true },
    { stt: 7, name: "Tổng phân tích nước tiểu (Bằng máy tự động)", basic: false, advanced: true },
    { stt: 8, name: "Tổng phân tích tế bào máu ngoại vi (bằng máy đếm laser)", basic: false, advanced: true },
    { stt: 9, name: "Định lượng Glucose [Máu]", basic: true, advanced: true },
    { stt: 10, name: "Định lượng HbA1c [Máu]", basic: false, advanced: true },
    { stt: 11, name: "Định lượng Urê máu [Máu]", basic: false, advanced: true },
    { stt: 12, name: "Định lượng Creatinin (Máu)", basic: true, advanced: true },
    { stt: 13, name: "Đo hoạt độ ALT (GPT) [Máu]", basic: false, advanced: true },
    { stt: 14, name: "Đo hoạt độ AST (GOT) [Máu]", basic: false, advanced: true },
    { stt: 15, name: "Điện giải đồ (Na, K, Cl) [Máu]", basic: false, advanced: true },
  ];

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Giới thiệu */}
            <section>
              <h2 className="text-2xl font-bold text-[#017a86] mb-4">Giới thiệu</h2>
              <p className="text-slate-600 leading-relaxed">
                {pkg.description || "Gói khám sức khỏe toàn diện được thiết kế giúp phát hiện sớm các nguy cơ bệnh lý, giúp bạn chủ động phòng ngừa và sống khỏe mạnh hơn."}
              </p>
            </section>

            {/* Gói khám bao gồm */}
            <section>
              <h2 className="text-2xl font-bold text-[#017a86] mb-6">Gói khám bao gồm</h2>
              <div className="space-y-6 text-slate-700">
                <div>
                  <h3 className="font-semibold mb-2">1.Khám lâm sàng</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                    <li>Đo huyết áp, mạch, BMI</li>
                    <li>Khám nội tổng quát</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2.Xét nghiệm</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                    <li>Công thức máu</li>
                    <li>Đường huyết (Glucose, HbA1c)</li>
                    <li>Mỡ máu (Cholesterol, Triglyceride, HDL, LDL)</li>
                    <li>Men gan (AST, ALT, GGT)</li>
                    <li>Chức năng thận (Ure, Creantinnin)</li>
                    <li>Tổng phân tích nước tiểu</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">3.Chẩn đoán hình ảnh</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                    <li>Chụp MRI sọ não</li>
                    <li>Siêu âm tim</li>
                    <li>Siêu âm ổ bụng</li>
                    <li>Siêu âm động mạch cảnh</li>
                    <li>X- quang phổi</li>
                    <li>Điện tim</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Lợi ích từ gói khám */}
            <section>
              <h2 className="text-2xl font-bold text-[#017a86] mb-6">Lợi ích từ gói khám</h2>
              <div className="overflow-x-auto border border-[#017a86] rounded-t-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#017a86] text-white">
                    <tr>
                      <th colSpan={4} className="py-4 px-4 text-center font-bold text-base uppercase tracking-wide border-b border-teal-600">
                        {pkg.name.toUpperCase()} (NAM/ NỮ)
                      </th>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 text-center border-r border-teal-600 w-16">STT</th>
                      <th className="py-3 px-4 text-center border-r border-teal-600">DANH MỤC</th>
                      <th className="py-3 px-4 text-center border-r border-teal-600 w-24">CƠ BẢN</th>
                      <th className="py-3 px-4 text-center w-24">NÂNG CAO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tableData.map((row) => (
                      <tr key={row.stt} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-center text-slate-600 border-r border-slate-200">{row.stt}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium border-r border-slate-200">{row.name}</td>
                        <td className="py-3 px-4 text-center text-slate-500 border-r border-slate-200">{row.basic ? "x" : ""}</td>
                        <td className="py-3 px-4 text-center text-slate-500">{row.advanced ? "x" : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            
          </div>

          {/* Sticky Booking Card (Right Column) */}
          <div className="lg:col-span-1 relative">
            <div className="sticky top-28 bg-[#eaf6f7] rounded-2xl p-6 border border-[#cce8e9]">
              <h1 className="text-2xl font-extrabold text-[#017a86] mb-6 leading-tight">
                {pkg.name}
              </h1>
              
              <div className="flex items-start gap-3 text-slate-600 mb-8">
                <MapPin className="w-5 h-5 text-[#017a86] shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium">Bệnh viện:</span>
                  <p className="font-bold text-[#017a86]">{pkg.hospital}</p>
                </div>
              </div>

              <Link 
                href={`/packages/${pkg.id}/booking`} 
                className="w-full bg-[#017a86] hover:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-between transition-colors shadow-lg shadow-teal-500/20"
              >
                <span>Đặt lịch hẹn</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
