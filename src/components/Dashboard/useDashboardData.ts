import { useCallback, useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosConfig";
import { getErrorMessage } from "../../helper";
import type { Item, User } from "../../interface";

interface PaginatedResponse<T> {
  total: number;
  items: T[];
}

interface CustomerReceivable {
  customer_id: number;
  customer_name: string;
  amount_receivable: string;
  uncleared_payment: string;
  bounced_payment: string;
}

interface ReceivablesResponse extends PaginatedResponse<CustomerReceivable> {
  total_receivable: string;
  total_uncleared: string;
  total_bounced: string;
}

export interface InventorySummary {
  activeSkus: number;
  availableUnits: number;
  allocatedUnits: number;
  stockoutCount: number;
  tightAvailabilityCount: number;
  attentionItems: Item[];
}

export interface DashboardData {
  user: User;
  inventory: InventorySummary;
  workflow: {
    draftPurchaseOrders: number;
    draftReceivingReports: number;
    unplannedAllocations: number;
    draftDeliveryPlans: number;
  };
  finance: {
    totalReceivable: number;
    totalUncleared: number;
    totalBounced: number;
    pendingCheckCount: number;
    topReceivables: CustomerReceivable[];
  };
  loadedAt: Date;
}

interface DashboardState {
  data: DashboardData | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function summarizeInventory(items: Item[]): InventorySummary {
  const activeItems = items.filter((item) => item.status === "active");
  const availableUnits = activeItems.reduce(
    (total, item) => total + Number(item.total_on_stock ?? 0),
    0,
  );
  const allocatedUnits = activeItems.reduce(
    (total, item) => total + Number(item.total_allocated ?? 0),
    0,
  );
  const stockoutCount = activeItems.filter(
    (item) => Number(item.total_on_stock ?? 0) <= 0,
  ).length;
  const tightAvailabilityCount = activeItems.filter((item) => {
    const available = Number(item.total_on_stock ?? 0);
    const allocated = Number(item.total_allocated ?? 0);
    return available > 0 && allocated >= available;
  }).length;

  const attentionItems = [...activeItems]
    .sort((first, second) => {
      const stockDifference =
        Number(first.total_on_stock ?? 0) - Number(second.total_on_stock ?? 0);
      if (stockDifference !== 0) return stockDifference;
      return (
        Number(second.total_allocated ?? 0) - Number(first.total_allocated ?? 0)
      );
    })
    .slice(0, 6);

  return {
    activeSkus: activeItems.length,
    availableUnits,
    allocatedUnits,
    stockoutCount,
    tightAvailabilityCount,
    attentionItems,
  };
}

export function useDashboardData(): DashboardState {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        userResponse,
        itemsResponse,
        purchaseOrdersResponse,
        receivingReportsResponse,
        allocationsResponse,
        deliveryPlansResponse,
        receivablesResponse,
        pendingChecksResponse,
      ] = await Promise.all([
        axiosInstance.get<User>("/api/users/me/"),
        axiosInstance.get<PaginatedResponse<Item>>(
          "/api/items/?status=active&sort_by=name&sort_order=asc",
        ),
        axiosInstance.get<PaginatedResponse<unknown>>(
          "/api/purchase_orders/?page=1&limit=1&status=unposted",
        ),
        axiosInstance.get<PaginatedResponse<unknown>>(
          "/api/receiving-reports/?page=1&limit=1&status=unposted",
        ),
        axiosInstance.get<PaginatedResponse<unknown>>(
          "/api/allocations/?page=1&limit=1&unplanned=true",
        ),
        axiosInstance.get<PaginatedResponse<unknown>>(
          "/api/delivery-plans/?page=1&limit=1&status=unposted",
        ),
        axiosInstance.get<ReceivablesResponse>(
          "/customer-financial/receivables?page=1&limit=5&sort_by=amount_receivable&sort_order=desc",
        ),
        axiosInstance.get<PaginatedResponse<unknown>>(
          "/api/ar-receipts/?page=1&limit=1&payment_status=pending&payment_method=check",
        ),
      ]);

      setData({
        user: userResponse.data,
        inventory: summarizeInventory(itemsResponse.data.items),
        workflow: {
          draftPurchaseOrders: purchaseOrdersResponse.data.total,
          draftReceivingReports: receivingReportsResponse.data.total,
          unplannedAllocations: allocationsResponse.data.total,
          draftDeliveryPlans: deliveryPlansResponse.data.total,
        },
        finance: {
          totalReceivable: Number(
            receivablesResponse.data.total_receivable ?? 0,
          ),
          totalUncleared: Number(receivablesResponse.data.total_uncleared ?? 0),
          totalBounced: Number(receivablesResponse.data.total_bounced ?? 0),
          pendingCheckCount: pendingChecksResponse.data.total,
          topReceivables: receivablesResponse.data.items,
        },
        loadedAt: new Date(),
      });
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "The operations dashboard could not be loaded. Check your connection and try again.",
        ) ??
          "The operations dashboard could not be loaded. Check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, error, isLoading, refresh };
}
