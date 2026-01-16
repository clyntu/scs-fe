import type {
  PaginatedCustomers,
  Customer,
  AR,
  Warehouse,
} from "../../interface";
import type { Dispatch, SetStateAction } from "react";

export interface ARFormDetailsProps {
  openEdit: boolean;
  selectedRow: AR | undefined;
  customers: PaginatedCustomers;

  // Fields
  selectedCustomer: Customer | null;
  fetchARByCustomer: (
    customerId: number | null,
    savedPayments?: Record<string, string>,
    currentItems?: OutstandingTrans[],
    completePayment?: boolean,
  ) => void;
  setSelectedCustomer: Dispatch<SetStateAction<Customer | null>>;
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  transactionDate: string;
  setTransactionDate: Dispatch<SetStateAction<string>>;
  remarks: string;
  setRemarks: Dispatch<SetStateAction<string>>;
  isEditDisabled: boolean;
  paymentMode: string;
  setPaymentMode: Dispatch<SetStateAction<string>>;
  checkDate: string;
  setCheckDate: Dispatch<SetStateAction<string>>;
  checkNumber: string;
  setCheckNumber: Dispatch<SetStateAction<string>>;
  amountPaid: string;
  setAmountPaid: Dispatch<SetStateAction<string>>;
  addAmount1: string;
  setAddAmount1: Dispatch<SetStateAction<string>>;
  addAmount2: string;
  setAddAmount2: Dispatch<SetStateAction<string>>;
  addAmount3: string;
  setAddAmount3: Dispatch<SetStateAction<string>>;
  lessAmount: string;
  setLessAmount: Dispatch<SetStateAction<string>>;
  totalApplied: number;
  paymentAmount: number;
  refNo: string;
  setRefNo: Dispatch<SetStateAction<string>>;
  paymentStatus: string;
  selectedCDR: string | null;
  setSelectedCDR: Dispatch<SetStateAction<string | null>>;
  cdrNumbers: string[];
  outstandingTrans: OutstandingTrans[];
  setOutstandingTrans: Dispatch<SetStateAction<OutstandingTrans[]>>;
}

export interface ARFormTableProps {
  outstandingTrans: OutstandingTrans[];
  setOutstandingTrans: Dispatch<SetStateAction<OutstandingTrans[]>>;
  selectedRow: AR | undefined;
  openEdit: boolean;
  isEditDisabled: boolean;
  isLoadingItems: boolean;
  selectedCDR: string | null;
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

export interface OutstandingTrans {
  id: number;
  source_type: string;
  transaction_number: string;
  transaction_date: string; // ISO date format (YYYY-MM-DD)
  original_amount: string; // Consider changing to number if calculations are needed
  transaction_amount: string; // Consider changing to number
  reference: string;
  days_outstanding?: number;
  balance: string; // Consider changing to number
  aging_bucket?: string;
  payment?: string;
}

export interface CustomerReceivableResponse {
  total: number;
  items: CustomerReceivable[];
  next_page: string | null;
  previous_page: string | null;
  total_receivable: string;
  total_uncleared: string;
  total_bounced: string;
}

interface CustomerReceivable {
  customer_id: number;
  customer_name: string;
  amount_receivable: string;
  uncleared_payment: string;
  bounced_payment: string;
}
