import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firestoreDb';
import { ServiceRequest } from '../types';
import { SAMPLE_SERVICES } from './sampleServices';

export const STORAGE_KEY_LOCAL_SERVICES = 'sourcing_agent_services_data_v1';

export function getLocalServices(): ServiceRequest[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOCAL_SERVICES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse local services:', e);
  }
  return SAMPLE_SERVICES;
}

export function saveLocalServices(services: ServiceRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_SERVICES, JSON.stringify(services));
  } catch (e) {
    console.error('Failed to save local services:', e);
  }
}

export function subscribeToServices(
  userId: string,
  onData: (services: ServiceRequest[]) => void,
  onError?: (error: Error) => void
): () => void {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid) return () => {};
  const path = `users/${uid}/services`;
  const servicesRef = collection(db, 'users', uid, 'services');
  return onSnapshot(
    servicesRef,
    (snapshot) => {
      const results: ServiceRequest[] = [];
      snapshot.forEach((docSnap) => {
        results.push({ id: docSnap.id, ...docSnap.data() } as ServiceRequest);
      });
      // Sort by newest first
      results.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      onData(results);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export async function saveServiceToFirestore(
  userId: string,
  service: ServiceRequest
): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  const srvId = service && typeof service === 'object' ? String(service.id || '') : String(service || '');
  if (!uid || !srvId) return;
  const path = `users/${uid}/services/${srvId}`;
  const serviceRef = doc(db, 'users', uid, 'services', srvId);
  const payload = { ...service, id: srvId };
  try {
    await setDoc(serviceRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteServiceFromFirestore(
  userId: string,
  serviceId: string | { id?: string }
): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  const resolvedId = typeof serviceId === 'object' && serviceId !== null ? serviceId.id : serviceId;
  const srvId = resolvedId ? String(resolvedId) : '';
  if (!uid || !srvId) return;
  const path = `users/${uid}/services/${srvId}`;
  const serviceRef = doc(db, 'users', uid, 'services', srvId);
  try {
    await deleteDoc(serviceRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}
