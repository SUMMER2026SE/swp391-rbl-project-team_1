'use client';

import React from 'react';
import PatientInfoColumn from '@/components/doctor/examination/PatientInfoColumn';
import ExaminationForm from '@/components/doctor/examination/ExaminationForm';
import { toast } from 'react-hot-toast';
import api from '@/services/api';

export default function ExaminationPage({ params }: { params: { appointmentId: string } }) {
  const [loading, setLoading] = React.useState(true);
  const [appointmentData, setAppointmentData] = React.useState<any>(null);
  const [recordData, setRecordData] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/medical-records/appointment/${params.appointmentId}`);
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
  }, [params.appointmentId]);

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
        <ExaminationForm 
          appointmentId={params.appointmentId} 
          initialRecord={recordData} 
          patientName={appointmentData.patientProfile?.fullName || appointmentData.user.fullName || 'Bệnh nhân'}
          doctorName={appointmentData.doctor?.name || 'Bác sĩ'}
          appointmentDate={appointmentData.appointmentDate}
        />
      </div>
    </div>
  );
}
