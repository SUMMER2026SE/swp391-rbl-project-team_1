"use client";

import React from "react";
import { Building2, MapPin, Phone, Mail, Award, Clock, HeartPulse, Stethoscope, ArrowRight } from "lucide-react";
import Link from "next/link";
import Button from "@/components/common/Button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-teal-900">
          <img 
            src="/uploads/hoan_my_da_nang.png" 
            alt="Bệnh viện Hoàn Mỹ Đà Nẵng" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-teal-100 font-medium mb-6">
            <HeartPulse className="h-4 w-4" />
            Hệ thống Y khoa Hoàn Mỹ
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Bệnh Viện Hoàn Mỹ Đà Nẵng
          </h1>
          <p className="text-lg md:text-xl text-teal-50 mb-8 max-w-2xl mx-auto leading-relaxed">
            Chăm sóc sức khỏe toàn diện với tiêu chuẩn quốc tế. Tận tâm, chuyên nghiệp và luôn đồng hành cùng sức khỏe của bạn.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/doctors">
              <Button variant="teal" className="w-full sm:w-auto text-lg px-8 py-4 h-auto shadow-xl shadow-teal-500/20 hover:shadow-teal-500/40 rounded-2xl flex items-center justify-center font-bold">
                Đặt lịch khám ngay
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="flex items-center gap-4 px-4">
              <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                <MapPin className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Địa chỉ</p>
                <p className="text-slate-900 font-semibold">291 Nguyễn Văn Linh, Đà Nẵng</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 pt-6 md:pt-0">
              <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                <Phone className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Cấp cứu 24/7</p>
                <p className="text-slate-900 font-semibold">(0236) 3650 676</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 pt-6 md:pt-0">
              <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Giờ làm việc</p>
                <p className="text-slate-900 font-semibold">Thứ 2 - Thứ 7: 7h00 - 16h00</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Về Bệnh Viện Chúng Tôi</h2>
              <div className="w-20 h-1.5 bg-teal-500 rounded-full mb-6"></div>
              <p className="text-slate-600 leading-relaxed text-lg mb-4">
                Thành lập từ năm 2002, Bệnh viện Hoàn Mỹ Đà Nẵng là thành viên của Tập đoàn Y khoa Hoàn Mỹ - Hệ thống Y tế tư nhân với hệ thống bệnh viện, phòng khám trải dài từ Bắc chí Nam.
              </p>
              <p className="text-slate-600 leading-relaxed text-lg">
                Với sứ mệnh mang đến dịch vụ chăm sóc sức khỏe chất lượng cao, chi phí hợp lý, Hoàn Mỹ Đà Nẵng không ngừng đầu tư vào hệ thống trang thiết bị y tế hiện đại, cùng đội ngũ y bác sĩ giàu kinh nghiệm, tận tâm với nghề.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Chất lượng Quốc tế</h3>
                  <p className="text-sm text-slate-500">Đạt chuẩn quản lý chất lượng khắt khe.</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Chuyên khoa Đa dạng</h3>
                  <p className="text-sm text-slate-500">Đáp ứng đầy đủ nhu cầu khám chữa bệnh.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 bg-teal-50 rounded-3xl transform rotate-3"></div>
            <img 
              src="/uploads/hoan_my_da_nang.png" 
              alt="Cơ sở vật chất" 
              className="relative rounded-2xl shadow-xl w-full object-cover aspect-[4/3]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
