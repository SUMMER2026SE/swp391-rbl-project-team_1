'use client';

import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import api from '../../../services/api';
import Button from '../../../components/common/Button';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Modal from '../../../components/common/Modal';
import { Target, Trash2, Plus, Brain, Check, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { Skill } from '../../../types';

const PROFICIENCY_OPTIONS = [
  { value: 'none',       label: 'Chưa biết gì',             desc: 'Hoàn toàn mới với kỹ năng này',  color: 'from-red-500/20 to-red-600/5',   border: 'border-red-500/50',   text: 'text-red-400',   dot: 'bg-red-500' },
  { value: 'basic',      label: 'Biết cơ bản',              desc: 'Đã nghe qua, biết sơ lược',       color: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/50', text: 'text-amber-400', dot: 'bg-amber-500' },
  { value: 'practiced',  label: 'Đã thực hành 1 thời gian', desc: 'Đã áp dụng trong dự án nhỏ',      color: 'from-sky-500/20 to-sky-600/5',   border: 'border-sky-500/50',   text: 'text-sky-400',   dot: 'bg-sky-500' },
  { value: 'proficient', label: 'Khá thành thạo',           desc: 'Sử dụng thường xuyên, tự tin',    color: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/50', text: 'text-emerald-400', dot: 'bg-emerald-500' },
];

const PROFICIENCY_BKT_MAP: Record<string, number> = {
  'none':         0.1,
  'basic':        0.3,
  'practiced':    0.5,
  'proficient':   0.7,
};

export default function SkillsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [masteries, setMasteries] = useState<any[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Modal Add Skills state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [parentSkills, setParentSkills] = useState<Skill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [skillProficiency, setSkillProficiency] = useState<Record<string, string>>({});
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [isAdding, setIsAdding] = useState(false);

  // Need Update Roadmap indicator
  const [needsRoadmapUpdate, setNeedsRoadmapUpdate] = useState(false);

  useEffect(() => {
    loadData();
    fetchAvailableSkills();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/bkt/mastery');
      if (res.data.success) {
        setMasteries(res.data.masteries);
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách kỹ năng.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSkills = async () => {
    try {
      const skillsRes = await api.get('/auth/skills');
      if (skillsRes.data.success) {
        setParentSkills(skillsRes.data.skills);
      }
    } catch (err) {
      // Use fallback
      setParentSkills([
        { id: 'web-dev-id', name: 'Web Development', slug: 'web-dev', children: [
          { id: 'html-id', name: 'HTML5 Basics', slug: 'html' },
          { id: 'css-id', name: 'CSS3 Responsive', slug: 'css' },
          { id: 'js-id', name: 'JavaScript ES6+', slug: 'javascript' },
        ]} as any,
      ]);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    const confirmDelete = window.confirm('Xóa kỹ năng này sẽ ẩn các task và lộ trình liên quan, nhưng dữ liệu mastery vẫn được lưu lại nếu bạn quay lại sau. Tiếp tục?');
    if (!confirmDelete) return;

    try {
      const res = await api.delete(`/bkt/mastery/${skillId}`);
      if (res.data.success) {
        toast.success('Đã xóa kỹ năng khỏi danh sách.');
        setNeedsRoadmapUpdate(true);
        loadData();
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi xóa kỹ năng.');
    }
  };

  const handleUpdateRoadmap = async () => {
    try {
      setIsRegenerating(true);
      toast.loading('AI đang phân tích và điều chỉnh lộ trình...', { id: 'roadmap_update' });
      const res = await api.post('/roadmap/generate');
      if (res.data.success) {
        toast.success('Đã cập nhật lộ trình thành công! 🎉', { id: 'roadmap_update' });
        setNeedsRoadmapUpdate(false);
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi cập nhật lộ trình.', { id: 'roadmap_update' });
    } finally {
      setIsRegenerating(false);
    }
  };

  // --- Add Skills Modal Logic ---
  const allSubSkills: Skill[] = [];
  parentSkills.forEach(parent => {
    if (parent.children) allSubSkills.push(...parent.children as Skill[]);
    else allSubSkills.push(parent);
  });
  const selectedSkillsObjects = allSubSkills.filter(s => selectedSkillIds.includes(s.id));

  const handleToggleSkill = (skillId: string) => {
    setSelectedSkillIds(prev =>
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
  };

  const handleNextStep = () => {
    if (selectedSkillIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 kỹ năng.');
      return;
    }
    setSkillProficiency(prev => {
      const next = { ...prev };
      selectedSkillIds.forEach(id => { if (!next[id]) next[id] = 'none'; });
      return next;
    });
    setAddStep(2);
  };

  const handleConfirmAdd = async () => {
    try {
      setIsAdding(true);
      const skillLevels: Record<string, number> = {};
      selectedSkillIds.forEach(id => {
        const prof = skillProficiency[id] || 'none';
        skillLevels[id] = PROFICIENCY_BKT_MAP[prof] ?? 0.1;
      });

      const res = await api.post('/bkt/mastery', { skillLevels });
      if (res.data.success) {
        toast.success('Đã thêm kỹ năng thành công!');
        setIsAddModalOpen(false);
        setNeedsRoadmapUpdate(true);
        loadData();
      }
    } catch (err) {
      toast.error('Lỗi khi thêm kỹ năng mới.');
    } finally {
      setIsAdding(false);
    }
  };

  const resetModal = () => {
    setSelectedSkillIds([]);
    setSkillProficiency({});
    setAddStep(1);
  };

  if (isLoading) {
    return <div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-500" />
            Quản lý kỹ năng
          </h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý các kỹ năng bạn đang theo đuổi trong lộ trình học tập.</p>
        </div>
        <Button onClick={() => { resetModal(); setIsAddModalOpen(true); }} variant="primary" className="shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-2" /> Thêm kỹ năng mới
        </Button>
      </div>

      {needsRoadmapUpdate && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-amber-400 font-bold text-sm">Lộ trình của bạn chưa được đồng bộ</p>
              <p className="text-amber-500/80 text-xs mt-0.5">Bạn vừa thay đổi kỹ năng theo đuổi. Hãy cập nhật lại lộ trình để AI sắp xếp task phù hợp.</p>
            </div>
          </div>
          <Button onClick={handleUpdateRoadmap} isLoading={isRegenerating} variant="secondary" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
            Cập nhật lộ trình theo thay đổi
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {masteries.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Bạn chưa có kỹ năng nào trong lộ trình.</p>
          </div>
        ) : (
          masteries.map((m) => {
            const masteryPct = Math.round(m.masteryLevel * 100);
            return (
              <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Brain className="w-5 h-5" />
                    </div>
                    <button 
                      onClick={() => handleRemoveSkill(m.skillId)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Xóa kỹ năng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-lg text-slate-100 mb-1">{m.skill.name}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-4">{m.skill.domain || 'KỸ NĂNG CHUNG'}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Mastery Level</span>
                      <span className="text-blue-400">{masteryPct}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${masteryPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm kỹ năng mới" size="xl">
        <div>
          {addStep === 1 && (
            <div className="space-y-6">
              <p className="text-slate-400 text-sm">Chọn những kỹ năng bạn muốn bổ sung vào lộ trình học tập của mình.</p>
              <div className="space-y-6 pr-1">
                {parentSkills.map(parent => {
                  // Filter out skills already in masteries
                  const availableChildren = parent.children?.filter(sub => !masteries.some(m => m.skillId === sub.id));
                  if (!availableChildren || availableChildren.length === 0) return null;
                  
                  return (
                    <div key={parent.id} className="space-y-3">
                      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-slate-800/80 pb-1.5">
                        {parent.name}
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {availableChildren.map((sub: any) => {
                          const isSelected = selectedSkillIds.includes(sub.id);
                          return (
                            <button
                              key={sub.id}
                              onClick={() => handleToggleSkill(sub.id)}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-all duration-300 group ${
                                isSelected
                                  ? 'bg-blue-950/20 border-blue-500/80 text-blue-300 shadow-inner'
                                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                              }`}
                            >
                              <span>{sub.name}</span>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ${
                                isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-transparent'
                              }`}>
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-800">
                <Button onClick={handleNextStep}>Tiếp tục</Button>
              </div>
            </div>
          )}

          {addStep === 2 && (
            <div className="space-y-6">
              <p className="text-slate-400 text-sm">Tự đánh giá năng lực hiện tại của bạn để AI có thể lên lộ trình phù hợp.</p>
              <div className="space-y-6 pr-1">
                {selectedSkillsObjects.map(skill => (
                  <div key={skill.id} className="space-y-2.5">
                    <p className="text-sm font-bold text-slate-200">
                      Mức độ hiện tại với <span className="text-violet-400">{skill.name}</span>:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {PROFICIENCY_OPTIONS.map(opt => {
                        const isChosen = skillProficiency[skill.id] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setSkillProficiency(prev => ({ ...prev, [skill.id]: opt.value }))}
                            className={`relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                              isChosen
                                ? `bg-gradient-to-br ${opt.color} ${opt.border} shadow-inner`
                                : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0 border-2 transition-all ${
                              isChosen ? `${opt.dot} border-transparent` : 'border-slate-600 bg-transparent'
                            }`} />
                            <div className="min-w-0">
                              <p className={`text-xs font-bold leading-tight ${isChosen ? opt.text : 'text-slate-300'}`}>{opt.label}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-4 border-t border-slate-800">
                <Button variant="secondary" onClick={() => setAddStep(1)}>Quay lại</Button>
                <Button variant="primary" onClick={handleConfirmAdd} isLoading={isAdding}>Hoàn tất & Thêm</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
