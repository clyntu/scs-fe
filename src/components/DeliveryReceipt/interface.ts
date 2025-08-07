import type {
  PurchaseOrder,
  Supplier,
  PaginatedSuppliers,
  Item,
  DeliveryReceipt,
} from "../../interface";
import type { Dispatch, SetStateAction } from "react";

export interface SDRFormDetailsProps {
  openEdit: boolean;
  selectedRow: DeliveryReceipt | undefined;
  suppliers: PaginatedSuppliers;
  selectedPOs: PurchaseOrder[];
  setSelectedPOs: Dispatch<SetStateAction<PurchaseOrder[]>>;
  setSelectedRow?: (record: DeliveryReceipt) => void;
  viewFilters?: Record<string, any>;

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
  pesoRate: number;
  currencyUsed: string;
  isEditDisabled: boolean;

  fobTotal: number;
  netAmount: number;
  landedTotal: number;
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
  selectedRow: DeliveryReceipt | undefined;
  selectedPOs: PurchaseOrder[];
  setSelectedPOs: Dispatch<SetStateAction<PurchaseOrder[]>>;
  totalNet: number;
  servedAmt: Record<string, number>;
  setServedAmt: Dispatch<SetStateAction<Record<string, number>>>;
  setTotalNet: Dispatch<SetStateAction<number>>;
  setTotalGross: Dispatch<SetStateAction<number>>;
  openEdit: boolean;
  isEditDisabled: boolean;
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
