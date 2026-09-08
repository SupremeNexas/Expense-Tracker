import { Prisma } from '@prisma/client';

export interface ParsedCSVRow {
  rowIndex: number;
  raw: Record<string, string>;
}

export interface MappedFieldData {
  date: string;
  parsedDate: Date | null;
  title: string;
  amount: number | null;
  type: 'EXPENSE' | 'INCOME';
  categoryName: string;
  walletName: string;
  paymentMethod: string;
  tags: string[];
  notes: string;
  location: string;
}

export interface RowValidationResult {
  rowIndex: number;
  status: 'valid' | 'duplicate' | 'invalid';
  errors: string[];
  warnings: string[];
  data: MappedFieldData;
  duplicateDetails?: string | null;
}

/**
 * RFC 4180 Compliant CSV Parser
 * Handles delimiters (comma, semicolon, tab), quotes escaping (""), and newlines inside quoted fields.
 */
export function parseCSV(csvContent: string): string[][] {
  if (!csvContent || !csvContent.trim()) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  // Auto-detect delimiter from first line (comma, semicolon, or tab)
  const firstLineEnd = csvContent.search(/[\r\n]/);
  const sampleLine = firstLineEnd !== -1 ? csvContent.substring(0, firstLineEnd) : csvContent;
  let delimiter = ',';
  const commaCount = (sampleLine.match(/,/g) || []).length;
  const semicolonCount = (sampleLine.match(/;/g) || []).length;
  const tabCount = (sampleLine.match(/\t/g) || []).length;

  if (semicolonCount > commaCount && semicolonCount > tabCount) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = '\t';
  }

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote ("")
          currentField += '"';
          i++;
        } else {
          // Closing quote
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++; // Skip \n in \r\n
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * RFC 4180 Compliant CSV Serializer
 */
export function stringifyCSV(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const escapeField = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r') || str.includes(';')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeField).join(',');
  const dataLines = rows.map((row) => row.map(escapeField).join(','));
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Robust flexible date parser
 * Supports YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, YYYY/MM/DD, ISO strings, etc.
 */
export function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const cleaned = dateStr.trim();

  // Try standard JS Date parsing first
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    // Basic sanity check: year should be between 1900 and 2100
    const year = parsed.getFullYear();
    if (year >= 1900 && year <= 2100) {
      return parsed;
    }
  }

  // Handle slash formats MM/DD/YYYY or DD/MM/YYYY or YYYY/MM/DD
  const slashParts = cleaned.split(/[\/\.\-]/);
  if (slashParts.length === 3) {
    const [p1, p2, p3] = slashParts.map((p) => parseInt(p, 10));

    // YYYY/MM/DD
    if (p1 > 1000) {
      const d = new Date(p1, p2 - 1, p3);
      if (!isNaN(d.getTime())) return d;
    }

    // MM/DD/YYYY or DD/MM/YYYY
    if (p3 > 1000) {
      // If p1 > 12, it must be DD/MM/YYYY
      if (p1 > 12 && p2 <= 12) {
        const d = new Date(p3, p2 - 1, p1);
        if (!isNaN(d.getTime())) return d;
      }
      // Standard US MM/DD/YYYY fallback
      if (p1 <= 12 && p2 <= 31) {
        const d = new Date(p3, p1 - 1, p2);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  return null;
}

/**
 * Robust flexible amount parser
 * Handles currencies ($1,234.56, €1.234,56, ₹50.00), accounting negative (50.00), signed numbers (-15.50).
 */
export function parseFlexibleAmount(rawAmount: any): { amount: number; type?: 'EXPENSE' | 'INCOME' } | null {
  if (rawAmount === null || rawAmount === undefined || rawAmount === '') return null;
  let str = String(rawAmount).trim();
  if (!str) return null;

  let isNegative = false;

  // Accounting style (123.45)
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.substring(1, str.length - 1);
  } else if (str.startsWith('-')) {
    isNegative = true;
    str = str.substring(1);
  }

  // Remove currency symbols & spaces
  str = str.replace(/[$€£₹\s]/g, '');

  // Handle European 1.234,56 vs US 1,234.56
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf(',') < str.indexOf('.')) {
      // US format 1,234.56 -> remove commas
      str = str.replace(/,/g, '');
    } else {
      // European format 1.234,56 -> remove dots, replace comma with dot
      str = str.replace(/\./g, '').replace(',', '.');
    }
  } else if (str.includes(',')) {
    // Only comma present, if it looks like a decimal separator e.g. 15,50
    if (/^\d+,\d{1,2}$/.test(str)) {
      str = str.replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  }

  const num = parseFloat(str);
  if (isNaN(num) || !isFinite(num) || num < 0) {
    return null;
  }

  const rounded = Math.round(num * 100) / 100;
  if (rounded <= 0) return null;

  return {
    amount: rounded,
    type: isNegative ? 'EXPENSE' : undefined,
  };
}

/**
 * Header Auto-Detection Logic
 */
export function autoDetectMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {
    date: '',
    title: '',
    amount: '',
    type: '',
    category: '',
    wallet: '',
    paymentMethod: '',
    tags: '',
    notes: '',
  };

  headers.forEach((h) => {
    const norm = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!mapping.date && (norm.includes('date') || norm.includes('time') || norm === 'createdat')) {
      mapping.date = h;
    } else if (
      !mapping.title &&
      (norm.includes('title') ||
        norm.includes('merchant') ||
        norm.includes('description') ||
        norm.includes('payee') ||
        norm.includes('narrative') ||
        norm.includes('name') ||
        norm.includes('details'))
    ) {
      mapping.title = h;
    } else if (
      !mapping.amount &&
      (norm.includes('amount') ||
        norm.includes('sum') ||
        norm.includes('total') ||
        norm.includes('value') ||
        norm.includes('debit') ||
        norm.includes('credit') ||
        norm.includes('price'))
    ) {
      mapping.amount = h;
    } else if (!mapping.type && (norm.includes('type') || norm.includes('kind'))) {
      mapping.type = h;
    } else if (!mapping.category && (norm.includes('category') || norm.includes('cat'))) {
      mapping.category = h;
    } else if (!mapping.wallet && (norm.includes('wallet') || norm.includes('account') || norm.includes('bank'))) {
      mapping.wallet = h;
    } else if (!mapping.paymentMethod && (norm.includes('payment') || norm.includes('method') || norm.includes('mode'))) {
      mapping.paymentMethod = h;
    } else if (!mapping.tags && (norm.includes('tag') || norm.includes('label'))) {
      mapping.tags = h;
    } else if (!mapping.notes && (norm.includes('note') || norm.includes('memo') || norm.includes('remark'))) {
      mapping.notes = h;
    }
  });

  return mapping;
}
