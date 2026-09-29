import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firestoreDb';
import { SourcingTask, TaskPriority, TaskCategory } from '../types';

export const STORAGE_KEY_LOCAL_TASKS = 'sourcing_flow_tasks_v1';

export const INITIAL_SAMPLE_TASKS: SourcingTask[] = [
  {
    id: 'task_1',
    title: 'Request golden pre-production samples from glass factory',
    description: 'Ensure 350ml double-wall glass mugs meet client heat-resistance test specs before mass production.',
    priority: 'urgent',
    status: 'in_progress',
    category: 'Factory & Samples',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    linkedInquiryNumber: 'INQ-2026-001',
    clientName: 'Sarah Jenkins',
    orderIndex: 0,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_2',
    title: 'Verify 1688 business license & factory audit video',
    description: 'Check supplier real factory registration in Dongguan, verify export license and VAT invoice capability.',
    priority: 'urgent',
    status: 'todo',
    category: 'Sourcing & 1688',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    linkedInquiryNumber: 'INQ-2026-002',
    clientName: 'Liam Vance',
    orderIndex: 1,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_3',
    title: 'Confirm DDP sea freight quotation with Ningbo freight forwarder',
    description: 'Compare 20ft container rates from Ningbo to Long Beach port (LCL vs FCL transit time 22 days).',
    priority: 'high',
    status: 'todo',
    category: 'Shipping & Logistics',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    orderIndex: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_4',
    title: 'Send formal Chinese B2B Quotation sheet to client for approval',
    description: 'Deliver landed cost breakdown with 25% margin and domestic shipping included.',
    priority: 'high',
    status: 'todo',
    category: 'Client Follow-up',
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    clientName: 'David Chen',
    orderIndex: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_5',
    title: 'Inspect master carton drop test & barcode labeling',
    description: 'Follow 5-ply carton drop test standard and Amazon FBA carton label placement.',
    priority: 'medium',
    status: 'todo',
    category: 'QC & Inspection',
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    orderIndex: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_6',
    title: 'Collect 13% Chinese VAT Fapiao (发票) from supplier',
    description: 'Required for export tax refund and financial bookkeeping reconciliation.',
    priority: 'low',
    status: 'completed',
    category: 'Payments & Finance',
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    completedAt: new Date().toISOString(),
    orderIndex: 5,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function cleanTaskPayload(task: SourcingTask, userId: string): Record<string, any> {
  const payload: Record<string, any> = {
    id: String(task.id),
    userId: String(userId),
    title: task.title ? String(task.title).trim() : 'Untitled Task',
    priority: task.priority || 'medium',
    status: task.status || 'todo',
    category: task.category || 'General',
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (task.description && task.description.trim()) {
    payload.description = task.description.trim();
  }
  if (task.dueDate && task.dueDate.trim()) {
    payload.dueDate = task.dueDate.trim();
  }
  if (task.linkedInquiryId && task.linkedInquiryId.trim()) {
    payload.linkedInquiryId = task.linkedInquiryId.trim();
  }
  if (task.linkedInquiryNumber && task.linkedInquiryNumber.trim()) {
    payload.linkedInquiryNumber = task.linkedInquiryNumber.trim();
  }
  if (task.clientName && task.clientName.trim()) {
    payload.clientName = task.clientName.trim();
  }
  if (task.completedAt) {
    payload.completedAt = task.completedAt;
  }
  if (task.orderIndex !== undefined && task.orderIndex !== null) {
    payload.orderIndex = Number(task.orderIndex);
  }

  return payload;
}

export function loadLocalTasks(): SourcingTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_TASKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Tasks] Failed to read tasks from localStorage:', e);
  }
  return INITIAL_SAMPLE_TASKS;
}

export function saveLocalTasks(tasks: SourcingTask[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.warn('[Tasks] Failed to save tasks to localStorage:', e);
  }
}

export async function migrateLocalTasksToFirestoreIfEmpty(
  userId: string,
  localTasks: SourcingTask[]
): Promise<{ migrated: boolean; count: number }> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid) return { migrated: false, count: 0 };
  const path = `users/${uid}/tasks`;
  try {
    const colRef = collection(db, 'users', uid, 'tasks');
    const snap = await getDocs(colRef);
    if (snap.empty && localTasks && localTasks.length > 0) {
      const batch = writeBatch(db);
      localTasks.forEach((t) => {
        const docRef = doc(db, 'users', uid, 'tasks', t.id);
        batch.set(docRef, cleanTaskPayload(t, uid), { merge: true });
      });
      await batch.commit();
      return { migrated: true, count: localTasks.length };
    }
    return { migrated: false, count: snap.size };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return { migrated: false, count: 0 };
  }
}

export function subscribeToTasks(
  userId: string,
  onData: (tasks: SourcingTask[]) => void,
  onError?: (err: Error) => void
) {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid) return () => {};
  const path = `users/${uid}/tasks`;
  try {
    const colRef = collection(db, 'users', uid, 'tasks');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const tasks: SourcingTask[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          tasks.push({
            id: docSnap.id,
            title: d.title || 'Untitled Task',
            description: d.description || '',
            priority: (d.priority as TaskPriority) || 'medium',
            status: d.status || 'todo',
            category: (d.category as TaskCategory) || 'General',
            dueDate: d.dueDate || undefined,
            linkedInquiryId: d.linkedInquiryId || undefined,
            linkedInquiryNumber: d.linkedInquiryNumber || undefined,
            clientName: d.clientName || undefined,
            completedAt: d.completedAt || undefined,
            orderIndex: d.orderIndex !== undefined ? Number(d.orderIndex) : undefined,
            createdAt: d.createdAt || new Date().toISOString(),
            updatedAt: d.updatedAt || new Date().toISOString(),
          });
        });

        // Sort by orderIndex first, then by priority (urgent -> high -> medium -> low), then newest
        const priorityWeights: Record<TaskPriority, number> = {
          urgent: 0,
          high: 1,
          medium: 2,
          low: 3,
        };

        tasks.sort((a, b) => {
          // Completed items go after active items
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (a.status !== 'completed' && b.status === 'completed') return -1;

          // If custom orderIndex is set
          if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
            return a.orderIndex - b.orderIndex;
          }

          // Next by priority weight
          const weightA = priorityWeights[a.priority] ?? 2;
          const weightB = priorityWeights[b.priority] ?? 2;
          if (weightA !== weightB) {
            return weightA - weightB;
          }

          // Next by due date if exists
          if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
            return a.dueDate.localeCompare(b.dueDate);
          }

          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        onData(tasks);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveTaskToFirestore(userId: string, task: SourcingTask): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  const taskId = task && task.id ? String(task.id) : '';
  if (!uid || !taskId) return;
  const path = `users/${uid}/tasks/${taskId}`;
  try {
    const docRef = doc(db, 'users', uid, 'tasks', taskId);
    const payload = cleanTaskPayload(task, uid);
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteTaskFromFirestore(userId: string, taskId: string): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  const tid = String(taskId || '');
  if (!uid || !tid) return;
  const path = `users/${uid}/tasks/${tid}`;
  try {
    const docRef = doc(db, 'users', uid, 'tasks', tid);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

export async function batchSaveTasksToFirestore(userId: string, tasks: SourcingTask[]): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid || !tasks || tasks.length === 0) return;
  const path = `users/${uid}/tasks`;
  try {
    const batch = writeBatch(db);
    tasks.forEach((task) => {
      const docRef = doc(db, 'users', uid, 'tasks', task.id);
      batch.set(docRef, cleanTaskPayload(task, uid), { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}
