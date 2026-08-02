import type {
  PaginatedWarehouse,
  Warehouse,
  Customer,
  PaginatedCustomers,
  Alloc,
  PaginatedAlloc,
  Dealloc,
} from "../../interface";
import type { Dispatch, SetStateAction } from "react";

export interface DeallocFormDetailsProps {
  openEdit: boolean;
  selectedRow: Dealloc | undefined;
  status: string;
  setStatus: (status: string) => void;
  transactionDate: string;
  setTransactionDate: (transactionDate: string) => void;
  remarks: string;
  setRemarks: (remarks: string) => void;
  warehouses: PaginatedWarehouse;
  allocs: PaginatedAlloc;
  selectedAlloc: Alloc | null;
  setSelectedAlloc: Dispatch<SetStateAction<Alloc | null>>;
  customers: PaginatedCustomers;
  selectedCustomer: Customer | null;
  setSelectedCustomer: Dispatch<SetStateAction<Customer | null>>;
  getAllocsByCustomer: (customer_id: number | undefined) => void;
  getAllocItemsByAlloc: (alloc_id: Alloc) => void;
  setAllocItems: Dispatch<SetStateAction<AllocItemFE[]>>;
}

export interface DeallocFormTableProps {
  selectedRow: Dealloc | undefined;
  selectedAlloc: Alloc | null;
  allocItems: AllocItemFE[];
  setAllocItems: Dispatch<SetStateAction<AllocItemFE[]>>;
  openCreate: boolean;
  warehouses: PaginatedWarehouse;
}

export interface AllocItemFE {
  id: number;
  customer_purchase_order_id: number;
  stock_code: string;
  stock_description: string;
  item_id: number;
  alloc_item_id: number;

  warehouse_1: Warehouse | null; // Name or identifier for Warehouse 1
  warehouse_1_qty: string | undefined; // Quantity deallocated to Warehouse 1
  warehouse_2: Warehouse | null; // Name or identifier for Warehouse 2
  warehouse_2_qty: string | undefined; // Quantity deallocated to Warehouse 2
  warehouse_3: Warehouse | null; // Name or identifier for Warehouse 3
  warehouse_3_qty: string | undefined; // Quantity deallocated to Warehouse 3
}

interface Destinations {
  to_warehouse_id: number;
  quantity: number;
}

export interface AllocFormPayload {
  warehouse_id: number;
  item_id: number;
  product_name: string;
  stock_code: string;
  destinations: Destinations[];
}
