import React, { useState, useRef } from 'react';
import { Save, Check, Printer, FileText, FlaskConical, Pill, Stethoscope } from 'lucide-react';
import ClinicalTab from './tabs/ClinicalTab';
import LabOrdersTab from './tabs/LabOrdersTab';
import PrescriptionTab from './tabs/PrescriptionTab';
import ConclusionTab from './tabs/ConclusionTab';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ExaminationFormProps {
  appointmentId: string;
  initialRecord: any;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
}

export default function ExaminationForm({ appointmentId, initialRecord, patientName, doctorName, appointmentDate }: ExaminationFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('clinical');
  const [isSaving, setIsSaving] = useState(false);
  
  // State for all form data
  const [formData, setFormData] = useState({
    // Vitals & Clinical
    height: initialRecord?.height || '',
    weight: initialRecord?.weight || '',
    bloodPressure: initialRecord?.bloodPressure || '',
    heartRate: initialRecord?.heartRate || '',
    temperature: initialRecord?.temperature || '',
    spo2: initialRecord?.spo2 || '',
    symptoms: initialRecord?.symptoms || '',
    physicalExam: initialRecord?.physicalExam || '',
    preliminaryDiagnosis: initialRecord?.preliminaryDiagnosis || '',
    
    // Conclusion
    finalDiagnosis: initialRecord?.finalDiagnosis || '',
    icd10Code: initialRecord?.icd10Code || '',
    treatmentPlan: initialRecord?.treatmentPlan || '',
    doctorNotes: initialRecord?.doctorNotes || '',
    followUpDate: initialRecord?.followUpDate ? new Date(initialRecord.followUpDate).toISOString().split('T')[0] : '',
    severity: initialRecord?.severity || 'MILD',
    status: initialRecord?.status || 'DRAFT',
  });

  // Complex states
  const [labOrders, setLabOrders] = useState<any[]>(initialRecord?.labOrders || []);
  const [prescriptions, setPrescriptions] = useState<any[]>(initialRecord?.prescriptions || []);

  const isCompleted = formData.status === 'COMPLETED';
  const prescriptionRef = useRef<HTMLDivElement>(null);

  const handleUpdateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (status: 'DRAFT' | 'COMPLETED') => {
    try {
      setIsSaving(true);
      
      let pdfBase64 = undefined;

      // If completing, generate PDF to attach to email
      if (status === 'COMPLETED' && prescriptionRef.current && prescriptions.length > 0) {
         try {
           // We render the HTML to PDF then get base64
           const opt = {
             margin: 10,
             filename: 'DonThuoc.pdf',
             image: { type: 'jpeg' as const, quality: 0.98 },
             html2canvas: { scale: 2 },
             jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' as const }
           };
           // Temporarily show the hidden print ref
           prescriptionRef.current.style.display = 'block';
           const pdfObj = html2pdf().from(prescriptionRef.current).set(opt);
           pdfBase64 = await pdfObj.outputPdf('datauristring');
           prescriptionRef.current.style.display = 'none';
         } catch(e) {
           console.error("PDF gen error", e);
         }
      }

      const payload = {
        ...formData,
        status,
        labOrders,
        prescriptions,
        pdfBase64
      };

      // Convert number fields
      if (payload.height) payload.height = parseFloat(payload.height as string);
      if (payload.weight) payload.weight = parseFloat(payload.weight as string);
      if (payload.heartRate) payload.heartRate = parseInt(payload.heartRate as string);
      if (payload.temperature) payload.temperature = parseFloat(payload.temperature as string);
      if (payload.spo2) payload.spo2 = parseFloat(payload.spo2 as string);

      // In real app, call axios
      const res = await fetch(`/api/medical-records/appointment/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(status === 'DRAFT' ? 'Đã lưu nháp thành công' : 'Đã hoàn tất khám bệnh!');
        setFormData(prev => ({ ...prev, status }));
        if (status === 'COMPLETED') {
           // Redirect back after a delay
           setTimeout(() => {
             router.push('/doctor/dashboard');
           }, 1500);
        }
      } else {
        toast.error(data.message || 'Lỗi khi lưu bệnh án');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (prescriptionRef.current && prescriptions.length > 0) {
      const opt = {
        margin: 10,
        filename: `DonThuoc_${patientName.replace(/\s+/g, '')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' as const }
      };
      prescriptionRef.current.style.display = 'block';
      html2pdf().from(prescriptionRef.current).set(opt).save().then(() => {
        if(prescriptionRef.current) prescriptionRef.current.style.display = 'none';
      });
    } else {
      toast.error("Vui lòng kê ít nhất 1 loại thuốc để in");
    }
  };

  const tabs = [
    { id: 'clinical', label: 'Khám lâm sàng', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'lab', label: 'Chỉ định CLS', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'prescription', label: 'Kê đơn thuốc', icon: <Pill className="w-4 h-4" /> },
    { id: 'conclusion', label: 'Kết luận & Dặn dò', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Tabs Header */}
      <div className="flex px-4 border-b border-slate-200 bg-slate-50 overflow-x-auto shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
              ${activeTab === tab.id 
                ? 'border-teal-600 text-teal-700 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.id === 'prescription' && prescriptions.length > 0 && (
              <span className="ml-2 bg-teal-100 text-teal-700 text-xs py-0.5 px-2 rounded-full">{prescriptions.length}</span>
            )}
            {tab.id === 'lab' && labOrders.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 text-xs py-0.5 px-2 rounded-full">{labOrders.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {isCompleted && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center text-emerald-700">
            <Check className="w-5 h-5 mr-3 shrink-0" />
            <p className="text-sm">Bệnh án đã được hoàn tất và khóa lại. Không thể chỉnh sửa thêm.</p>
          </div>
        )}

        <div className={activeTab === 'clinical' ? 'block' : 'hidden'}>
          <ClinicalTab formData={formData} onUpdate={handleUpdateField} disabled={isCompleted} />
        </div>
        
        <div className={activeTab === 'lab' ? 'block' : 'hidden'}>
          <LabOrdersTab labOrders={labOrders} setLabOrders={setLabOrders} disabled={isCompleted} />
        </div>
        
        <div className={activeTab === 'prescription' ? 'block' : 'hidden'}>
          <PrescriptionTab 
            prescriptions={prescriptions} 
            setPrescriptions={setPrescriptions} 
            disabled={isCompleted} 
          />
        </div>
        
        <div className={activeTab === 'conclusion' ? 'block' : 'hidden'}>
          <ConclusionTab formData={formData} onUpdate={handleUpdateField} disabled={isCompleted} />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
        <div>
           <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors font-medium text-sm"
          >
            <Printer className="w-4 h-4" />
            <span>In đơn thuốc</span>
          </button>
        </div>
        <div className="flex space-x-3">
          {!isCompleted && (
            <>
              <button
                onClick={() => handleSave('DRAFT')}
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-medium text-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Lưu nháp</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn hoàn tất khám? Bệnh án sẽ không thể chỉnh sửa và hệ thống sẽ gửi email đơn thuốc cho bệnh nhân.')) {
                    handleSave('COMPLETED');
                  }
                }}
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Hoàn tất khám</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hidden Print Template */}
      <div style={{ display: 'none' }}>
         <div ref={prescriptionRef} className="p-8 bg-white text-black" style={{ width: '148mm', minHeight: '210mm' }}>
            <div className="text-center mb-6 border-b-2 border-teal-600 pb-4">
               <h1 className="text-2xl font-bold text-teal-600">MedBooking</h1>
               <p className="text-sm text-gray-500 mt-1">Hệ thống Y tế thông minh</p>
               <h2 className="text-xl font-bold mt-4">ĐƠN THUỐC</h2>
            </div>
            
            <div className="mb-6 space-y-2 text-sm">
               <p><span className="font-semibold">Bệnh nhân:</span> {patientName}</p>
               <p><span className="font-semibold">Chẩn đoán:</span> {formData.finalDiagnosis || formData.preliminaryDiagnosis || 'Chưa cập nhật'}</p>
               <p><span className="font-semibold">Bác sĩ khám:</span> {doctorName}</p>
               <p><span className="font-semibold">Ngày khám:</span> {new Date(appointmentDate).toLocaleDateString('vi-VN')}</p>
            </div>

            <div className="mb-8">
               <h3 className="font-bold text-lg mb-3">Chỉ định dùng thuốc:</h3>
               <div className="space-y-4">
                  {prescriptions.map((p, idx) => (
                    <div key={idx} className="border-b border-dashed border-gray-300 pb-2">
                       <p className="font-bold">{idx + 1}. {p.medicine?.name || p.medicineId}</p>
                       <div className="pl-4 text-sm mt-1">
                          <p>Số lượng: {p.quantity} {p.medicine?.unit || 'Viên'}</p>
                          <p>Cách dùng: {p.dosage}, {p.frequency} ({p.durationDays} ngày)</p>
                          {p.instructions && <p className="italic text-gray-600">Ghi chú: {p.instructions}</p>}
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {formData.doctorNotes && (
               <div className="mb-8">
                 <h3 className="font-bold">Lời dặn của Bác sĩ:</h3>
                 <p className="text-sm mt-1">{formData.doctorNotes}</p>
               </div>
            )}

            <div className="text-right mt-12 pr-8">
               <p className="text-sm italic mb-16">Ngày ..... tháng ..... năm 202...</p>
               <p className="font-bold">Bác sĩ điều trị</p>
               <p className="mt-16">{doctorName}</p>
            </div>
         </div>
      </div>

    </div>
  );
}
