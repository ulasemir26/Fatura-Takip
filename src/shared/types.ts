export type ContactType = 'MUSTERI' | 'TEDARIKCI' | 'HER_IKISI';
export type InvoiceType = 'ALIS' | 'SATIS';
export type InvoiceStatus = 'ODENDI' | 'KISMI' | 'ODENMEDI';
export type PaymentType = 'ODEME' | 'TAHSILAT';
export type PaymentMethod = 'NAKIT' | 'HAVALE_EFT' | 'KREDI_KARTI' | 'DIGER';
export type StockMovementType = 'GIRIS' | 'CIKIS' | 'DUZELTME';

export interface Contact {
  id: number;
  type: ContactType;
  name: string;
  taxNo?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  createdAt: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  category?: string;
  barcode?: string;
  unit: string;
  purchasePrice?: number;
  salePrice?: number;
  stock: number;
  minStock: number;
  location?: string;
  note?: string;
  createdAt: string;
}

export interface InvoiceItemInput {
  productId?: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
}

export interface InvoiceInput {
  invoiceNo: string;
  type: InvoiceType;
  contactId: number;
  invoiceDate: string;
  dueDate?: string;
  currency: string;
  note?: string;
  adjustStock: boolean;
  items: InvoiceItemInput[];
}

export interface PaymentInput {
  type: PaymentType;
  contactId: number;
  invoiceId?: number;
  date: string;
  amount: number;
  method: PaymentMethod;
  note?: string;
}
