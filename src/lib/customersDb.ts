import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firestoreDb';
import { Customer } from '../types';

export function subscribeToCustomers(
  userId: string,
  onData: (customers: Customer[]) => void,
  onError?: (error: Error) => void
): () => void {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid) return () => {};
  const path = `users/${uid}/customers`;
  const customersRef = collection(db, 'users', uid, 'customers');
  return onSnapshot(
    customersRef,
    (snapshot) => {
      const results: Customer[] = [];
      snapshot.forEach((docSnap) => {
        results.push({ id: docSnap.id, ...docSnap.data() } as Customer);
      });
      // Sort by newest first
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(results);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export async function saveCustomerToFirestore(
  userId: string,
  customer: Customer
): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  const custId = customer && typeof customer === 'object' ? String(customer.id || '') : String(customer || '');
  if (!uid || !custId) return;
  const path = `users/${uid}/customers/${custId}`;
  const customerRef = doc(db, 'users', uid, 'customers', custId);
  const payload = { ...customer, id: custId };
  try {
    await setDoc(customerRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteCustomerFromFirestore(
  userId: string,
  customerId: string | { id?: string }
): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  const resolvedId = typeof customerId === 'object' && customerId !== null ? customerId.id : customerId;
  const custId = resolvedId ? String(resolvedId) : '';
  if (!uid || !custId) return;
  const path = `users/${uid}/customers/${custId}`;
  const customerRef = doc(db, 'users', uid, 'customers', custId);
  try {
    await deleteDoc(customerRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}
