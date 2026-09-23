import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { app, auth } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { InquiryItem, ExchangeRates, OrderStatus } from '../types';
import { DEFAULT_EXCHANGE_RATES } from './currency';

// Initialize Firestore according to Firebase Skill specification
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Error Context:', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Sync user profile to Firestore
 */
export async function syncUserProfile(user: User): Promise<void> {
  if (!user || !user.uid) return;
  const uid = String(user.uid);
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        uid: uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        lastLoginAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Real-time listener for user's inquiries: users/{userId}/inquiries
 * Changes made on iPad, phone, or desktop update automatically in real time across devices.
 */
export function subscribeToUserInquiries(
  userId: string,
  onData: (inquiries: InquiryItem[]) => void,
  onError?: (error: Error) => void
): () => void {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid) {
    onData([]);
    return () => {};
  }

  const path = `users/${uid}/inquiries`;
  const inquiriesRef = collection(db, 'users', uid, 'inquiries');
  const q = query(inquiriesRef, orderBy('updatedAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items: InquiryItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          inquiryNumber: data.inquiryNumber || docSnap.id,
          date: data.date || new Date().toISOString().split('T')[0],
          customerName: data.customerName || '',
          customerContact: data.customerContact || '',
          wechatId: data.wechatId || '',
          country: data.country || '',
          product: data.product || '',
          imageUrl: data.imageUrl || '',
          material: data.material || '',
          colorVariant: data.colorVariant || '',
          packagingType: data.packagingType || '',
          hsCode: data.hsCode || '',
          boxLengthCm: data.boxLengthCm !== undefined && data.boxLengthCm !== null ? Number(data.boxLengthCm) : undefined,
          boxWidthCm: data.boxWidthCm !== undefined && data.boxWidthCm !== null ? Number(data.boxWidthCm) : undefined,
          boxHeightCm: data.boxHeightCm !== undefined && data.boxHeightCm !== null ? Number(data.boxHeightCm) : undefined,
          pcsPerBox: data.pcsPerBox !== undefined && data.pcsPerBox !== null ? Number(data.pcsPerBox) : undefined,
          unitWeightG: data.unitWeightG !== undefined && data.unitWeightG !== null ? Number(data.unitWeightG) : undefined,
          grossWeightKg: data.grossWeightKg !== undefined && data.grossWeightKg !== null ? Number(data.grossWeightKg) : undefined,
          netWeightKg: data.netWeightKg !== undefined && data.netWeightKg !== null ? Number(data.netWeightKg) : undefined,
          productUrl1688: data.productUrl1688 || '',
          supplierName: data.supplierName || '',
          quantity: Number(data.quantity || 1),
          quantityUnit: data.quantityUnit || 'pcs',
          targetPriceUsd: data.targetPriceUsd !== undefined && data.targetPriceUsd !== null ? Number(data.targetPriceUsd) : undefined,
          targetPriceRmb: data.targetPriceRmb !== undefined && data.targetPriceRmb !== null ? Number(data.targetPriceRmb) : undefined,
          moq: data.moq !== undefined && data.moq !== null ? Number(data.moq) : undefined,
          sampleQuantity: data.sampleQuantity !== undefined && data.sampleQuantity !== null ? Number(data.sampleQuantity) : undefined,
          quantityTolerancePercent: data.quantityTolerancePercent !== undefined && data.quantityTolerancePercent !== null ? Number(data.quantityTolerancePercent) : undefined,
          annualEstimatedQuantity: data.annualEstimatedQuantity !== undefined && data.annualEstimatedQuantity !== null ? Number(data.annualEstimatedQuantity) : undefined,
          deliveryLeadTimeDays: data.deliveryLeadTimeDays !== undefined && data.deliveryLeadTimeDays !== null ? Number(data.deliveryLeadTimeDays) : undefined,
          price1688Rmb: Number(data.price1688Rmb || 0),
          domesticShippingRmb: Number(data.domesticShippingRmb || 0),
          quotes: Array.isArray(data.quotes) ? data.quotes : [],
          selectedQuoteId: data.selectedQuoteId || '',
          marginPercent: Number(data.marginPercent || 0),
          marginFixedUsd: data.marginFixedUsd !== undefined && data.marginFixedUsd !== null ? Number(data.marginFixedUsd) : undefined,
          marginMode: data.marginMode || undefined,
          marginDealTotal: data.marginDealTotal !== undefined && data.marginDealTotal !== null ? Number(data.marginDealTotal) : undefined,
          clientUnitPriceUsd: Number(data.clientUnitPriceUsd || 0),
          totalQuotationUsd: Number(data.totalQuotationUsd || 0),
          estimatedProfitUsd: Number(data.estimatedProfitUsd || 0),
          helperCommissions: Array.isArray(data.helperCommissions) ? data.helperCommissions : [],
          totalHelperCommissionUsd: data.totalHelperCommissionUsd !== undefined ? Number(data.totalHelperCommissionUsd) : undefined,
          netAgentProfitUsd: data.netAgentProfitUsd !== undefined ? Number(data.netAgentProfitUsd) : undefined,
          orderStatus: (data.orderStatus as OrderStatus) || 'New Inquiry',
          notes: data.notes || '',
          orderIndex: data.orderIndex !== undefined && data.orderIndex !== null ? Number(data.orderIndex) : undefined,
          isPinned: data.isPinned !== undefined ? Boolean(data.isPinned) : undefined,
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });

      // Sort with custom order priority (pinned first, then orderIndex, then newest date)
      items.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
          return a.orderIndex - b.orderIndex;
        }
        if (a.orderIndex !== undefined) return -1;
        if (b.orderIndex !== undefined) return 1;
        return new Date(b.updatedAt || b.date || 0).getTime() - new Date(a.updatedAt || a.date || 0).getTime();
      });

      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Save (create or update) an inquiry document in Firestore
 * users/{userId}/inquiries/{inquiryId}
 */
export async function saveInquiryToFirestore(
  userId: string,
  inquiry: InquiryItem
): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid) throw new Error('User ID is required to save inquiry to Firestore');
  if (!inquiry || !inquiry.id) throw new Error('Inquiry ID is required');

  const inqId = String(inquiry.id);
  const path = `users/${uid}/inquiries/${inqId}`;
  const inquiryRef = doc(db, 'users', uid, 'inquiries', inqId);

  const safeNum = (val: any, fallback = 0): number => {
    const n = Number(val);
    return isNaN(n) || !isFinite(n) ? fallback : n;
  };

  // Clean data payload, omitting undefined values for Firestore compatibility
  const cleanPayload: Record<string, any> = {
    id: inqId,
    userId: uid,
    inquiryNumber: inquiry.inquiryNumber,
    date: inquiry.date,
    customerName: inquiry.customerName,
    country: inquiry.country || 'Global',
    product: inquiry.product,
    quantity: Math.max(1, safeNum(inquiry.quantity, 1)),
    price1688Rmb: safeNum(inquiry.price1688Rmb, 0),
    marginPercent: safeNum(inquiry.marginPercent, 0),
    clientUnitPriceUsd: safeNum(inquiry.clientUnitPriceUsd, 0),
    totalQuotationUsd: safeNum(inquiry.totalQuotationUsd, 0),
    estimatedProfitUsd: safeNum(inquiry.estimatedProfitUsd, 0),
    orderStatus: inquiry.orderStatus,
    updatedAt: inquiry.updatedAt || new Date().toISOString(),
    firestoreServerTime: serverTimestamp(),
  };

  if (inquiry.customerContact) cleanPayload.customerContact = inquiry.customerContact;
  if (inquiry.wechatId) cleanPayload.wechatId = inquiry.wechatId;
  if (inquiry.quantityUnit) cleanPayload.quantityUnit = inquiry.quantityUnit;
  if (inquiry.targetPriceUsd !== undefined && inquiry.targetPriceUsd !== null) cleanPayload.targetPriceUsd = safeNum(inquiry.targetPriceUsd);
  if (inquiry.targetPriceRmb !== undefined && inquiry.targetPriceRmb !== null) cleanPayload.targetPriceRmb = safeNum(inquiry.targetPriceRmb);
  if (inquiry.moq !== undefined && inquiry.moq !== null) cleanPayload.moq = safeNum(inquiry.moq);
  if (inquiry.sampleQuantity !== undefined && inquiry.sampleQuantity !== null) cleanPayload.sampleQuantity = safeNum(inquiry.sampleQuantity);
  if (inquiry.quantityTolerancePercent !== undefined && inquiry.quantityTolerancePercent !== null) cleanPayload.quantityTolerancePercent = safeNum(inquiry.quantityTolerancePercent);
  if (inquiry.annualEstimatedQuantity !== undefined && inquiry.annualEstimatedQuantity !== null) cleanPayload.annualEstimatedQuantity = safeNum(inquiry.annualEstimatedQuantity);
  if (inquiry.deliveryLeadTimeDays !== undefined && inquiry.deliveryLeadTimeDays !== null) cleanPayload.deliveryLeadTimeDays = safeNum(inquiry.deliveryLeadTimeDays);
  if (inquiry.imageUrl) cleanPayload.imageUrl = inquiry.imageUrl;
  if (inquiry.material) cleanPayload.material = inquiry.material;
  if (inquiry.colorVariant) cleanPayload.colorVariant = inquiry.colorVariant;
  if (inquiry.packagingType) cleanPayload.packagingType = inquiry.packagingType;
  if (inquiry.hsCode) cleanPayload.hsCode = inquiry.hsCode;
  if (inquiry.boxLengthCm !== undefined && inquiry.boxLengthCm !== null) cleanPayload.boxLengthCm = safeNum(inquiry.boxLengthCm);
  if (inquiry.boxWidthCm !== undefined && inquiry.boxWidthCm !== null) cleanPayload.boxWidthCm = safeNum(inquiry.boxWidthCm);
  if (inquiry.boxHeightCm !== undefined && inquiry.boxHeightCm !== null) cleanPayload.boxHeightCm = safeNum(inquiry.boxHeightCm);
  if (inquiry.pcsPerBox !== undefined && inquiry.pcsPerBox !== null) cleanPayload.pcsPerBox = safeNum(inquiry.pcsPerBox);
  if (inquiry.unitWeightG !== undefined && inquiry.unitWeightG !== null) cleanPayload.unitWeightG = safeNum(inquiry.unitWeightG);
  if (inquiry.grossWeightKg !== undefined && inquiry.grossWeightKg !== null) cleanPayload.grossWeightKg = safeNum(inquiry.grossWeightKg);
  if (inquiry.netWeightKg !== undefined && inquiry.netWeightKg !== null) cleanPayload.netWeightKg = safeNum(inquiry.netWeightKg);
  if (inquiry.productUrl1688) cleanPayload.productUrl1688 = inquiry.productUrl1688;
  if (inquiry.supplierName) cleanPayload.supplierName = inquiry.supplierName;
  if (inquiry.domesticShippingRmb !== undefined && inquiry.domesticShippingRmb !== null) cleanPayload.domesticShippingRmb = safeNum(inquiry.domesticShippingRmb);
  if (inquiry.marginFixedUsd !== undefined && inquiry.marginFixedUsd !== null) cleanPayload.marginFixedUsd = safeNum(inquiry.marginFixedUsd);
  if (inquiry.marginMode) cleanPayload.marginMode = inquiry.marginMode;
  if (inquiry.marginDealTotal !== undefined && inquiry.marginDealTotal !== null) cleanPayload.marginDealTotal = safeNum(inquiry.marginDealTotal);
  if (inquiry.selectedQuoteId) cleanPayload.selectedQuoteId = inquiry.selectedQuoteId;
  if (inquiry.notes) cleanPayload.notes = inquiry.notes;
  if (Array.isArray(inquiry.helperCommissions)) cleanPayload.helperCommissions = inquiry.helperCommissions;
  if (inquiry.totalHelperCommissionUsd !== undefined && inquiry.totalHelperCommissionUsd !== null) cleanPayload.totalHelperCommissionUsd = safeNum(inquiry.totalHelperCommissionUsd);
  if (inquiry.netAgentProfitUsd !== undefined && inquiry.netAgentProfitUsd !== null) cleanPayload.netAgentProfitUsd = safeNum(inquiry.netAgentProfitUsd);
  if (Array.isArray(inquiry.quotes) && inquiry.quotes.length > 0) {
    cleanPayload.quotes = inquiry.quotes.map((q) => ({
      id: q.id || '',
      supplierName: q.supplierName || '',
      productUrl1688: q.productUrl1688 || '',
      price1688Rmb: safeNum(q.price1688Rmb, 0),
      domesticShippingRmb: safeNum(q.domesticShippingRmb, 0),
      wechatId: q.wechatId || '',
      whatsapp: q.whatsapp || '',
    }));
  }

  if (inquiry.orderIndex !== undefined && inquiry.orderIndex !== null) cleanPayload.orderIndex = safeNum(inquiry.orderIndex);
  if (inquiry.isPinned !== undefined) cleanPayload.isPinned = Boolean(inquiry.isPinned);

  try {
    await setDoc(inquiryRef, cleanPayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Batch update order of inquiries in Firestore
 * Persists the user's custom drag-and-drop order across all devices
 */
export async function updateInquiriesOrderInFirestore(
  userId: string,
  orderedInquiryIds: string[]
): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid || !orderedInquiryIds || orderedInquiryIds.length === 0) return;

  const batch = writeBatch(db);
  orderedInquiryIds.forEach((id, index) => {
    const docRef = doc(db, 'users', uid, 'inquiries', id);
    batch.set(docRef, { orderIndex: index, updatedAt: new Date().toISOString() }, { merge: true });
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/inquiries`);
    console.error('Failed to update inquiries order in Firestore:', error);
  }
}

/**
 * Delete an inquiry document from Firestore
 */
export async function deleteInquiryFromFirestore(
  userId: string,
  inquiryId: string | { id?: string }
): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  const resolvedId = typeof inquiryId === 'object' && inquiryId !== null ? inquiryId.id : inquiryId;
  const inqId = resolvedId ? String(resolvedId) : '';
  if (!uid || !inqId) return;

  const path = `users/${uid}/inquiries/${inqId}`;
  const inquiryRef = doc(db, 'users', uid, 'inquiries', inqId);
  try {
    await deleteDoc(inquiryRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

/**
 * Real-time listener for user settings / exchange rates: users/{userId}/settings/rates
 */
export function subscribeToUserExchangeRates(
  userId: string,
  onData: (rates: ExchangeRates) => void,
  onError?: (error: Error) => void
): () => void {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid) return () => {};

  const path = `users/${uid}/settings/rates`;
  const ratesRef = doc(db, 'users', uid, 'settings', 'rates');

  return onSnapshot(
    ratesRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onData({
          USD_TO_RMB: Number(data.USD_TO_RMB || DEFAULT_EXCHANGE_RATES.USD_TO_RMB),
          EUR_TO_RMB: Number(data.EUR_TO_RMB || DEFAULT_EXCHANGE_RATES.EUR_TO_RMB),
          GBP_TO_RMB: Number(data.GBP_TO_RMB || DEFAULT_EXCHANGE_RATES.GBP_TO_RMB),
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

/**
 * Save user exchange rates to Firestore
 */
export async function saveExchangeRatesToFirestore(
  userId: string,
  rates: ExchangeRates
): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid) return;
  const path = `users/${uid}/settings/rates`;
  const ratesRef = doc(db, 'users', uid, 'settings', 'rates');
  try {
    await setDoc(
      ratesRef,
      {
        USD_TO_RMB: Number(rates.USD_TO_RMB),
        EUR_TO_RMB: Number(rates.EUR_TO_RMB),
        GBP_TO_RMB: Number(rates.GBP_TO_RMB),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Safe Migration Strategy:
 * When a user logs in for the first time with an existing dataset in local cache / previous session,
 * if their cloud Firestore collection is empty, automatically migrate and preserve all records into Firestore.
 */
export async function migrateLocalDataToFirestoreIfEmpty(
  userId: string,
  localInquiries: InquiryItem[],
  localRates?: ExchangeRates
): Promise<{ migrated: boolean; count: number }> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid) return { migrated: false, count: 0 };
  const path = `users/${uid}/inquiries`;

  try {
    const inquiriesRef = collection(db, 'users', uid, 'inquiries');
    const existingSnap = await getDocs(inquiriesRef);

    if (existingSnap.empty && Array.isArray(localInquiries) && localInquiries.length > 0) {
      const batch = writeBatch(db);

      for (const item of localInquiries) {
        if (!item || !item.id) continue;
        const itemId = String(item.id);
        const docRef = doc(db, 'users', uid, 'inquiries', itemId);
        const cleanPayload: Record<string, any> = {
          id: itemId,
          userId: uid,
          inquiryNumber: item.inquiryNumber,
          date: item.date,
          customerName: item.customerName,
          country: item.country || 'Global',
          product: item.product,
          quantity: Number(item.quantity || 1),
          price1688Rmb: Number(item.price1688Rmb || 0),
          marginPercent: Number(item.marginPercent || 0),
          clientUnitPriceUsd: Number(item.clientUnitPriceUsd || 0),
          totalQuotationUsd: Number(item.totalQuotationUsd || 0),
          estimatedProfitUsd: Number(item.estimatedProfitUsd || 0),
          orderStatus: item.orderStatus,
          updatedAt: item.updatedAt || new Date().toISOString(),
        };

        if (item.customerContact) cleanPayload.customerContact = item.customerContact;
        if (item.wechatId) cleanPayload.wechatId = item.wechatId;
        if (item.imageUrl) cleanPayload.imageUrl = item.imageUrl;
        if (item.material) cleanPayload.material = item.material;
        if (item.colorVariant) cleanPayload.colorVariant = item.colorVariant;
        if (item.packagingType) cleanPayload.packagingType = item.packagingType;
        if (item.hsCode) cleanPayload.hsCode = item.hsCode;
        if (item.boxLengthCm !== undefined && item.boxLengthCm !== null) cleanPayload.boxLengthCm = Number(item.boxLengthCm);
        if (item.boxWidthCm !== undefined && item.boxWidthCm !== null) cleanPayload.boxWidthCm = Number(item.boxWidthCm);
        if (item.boxHeightCm !== undefined && item.boxHeightCm !== null) cleanPayload.boxHeightCm = Number(item.boxHeightCm);
        if (item.pcsPerBox !== undefined && item.pcsPerBox !== null) cleanPayload.pcsPerBox = Number(item.pcsPerBox);
        if (item.unitWeightG !== undefined && item.unitWeightG !== null) cleanPayload.unitWeightG = Number(item.unitWeightG);
        if (item.grossWeightKg !== undefined && item.grossWeightKg !== null) cleanPayload.grossWeightKg = Number(item.grossWeightKg);
        if (item.netWeightKg !== undefined && item.netWeightKg !== null) cleanPayload.netWeightKg = Number(item.netWeightKg);
        if (item.productUrl1688) cleanPayload.productUrl1688 = item.productUrl1688;
        if (item.supplierName) cleanPayload.supplierName = item.supplierName;
        if (item.domesticShippingRmb !== undefined && item.domesticShippingRmb !== null) cleanPayload.domesticShippingRmb = Number(item.domesticShippingRmb);
        if (item.marginFixedUsd !== undefined && item.marginFixedUsd !== null) cleanPayload.marginFixedUsd = Number(item.marginFixedUsd);
        if (item.marginMode) cleanPayload.marginMode = item.marginMode;
        if (item.marginDealTotal !== undefined && item.marginDealTotal !== null) cleanPayload.marginDealTotal = Number(item.marginDealTotal);
        if (item.selectedQuoteId) cleanPayload.selectedQuoteId = item.selectedQuoteId;
        if (item.notes) cleanPayload.notes = item.notes;
        if (Array.isArray(item.helperCommissions)) cleanPayload.helperCommissions = item.helperCommissions;
        if (item.totalHelperCommissionUsd !== undefined && item.totalHelperCommissionUsd !== null) cleanPayload.totalHelperCommissionUsd = Number(item.totalHelperCommissionUsd);
        if (item.netAgentProfitUsd !== undefined && item.netAgentProfitUsd !== null) cleanPayload.netAgentProfitUsd = Number(item.netAgentProfitUsd);
        if (Array.isArray(item.quotes) && item.quotes.length > 0) {
          cleanPayload.quotes = item.quotes;
        }

        batch.set(docRef, cleanPayload, { merge: true });
      }

      // Also migrate exchange rates if provided
      if (localRates) {
        const ratesRef = doc(db, 'users', uid, 'settings', 'rates');
        batch.set(
          ratesRef,
          {
            USD_TO_RMB: localRates.USD_TO_RMB,
            EUR_TO_RMB: localRates.EUR_TO_RMB,
            GBP_TO_RMB: localRates.GBP_TO_RMB,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      await batch.commit();
      return { migrated: true, count: localInquiries.length };
    }

    return { migrated: false, count: existingSnap.size };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return { migrated: false, count: 0 };
  }
}
