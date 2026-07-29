'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import PatientInfoColumn from '@/components/doctor/examination/PatientInfoColumn';
import ExaminationForm from '@/components/doctor/examination/ExaminationForm';
import { toast } from 'react-hot-toast';
import api from '@/services/api';
import { Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ExaminationPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = React.use(params);
  const searchParams = useSearchParams();
  const viewOnly = searchParams.get('viewOnly') === 'true';

  const [loading, setLoading] = React.useState(true);
  const [appointmentData, setAppointmentData] = React.useState<any>(null);
  const [recordData, setRecordData] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/medical-records/appointment/${appointmentId}`);
        const result = res.data;
        if (result.success) {
          setAppointmentData(result.data.appointment);
          if (result.data.record) {
            setRecordData(result.data.record);
          }
        }
      } catch (error) {
        console.error('Failed to load data', error);
        toast.error('Không thể tải dữ liệu bệnh án');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [appointmentId]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>;
  }

  if (!appointmentData) {
    return <div className="p-8 text-center text-slate-500">Không tìm thấy thông tin lịch hẹn.</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="w-[30%] min-w-[320px] max-w-[400px] border-r border-slate-200 bg-white overflow-y-auto">
        <PatientInfoColumn appointment={appointmentData} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-50">
        {/* ViewOnly banner */}
        {viewOnly && (
          <div className="flex items-center justify-between px-6 py-3 bg-blue-50 border-b border-blue-100 shrink-0">
            <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
              <Eye className="w-4 h-4" />
              Đang xem bệnh án (chỉ đọc) — Không thể chỉnh sửa
            </div>
            <Link
              href="/doctor/patients"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách bệnh án
            </Link>
          </div>
        )}

        <ExaminationForm
          appointmentId={appointmentId}
          initialRecord={recordData}
          patientName={(appointmentData.patientInfo as any)?.fullName || appointmentData.user?.fullName || 'Bệnh nhân'}
          doctorName={appointmentData.doctor?.name || 'Bác sĩ'}
          appointmentDate={appointmentData.appointmentDate}
          viewOnly={viewOnly}
        />
      </div>
    </div>
  );
}
