'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/services/api';
import { handleError } from '@/utils/errorHandler';
import { RoadmapTemplateForm } from '@/components/mentor/RoadmapTemplateForm';

export default function EditRoadmapTemplatePage() {
  const params = useParams();
  const id = params?.id as string;
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchTemplate = async () => {
      try {
        const res = await api.get(`/roadmap/templates/${id}`);
        if (res.data.success) {
          setInitialData(res.data.template);
        }
      } catch (error) {
        handleError(error, 'Không thể tải thông tin lộ trình mẫu.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse bg-slate-900 rounded-2xl h-16"></div>
        <div className="animate-pulse bg-slate-900 rounded-2xl h-96"></div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="p-6 text-center text-slate-400">
        Không tìm thấy lộ trình mẫu hoặc bạn không có quyền truy cập.
      </div>
    );
  }

  return <RoadmapTemplateForm isEdit initialData={initialData} />;
}
