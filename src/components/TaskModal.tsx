import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Flame,
  Zap,
  Coffee,
  Tag,
  Link as LinkIcon,
  User,
  Clock,
  FileText,
} from 'lucide-react';
import { SourcingTask, TaskPriority, TaskStatus, TaskCategory, InquiryItem, Customer } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: SourcingTask) => void;
  taskToEdit?: SourcingTask | null;
  inquiries?: InquiryItem[];
  customers?: Customer[];
}

const CATEGORIES: TaskCategory[] = [
  'Sourcing & 1688',
  'Factory & Samples',
  'Client Follow-up',
  'QC & Inspection',
  'Shipping & Logistics',
  'Payments & Finance',
  'General',
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  inquiries = [],
  customers = [],
}) => {
  const [formData, setFormData] = useState<Partial<SourcingTask>>({
    title: '',
    description: '',
    priority: 'high',
    status: 'todo',
    category: 'Sourcing & 1688',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    linkedInquiryNumber: '',
    clientName: '',
  });

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        ...taskToEdit,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'high',
        status: 'todo',
        category: 'Sourcing & 1688',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        linkedInquiryNumber: '',
        clientName: '',
      });
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('Please enter a task title');
      return;
    }

    const newTask: SourcingTask = {
      id: taskToEdit?.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: formData.title.trim(),
      description: formData.description?.trim() || '',
      priority: formData.priority || 'medium',
      status: formData.status || 'todo',
      category: formData.category || 'General',
      dueDate: formData.dueDate || undefined,
      linkedInquiryNumber: formData.linkedInquiryNumber || undefined,
      clientName: formData.clientName?.trim() || undefined,
      completedAt: formData.status === 'completed' ? (taskToEdit?.completedAt || new Date().toISOString()) : undefined,
      orderIndex: taskToEdit?.orderIndex !== undefined ? taskToEdit.orderIndex : 0,
      createdAt: taskToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newTask);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {taskToEdit ? 'Edit To-Do Task' : 'New Priority Task'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Manage actionable sourcing milestones, deadlines & priorities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Task Title / Action Item <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Inspect pre-production samples at Yiwu factory"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
              autoFocus
            />
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Priority Level</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'urgent' })}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                  formData.priority === 'urgent'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Flame className={`w-4 h-4 ${formData.priority === 'urgent' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span className="text-[11px]">Urgent</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'high' })}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                  formData.priority === 'high'
                    ? 'bg-amber-50 border-amber-400 text-amber-800 ring-2 ring-amber-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Zap className={`w-4 h-4 ${formData.priority === 'high' ? 'text-amber-500' : 'text-slate-400'}`} />
                <span className="text-[11px]">High</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'medium' })}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                  formData.priority === 'medium'
                    ? 'bg-blue-50 border-blue-400 text-blue-800 ring-2 ring-blue-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className={`w-4 h-4 ${formData.priority === 'medium' ? 'text-blue-500' : 'text-slate-400'}`} />
                <span className="text-[11px]">Medium</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'low' })}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                  formData.priority === 'low'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Coffee className={`w-4 h-4 ${formData.priority === 'low' ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className="text-[11px]">Low</span>
              </button>
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Category</span>
              </label>
              <select
                value={formData.category || 'General'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status || 'todo'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
              >
                <option value="todo">Pending / To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date & Linked Client */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Client Name</span>
              </label>
              <input
                type="text"
                list="client-suggestions"
                placeholder="e.g. Sarah Jenkins"
                value={formData.clientName || ''}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
              />
              <datalist id="client-suggestions">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Link to Active Inquiry (Optional) */}
          {inquiries.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Link to Inquiry (Optional)</span>
              </label>
              <select
                value={formData.linkedInquiryNumber || ''}
                onChange={(e) => {
                  const selectedNum = e.target.value;
                  const foundInq = inquiries.find((i) => i.inquiryNumber === selectedNum);
                  setFormData({
                    ...formData,
                    linkedInquiryNumber: selectedNum,
                    clientName: foundInq?.customerName || formData.clientName,
                  });
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
              >
                <option value="">-- No linked inquiry --</option>
                {inquiries.map((inq) => (
                  <option key={inq.id} value={inq.inquiryNumber}>
                    {inq.inquiryNumber} - {inq.customerName} ({inq.product || 'Inquiry'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description & Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Details / Notes / Checkpoints</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Call factory boss Mr. Wang directly on WeChat (+86 138...). Request 2 samples in matte black finish..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{taskToEdit ? 'Update Task' : 'Save Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
