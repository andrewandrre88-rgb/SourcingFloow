import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Zap,
  Clock,
  Coffee,
  AlertTriangle,
  Calendar,
  Tag,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Check,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { SourcingTask, TaskPriority, TaskStatus, TaskCategory, InquiryItem, Customer } from '../types';

interface TasksPageProps {
  tasks: SourcingTask[];
  inquiries: InquiryItem[];
  customers: Customer[];
  onAddTask: () => void;
  onEditTask: (task: SourcingTask) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskStatus: (taskId: string) => void;
  onChangeTaskPriority: (taskId: string, priority: TaskPriority) => void;
  onQuickAddTask: (title: string, priority: TaskPriority, category: TaskCategory, dueDate?: string) => void;
  onViewInquiry?: (inquiry: InquiryItem) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  inquiries,
  customers,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTaskStatus,
  onChangeTaskPriority,
  onQuickAddTask,
  onViewInquiry,
}) => {
  const [viewMode, setViewMode] = useState<'columns' | 'list'>('columns');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TaskCategory>('all');

  // Quick add input states
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('high');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('Sourcing & 1688');
  const [quickDueDate, setQuickDueDate] = useState('');

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAddTask(quickTitle.trim(), quickPriority, quickCategory, quickDueDate || undefined);
    setQuickTitle('');
    setQuickDueDate('');
  };

  // Metrics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = total - completed;
    const urgentAndHigh = tasks.filter(
      (t) => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed'
    ).length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(
      (t) => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr
    ).length;
    const dueToday = tasks.filter(
      (t) => t.status !== 'completed' && t.dueDate && t.dueDate === todayStr
    ).length;

    return { total, completed, pending, urgentAndHigh, inProgress, completionPct, overdue, dueToday };
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesClient = t.clientName?.toLowerCase().includes(q);
        const matchesInq = t.linkedInquiryNumber?.toLowerCase().includes(q);
        const matchesCat = t.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesClient && !matchesInq && !matchesCat) {
          return false;
        }
      }

      // Priority
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
        return false;
      }

      // Status
      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== 'all' && t.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, priorityFilter, statusFilter, categoryFilter]);

  // Priority groups
  const urgentTasks = useMemo(
    () => filteredTasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed'),
    [filteredTasks]
  );
  const highTasks = useMemo(
    () => filteredTasks.filter((t) => t.priority === 'high' && t.status !== 'completed'),
    [filteredTasks]
  );
  const mediumTasks = useMemo(
    () => filteredTasks.filter((t) => t.priority === 'medium' && t.status !== 'completed'),
    [filteredTasks]
  );
  const lowTasks = useMemo(
    () => filteredTasks.filter((t) => t.priority === 'low' && t.status !== 'completed'),
    [filteredTasks]
  );
  const completedTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'completed'),
    [filteredTasks]
  );

  const getDueDateLabel = (dueDate?: string) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = dueDate.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' };
    }
    if (diffDays === 0) {
      return { text: 'Due Today', color: 'bg-amber-50 text-amber-800 border-amber-300 font-bold animate-pulse' };
    }
    if (diffDays === 1) {
      return { text: 'Due Tomorrow', color: 'bg-amber-50 text-amber-700 border-amber-200 font-medium' };
    }
    if (diffDays <= 7) {
      return { text: `Due in ${diffDays}d`, color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    return { text: dueDate, color: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  const renderPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <Flame className="w-3 h-3 text-rose-600" />
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Zap className="w-3 h-3 text-amber-600" />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Coffee className="w-3 h-3 text-emerald-600" />
            Low
          </span>
        );
    }
  };

  const renderTaskCard = (task: SourcingTask) => {
    const isDone = task.status === 'completed';
    const dueInfo = getDueDateLabel(task.dueDate);

    return (
      <div
        key={task.id}
        className={`rounded-xl border p-3.5 sm:p-4 transition-all duration-150 shadow-2xs group relative ${
          isDone
            ? 'bg-slate-50/70 border-slate-200 opacity-75'
            : task.priority === 'urgent'
            ? 'bg-white border-rose-200 hover:border-rose-400 hover:shadow-xs'
            : task.priority === 'high'
            ? 'bg-white border-amber-200 hover:border-amber-400 hover:shadow-xs'
            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
        }`}
      >
        <div className="flex items-start gap-2.5">
          {/* Status Checkbox */}
          <button
            type="button"
            onClick={() => onToggleTaskStatus(task.id)}
            className="mt-0.5 text-slate-400 hover:text-indigo-600 transition shrink-0 cursor-pointer"
            title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
          >
            {isDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
            ) : (
              <Circle className="w-5 h-5 hover:text-indigo-600" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            {/* Title & Priority Badge */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
              <span
                className={`text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words ${
                  isDone ? 'line-through text-slate-400 font-normal' : ''
                }`}
              >
                {task.title}
              </span>
              <div className="shrink-0">{renderPriorityBadge(task.priority)}</div>
            </div>

            {/* Description */}
            {task.description && (
              <p
                className={`text-xs text-slate-600 line-clamp-2 mb-2 ${
                  isDone ? 'line-through text-slate-400' : ''
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Badges: Category, Due Date, Linked Inquiry, Client */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
              {/* Category */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                <Tag className="w-2.5 h-2.5 text-slate-400" />
                {task.category}
              </span>

              {/* Due Date */}
              {dueInfo && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] ${dueInfo.color}`}
                >
                  <Calendar className="w-2.5 h-2.5" />
                  {dueInfo.text}
                </span>
              )}

              {/* Linked Inquiry */}
              {task.linkedInquiryNumber && (
                <button
                  type="button"
                  onClick={() => {
                    if (onViewInquiry) {
                      const found = inquiries.find((i) => i.inquiryNumber === task.linkedInquiryNumber);
                      if (found) onViewInquiry(found);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono font-semibold border border-indigo-200 transition cursor-pointer"
                  title="Click to view linked inquiry"
                >
                  <span>{task.linkedInquiryNumber}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              )}

              {/* Client Name */}
              {task.clientName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                  {task.clientName}
                </span>
              )}
            </div>

            {/* Card Footer: Quick Actions */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Priority:</span>
                <select
                  value={task.priority}
                  onChange={(e) => onChangeTaskPriority(task.id, e.target.value as TaskPriority)}
                  className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 hover:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="urgent">🔥 Urgent</option>
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEditTask(task)}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                  title="Edit task"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header & Overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>To-Do List & Priority Tasks</span>
                {stats.urgentAndHigh > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 animate-pulse">
                    <Flame className="w-3 h-3 text-rose-600" />
                    {stats.urgentAndHigh} Urgent / High
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track sourcing milestones, factory samples, QC audits, and supplier follow-ups by priority
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('columns')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'columns'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Organize tasks in priority columns"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Priority Columns</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View all tasks in priority order"
            >
              <List className="w-3.5 h-3.5" />
              <span>Priority List</span>
            </button>
          </div>

          {/* New Task Button */}
          <button
            type="button"
            id="tasks-add-new-btn"
            onClick={onAddTask}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Task</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Tasks</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">{stats.pending}</span>
            <span className="text-[11px] text-slate-400">of {stats.total} total</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Urgent & High</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-rose-700">{stats.urgentAndHigh}</span>
            {stats.overdue > 0 && (
              <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                {stats.overdue} overdue
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-blue-700">{stats.inProgress}</span>
            <span className="text-[11px] text-slate-400">working now</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-700">{stats.completed}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">{stats.completionPct}% done</span>
          </div>
        </div>
      </div>

      {/* Quick 1-Click Inline Add Input */}
      <form
        onSubmit={handleQuickAddSubmit}
        className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row items-center gap-2.5"
      >
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Quick add a new task according to priority (e.g. Call factory for packaging drop test)..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Priority selector */}
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
            className={`px-2.5 py-2 rounded-lg text-xs font-bold border transition cursor-pointer shrink-0 ${
              quickPriority === 'urgent'
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : quickPriority === 'high'
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : quickPriority === 'medium'
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            <option value="urgent">🔥 Urgent Priority</option>
            <option value="high">🔴 High Priority</option>
            <option value="medium">🟡 Medium Priority</option>
            <option value="low">🟢 Low Priority</option>
          </select>

          {/* Category */}
          <select
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
            className="px-2.5 py-2 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 shrink-0 cursor-pointer"
          >
            <option value="Sourcing & 1688">Sourcing & 1688</option>
            <option value="Factory & Samples">Factory & Samples</option>
            <option value="Client Follow-up">Client Follow-up</option>
            <option value="QC & Inspection">QC & Inspection</option>
            <option value="Shipping & Logistics">Shipping & Logistics</option>
            <option value="Payments & Finance">Payments & Finance</option>
            <option value="General">General</option>
          </select>

          {/* Due Date */}
          <input
            type="date"
            value={quickDueDate}
            onChange={(e) => setQuickDueDate(e.target.value)}
            className="px-2.5 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 shrink-0"
            title="Optional due date"
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer shadow-xs active:scale-95"
          >
            + Add
          </button>
        </div>
      </form>

      {/* Filter and Search Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks, clients, inquiries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
            />
          </div>

          {(searchQuery || priorityFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter('all');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
              className="text-xs text-indigo-600 hover:underline shrink-0 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Priority Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Priority:</span>
          {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition shrink-0 cursor-pointer capitalize ${
                priorityFilter === p
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p === 'urgent' ? '🔥 Urgent' : p === 'high' ? '🔴 High' : p === 'medium' ? '🟡 Medium' : p === 'low' ? '🟢 Low' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Columns or List */}
      {viewMode === 'columns' ? (
        /* Priority Columns View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {/* Column 1: 🔥 Urgent Priority */}
          <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  Urgent Priority
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 font-mono">
                {urgentTasks.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {urgentTasks.length > 0 ? (
                urgentTasks.map(renderTaskCard)
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg bg-white/60">
                  <p className="text-xs text-slate-400">No urgent tasks pending</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: 🔴 High Priority */}
          <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  High Priority
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 font-mono">
                {highTasks.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {highTasks.length > 0 ? (
                highTasks.map(renderTaskCard)
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg bg-white/60">
                  <p className="text-xs text-slate-400">No high priority tasks</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: 🟡 Medium Priority */}
          <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Medium Priority
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                {mediumTasks.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {mediumTasks.length > 0 ? (
                mediumTasks.map(renderTaskCard)
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg bg-white/60">
                  <p className="text-xs text-slate-400">No medium priority tasks</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 4: 🟢 Low Priority & Completed */}
          <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 text-emerald-600" />
                  Low & Done
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                {lowTasks.length + completedTasks.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {lowTasks.map(renderTaskCard)}
              {completedTasks.length > 0 && (
                <div className="pt-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                    Completed ({completedTasks.length})
                  </div>
                  <div className="space-y-2">
                    {completedTasks.map(renderTaskCard)}
                  </div>
                </div>
              )}
              {lowTasks.length === 0 && completedTasks.length === 0 && (
                <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg bg-white/60">
                  <p className="text-xs text-slate-400">No tasks in this list</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Priority List View */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              All Tasks Sorted by Priority ({filteredTasks.length})
            </span>
          </div>

          <div className="divide-y divide-slate-100 p-3 sm:p-4 space-y-2.5">
            {filteredTasks.length > 0 ? (
              // Order by priority: urgent -> high -> medium -> low -> completed
              [...filteredTasks]
                .sort((a, b) => {
                  if (a.status === 'completed' && b.status !== 'completed') return 1;
                  if (a.status !== 'completed' && b.status === 'completed') return -1;
                  const rank: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
                  return rank[a.priority] - rank[b.priority];
                })
                .map(renderTaskCard)
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No tasks found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting your filters or use the quick add bar above to create a task!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
