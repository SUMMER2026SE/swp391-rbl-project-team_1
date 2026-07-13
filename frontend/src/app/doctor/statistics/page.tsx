"use client";

import React, { useEffect, useState } from "react";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { Users, CheckCircle2, Star, MessageSquare, DollarSign, RefreshCw, User, Search, Filter } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell
} from 'recharts';
import Pagination from "@/components/common/Pagination";

const COLORS = ['#14b8a6', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

export default function StatisticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterRating, setFilterRating] = useState<string>("ALL");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/doctor/statistics");
        setStats(res.data);
      } catch (err: any) {
        setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.");
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const url = `/doctor/reviews?page=${meta.page}&limit=${meta.limit}${filterRating !== 'ALL' ? `&rating=${filterRating}` : ''}`;
        const res = await api.get(url);
        setReviews(res.data.data);
        setMeta(res.data.meta);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [meta.page, filterRating]);

  if (loadingStats) return <div className="flex justify-center p-12"><LoadingSpinner className="w-8 h-8 text-teal-600" /></div>;
  if (error) return <Alert type="error" message={error} />;

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const kpiData = stats?.kpi || {};
  const charts = stats?.charts || {};

  const statCards = [
    { title: "Tổng bệnh nhân", value: kpiData.totalPatients || 0, icon: <Users className="w-8 h-8 text-teal-500" />, bg: "bg-teal-50" },
    { title: "Tỷ lệ hoàn thành", value: `${kpiData.completionRate || 0}%`, icon: <CheckCircle2 className="w-8 h-8 text-green-500" />, bg: "bg-green-50" },
    { title: "Điểm đánh giá TB", value: `${kpiData.averageRating || 0} ★`, icon: <Star className="w-8 h-8 text-orange-500" />, bg: "bg-orange-50" },
    { title: "Tổng đánh giá", value: kpiData.totalReviews || 0, icon: <MessageSquare className="w-8 h-8 text-blue-500" />, bg: "bg-blue-50" },
    { title: "Tổng doanh thu", value: formatVND(kpiData.totalRevenue || 0), subtitle: `Tháng này: ${formatVND(kpiData.monthlyRevenue || 0)}`, icon: <DollarSign className="w-8 h-8 text-purple-500" />, bg: "bg-purple-50" },
    { title: "Bệnh nhân quay lại", value: `${kpiData.returnPatientRate || 0}%`, icon: <RefreshCw className="w-8 h-8 text-indigo-500" />, bg: "bg-indigo-50" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Thống kê cá nhân</h2>
        <p className="text-slate-500">Phân tích chuyên sâu về hiệu suất và mức độ hài lòng của bệnh nhân.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                {card.icon}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 line-clamp-1" title={card.title}>{card.title}</p>
              <h3 className={`text-xl font-bold ${idx === 4 ? 'text-purple-700 text-lg' : 'text-slate-800'}`}>{card.value}</h3>
              {card.subtitle && <p className="text-[10px] font-semibold text-purple-500 mt-1">{card.subtitle}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Line Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-base mb-6">Doanh thu 12 tháng qua</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.revenue12Months || []} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={80} tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip formatter={(value: any) => formatVND(Number(value))} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patients Bar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-base mb-6">Số lượng bệnh nhân (12 tháng)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.patients12Months || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="patients" name="Bệnh nhân" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 ICD-10 Bar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-base mb-6">Top 5 Chẩn đoán phổ biến (ICD-10)</h3>
          <div className="h-[250px] w-full">
            {charts.topIcdChart && charts.topIcdChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topIcdChart} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: 'bold'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="count" name="Số ca" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">Chưa có dữ liệu chẩn đoán</div>
            )}
          </div>
        </div>

        {/* Age Demographics Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-base mb-2">Phân bổ độ tuổi bệnh nhân</h3>
          <div className="h-[250px] w-full flex justify-center items-center">
            {charts.ageChart && charts.ageChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={charts.ageChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {charts.ageChart.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{fontSize: '12px'}} />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="text-slate-400 italic text-sm">Chưa có dữ liệu độ tuổi</div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" id="reviews-table">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
               <h3 className="font-bold text-slate-800 text-lg">Đánh giá từ bệnh nhân</h3>
               <p className="text-sm text-slate-500">Quản lý phản hồi và danh tiếng của bạn</p>
            </div>
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                    value={filterRating}
                    onChange={(e) => { setFilterRating(e.target.value); setMeta(prev => ({...prev, page: 1})); }}
                    className="px-3 py-2 rounded-xl border border-slate-200 focus:border-teal-500 outline-none text-sm bg-slate-50 font-medium"
                >
                    <option value="ALL">Tất cả số sao</option>
                    <option value="5">5 Sao</option>
                    <option value="4">4 Sao</option>
                    <option value="3">3 Sao</option>
                    <option value="2">2 Sao</option>
                    <option value="1">1 Sao</option>
                </select>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                    <tr>
                        <th className="p-4">Bệnh nhân</th>
                        <th className="p-4">Đánh giá</th>
                        <th className="p-4 w-[40%]">Nội dung</th>
                        <th className="p-4">Thời gian</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loadingReviews ? (
                        <tr>
                            <td colSpan={4} className="p-8 text-center"><LoadingSpinner className="w-6 h-6 text-teal-600 mx-auto" /></td>
                        </tr>
                    ) : reviews.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-500">
                                <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                                Không có đánh giá nào.
                            </td>
                        </tr>
                    ) : (
                        reviews.map(review => {
                            // Hide last name for privacy
                            const nameParts = review.user?.fullName?.split(" ") || ["Bệnh", "Nhân"];
                            const hiddenName = nameParts.length > 1 
                                ? `${nameParts[0]} ${nameParts.slice(1, -1).map(()=>'*').join('')} ${nameParts[nameParts.length - 1]}`
                                : review.user?.fullName;
                            return (
                                <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                                {review.user?.avatar ? (
                                                    <img src={review.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5 text-slate-400 m-auto mt-1.5" />
                                                )}
                                            </div>
                                            <span className="font-semibold text-slate-800">{hiddenName}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1">
                                            {[1,2,3,4,5].map(star => (
                                                <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-orange-400 text-orange-400' : 'text-slate-200'}`} />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-slate-600 italic">"{review.comment || "Không có lời bình"}"</p>
                                    </td>
                                    <td className="p-4 text-slate-500">
                                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>
        </div>
        
        {meta.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex justify-center">
                <Pagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={(page) => setMeta(prev => ({...prev, page}))}
                    scrollTargetId="reviews-table"
                />
            </div>
        )}
      </div>

    </div>
  );
}
