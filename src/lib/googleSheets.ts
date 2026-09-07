import { InquiryItem, OrderStatus } from '../types';
import { sanitizeCellForSheets } from './imageUtils';

const SHEET_NAME = 'Inquiries Pipeline';
const SPREADSHEET_TITLE = 'Sourcing Agent Inquiries & Clients';

export const SHEET_COLUMNS = [
  'Inquiry Number',
  'Date',
  'Customer Name',
  'Customer Contact',
  'WeChat ID',
  'Country',
  'Product',
  '1688 Product Link',
  'Supplier / Store',
  'Quantity (pcs)',
  '1688 Price (¥)',
  'Domestic Shipping (¥)',
  'Margin (%)',
  'Client Unit Price ($)',
  'Total Quotation ($)',
  'Estimated Profit ($)',
  'Order Status',
  'Notes',
  'Last Updated',
  'Record ID',
  'Image URL',
  'Selected Quote ID',
  'Quotes Data (JSON)',
];

/**
 * Converts an InquiryItem to a Google Sheet row array
 */
export function inquiryToRow(item: InquiryItem): (string | number)[] {
  const rawRow: (string | number)[] = [
    item.inquiryNumber || '',
    item.date || '',
    item.customerName || '',
    item.customerContact || '',
    item.wechatId || '',
    item.country || '',
    item.product || '',
    item.productUrl1688 || '',
    item.supplierName || '',
    item.quantity || 0,
    item.price1688Rmb || 0,
    item.domesticShippingRmb || 0,
    item.marginPercent || 0,
    item.clientUnitPriceUsd || 0,
    item.totalQuotationUsd || 0,
    item.estimatedProfitUsd || 0,
    item.orderStatus || 'New Inquiry',
    item.notes || '',
    item.updatedAt || new Date().toISOString(),
    item.id || '',
    item.imageUrl || '',
    item.selectedQuoteId || '',
    item.quotes ? JSON.stringify(item.quotes) : '',
  ];

  return rawRow.map((val) => sanitizeCellForSheets(val, 45000));
}

/**
 * Converts a Google Sheet row array to an InquiryItem
 */
export function rowToInquiry(row: any[]): InquiryItem {
  const [
    inquiryNumber,
    date,
    customerName,
    customerContact,
    wechatId,
    country,
    product,
    productUrl1688,
    supplierName,
    quantity,
    price1688Rmb,
    domesticShippingRmb,
    marginPercent,
    clientUnitPriceUsd,
    totalQuotationUsd,
    estimatedProfitUsd,
    orderStatus,
    notes,
    updatedAt,
    id,
    imageUrl,
    selectedQuoteId,
    quotesJson,
  ] = row;

  let quotes: any[] | undefined = undefined;
  if (quotesJson && typeof quotesJson === 'string') {
    try {
      quotes = JSON.parse(quotesJson);
    } catch (e) {
      console.error('Failed to parse quotes JSON:', e);
    }
  }

  const validStatus: OrderStatus = [
    'New Inquiry',
    '1688 Sourcing',
    'Quoted to Client',
    'Sample Ordered',
    'Sample Approved',
    'Order Placed',
    'In Production',
    'QC & Inspection',
    'Shipped',
    'Completed',
    'Cancelled',
  ].includes(orderStatus)
    ? (orderStatus as OrderStatus)
    : 'New Inquiry';

  return {
    id: id ? String(id) : `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    inquiryNumber: inquiryNumber ? String(inquiryNumber) : `INQ-${Date.now().toString().slice(-4)}`,
    date: date ? String(date) : new Date().toISOString().split('T')[0],
    customerName: customerName ? String(customerName) : '',
    customerContact: customerContact ? String(customerContact) : '',
    wechatId: wechatId ? String(wechatId) : '',
    country: country ? String(country) : '',
    product: product ? String(product) : '',
    imageUrl: imageUrl ? String(imageUrl) : '',
    productUrl1688: productUrl1688 ? String(productUrl1688) : '',
    supplierName: supplierName ? String(supplierName) : '',
    quantity: Number(quantity) || 1,
    price1688Rmb: Number(price1688Rmb) || 0,
    domesticShippingRmb: Number(domesticShippingRmb) || 0,
    quotes,
    selectedQuoteId: selectedQuoteId ? String(selectedQuoteId) : undefined,
    marginPercent: Number(marginPercent) || 0,
    clientUnitPriceUsd: Number(clientUnitPriceUsd) || 0,
    totalQuotationUsd: Number(totalQuotationUsd) || 0,
    estimatedProfitUsd: Number(estimatedProfitUsd) || 0,
    orderStatus: validStatus,
    notes: notes ? String(notes) : '',
    updatedAt: updatedAt ? String(updatedAt) : new Date().toISOString(),
  };
}

const SHEET_ID_KEY = 'sourcing_agent_sheet_id';
const SHEET_URL_KEY = 'sourcing_agent_sheet_url';

export const getCachedSpreadsheetInfo = (): { spreadsheetId: string; spreadsheetUrl: string } | null => {
  try {
    const id = localStorage.getItem(SHEET_ID_KEY);
    const url = localStorage.getItem(SHEET_URL_KEY);
    if (id && url) {
      return { spreadsheetId: id, spreadsheetUrl: url };
    }
  } catch (e) {
    console.warn('LocalStorage error reading spreadsheet info:', e);
  }
  return null;
};

export const setCachedSpreadsheetInfo = (info: { spreadsheetId: string; spreadsheetUrl: string } | null) => {
  try {
    if (info) {
      localStorage.setItem(SHEET_ID_KEY, info.spreadsheetId);
      localStorage.setItem(SHEET_URL_KEY, info.spreadsheetUrl);
    } else {
      localStorage.removeItem(SHEET_ID_KEY);
      localStorage.removeItem(SHEET_URL_KEY);
    }
  } catch (e) {
    console.warn('LocalStorage error writing spreadsheet info:', e);
  }
};

/**
 * Searches Google Drive for existing Sourcing Sheet or creates a new one
 */
export async function getOrCreateSourcingSheet(
  accessToken: string,
  preferredId?: string | null
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. If we already have a cached/known spreadsheet ID, verify if it exists
  const targetId = preferredId || getCachedSpreadsheetInfo()?.spreadsheetId;
  if (targetId) {
    try {
      const checkRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${targetId}?fields=spreadsheetId,spreadsheetUrl`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (checkRes.ok) {
        const data = await checkRes.json();
        const info = {
          spreadsheetId: data.spreadsheetId,
          spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
        };
        setCachedSpreadsheetInfo(info);
        return info;
      } else if (checkRes.status === 401) {
        throw new Error('Google session expired (401). Please sign in again.');
      } else if (checkRes.status === 403) {
        throw new Error('Access permission to Google Sheet denied (403). Please reconnect.');
      }
      // If 404, the sheet might have been deleted, proceed to search Drive
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('403')) {
        throw err;
      }
      console.warn('Cached spreadsheet check failed, falling back to Drive search:', err);
    }
  }

  // 2. Search Google Drive for existing sheet
  const query = encodeURIComponent(
    `name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
  );
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&pageSize=1`;

  let searchRes: Response;
  try {
    searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (netErr: any) {
    throw new Error('Network error connecting to Google Drive. Please check your internet connection.');
  }

  if (searchRes.status === 401) {
    throw new Error('Google session expired (401). Please sign in again.');
  }
  if (searchRes.status === 403) {
    throw new Error('Access denied to Google Drive/Sheets. Please reconnect your Google account.');
  }

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const existing = searchData.files[0];
      const info = {
        spreadsheetId: existing.id,
        spreadsheetUrl: existing.webViewLink || `https://docs.google.com/spreadsheets/d/${existing.id}/edit`,
      };
      setCachedSpreadsheetInfo(info);
      return info;
    }
  }

  // 3. If not found, create new Google Sheet with styled header
  let createRes: Response;
  try {
    createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: SPREADSHEET_TITLE,
        },
        sheets: [
          {
            properties: {
              title: SHEET_NAME,
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });
  } catch (netErr: any) {
    throw new Error('Network error creating Google Spreadsheet. Please check your connection.');
  }

  if (createRes.status === 401) {
    throw new Error('Google session expired (401). Please sign in again.');
  }

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Failed to create Google Spreadsheet');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl =
    sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 4. Populate Header Row and Format
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        SHEET_NAME
      )}!A1:W1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [SHEET_COLUMNS],
        }),
      }
    );
  } catch (hErr) {
    console.warn('Failed to populate header row:', hErr);
  }

  // 5. Style the Header Row (Dark background, Bold text)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetData.sheets?.[0]?.properties?.sheetId || 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.09, green: 0.12, blue: 0.18 }, // Navy/Slate dark
                  textFormat: {
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    bold: true,
                    fontSize: 10,
                  },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: sheetData.sheets?.[0]?.properties?.sheetId || 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: SHEET_COLUMNS.length,
              },
            },
          },
        ],
      }),
    });
  } catch (styleErr) {
    console.warn('Could not apply formatting to Google Sheet header:', styleErr);
  }

  const result = { spreadsheetId, spreadsheetUrl };
  setCachedSpreadsheetInfo(result);
  return result;
}

/**
 * Fetch all inquiry items from the Google Sheet
 */
export async function fetchInquiriesFromSheet(
  spreadsheetId: string,
  accessToken: string
): Promise<InquiryItem[]> {
  const range = `${encodeURIComponent(SHEET_NAME)}!A2:W`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (netErr: any) {
    throw new Error('Network error fetching from Google Sheets. Please check your connection.');
  }

  if (res.status === 401) {
    throw new Error('Google session expired (401). Please sign in again.');
  }

  if (!res.ok) {
    if (res.status === 404) {
      setCachedSpreadsheetInfo(null);
      throw new Error('Spreadsheet not found or access revoked');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch inquiries from Google Sheets');
  }

  const data = await res.json();
  const rows = data.values || [];

  return rows.map((row: any[]) => rowToInquiry(row)).filter((item: InquiryItem) => Boolean(item.customerName || item.product || item.inquiryNumber));
}

/**
 * Sync entire inquiry list to Google Sheet (overwrites data rows from row 2 onwards)
 */
export async function syncInquiriesToSheet(
  spreadsheetId: string,
  accessToken: string,
  items: InquiryItem[]
): Promise<void> {
  // Clear old rows first (from A2 to W1000)
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    SHEET_NAME
  )}!A2:W1000:clear`;

  try {
    const clearRes = await fetch(clearUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (clearRes.status === 401) {
      throw new Error('Google session expired (401). Please sign in again.');
    }
  } catch (err: any) {
    if (err.message?.includes('401')) throw err;
    console.warn('Could not clear old rows before update:', err);
  }

  if (items.length === 0) return;

  const rows = items.map(inquiryToRow);
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    SHEET_NAME
  )}!A2:W${items.length + 1}?valueInputOption=USER_ENTERED`;

  let res: Response;
  try {
    res = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    });
  } catch (netErr: any) {
    throw new Error('Network error syncing to Google Sheets. Please check your connection.');
  }

  if (res.status === 401) {
    throw new Error('Google session expired (401). Please sign in again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to sync inquiries to Google Sheets');
  }
}
