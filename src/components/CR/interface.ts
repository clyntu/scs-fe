import type {
  PaginatedCustomers,
  Customer,
  CR,
  Warehouse,
  PaginatedWarehouse,
} from "../../interface";
import type { Dispatch, SetStateAction } from "react";

export interface CRFormDetailsProps {
  openEdit: boolean;
  selectedRow: CR | undefined;
  customers: PaginatedCustomers;
  formattedDRs: DRItemsFE[];
  setFormattedDRs: Dispatch<SetStateAction<DRItemsFE[]>>;

  // Fields
  selectedCustomer: Customer | null;
  setSelectedCustomer: Dispatch<SetStateAction<Customer | null>>;
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  transactionDate: string;
  setTransactionDate: Dispatch<SetStateAction<string>>;
  remarks: string;
  setRemarks: Dispatch<SetStateAction<string>>;
  referenceNumber: string;
  setReferenceNumber: Dispatch<SetStateAction<string>>;
  isEditDisabled: boolean;
  totalGross: number;
  totalItems: number;

  discountReturn: number | string;
  setDiscountReturn: Dispatch<SetStateAction<number | string>>;
}

export interface CRFormTableProps {
  selectedRow: CR | undefined;
  warehouses: PaginatedWarehouse;
  formattedDRs: DRItemsFE[];
  setFormattedDRs: Dispatch<SetStateAction<DRItemsFE[]>>;
  totalGross: number;
  totalItems: number;
  openEdit: boolean;
  isEditDisabled: boolean;
}

export interface DRItemsFE {
  id: number;
  delivery_receipt_item_id: number;
  item_id: number;
  alloc_no: number;
  cpo_id: number;
  stock_code: string;
  name: string;
  return_warehouse: Warehouse | null;
  return_qty: string;
  price: string;
  gross_amount: number;
  customer_discount_1: string;
  customer_discount_2: string;
  customer_discount_3: string;
  transaction_discount_1: string;
  transaction_discount_2: string;
  transaction_discount_3: string;
}
