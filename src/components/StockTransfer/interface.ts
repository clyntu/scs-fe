import type {
  PaginatedRR,
  PaginatedWarehouse,
  ReceivingReport,
  Warehouse,
  StockTransfer,
  Supplier,
  PaginatedSuppliers,
} from "../../interface";
import type { Dispatch, SetStateAction } from "react";

export interface STFormDetailsProps {
  openEdit: boolean;
  selectedRow: StockTransfer | undefined;
  status: string;
  setStatus: (status: string) => void;
  transactionDate: string;
  setTransactionDate: (transactionDate: string) => void;
  remarks: string;
  setRemarks: (remarks: string) => void;
  rrTransfer: string;
  setRRTransfer: (rrTransfer: string) => void;
  warehouses: PaginatedWarehouse;
  selectedWarehouse: Warehouse | null;
  setSelectedWarehouse: (warehouse: Warehouse | null) => void;
  receivingAreaWarehouse: Warehouse | null;
  receivingReports: PaginatedRR;
  selectedRR: ReceivingReport | null;
  setSelectedRR: (receivingReport: ReceivingReport | null) => void;
  suppliers: PaginatedSuppliers;
  selectedSupplier: Supplier | null;
  setSelectedSupplier: Dispatch<SetStateAction<Supplier | null>>;
  fetchWarehouseItems: (
    warehouse_id: number,
    rr: ReceivingReport | null,
  ) => void;
  setWarehouseItems: (warehouseItems: WarehouseItemsFE[]) => void;
}

export interface WarehouseItemsFE {
  id: string;
  warehouse_id: number;
  item_id: number;
  name: string;
  stock_code: string;
  total_quantity: number;
  on_stock: number;
  allocated: number;
  warehouse_1: Warehouse | null; // Name or identifier for Warehouse 1
  warehouse_1_qty: string | undefined; // Quantity allocated to Warehouse 1
  warehouse_2: Warehouse | null; // Name or identifier for Warehouse 2
  warehouse_2_qty: string | undefined; // Quantity allocated to Warehouse 2
  warehouse_3: Warehouse | null; // Name or identifier for Warehouse 3
  warehouse_3_qty: string | undefined; // Quantity allocated to Warehouse 3
}

export interface STFormTableProps {
  selectedRow: StockTransfer | undefined;
  warehouses: PaginatedWarehouse;
  warehouseItems: WarehouseItemsFE[];
  setWarehouseItems: (warehouseItems: WarehouseItemsFE[]) => void;
  isLoadingItems: boolean;
}

interface Destinations {
  to_warehouse_id: number;
  quantity: number;
}

export interface STFormPayload {
  warehouse_id: number;
  item_id: number;
  product_name: string;
  stock_code: string;
  destinations: Destinations[];
}

export interface RRAvailableStockItem {
  item_id: number;
  stock_code: string;
  product_name: string;
  rr_on_stock: number;
  total_transferred: number;
  available_stock: number;
  warehouse_id: number;
}

export interface RRAvailableStockResponse {
  rr_id: number;
  warehouse_id: number;
  items: RRAvailableStockItem[];
}
