import type {
  PaginatedWarehouse,
  Warehouse,
  Customer,
  PaginatedCustomers,
  Alloc,
} from "../../interface";
import type { Dispatch, SetStateAction } from "react";

// Stock availability interfaces
export interface WarehouseStockInfo {
  warehouse_id: number;
  warehouse_name: string;
  warehouse_code: string;
  available_qty: number;
  reserved_qty: number;
  allocatable_qty: number;
}

export interface StockAvailabilityResponse {
  item_stock_availability: Record<string, WarehouseStockInfo[]>;
}

export interface AllocFormDetailsProps {
  openEdit: boolean;
  selectedRow: any;
  status: string;
  setStatus: (status: string) => void;
  transactionDate: string;
  setTransactionDate: (transactionDate: string) => void;
  remarks: string;
  setRemarks: (remarks: string) => void;
  warehouses: PaginatedWarehouse;
  customers: PaginatedCustomers;
  selectedCustomer: Customer | null;
  setSelectedCustomer: Dispatch<SetStateAction<Customer | null>>;
  getCPOsByCustomer: (customer_id: number | undefined, noSet?: boolean) => void;
  CPOItems: CPOItemFE[];
  setCPOItems: Dispatch<SetStateAction<CPOItemFE[]>>;
  cpoNumbers: number[];
  selectedCPO: number | null;
  setSelectedCPO: Dispatch<SetStateAction<number | null>>;
}

export interface CPOItemFE {
  id: number; // The ID of the Customer Purchase Order (CPO)
  name: string; // The name of the item
  volume: number; // The total volume of the item
  alloc_qty: number; // Allocated quantity (volume - unserved_cpo)
  item_id: number;
  cpo_existing_allocated?: number;

  // Allocations to warehouses
  warehouse_1: Warehouse | null; // Name or identifier for Warehouse 1
  warehouse_1_qty: string | undefined; // Quantity allocated to Warehouse 1
  warehouse_2: Warehouse | null; // Name or identifier for Warehouse 2
  warehouse_2_qty: string | undefined; // Quantity allocated to Warehouse 2
  warehouse_3: Warehouse | null; // Name or identifier for Warehouse 3
  warehouse_3_qty: string | undefined; // Quantity allocated to Warehouse 3
}

export interface AllocFormTableProps {
  selectedRow: Alloc | undefined;
  warehouses: PaginatedWarehouse;
  selectedCustomer: Customer | null;
  CPOItems: CPOItemFE[];
  setCPOItems: Dispatch<SetStateAction<CPOItemFE[]>>;
  openCreate: boolean;
  isLoadingItems: boolean;
  warehouseStockAvailability: Record<string, WarehouseStockInfo[]>;
  selectedCPO: number | null;
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
