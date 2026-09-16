import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firestoreDb';
import { ExpenseItem } from '../types';
import { SAMPLE_EXPENSES } from './sampleExpenses';

export const STORAGE_KEY_LOCAL_EXPENSES = 'sourcing_agent_expenses_data_v1';

export function getLocalExpenses(): ExpenseItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOCAL_EXPENSES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse local expenses:', e);
  }
  return SAMPLE_EXPENSES;
}

export function saveLocalExpenses(expenses: ExpenseItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_EXPENSES, JSON.stringify(expenses));
  } catch (e) {
    console.error('Failed to save local expenses:', e);
  }
}

export function subscribeToExpenses(
  userId: string,
  onData: (expenses: ExpenseItem[]) => void,
  onError?: (error: Error) => void
): () => void {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid) return () => {};
  const path = `users/${uid}/expenses`;
  const expensesRef = collection(db, 'users', uid, 'expenses');
  return onSnapshot(
    expensesRef,
    (snapshot) => {
      const results: ExpenseItem[] = [];
      snapshot.forEach((docSnap) => {
        results.push({ id: docSnap.id, ...docSnap.data() } as ExpenseItem);
      });
      // Sort by newest date first
      results.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
      onData(results);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export async function saveExpenseToFirestore(
  userId: string,
  expense: ExpenseItem
): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  const expId = expense && typeof expense === 'object' ? String(expense.id || '') : String(expense || '');
  if (!uid || !expId) return;
  const path = `users/${uid}/expenses/${expId}`;
  const expenseRef = doc(db, 'users', uid, 'expenses', expId);
  const payload = { ...expense, id: expId };
  try {
    await setDoc(expenseRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteExpenseFromFirestore(
  userId: string,
  expenseId: string | { id?: string }
): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  const resolvedId = typeof expenseId === 'object' && expenseId !== null ? expenseId.id : expenseId;
  const expId = resolvedId ? String(resolvedId) : '';
  if (!uid || !expId) return;
  const path = `users/${uid}/expenses/${expId}`;
  const expenseRef = doc(db, 'users', uid, 'expenses', expId);
  try {
    await deleteDoc(expenseRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}
