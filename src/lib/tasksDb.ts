import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
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

export function subscribeToTasks(
  userId: string,
  onData: (tasks: SourcingTask[]) => void,
  onError?: (err: Error) => void
) {
  const path = `users/${userId}/tasks`;
  try {
    const colRef = collection(db, 'users', userId, 'tasks');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const tasks: SourcingTask[] = [];
        snapshot.forEach((docSnap) => {
          tasks.push({ ...(docSnap.data() as SourcingTask), id: docSnap.id });
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
  const path = `users/${userId}/tasks/${task.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'tasks', task.id);
    await setDoc(docRef, task, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteTaskFromFirestore(userId: string, taskId: string): Promise<void> {
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    const docRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

export async function batchSaveTasksToFirestore(userId: string, tasks: SourcingTask[]): Promise<void> {
  const path = `users/${userId}/tasks`;
  try {
    const batch = writeBatch(db);
    tasks.forEach((task) => {
      const docRef = doc(db, 'users', userId, 'tasks', task.id);
      batch.set(docRef, task, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}
