import type {
  PurchaseOrder,
  Supplier,
  PaginatedSuppliers,
  Item,
} from "../../interface";
import type { Dispatch, SetStateAction } from "react";

export interface POFormProps {
  openEdit: boolean;
  selectedRow: PurchaseOrder | undefined;
  suppliers: PaginatedSuppliers;
  setSelectedItems: Dispatch<SetStateAction<Item[]>>;
  setSelectedRow?: (record: PurchaseOrder) => void;
  viewFilters?: Record<string, any>;

  // Fields
  selectedSupplier: Supplier | null;
  setSelectedSupplier: Dispatch<SetStateAction<Supplier | null>>;
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  transactionDate: string;
  setTransactionDate: Dispatch<SetStateAction<string>>;
  discounts: {
    supplier: string[];
    transaction: string[];
  };
  setDiscounts: Dispatch<SetStateAction<any>>;
  remarks: string;
  setRemarks: Dispatch<SetStateAction<string>>;
  referenceNumber: string;
  setReferenceNumber: Dispatch<SetStateAction<string>>;
  currencyUsed: string;
  setCurrencyUsed: Dispatch<SetStateAction<string>>;
  pesoRate: number | string;
  setPesoRate: Dispatch<SetStateAction<number | string>>;
  // Toggle for showing/hiding totals - optional with ? marks to ensure backward compatibility
  showTotals?: boolean;
  setShowTotals?: Dispatch<SetStateAction<boolean>>;

  fobTotal: number;
  netAmount: number;
  landedTotal: number;
}

export interface NewPriceInstance {
  id: number;
  newPrice: number;
}

export interface POFormTableProps {
  items: Item[];
  status: string;
  selectedRow: PurchaseOrder | undefined;
  selectedItems: Item[];
  setSelectedItems: Dispatch<SetStateAction<Item[]>>;
  indexOfModal: number;
  setIndexOfModal: Dispatch<SetStateAction<number>>;
  newPrices: NewPriceInstance[];
  setNewPrices: Dispatch<SetStateAction<NewPriceInstance[]>>;
  isConfirmOpen: boolean;
  setIsConfirmOpen: Dispatch<SetStateAction<boolean>>;
  selectedSupplier: Supplier | null;
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
  items: Array<{
    item_id: number;
    volume: number;
    unserved_spo: number;
    price: number;
    total_price: number;
  }>;
}

export interface POItemValues {
  item_id: number;
  volume: number;
  unserved_spo: number;
  price: number;
  total_price: number;
}
