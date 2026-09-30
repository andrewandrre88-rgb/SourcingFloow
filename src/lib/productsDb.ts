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
import { CatalogProduct, FactoryQuote } from '../types';

export const STORAGE_KEY_LOCAL_PRODUCTS = 'sourcing_flow_products_v1';

export const INITIAL_SAMPLE_PRODUCTS: CatalogProduct[] = [
  {
    id: 'prod_1',
    itemCode: 'DWG-350',
    name: 'Double-Wall Borosilicate Glass Coffee Mug (350ml)',
    category: 'Drinkware & Glass',
    material: 'High Borosilicate Glass (Heat Resistant -20°C to 150°C)',
    quantity: 1200,
    quantityUnit: 'pcs',
    unitsPerCarton: 24,
    cartons: 50,
    cartonLengthCm: 48,
    cartonWidthCm: 32,
    cartonHeightCm: 30,
    cartonCbm: 0.0461,
    totalCbm: 2.304,
    grossWeightKg: 7.5,
    totalGrossWeightKg: 375,
    netWeightKg: 6.2,
    exwPrice: 9.8,
    exwCurrency: 'RMB',
    fobPrice: 1.85,
    fobCurrency: 'USD',
    fobPort: 'Ningbo',
    targetPriceUsd: 2.45,
    supplierName: 'Hebei Sunshine Glass Products Co., Ltd.',
    supplierUrl: 'https://detail.1688.com/offer/71239841.html',
    supplierContact: 'WeChat: hebei_glass_sales88',
    hsCode: '7013.37.0000',
    packagingType: '5-ply corrugated export master carton, 1pc bubble wrap + individual white box',
    colorVariants: 'Clear Transparent, Amber Tint, Smoke Gray',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    notes: 'Pass thermal shock test 120°C. Custom client laser etched logo on base. Drop test passed from 1.2m.',
    cartons20gp: 607,
    qty20gp: 14568,
    cartons40gp: 1258,
    qty40gp: 30192,
    cartons40hc: 1475,
    qty40hc: 35400,
    cartons45hc: 1691,
    qty45hc: 40584,
    factoryQuotes: [
      {
        id: 'fq_1_1',
        factoryName: 'Factory 1 - Hebei Sunshine Glass Co., Ltd.',
        price: 9.8,
        currency: 'RMB',
        moq: 1000,
        leadTimeDays: 20,
        contactPerson: 'WeChat: hebei_glass_sales88',
        supplierUrl: 'https://detail.1688.com/offer/71239841.html',
        notes: 'Primary selected supplier. Custom laser etched base logo included.',
        isPrimary: true,
      },
      {
        id: 'fq_1_2',
        factoryName: 'Factory 2 - Cangzhou Mingda Glassware Works',
        price: 9.2,
        currency: 'RMB',
        moq: 2000,
        leadTimeDays: 25,
        contactPerson: 'WeChat: mingda_glass_cangzhou',
        notes: 'Lower unit cost (-¥0.60/pc) but requires higher MOQ of 2,000 pcs.',
        isPrimary: false,
      },
      {
        id: 'fq_1_3',
        factoryName: 'Factory 3 - Yiwu Star Ocean Export Trade',
        price: 10.5,
        currency: 'RMB',
        moq: 500,
        leadTimeDays: 12,
        contactPerson: 'WhatsApp: +86 139 5792 1102',
        notes: 'Fast turnaround from semi-finished stock, slightly higher unit price.',
        isPrimary: false,
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_2',
    itemCode: 'SS-TB-750',
    name: 'Vacuum Insulated Stainless Steel Tumbler (750ml / 25oz)',
    category: 'Drinkware & Outdoor',
    material: 'Food Grade 304 (18/8) Stainless Steel + BPA-Free Tritan Lid',
    quantity: 2000,
    quantityUnit: 'pcs',
    unitsPerCarton: 25,
    cartons: 80,
    cartonLengthCm: 52,
    cartonWidthCm: 52,
    cartonHeightCm: 32,
    cartonCbm: 0.0865,
    totalCbm: 6.92,
    grossWeightKg: 12.0,
    totalGrossWeightKg: 960,
    netWeightKg: 10.5,
    exwPrice: 22.5,
    exwCurrency: 'RMB',
    fobPrice: 3.95,
    fobCurrency: 'USD',
    fobPort: 'Ningbo',
    targetPriceUsd: 5.20,
    supplierName: 'Yongkang Pioneer Drinkware Industry',
    supplierUrl: 'https://detail.1688.com/offer/65842190.html',
    supplierContact: 'WeChat: yk_tumbler_jack',
    hsCode: '9617.00.1000',
    packagingType: 'Individually bagged in compostable polybag + custom matte color gift box with barcode sticker',
    colorVariants: 'Matte Obsidian, Sage Green, Desert Sand, Metallic Silver',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
    notes: 'Keeps hot 12hrs / cold 24hrs. Leakproof silicone seal. FDA & LFGB food safety certification report on file.',
    cartons20gp: 323,
    qty20gp: 8075,
    cartons40gp: 670,
    qty40gp: 16750,
    cartons40hc: 786,
    qty40hc: 19650,
    cartons45hc: 901,
    qty45hc: 22525,
    factoryQuotes: [
      {
        id: 'fq_2_1',
        factoryName: 'Factory 1 - Yongkang Pioneer Drinkware Industry',
        price: 22.5,
        currency: 'RMB',
        moq: 1000,
        leadTimeDays: 25,
        contactPerson: 'WeChat: yk_tumbler_jack',
        notes: 'Passed LFGB testing, powder coating color matched to Pantone.',
        isPrimary: true,
      },
      {
        id: 'fq_2_2',
        factoryName: 'Factory 2 - Wuyi Strong Vacuum Flask Tech',
        price: 21.0,
        currency: 'RMB',
        moq: 3000,
        leadTimeDays: 30,
        contactPerson: 'WeChat: wuyi_strong_export',
        notes: 'Best high-volume quotation, ¥1.50/pc savings on 3k+ run.',
        isPrimary: false,
      },
      {
        id: 'fq_2_3',
        factoryName: 'Factory 3 - Jinhua Zenith Thermal Products',
        price: 23.8,
        currency: 'RMB',
        moq: 500,
        leadTimeDays: 16,
        contactPerson: 'Phone: +86 579 8712 9901',
        notes: 'Includes magnetic slider lid upgrade and embossed logo.',
        isPrimary: false,
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_3',
    itemCode: 'ECO-CANVAS-01',
    name: 'Heavyweight Organic Cotton Canvas Tote Bag with Gusset',
    category: 'Textiles & Bags',
    material: '16oz 100% GOTS Certified Organic Cotton Canvas',
    quantity: 3000,
    quantityUnit: 'pcs',
    unitsPerCarton: 100,
    cartons: 30,
    cartonLengthCm: 45,
    cartonWidthCm: 40,
    cartonHeightCm: 35,
    cartonCbm: 0.063,
    totalCbm: 1.89,
    grossWeightKg: 18.5,
    totalGrossWeightKg: 555,
    netWeightKg: 17.0,
    exwPrice: 8.5,
    exwCurrency: 'RMB',
    fobPrice: 1.55,
    fobCurrency: 'USD',
    fobPort: 'Shenzhen',
    targetPriceUsd: 2.10,
    supplierName: 'Guangdong EcoTextile Factory',
    supplierUrl: 'https://detail.1688.com/offer/58920143.html',
    supplierContact: 'WhatsApp: +86 138 2849 5921',
    hsCode: '4202.92.3031',
    packagingType: '10 pcs tied per kraft paper bundle, 100 pcs per water-resistant PE liner export carton',
    colorVariants: 'Natural Unbleached, Washed Charcoal, Olive Green',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
    notes: 'Reinforced cross-stitch on handles (handle length 65cm). Water-based silk screen print on front.',
    factoryQuotes: [
      {
        id: 'fq_3_1',
        factoryName: 'Factory 1 - Guangdong EcoTextile Factory',
        price: 8.5,
        currency: 'RMB',
        moq: 1000,
        leadTimeDays: 15,
        contactPerson: 'WhatsApp: +86 138 2849 5921',
        notes: 'GOTS organic certified cotton, primary factory.',
        isPrimary: true,
      },
      {
        id: 'fq_3_2',
        factoryName: 'Factory 2 - Zhejiang Cangnan Bag Base Co.',
        price: 7.8,
        currency: 'RMB',
        moq: 5000,
        leadTimeDays: 20,
        contactPerson: 'WeChat: cangnan_bag_sales',
        notes: 'Super competitive bulk price (-¥0.70/pc) on 5,000+ units.',
        isPrimary: false,
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_4',
    itemCode: 'ALU-STAND-PRO',
    name: 'Ergonomic Foldable Aluminum Laptop & Tablet Riser Stand',
    category: 'Electronics & Accessories',
    material: 'Anodized Aircraft-Grade Aluminum Alloy + Non-Slip Silicone Pads',
    quantity: 800,
    quantityUnit: 'pcs',
    unitsPerCarton: 40,
    cartons: 20,
    cartonLengthCm: 42,
    cartonWidthCm: 34,
    cartonHeightCm: 28,
    cartonCbm: 0.040,
    totalCbm: 0.80,
    grossWeightKg: 13.5,
    totalGrossWeightKg: 270,
    netWeightKg: 12.0,
    exwPrice: 28.0,
    exwCurrency: 'RMB',
    fobPrice: 4.60,
    fobCurrency: 'USD',
    fobPort: 'Shenzhen',
    targetPriceUsd: 6.50,
    supplierName: 'Shenzhen Precision Hardware Tech',
    supplierUrl: 'https://detail.1688.com/offer/69482103.html',
    supplierContact: 'WeChat: sz_precision_hw',
    hsCode: '7616.99.5190',
    packagingType: '1pc velvet travel storage pouch + color retail packaging with magnetic flip lid',
    colorVariants: 'Space Gray, Silver, Midnight Black',
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80',
    notes: 'Supports up to 17-inch laptops (up to 10kg load). 6 adjustable height angles. CNC chamfered edges.',
    factoryQuotes: [
      {
        id: 'fq_4_1',
        factoryName: 'Factory 1 - Shenzhen Precision Hardware Tech',
        price: 28.0,
        currency: 'RMB',
        moq: 500,
        leadTimeDays: 18,
        contactPerson: 'WeChat: sz_precision_hw',
        notes: 'Aircraft-grade anodized finish with laser logo & velvet pouch.',
        isPrimary: true,
      },
      {
        id: 'fq_4_2',
        factoryName: 'Factory 2 - Dongguan AlumCraft Works',
        price: 26.5,
        currency: 'RMB',
        moq: 1000,
        leadTimeDays: 22,
        contactPerson: 'WeChat: dg_alum_jack',
        notes: 'Slightly lighter hinge mechanism, ¥1.50 less per unit.',
        isPrimary: false,
      },
      {
        id: 'fq_4_3',
        factoryName: 'Factory 3 - Ningbo Metal Innovations Co.',
        price: 29.5,
        currency: 'RMB',
        moq: 300,
        leadTimeDays: 10,
        contactPerson: 'Phone: +86 574 8831 2011',
        notes: 'Fast stock dispatch with custom gift box packaging.',
        isPrimary: false,
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Standard industry usable container volumes (CBM) for ocean freight estimation
 */
export const CONTAINER_USABLE_CBM = {
  '20GP': 28, // 20ft General Purpose (~28 CBM realistic loading capacity)
  '40GP': 58, // 40ft General Purpose (~58 CBM realistic loading capacity)
  '40HC': 68, // 40ft High Cube (~68 CBM realistic loading capacity)
  '45HC': 78, // 45ft High Cube (~78 CBM realistic loading capacity)
} as const;

export type ContainerType = keyof typeof CONTAINER_USABLE_CBM;

/**
 * Calculates estimated cartons and units for a container given carton CBM and units per carton
 */
export function calculateContainerLoad(
  cartonCbm: number,
  unitsPerCarton: number,
  containerType: ContainerType
): { cartons: number; quantity: number } {
  if (!cartonCbm || cartonCbm <= 0) return { cartons: 0, quantity: 0 };
  const maxCbm = CONTAINER_USABLE_CBM[containerType] || 28;
  const cartons = Math.floor(maxCbm / cartonCbm);
  const perCtn = unitsPerCarton > 0 ? unitsPerCarton : 1;
  const quantity = cartons * perCtn;
  return { cartons, quantity };
}

/**
 * Calculates CBM for single carton: (L * W * H in cm) / 1,000,000
 */
export function calculateCartonCbm(lengthCm: number, widthCm: number, heightCm: number): number {
  if (!lengthCm || !widthCm || !heightCm) return 0;
  const cbm = (Number(lengthCm) * Number(widthCm) * Number(heightCm)) / 1000000;
  return Number(cbm.toFixed(4));
}

/**
 * Clean data payload before writing to Firestore, omitting any undefined properties
 */
export function cleanProductPayload(product: CatalogProduct, userId: string): Record<string, any> {
  const l = Number(product.cartonLengthCm || 0);
  const w = Number(product.cartonWidthCm || 0);
  const h = Number(product.cartonHeightCm || 0);
  const singleCbm = calculateCartonCbm(l, w, h);
  const ctns = Number(product.cartons || 0);
  const computedTotalCbm = Number((singleCbm * ctns).toFixed(4));

  const payload: Record<string, any> = {
    id: String(product.id),
    userId: String(userId),
    name: product.name ? String(product.name).trim() : 'Untitled Product',
    material: product.material ? String(product.material).trim() : '',
    quantity: Number(product.quantity || 0),
    quantityUnit: product.quantityUnit || 'pcs',
    unitsPerCarton: Number(product.unitsPerCarton || 1),
    cartons: ctns,
    cartonLengthCm: l,
    cartonWidthCm: w,
    cartonHeightCm: h,
    cartonCbm: singleCbm,
    totalCbm: product.totalCbm !== undefined && product.totalCbm > 0 ? Number(product.totalCbm) : computedTotalCbm,
    exwPrice: Number(product.exwPrice || 0),
    exwCurrency: product.exwCurrency || 'RMB',
    fobPrice: Number(product.fobPrice || 0),
    fobCurrency: product.fobCurrency || 'USD',
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (product.itemCode && product.itemCode.trim()) payload.itemCode = product.itemCode.trim();
  if (product.category && product.category.trim()) payload.category = product.category.trim();
  if (product.grossWeightKg !== undefined && product.grossWeightKg !== null) payload.grossWeightKg = Number(product.grossWeightKg);
  if (product.totalGrossWeightKg !== undefined && product.totalGrossWeightKg !== null) {
    payload.totalGrossWeightKg = Number(product.totalGrossWeightKg);
  } else if (product.grossWeightKg) {
    payload.totalGrossWeightKg = Number((product.grossWeightKg * ctns).toFixed(2));
  }
  if (product.netWeightKg !== undefined && product.netWeightKg !== null) payload.netWeightKg = Number(product.netWeightKg);
  if (product.fobPort && product.fobPort.trim()) payload.fobPort = product.fobPort.trim();
  if (product.targetPriceUsd !== undefined && product.targetPriceUsd !== null) payload.targetPriceUsd = Number(product.targetPriceUsd);
  if (product.supplierName && product.supplierName.trim()) payload.supplierName = product.supplierName.trim();
  if (product.supplierUrl && product.supplierUrl.trim()) payload.supplierUrl = product.supplierUrl.trim();
  if (product.supplierContact && product.supplierContact.trim()) payload.supplierContact = product.supplierContact.trim();
  if (product.hsCode && product.hsCode.trim()) payload.hsCode = product.hsCode.trim();
  if (product.packagingType && product.packagingType.trim()) payload.packagingType = product.packagingType.trim();
  if (product.colorVariants && product.colorVariants.trim()) payload.colorVariants = product.colorVariants.trim();
  if (product.imageUrl && product.imageUrl.trim()) payload.imageUrl = product.imageUrl.trim();
  if (product.notes && product.notes.trim()) payload.notes = product.notes.trim();

  // Container Loads (20GP, 40GP, 40HC, 45HC)
  if (product.cartons20gp !== undefined && product.cartons20gp !== null) payload.cartons20gp = Number(product.cartons20gp);
  if (product.qty20gp !== undefined && product.qty20gp !== null) payload.qty20gp = Number(product.qty20gp);
  if (product.cartons40gp !== undefined && product.cartons40gp !== null) payload.cartons40gp = Number(product.cartons40gp);
  if (product.qty40gp !== undefined && product.qty40gp !== null) payload.qty40gp = Number(product.qty40gp);
  if (product.cartons40hc !== undefined && product.cartons40hc !== null) payload.cartons40hc = Number(product.cartons40hc);
  if (product.qty40hc !== undefined && product.qty40hc !== null) payload.qty40hc = Number(product.qty40hc);
  if (product.cartons45hc !== undefined && product.cartons45hc !== null) payload.cartons45hc = Number(product.cartons45hc);
  if (product.qty45hc !== undefined && product.qty45hc !== null) payload.qty45hc = Number(product.qty45hc);

  // Different factory quotations (Factory 1, Factory 2, Factory 3, etc.)
  if (Array.isArray(product.factoryQuotes) && product.factoryQuotes.length > 0) {
    payload.factoryQuotes = product.factoryQuotes.map((fq, index) => {
      const q: Record<string, any> = {
        id: String(fq.id || `fq_${Date.now()}_${index}`),
        factoryName: String(fq.factoryName || `Factory ${index + 1}`).trim(),
        price: Number(fq.price || 0),
        currency: fq.currency || 'RMB',
      };
      if (fq.moq !== undefined && fq.moq !== null && !isNaN(Number(fq.moq))) q.moq = Number(fq.moq);
      if (fq.leadTimeDays !== undefined && fq.leadTimeDays !== null && !isNaN(Number(fq.leadTimeDays))) q.leadTimeDays = Number(fq.leadTimeDays);
      if (fq.contactPerson && fq.contactPerson.trim()) q.contactPerson = fq.contactPerson.trim();
      if (fq.supplierUrl && fq.supplierUrl.trim()) q.supplierUrl = fq.supplierUrl.trim();
      if (fq.notes && fq.notes.trim()) q.notes = fq.notes.trim();
      if (fq.isPrimary !== undefined) q.isPrimary = Boolean(fq.isPrimary);
      if (fq.quotationDate && fq.quotationDate.trim()) q.quotationDate = fq.quotationDate.trim();
      return q;
    });
  } else {
    payload.factoryQuotes = [];
  }

  return payload;
}

export function loadLocalProducts(): CatalogProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Products] Failed to load local products:', e);
  }
  return INITIAL_SAMPLE_PRODUCTS;
}

export function saveLocalProducts(products: CatalogProduct[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.warn('[Products] Failed to save local products:', e);
  }
}

export function subscribeToProducts(
  userId: string,
  onData: (products: CatalogProduct[]) => void,
  onError?: (err: Error) => void
) {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid) return () => {};
  const path = `users/${uid}/products`;

  try {
    const colRef = collection(db, 'users', uid, 'products');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const products: CatalogProduct[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const l = Number(d.cartonLengthCm || 0);
          const w = Number(d.cartonWidthCm || 0);
          const h = Number(d.cartonHeightCm || 0);
          const ctns = Number(d.cartons || 0);
          const cbm = d.cartonCbm !== undefined ? Number(d.cartonCbm) : calculateCartonCbm(l, w, h);
          const totalCbm = d.totalCbm !== undefined ? Number(d.totalCbm) : Number((cbm * ctns).toFixed(4));

          products.push({
            id: docSnap.id,
            itemCode: d.itemCode || undefined,
            name: d.name || 'Untitled Product',
            category: d.category || undefined,
            material: d.material || '',
            quantity: Number(d.quantity || 0),
            quantityUnit: d.quantityUnit || 'pcs',
            unitsPerCarton: Number(d.unitsPerCarton || 1),
            cartons: ctns,
            cartonLengthCm: l,
            cartonWidthCm: w,
            cartonHeightCm: h,
            cartonCbm: cbm,
            totalCbm: totalCbm,
            grossWeightKg: d.grossWeightKg !== undefined ? Number(d.grossWeightKg) : undefined,
            totalGrossWeightKg: d.totalGrossWeightKg !== undefined ? Number(d.totalGrossWeightKg) : undefined,
            netWeightKg: d.netWeightKg !== undefined ? Number(d.netWeightKg) : undefined,
            exwPrice: Number(d.exwPrice || 0),
            exwCurrency: d.exwCurrency || 'RMB',
            fobPrice: Number(d.fobPrice || 0),
            fobCurrency: d.fobCurrency || 'USD',
            fobPort: d.fobPort || undefined,
            targetPriceUsd: d.targetPriceUsd !== undefined ? Number(d.targetPriceUsd) : undefined,
            supplierName: d.supplierName || undefined,
            supplierUrl: d.supplierUrl || undefined,
            supplierContact: d.supplierContact || undefined,
            hsCode: d.hsCode || undefined,
            packagingType: d.packagingType || undefined,
            colorVariants: d.colorVariants || undefined,
            imageUrl: d.imageUrl || undefined,
            notes: d.notes || undefined,
            cartons20gp: d.cartons20gp !== undefined ? Number(d.cartons20gp) : undefined,
            qty20gp: d.qty20gp !== undefined ? Number(d.qty20gp) : undefined,
            cartons40gp: d.cartons40gp !== undefined ? Number(d.cartons40gp) : undefined,
            qty40gp: d.qty40gp !== undefined ? Number(d.qty40gp) : undefined,
            cartons40hc: d.cartons40hc !== undefined ? Number(d.cartons40hc) : undefined,
            qty40hc: d.qty40hc !== undefined ? Number(d.qty40hc) : undefined,
            cartons45hc: d.cartons45hc !== undefined ? Number(d.cartons45hc) : undefined,
            qty45hc: d.qty45hc !== undefined ? Number(d.qty45hc) : undefined,
            factoryQuotes: Array.isArray(d.factoryQuotes)
              ? d.factoryQuotes.map((fq: any) => ({
                  id: String(fq.id || `fq_${Math.random()}`),
                  factoryName: String(fq.factoryName || ''),
                  price: Number(fq.price || 0),
                  currency: fq.currency || 'RMB',
                  moq: fq.moq !== undefined ? Number(fq.moq) : undefined,
                  leadTimeDays: fq.leadTimeDays !== undefined ? Number(fq.leadTimeDays) : undefined,
                  contactPerson: fq.contactPerson || undefined,
                  supplierUrl: fq.supplierUrl || undefined,
                  notes: fq.notes || undefined,
                  isPrimary: Boolean(fq.isPrimary),
                  quotationDate: fq.quotationDate || undefined,
                }))
              : undefined,
            createdAt: d.createdAt || new Date().toISOString(),
            updatedAt: d.updatedAt || new Date().toISOString(),
          });
        });

        // Sort by newest updated
        products.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());

        onData(products);
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

export async function saveProductToFirestore(userId: string, product: CatalogProduct): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  const prodId = product && product.id ? String(product.id) : '';
  if (!uid || !prodId) return;
  const path = `users/${uid}/products/${prodId}`;
  try {
    const docRef = doc(db, 'users', uid, 'products', prodId);
    const payload = cleanProductPayload(product, uid);
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteProductFromFirestore(userId: string, productId: string): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  const pid = String(productId || '');
  if (!uid || !pid) return;
  const path = `users/${uid}/products/${pid}`;
  try {
    const docRef = doc(db, 'users', uid, 'products', pid);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

export async function migrateLocalProductsToFirestoreIfEmpty(
  userId: string,
  localProducts: CatalogProduct[]
): Promise<{ migrated: boolean; count: number }> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid) return { migrated: false, count: 0 };
  const path = `users/${uid}/products`;
  try {
    const colRef = collection(db, 'users', uid, 'products');
    const snap = await getDocs(colRef);
    if (snap.empty && localProducts && localProducts.length > 0) {
      const batch = writeBatch(db);
      localProducts.forEach((p) => {
        const docRef = doc(db, 'users', uid, 'products', p.id);
        batch.set(docRef, cleanProductPayload(p, uid), { merge: true });
      });
      await batch.commit();
      return { migrated: true, count: localProducts.length };
    }
    return { migrated: false, count: snap.size };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return { migrated: false, count: 0 };
  }
}

export async function batchSaveProductsToFirestore(userId: string, products: CatalogProduct[]): Promise<void> {
  const uid = typeof userId === 'string' ? userId : (userId as any)?.uid ? String((userId as any).uid) : '';
  if (!uid || !products || products.length === 0) return;
  const path = `users/${uid}/products`;
  try {
    const batch = writeBatch(db);
    products.forEach((product) => {
      const docRef = doc(db, 'users', uid, 'products', product.id);
      batch.set(docRef, cleanProductPayload(product, uid), { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}
