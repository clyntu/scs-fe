import type {
  PurchaseOrder,
  Supplier,
  PaginatedSuppliers,
  Item,
  Customer,
  PaginatedCustomers,
  CPO,
} from "../../interface";
import type { Dispatch, SetStateAction } from "react";

export interface CPOFormProps {
  openEdit: boolean;
  selectedRow: CPO | undefined;
  customers: PaginatedCustomers;
  setSelectedItems: Dispatch<SetStateAction<Item[]>>;

  // Fields
  selectedCustomer: Customer | null;
  setSelectedCustomer: Dispatch<SetStateAction<Customer | null>>;
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  transactionDate: string;
  setTransactionDate: Dispatch<SetStateAction<string>>;
  discounts: {
    customer: string[];
    transaction: string[];
  };
  setDiscounts: Dispatch<SetStateAction<any>>;
  remarks: string;
  setRemarks: Dispatch<SetStateAction<string>>;
  referenceNumber: string;
  setReferenceNumber: Dispatch<SetStateAction<string>>;
  netTotal: number;
  grossTotal: number;
  priceLevel: string;
  setPriceLevel: Dispatch<SetStateAction<string>>;
}

export interface CPOFormTableProps {
  items: Item[];
  status: string;
  selectedRow: CPO | undefined;
  selectedItems: Item[];
  setSelectedItems: Dispatch<SetStateAction<Item[]>>;
  indexOfModal: number;
  setIndexOfModal: Dispatch<SetStateAction<number>>;
  isConfirmOpen: boolean;
  setIsConfirmOpen: Dispatch<SetStateAction<boolean>>;
  selectedCustomer: Customer | null;
}

export interface CPOPayload {
  customer_id: number;
  status: string;
  price_level: string;
  transaction_date: string;
  customer_discount_1: string;
  transaction_discount_1: string;
  customer_discount_2: string;
  transaction_discount_2: string;
  customer_discount_3: string;
  transaction_discount_3: string;
  net_total: number;
  gross_total: number;
  reference_number?: string;
  remarks: string;
  items: CPOItemValues[];
}

export interface CPOItemValues {
  item_id: number;
  p_type: string;
  volume: number;
  unserved_spo: number;
  price: number;
  total_price: number;
}
