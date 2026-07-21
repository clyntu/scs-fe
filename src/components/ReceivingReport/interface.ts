import type {
  PurchaseOrder,
  Supplier,
  PaginatedSuppliers,
  Item,
  DeliveryReceipt,
  ReceivingReport,
} from "../../interface";
import type { Dispatch, SetStateAction } from "react";

export interface SDRFormDetailsProps {
  openEdit: boolean;
  selectedRow: DeliveryReceipt | undefined;
  suppliers: PaginatedSuppliers;
  selectedPOs: PurchaseOrder[];
  setSelectedPOs: Dispatch<SetStateAction<PurchaseOrder[]>>;

  // Fields
  selectedSupplier: Supplier | null;
  setSelectedSupplier: Dispatch<SetStateAction<Supplier | null>>;
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  transactionDate: string;
  setTransactionDate: Dispatch<SetStateAction<string>>;
  remarks: string;
  setRemarks: Dispatch<SetStateAction<string>>;
  referenceNumber: string;
  setReferenceNumber: Dispatch<SetStateAction<string>>;

  fobTotal: number;
  netAmount: number;
  landedTotal: number;
  amountDiscount: number;
  setAmountDiscount: Dispatch<SetStateAction<number>>;
}

export interface RRFormDetailsProps {
  openEdit: boolean;
  selectedRow: ReceivingReport | undefined;
  suppliers: PaginatedSuppliers;
  selectedSDRs: DeliveryReceipt[];
  setSelectedSDRs: Dispatch<SetStateAction<DeliveryReceipt[]>>;

  // Fields
  selectedSupplier: Supplier | null;
  setSelectedSupplier: Dispatch<SetStateAction<Supplier | null>>;
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  transactionDate: string;
  setTransactionDate: Dispatch<SetStateAction<string>>;
  pesoRate: number | string;
  setPesoRate: Dispatch<SetStateAction<number | string>>;
  currencyUsed: string;
  setCurrencyUsed: Dispatch<SetStateAction<string>>;
  remarks: string;
  setRemarks: Dispatch<SetStateAction<string>>;
  referenceNumber: string;
  setReferenceNumber: Dispatch<SetStateAction<string>>;
  isEditDisabled: boolean;

  fobTotal: number;
  netAmount: number;
  landedTotal: number;
  totalExpense: number;
  percentNetCost: number;

  amountDiscount: number;
  setAmountDiscount: Dispatch<SetStateAction<number>>;
}

export interface NewPriceInstance {
  id: number;
  newPrice: number;
}

export interface POFormTableProps {
  selectedPOs: PurchaseOrder[];
  setSelectedPOs: Dispatch<SetStateAction<PurchaseOrder[]>>;
}

export interface SDRFormTableProps {
  selectedPOs: PurchaseOrder[];
  setSelectedPOs: Dispatch<SetStateAction<PurchaseOrder[]>>;
  totalNet: number;
  servedAmt: Record<string, number>;
  setServedAmt: Dispatch<SetStateAction<Record<string, number>>>;
  setTotalNet: Dispatch<SetStateAction<number>>;
  setTotalGross: Dispatch<SetStateAction<number>>;
  openEdit: boolean;
}

export interface RRFormTableProps {
  selectedRow: ReceivingReport | undefined;
  selectedSDRs: DeliveryReceipt[];
  setSelectedSDRs: Dispatch<SetStateAction<DeliveryReceipt[]>>;
  totalNet: number;
  servedAmt: Record<string, number>;
  setServedAmt: Dispatch<SetStateAction<Record<string, number>>>;
  setTotalNet: Dispatch<SetStateAction<number>>;
  setTotalGross: Dispatch<SetStateAction<number>>;
  openEdit: boolean;
  pesoRate: number | string;
  percentNetCost: number;
}

export interface POPayload {
  status: string;
  transaction_date: string;
  supplier_id: number;
  fob_total: number;
  currency_used: string;
  supplier_discount_1: string;
  supplier_discount_2: string;
  supplier_discount_3: string;
  transaction_discount_1: string;
  transaction_discount_2: string;
  transaction_discount_3: string;
  peso_rate: number;
  net_amount: number;
  reference_number: string;
  landed_total: number;
  remarks: string;
  created_by?: number;
  modified_by?: number;
  items: Item[];
}

export interface POItemValues {
  item_id: number;
  volume: number;
  unserved_spo: number;
  price: number;
  total_price: number;
}

export interface Expense {
  id: number;
  expense: string;
  amount: number;
  comments: string;
}

export interface ExpenseFormRow {
  id?: number;
  clientKey: string;
  expense: string;
  amount: number | string | undefined;
  comments: string;
}
