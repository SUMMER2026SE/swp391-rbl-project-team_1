"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { CalendarCheck, Users, Clock, CheckCircle2, Star, DollarSign, User } from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell
} from 'recharts';

interface DashboardStats {
  totalAppointmentsToday: number;
  pendingAppointments: number;
  completedAppointmentsThisMonth: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalPatients: number;
  averageRating: number;
  monthlyRevenue: number;
}

interface DashboardCharts {
  barChart: any[];
  lineChart: any[];
  donutChart: any[];
  upcomingAppointments: any[];
  latestReviews: any[];
}

const COLORS = ['#14b8a6', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes] = await Promise.all([
          api.get("/doctor/dashboard/stats"),
          api.get("/doctor/dashboard/charts")
        ]);
        setStats(statsRes.data);
        setCharts(chartsRes.data);
      } catch (err: any) {
        setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "DOCTOR") {
      fetchData();
    }
  }, [user]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><LoadingSpinner className="w-10 h-10 text-teal-600" /></div>;
  if (error) return <Alert type="error" message={error} />;

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const statCards = [
    { title: "Lịch hẹn hôm nay", value: stats?.totalAppointmentsToday || 0, icon: <CalendarCheck className="w-8 h-8 text-white" />, bg: "bg-gradient-to-br from-blue-400 to-blue-600", shadow: "shadow-blue-200", href: "/doctor/appointments" },
    { title: "Chờ xác nhận", value: stats?.pendingAppointments || 0, icon: <Clock className="w-8 h-8 text-white" />, bg: "bg-gradient-to-br from-amber-400 to-amber-600", shadow: "shadow-amber-200", href: "/doctor/appointments" },
    { title: "Hoàn thành tháng này", value: stats?.completedAppointmentsThisMonth || 0, icon: <CheckCircle2 className="w-8 h-8 text-white" />, bg: "bg-gradient-to-br from-emerald-400 to-emerald-600", shadow: "shadow-emerald-200", href: "/doctor/appointments" },
    { title: "Tổng bệnh nhân", value: stats?.totalPatients || 0, icon: <Users className="w-8 h-8 text-white" />, bg: "bg-gradient-to-br from-teal-400 to-teal-600", shadow: "shadow-teal-200", href: "/doctor/patients" },
    { title: "Đánh giá TB", value: `${stats?.averageRating || 0} ★`, icon: <Star className="w-8 h-8 text-white" />, bg: "bg-gradient-to-br from-orange-400 to-orange-600", shadow: "shadow-orange-200", href: "/doctor/reviews" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Tổng quan</h2>
        <p className="text-slate-500">Phân tích hiệu suất và hoạt động phòng khám của bạn.</p>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <Link href={card.href} key={idx} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100/50 flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${card.bg} shadow-lg ${card.shadow} group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{card.title}</p>
              <h3 className={`text-2xl font-black text-slate-800`}>{card.value}</h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="font-bold text-slate-800 text-base mb-6">Số lịch hẹn theo ngày (7 ngày qua)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.barChart || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                <Bar dataKey="completed" name="Hoàn thành" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="confirmed" name="Đã xác nhận" stackId="a" fill="#f59e0b" />
                <Bar dataKey="cancelled" name="Đã hủy" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-base mb-2">Phân bổ bệnh (ICD-10)</h3>
          <div className="h-[300px] w-full flex flex-col justify-center items-center">
            {charts?.donutChart && charts.donutChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.donutChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.donutChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{fontSize: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 italic">Chưa có dữ liệu bệnh án</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Line Chart */}
         <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-base mb-6">Xu hướng Bệnh nhân mới (3 tháng)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.lineChart || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="patients" name="Bệnh nhân" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3: Upcoming & Reviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-[320px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base">Lịch hẹn tiếp theo</h3>
              <Link href="/doctor/appointments">
                <span className="text-xs text-teal-600 hover:underline font-semibold cursor-pointer">Xem tất cả</span>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {!charts?.upcomingAppointments || charts.upcomingAppointments.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-slate-400 italic">Không có lịch hẹn sắp tới trong ngày.</p>
                </div>
              ) : (
                charts.upcomingAppointments.map(app => (
                  <div key={app.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                      {app.user?.avatar ? (
                        <img src={app.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400 m-auto mt-2" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-800 line-clamp-1">{(app.patientInfo as any)?.fullName || app.user?.fullName}</p>
                      {(app.patientProfileType as any) === 'OTHER' && (
                        <p className="text-[10px] text-slate-400 mt-0.5">Đặt bởi: {app.user?.email}</p>
                      )}
                      <p className="text-xs text-teal-600 font-medium mt-0.5 bg-teal-50 inline-block px-2 py-0.5 rounded-full border border-teal-100">
                        {new Date(app.appointmentDate).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - {new Date(app.appointmentDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <Link href={`/video-call?appointmentId=${app.id}`}>
                      <button className="px-3 py-1.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-lg hover:bg-teal-200 transition-colors shrink-0">
                        Phòng khám
                      </button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Latest Reviews */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-[320px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base">Đánh giá mới nhất</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {!charts?.latestReviews || charts.latestReviews.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-slate-400 italic">Chưa có đánh giá nào.</p>
                </div>
              ) : (
                charts.latestReviews.map(review => (
                  <div key={review.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                        {review.user?.avatar ? (
                          <img src={review.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-slate-400 m-auto mt-1.5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-xs text-slate-800">{review.user?.fullName}</p>
                        <div className="flex text-orange-400 mt-0.5">
                          {[1,2,3,4,5].map(star => (
                            <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-current' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-xs text-slate-600 line-clamp-2 italic">"{review.comment}"</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
