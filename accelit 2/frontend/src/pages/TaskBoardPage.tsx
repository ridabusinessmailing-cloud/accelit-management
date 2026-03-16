// src/pages/TaskBoardPage.tsx

import { useState, useMemo } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Calendar } from 'lucide-react';
import { useTasks, useUsers } from '@/hooks/useApi';
import type { UserOption } from '@/hooks/useApi';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  PageHeader, Button, Modal, Input, Textarea, Select,
  TaskTypeBadge, Spinner,
} from '@/components/ui';
import { formatDate, isDelayed, COLUMN_COLORS, cn, requiresAssetLink } from '@/lib/utils';
import { KANBAN_COLUMNS, type KanbanColumnId, type Task, type TaskType, type CompleteTaskResponse } from '@/types';

// ── Task Card ─────────────────────────────────────────────────────────
function TaskCard({
  task,
  onClick,
  isDragging = false,
}: {
  task:        Task;
  onClick:     (t: Task) => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style   = { transform: CSS.Transform.toString(transform), transition };
  const delayed = isDelayed(task.dueDate, task.status);
  const isDone  = task.status === 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={cn(
        'bg-[#F4F3FF] border border-purple-100 rounded-lg p-3 cursor-pointer select-none',
        'hover:border-purple-400 hover:bg-white hover:shadow-sm transition-all',
        isDragging && 'opacity-50',
        isDone && 'opacity-60'
      )}
    >
      <p className={cn('text-xs font-medium text-gray-800 mb-2 leading-snug', isDone && 'line-through text-gray-400')}>
        {task.title}
      </p>
      <div className="flex items-center justify-between gap-1 flex-wrap">
        {task.product && (
          <span className="text-[10px] text-purple-600 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded font-medium truncate max-w-[80px]">
            {task.product.name.split(' ')[0]}
          </span>
        )}
        <TaskTypeBadge type={task.type} />
      </div>
      <div className={cn('flex items-center gap-1 mt-2 text-[10px]', delayed ? 'text-red-500 font-semibold' : 'text-gray-400')}>
        <Calendar size={9} />
        {delayed && '⚑ '}{task.dueDate}
      </div>
      {task.visibility === 'admin_only' && (
        <p className="text-[10px] text-gray-400 mt-1.5">🔒 Admin only</p>
      )}
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────
function KanbanColumn({
  id: colId,
  tasks,
  onTaskClick,
}: {
  id:          KanbanColumnId;
  tasks:       Task[];
  onTaskClick: (t: Task) => void;
}) {
  const isDone      = colId === 'Done';
  const avatarColor = COLUMN_COLORS[colId] ?? 'bg-gray-400';

  return (
    <div className={cn(
      'w-52 min-w-52 bg-white border border-purple-100 rounded-xl flex flex-col',
      'max-h-[calc(100vh-180px)]',
      isDone && 'border-emerald-100'
    )}>
      <div className={cn('px-3.5 py-3 border-b flex items-center justify-between flex-shrink-0',
        isDone ? 'border-emerald-100' : 'border-purple-100'
      )}>
        <div className="flex items-center gap-2">
          <div className={cn('w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center', avatarColor)}>
            {colId[0]}
          </div>
          <span className="text-sm font-semibold text-gray-800">{colId}</span>
        </div>
        <span className="text-xs text-gray-400 bg-[#F4F3FF] rounded-full px-2 py-0.5 font-medium">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="text-xs text-gray-300 text-center py-6">Drop tasks here</p>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export function TaskBoardPage() {
  const { isAdmin, user } = useAuth();
  const { data: tasks,   loading: tasksLoading, refetch } = useTasks();
  const { data: users,   loading: usersLoading  }         = useUsers();

  const [activeTask,      setActiveTask]      = useState<Task | null>(null);
  const [selectedTask,    setSelectedTask]    = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [completeModal,   setCompleteModal]   = useState<Task | null>(null);
  const [assetLinkInput,  setAssetLinkInput]  = useState('');
  const [completing,      setCompleting]      = useState(false);
  const [completeError,   setCompleteError]   = useState('');
  const [autoAssetToast,  setAutoAssetToast]  = useState<string | null>(null);

  // Build name → UUID map from real user list
  const userByName = useMemo<Record<string, UserOption>>(() => {
    if (!users) return {};
    return Object.fromEntries(users.map(u => [u.name, u]));
  }, [users]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Map tasks into Kanban columns using assignee name
  const columnTasks = useMemo(() => {
    if (!tasks) return {} as Record<KanbanColumnId, Task[]>;
    return KANBAN_COLUMNS.reduce((acc, col) => {
      acc[col] = col === 'Done'
        ? tasks.filter(t => t.status === 'done')
        : tasks.filter(t => t.assignee?.name === col && t.status !== 'done');
      return acc;
    }, {} as Record<KanbanColumnId, Task[]>);
  }, [tasks]);

  function showToast(msg: string) {
    setAutoAssetToast(msg);
    setTimeout(() => setAutoAssetToast(null), 4000);
  }

  // ── Drag handlers ─────────────────────────────────────────────────

  function onDragStart({ active }: DragStartEvent) {
    setActiveTask(tasks?.find(t => t.id === active.id) ?? null);
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    if (!over || active.id === over.id) return;

    const task = tasks?.find(t => t.id === active.id);
    if (!task) return;

    // Resolve target column
    let targetCol: KanbanColumnId | null = null;
    if (KANBAN_COLUMNS.includes(over.id as KanbanColumnId)) {
      targetCol = over.id as KanbanColumnId;
    } else {
      for (const col of KANBAN_COLUMNS) {
        if (columnTasks[col]?.some(t => t.id === over.id)) { targetCol = col; break; }
      }
    }

    if (!targetCol) return;

    const currentCol = task.status === 'done' ? 'Done' : (task.assignee?.name as KanbanColumnId);
    if (targetCol === currentCol) return;

    if (targetCol === 'Done') {
      // Open complete modal — validate asset link before marking done
      setCompleteModal(task);
      setAssetLinkInput(task.assetLink ?? '');
      setCompleteError('');
    } else {
      // Resolve target user UUID from column name
      const targetUser = userByName[targetCol];
      if (!targetUser) return;

      try {
        await api.patch(`/tasks/${task.id}`, {
          assignedTo: targetUser.id,   // ✓ sends UUID, not name
          status: 'in_progress',
        });
        refetch();
      } catch {
        // Could add optimistic rollback here in v1.1
      }
    }
  }

  // ── Complete task ─────────────────────────────────────────────────

  async function handleComplete() {
    if (!completeModal) return;
    if (requiresAssetLink(completeModal.type) && !assetLinkInput.trim()) {
      setCompleteError(`Asset link is required for "${completeModal.type.replace(/_/g, ' ')}" tasks.`);
      return;
    }
    setCompleting(true);
    setCompleteError('');
    try {
      const { data } = await api.post<CompleteTaskResponse>(
        `/tasks/${completeModal.id}/complete`,
        assetLinkInput.trim() ? { assetLink: assetLinkInput.trim() } : {}
      );
      setCompleteModal(null);
      if (data.assetCreated && data.asset) {
        showToast(`⚡ Asset auto-created: "${data.asset.name}"`);
      } else {
        showToast(`✅ Task "${completeModal.title}" marked as done`);
      }
      refetch();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Failed to complete task';
      setCompleteError(msg);
    } finally {
      setCompleting(false);
    }
  }

  // ── Create task ───────────────────────────────────────────────────

  const [createForm, setCreateForm] = useState({
    title: '', description: '', assignedTo: '',
    productId: '', type: 'creative_video' as TaskType,
    visibility: 'team', dueDate: '', assetLink: '',
  });
  const [creating, setCreating] = useState(false);

  async function handleCreateTask() {
    setCreating(true);
    try {
      await api.post('/tasks', {
        title:       createForm.title,
        description: createForm.description || undefined,
        assignedTo:  createForm.assignedTo,    // ✓ UUID from select value
        productId:   createForm.productId || undefined,
        type:        createForm.type,
        visibility:  createForm.visibility,
        dueDate:     createForm.dueDate,
        assetLink:   createForm.assetLink || undefined,
      });
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', assignedTo: '', productId: '', type: 'creative_video', visibility: 'team', dueDate: '', assetLink: '' });
      refetch();
    } finally {
      setCreating(false);
    }
  }

  const loading = tasksLoading || usersLoading;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner className="w-6 h-6" />
    </div>
  );

  return (
    <div className="p-7 h-full flex flex-col">
      <PageHeader
        title="Task Board"
        description="Kanban board — drag tasks between columns"
        action={
          isAdmin ? (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={14} /> New Task
            </Button>
          ) : undefined
        }
      />

      {/* Auto-asset toast */}
      {autoAssetToast && (
        <div className="mb-4 flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 text-sm font-medium px-4 py-2.5 rounded-lg">
          {autoAssetToast}
        </div>
      )}

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-3.5 h-full min-w-max">
            {KANBAN_COLUMNS.map(col => (
              <KanbanColumn
                key={col}
                id={col}
                tasks={columnTasks[col] ?? []}
                onTaskClick={setSelectedTask}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} onClick={() => {}} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* ── Task detail modal ──────────────────────────────── */}
      <Modal open={!!selectedTask} onClose={() => setSelectedTask(null)} title={selectedTask?.title ?? ''}>
        {selectedTask && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <TaskTypeBadge type={selectedTask.type} />
              {selectedTask.visibility === 'admin_only' && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">🔒 Admin only</span>
              )}
              {selectedTask.status === 'done' && (
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">✓ Done</span>
              )}
            </div>
            {selectedTask.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{selectedTask.description}</p>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {([
                ['Assigned to', selectedTask.assignee?.name],
                ['Product',     selectedTask.product?.name ?? '—'],
                ['Due date',    selectedTask.dueDate],
                ['Status',      selectedTask.status.replace('_', ' ')],
                ['Created by',  selectedTask.creator?.name],
                ['Visibility',  selectedTask.visibility],
              ] as [string, string][]).map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">{l}</p>
                  <p className="font-medium text-gray-800">{v}</p>
                </div>
              ))}
            </div>
            {selectedTask.assetLink && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Asset Link</p>
                <a href={selectedTask.assetLink} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:underline break-all">
                  {selectedTask.assetLink}
                </a>
              </div>
            )}
            {selectedTask.status !== 'done' && (isAdmin || selectedTask.assignedTo === user?.userId) && (
              <div className="pt-2 flex justify-end">
                <Button onClick={() => {
                  setSelectedTask(null);
                  setCompleteModal(selectedTask);
                  setAssetLinkInput(selectedTask.assetLink ?? '');
                  setCompleteError('');
                }}>
                  Mark as Done ✓
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Complete task modal ────────────────────────────── */}
      <Modal open={!!completeModal} onClose={() => setCompleteModal(null)} title="Complete Task">
        {completeModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Completing: <strong>{completeModal.title}</strong>
            </p>
            <div className={cn(
              'rounded-lg p-3 text-xs font-medium border',
              requiresAssetLink(completeModal.type)
                ? 'bg-purple-50 border-purple-200 text-purple-700'
                : 'bg-gray-50 border-gray-200 text-gray-500'
            )}>
              {requiresAssetLink(completeModal.type)
                ? `⚡ "${completeModal.type.replace(/_/g, ' ')}" tasks require an asset link — it will be saved to Product Assets automatically.`
                : 'Asset link is optional for this task type.'}
            </div>
            <Input
              label={`Asset Link ${requiresAssetLink(completeModal.type) ? '(required)' : '(optional)'}`}
              type="url"
              value={assetLinkInput}
              onChange={e => setAssetLinkInput(e.target.value)}
              placeholder="https://drive.google.com/…"
            />
            {completeError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {completeError}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="secondary" onClick={() => setCompleteModal(null)}>Cancel</Button>
              <Button onClick={handleComplete} loading={completing}>Confirm Done ✓</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create task modal ──────────────────────────────── */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Task">
        <div className="space-y-3">
          <Input
            label="Title *"
            value={createForm.title}
            onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. 10 UGC Videos — Brain Supplement"
          />
          <Textarea
            label="Description"
            value={createForm.description}
            onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What needs to be done?"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assign To *"
              value={createForm.assignedTo}
              onChange={e => setCreateForm(f => ({ ...f, assignedTo: e.target.value }))}
            >
              <option value="">— Select —</option>
              {/* ✓ value is user.id (UUID), label is user.name */}
              {users?.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
            <Select
              label="Task Type *"
              value={createForm.type}
              onChange={e => setCreateForm(f => ({ ...f, type: e.target.value as TaskType }))}
            >
              <option value="creative_video">Creative Video</option>
              <option value="creative_image">Creative Image</option>
              <option value="landing_page">Landing Page</option>
              <option value="research">Research</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date *"
              type="date"
              value={createForm.dueDate}
              onChange={e => setCreateForm(f => ({ ...f, dueDate: e.target.value }))}
            />
            <Select
              label="Visibility"
              value={createForm.visibility}
              onChange={e => setCreateForm(f => ({ ...f, visibility: e.target.value }))}
            >
              <option value="team">Team (everyone)</option>
              <option value="admin_only">Admin only</option>
            </Select>
          </div>
          <Input
            label="Asset Link (optional)"
            type="url"
            value={createForm.assetLink}
            onChange={e => setCreateForm(f => ({ ...f, assetLink: e.target.value }))}
            placeholder="https://drive.google.com/…"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button
              onClick={handleCreateTask}
              loading={creating}
              disabled={!createForm.title.trim() || !createForm.dueDate || !createForm.assignedTo}
            >
              Create Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
