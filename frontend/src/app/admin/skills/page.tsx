'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { 
  GitBranch, Plus, Trash2, ChevronDown, ChevronRight, 
  Folder, FolderOpen, FileCode, Save, Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Skill {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent?: {
    name: string;
  } | null;
}

interface TreeNode extends Skill {
  children: TreeNode[];
  isOpen?: boolean;
}

export default function AdminSkillsTree() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Form states
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [parentId, setParentId] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/skills');
      if (response.data.success) {
        const flatSkills = response.data.skills;
        setSkills(flatSkills);
        buildTree(flatSkills);
      }
    } catch (_) {
      toast.error('Không thể tải cấu trúc cây kỹ năng.');
    } finally {
      setIsLoading(false);
    }
  };

  const buildTree = (flatList: Skill[]) => {
    const map: { [id: string]: TreeNode } = {};
    const roots: TreeNode[] = [];

    // Initialize map
    flatList.forEach((skill) => {
      map[skill.id] = { ...skill, children: [], isOpen: true };
    });

    // Populate children
    flatList.forEach((skill) => {
      const node = map[skill.id];
      if (skill.parentId && map[skill.parentId]) {
        map[skill.parentId].children.push(node);
      } else {
        roots.push(node);
      }
    });

    setTreeData(roots);
  };

  // Helper to slugify string
  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate slug
    const cleanSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // remove special chars
      .replace(/[\s_]+/g, '-') // replace spaces with dash
      .replace(/^-+|-+$/g, ''); // trim dashes
    setSlug(cleanSlug);
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error('Vui lòng nhập đầy đủ tên và slug kỹ năng.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.post('/admin/skills', {
        name,
        slug,
        parentId: parentId || null
      });
      if (response.data.success) {
        toast.success('Thêm mới kỹ năng thành công! 🌳');
        setName('');
        setSlug('');
        setParentId('');
        fetchSkills();
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Thêm kỹ năng thất bại.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!window.confirm('Cảnh báo: Xóa kỹ năng sẽ xóa tất cả các kỹ năng con và xóa vĩnh viễn các dữ liệu liên quan (SkillMastery, Task, Quiz). Bạn chắc chắn muốn xóa chứ?')) return;
    try {
      const response = await api.delete(`/admin/skills/${id}`);
      if (response.data.success) {
        toast.success('Xóa kỹ năng thành công.');
        fetchSkills();
      }
    } catch (_) {
      toast.error('Xóa kỹ năng thất bại.');
    }
  };

  const toggleNodeOpen = (nodeId: string) => {
    const toggleInTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children.length > 0) {
          return { ...node, children: toggleInTree(node.children) };
        }
        return node;
      });
    };
    setTreeData(prev => toggleInTree(prev));
  };

  // Render a single node in tree view recursion
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    
    return (
      <div key={node.id} className="space-y-1.5" style={{ paddingLeft: `${depth * 16}px` }}>
        <div className="flex items-center justify-between p-3 bg-slate-950/40 hover:bg-slate-900/40 rounded-xl border border-slate-900/60 transition-colors">
          <div className="flex items-center gap-2 text-left">
            {hasChildren ? (
              <button 
                onClick={() => toggleNodeOpen(node.id)}
                className="text-slate-500 hover:text-slate-300 p-0.5"
              >
                {node.isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              </div>
            )}

            {hasChildren ? (
              node.isOpen ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <Folder className="w-4 h-4 text-amber-500" />
            ) : (
              <FileCode className="w-4 h-4 text-indigo-400" />
            )}

            <div>
              <span className="text-slate-200 text-xs font-semibold">{node.name}</span>
              <span className="text-[10px] text-slate-500 ml-2 font-mono">({node.slug})</span>
            </div>
          </div>

          <button
            onClick={() => handleDeleteSkill(node.id)}
            className="p-1 rounded-md bg-slate-950 hover:bg-rose-955/20 text-slate-500 hover:text-rose-400 border border-slate-900 transition-colors"
            title="Xóa kỹ năng"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {hasChildren && node.isOpen && (
          <div className="space-y-1.5">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Filter possible parent skills (only those without parents themselves to keep tree shallow, or all)
  const parentOptions = skills.filter(s => s.parentId === null);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
          Cây kỹ năng và Phân loại học thuật
          </h1>
        <p className="text-slate-400 text-sm mt-1">
          Định nghĩa cấu trúc phân cấp các môn học, kỹ năng phục vụ cho Bayesian Knowledge Tracing và Lộ trình tự thích ứng.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Treeview Display */}
        <div className="lg:col-span-7 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-4">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2 pb-3 border-b border-slate-900 uppercase tracking-wider text-left">
            <GitBranch className="w-5 h-5 text-indigo-500" />
            <span>Cây kỹ năng hiện tại</span>
          </h2>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
          ) : treeData.length === 0 ? (
            <p className="text-slate-550 text-xs py-12 text-center">Chưa định nghĩa kỹ năng nào.</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {treeData.map(node => renderTreeNode(node))}
            </div>
          )}
        </div>

        {/* Right: Add Form Card */}
        <div className="lg:col-span-5 bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-5 text-left">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2 pb-3 border-b border-slate-900 uppercase tracking-wider">
            <Plus className="w-5 h-5 text-emerald-500" />
            <span>Thêm kỹ năng mới</span>
          </h2>

          <form onSubmit={handleCreateSkill} className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Tên kỹ năng</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Lập trình Python, ReactJS..."
                className="bg-slate-950 border-slate-850 text-slate-200"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1">
              <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Mã định danh (Slug - Dùng cho API/URL)</label>
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Ví dụ: python-basics"
                className="bg-slate-955 border-slate-850 text-slate-350 font-mono"
              />
            </div>

            {/* Parent selector */}
            <div className="space-y-1">
              <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Kỹ năng cha (Chọn danh mục cha)</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 text-slate-350 py-2.5 px-3 rounded-xl text-xs focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">Không có (Gốc / Parent Skill)</option>
                {parentOptions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <span className="text-[9px] text-slate-500 block leading-normal mt-1">
                Kỹ năng cha sẽ chứa các nhánh nhỏ hơn (ví dụ Web Development chứa HTML/CSS, ReactJS).
              </span>
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-emerald-500/10"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Đang thêm...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Thêm kỹ năng mới</span>
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
