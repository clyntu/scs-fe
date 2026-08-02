import { Button, Typography } from "@mui/joy";
import SaveIcon from "@mui/icons-material/Save";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import { useEffect, useState, useRef } from "react";
import axiosInstance from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import {
  type User,
  type PaginatedWarehouse,
  type Customer,
  type PaginatedCustomers,
  type AllocFormProps,
  type PaginatedCPO,
  type AllocItem,
  type Alloc,
} from "../../interface";
import { convertToQueryParams, getErrorMessage } from "../../helper";
import {
  type CPOItemFE,
  type StockAvailabilityResponse,
  type WarehouseStockInfo,
} from "./interface";
import AllocFormDetails from "./AllocForm/AllocFormDetails";
import AllocFormTable from "./AllocForm/AllocFormTable";
import { FormLoadingSkeleton } from "../shared/ContentStates";

const AllocForm = ({
  setOpen,
  openCreate,
  openEdit,
  selectedRow,
  title,
}: AllocFormProps): JSX.Element => {
  const currentDate = new Date().toISOString().split("T")[0];
  const isEditDisabled =
    selectedRow !== undefined && selectedRow?.status !== "unposted";
  const [status, setStatus] = useState("unposted");
  const [transactionDate, setTransactionDate] = useState(currentDate);
  const [remarks, setRemarks] = useState("");
  const [, setUserId] = useState<number | null>(null);
  const [warehouses, setWarehouses] = useState<PaginatedWarehouse>({
    total: 0,
    items: [],
  });

  const [customers, setCustomers] = useState<PaginatedCustomers>({
    total: 0,
    items: [],
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [CPOItems, setCPOItems] = useState<CPOItemFE[]>([]);

  const [cpoNumbers, setCPONumbers] = useState<number[]>([]);
  const [selectedCPO, setSelectedCPO] = useState<number | null>(null);

  // Add state for warehouse stock availability
  const [warehouseStockAvailability, setWarehouseStockAvailability] = useState<
    Record<string, WarehouseStockInfo[]>
  >({});

  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Add ref to track if we need to refresh stock availability
  const lastStockFetchTime = useRef<number>(0);
  const STOCK_REFRESH_INTERVAL = 30000; // 30 seconds

  // Add window focus listener to refresh stock data
  useEffect(() => {
    const handleWindowFocus = (): void => {
      const now = Date.now();
      if (
        CPOItems.length > 0 &&
        now - lastStockFetchTime.current > STOCK_REFRESH_INTERVAL
      ) {
        const itemIds = CPOItems.map((item) => item.item_id);
        void fetchWarehouseStockAvailability(itemIds);
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => window.removeEventListener("focus", handleWindowFocus);
  }, [CPOItems]);

  useEffect(() => {
    // Fetch warehouses
    axiosInstance
      .get<PaginatedWarehouse>("/api/warehouses/")
      .then((response) => {
        setWarehouses(response.data);
      })
      .catch((error) => console.error("Error:", error));

    // Fetch customers
    axiosInstance
      .get<PaginatedCustomers>(
        "/api/customers/?with_active_cpo=True&sort_by=name",
      )
      .then((response) => setCustomers(response.data))
      .catch((error) => console.error("Error:", error));

    // Fetch user ID
    axiosInstance
      .get<User>("/api/users/me/")
      .then((response) => setUserId(response.data.id))
      .catch((error) => console.error("Error fetching user ID:", error));
  }, []);

  useEffect(() => {
    // Fill in fields for Edit
    const fetchValues = (selectedRow: Alloc): void => {
      setStatus(selectedRow?.status ?? "unposted");
      setTransactionDate(selectedRow?.transaction_date ?? currentDate);
      setRemarks(selectedRow?.remarks ?? "");
      setSelectedCPO(
        selectedRow?.cpo_number_filter !== undefined &&
          selectedRow.cpo_number_filter !== ""
          ? Number(selectedRow.cpo_number_filter)
          : null,
      );

      // Fill up tables
      const formattedItems = selectedRow.allocation_items.map(
        (item: AllocItem) => {
          // get real time volume and allocQty
          const itemId = item.item_id;
          const CPOItem = item.customer_purchase_order.items.find((cpoItem) => {
            return cpoItem.item_id === itemId;
          });

          const volume = CPOItem?.volume ?? 0;
          const allocQty =
            volume !== 0 && CPOItem?.unserved_cpo !== undefined
              ? volume - CPOItem?.unserved_cpo
              : 0;

          // get warehouse
          let warehouse1 = null;
          let warehouse2 = null;
          let warehouse3 = null;
          let warehouse1Qty;
          let warehouse2Qty;
          let warehouse3Qty;

          if (item.warehouse_allocations.length >= 1) {
            warehouse1 =
              warehouses.items.find(
                (warehouse) =>
                  warehouse.id === item.warehouse_allocations[0].warehouse_id,
              ) ?? null;

            warehouse1Qty = String(item.warehouse_allocations[0].allocated_qty);
          }

          if (item.warehouse_allocations.length >= 2) {
            warehouse2 =
              warehouses.items.find(
                (warehouse) =>
                  warehouse.id === item.warehouse_allocations[1].warehouse_id,
              ) ?? null;
            warehouse2Qty = String(item.warehouse_allocations[1].allocated_qty);
          }

          if (item.warehouse_allocations.length === 3) {
            warehouse3 =
              warehouses.items.find(
                (warehouse) =>
                  warehouse.id === item.warehouse_allocations[2].warehouse_id,
              ) ?? null;
            warehouse3Qty = String(item.warehouse_allocations[2].allocated_qty);
          }

          return {
            id: item.customer_purchase_order_id,
            name: item.item.name,
            cpo_existing_allocated: item.cpo_existing_allocated,
            volume,
            alloc_qty: allocQty,
            item_id: itemId,
            warehouse_1: warehouse1,
            warehouse_1_qty: warehouse1Qty,
            warehouse_2: warehouse2,
            warehouse_2_qty: warehouse2Qty,
            warehouse_3: warehouse3,
            warehouse_3_qty: warehouse3Qty,
          };
        },
      );

      setCPOItems(formattedItems);

      // Fetch warehouse stock availability for edit mode
      const itemIds = formattedItems.map((item) => item.item_id);
      if (itemIds.length > 0) {
        void fetchWarehouseStockAvailability(itemIds);
      }
    };

    if (selectedRow !== undefined) {
      if (warehouses.items.length > 0) {
        axiosInstance
          .get<Customer>(`/api/customers/${selectedRow.customer.customer_id}`)
          .then((response) => {
            fetchValues(selectedRow);
            setSelectedCustomer(response.data);
            getCPOsByCustomer(response.data.customer_id, true);
            setIsFetching(false);
          })
          .catch((error) => {
            console.error("Error:", error);
            fetchValues(selectedRow);
            setIsFetching(false);
          });
      }
    } else {
      setIsFetching(false);
    }
  }, [selectedRow, warehouses]);

  // Add function to fetch warehouse stock availability
  const fetchWarehouseStockAvailability = async (
    itemIds: number[],
  ): Promise<void> => {
    if (itemIds.length === 0) return;

    try {
      const response = await axiosInstance.post<StockAvailabilityResponse>(
        "/api/warehouses/stock-availability/",
        { item_ids: itemIds },
      );
      setWarehouseStockAvailability(response.data.item_stock_availability);
      lastStockFetchTime.current = Date.now(); // Track when we last fetched
    } catch (error) {
      console.error("Error fetching warehouse stock availability:", error);
      toast.error("Failed to fetch warehouse stock information");
    }
  };

  const getCPOsByCustomer = (
    customerId: number | undefined,
    noSet = false,
  ): void => {
    setIsLoadingItems(true);
    if (customerId !== undefined && customerId !== 0) {
      const params = {
        customer_id: customerId,
        has_unserved: true,
      };

      axiosInstance
        .get<PaginatedCPO>(
          `/api/customer_purchase_orders/?${convertToQueryParams(params)}`,
        )
        .then(async (response) => {
          // Get all unique CPO numbers
          const cpoNumbers = [
            ...new Set(response.data.items.map((CPO) => CPO.id)),
          ];
          setCPONumbers(cpoNumbers);

          // Get all CPO items
          if (!noSet) {
            const CPOItems = response.data.items
              .map((CPO) => {
                return CPO.items.map((CPOItem) => {
                  return {
                    id: CPO.id,
                    name: CPOItem.item.name,
                    volume: CPOItem.volume,
                    alloc_qty: CPOItem.volume - CPOItem.unserved_cpo,
                    item_id: CPOItem.item_id,

                    // allocations
                    warehouse_1: null,
                    warehouse_1_qty: undefined,
                    warehouse_2: null,
                    warehouse_2_qty: undefined,
                    warehouse_3: null,
                    warehouse_3_qty: undefined,
                  };
                });
              })
              .flat();

            setCPOItems(CPOItems);

            // Fetch warehouse stock availability for all items
            const itemIds = CPOItems.map((item) => item.item_id);
            await fetchWarehouseStockAvailability(itemIds);
          }

          setIsLoadingItems(false);
        })
        .catch((error) => {
          console.error("Error", error);
          setIsLoadingItems(false);
        });
    }
  };

  const createPayload = (): {
    status: string;
    customer_id: number | undefined;
    remarks: string;
    transaction_date: string;
    cpo_number_filter: string | null;
    allocation_items: Array<{
      customer_purchase_order_id: number;
      item_id: number;
      warehouse_allocations: Array<{
        warehouse_id: number;
        allocated_qty: string;
      }>;
    } | null>;
  } => {
    const payload = {
      status,
      customer_id: selectedCustomer?.customer_id,
      remarks,
      transaction_date: transactionDate,
      cpo_number_filter: selectedCPO !== null ? String(selectedCPO) : null,
      allocation_items: CPOItems.map((cpoItem: CPOItemFE) => {
        // Construct warehouse_allocations array
        const warehouseAllocations = [];

        // Dynamically check and add warehouse allocations
        if (
          cpoItem.warehouse_1 !== null &&
          cpoItem.warehouse_1_qty !== undefined &&
          cpoItem.warehouse_1_qty !== ""
        ) {
          warehouseAllocations.push({
            warehouse_id: cpoItem.warehouse_1.id, // Assuming `warehouse_1` contains an `id`
            allocated_qty: cpoItem.warehouse_1_qty,
          });
        }

        if (
          cpoItem.warehouse_2 !== null &&
          cpoItem.warehouse_2_qty !== undefined &&
          cpoItem.warehouse_2_qty !== ""
        ) {
          warehouseAllocations.push({
            warehouse_id: cpoItem.warehouse_2.id, // Assuming `warehouse_2` contains an `id`
            allocated_qty: cpoItem.warehouse_2_qty,
          });
        }

        if (
          cpoItem.warehouse_3 !== null &&
          cpoItem.warehouse_3_qty !== undefined &&
          cpoItem.warehouse_3_qty !== ""
        ) {
          warehouseAllocations.push({
            warehouse_id: cpoItem.warehouse_3.id, // Assuming `warehouse_3` contains an `id`
            allocated_qty: cpoItem.warehouse_3_qty,
          });
        }

        if (warehouseAllocations.length < 1) return null;

        return {
          customer_purchase_order_id: cpoItem.id,
          item_id: cpoItem.item_id,
          warehouse_allocations: warehouseAllocations,
        };
      }).filter((item) => item?.warehouse_allocations !== undefined),
    };

    return payload;
  };

  const handleCreateAlloc = async (): Promise<void> => {
    const payload = createPayload();

    try {
      setIsSaving(true);
      await axiosInstance.post("/api/allocations/", payload);
      setIsSaving(false);
      toast.success("Save successful!");
      setHasSaved(true);

      // Handle the response, update state, etc.
    } catch (error: any) {
      toast.error(`Error: ${getErrorMessage(error, "Save unsuccessful")}`);
      setIsSaving(false);
    }
  };

  const handleEditAlloc = async (): Promise<void> => {
    const payload = createPayload();

    try {
      setIsSaving(true);
      await axiosInstance.put(`api/allocations/${selectedRow?.id}`, payload);
      setIsSaving(false);
      toast.success("Save successful!");
      setHasSaved(true);

      // Handle the response, update state, etc.
    } catch (error: any) {
      console.log(error);
      toast.error(`Error: ${getErrorMessage(error, "Save unsuccessful")}`);
      setIsSaving(false);
    }
  };

  const resetForm = (): void => {
    setStatus("unposted");
    setTransactionDate(currentDate);
    setRemarks("");
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (openCreate) await handleCreateAlloc();
        if (openEdit) await handleEditAlloc();
      }}
    >
      <div className="flex justify-between">
        <Typography level="h2" component="h1" sx={{ mb: 3 }}>
          {title}
        </Typography>
      </div>

      {isFetching ? (
        <FormLoadingSkeleton />
      ) : (
        <>
          <AllocFormDetails
            openEdit={openEdit}
            selectedRow={selectedRow}
            status={status}
            setStatus={setStatus}
            transactionDate={transactionDate}
            setTransactionDate={setTransactionDate}
            remarks={remarks}
            setRemarks={setRemarks}
            warehouses={warehouses}
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            getCPOsByCustomer={getCPOsByCustomer}
            cpoNumbers={cpoNumbers}
            CPOItems={CPOItems}
            setCPOItems={setCPOItems}
            selectedCPO={selectedCPO}
            setSelectedCPO={setSelectedCPO}
          />
          <AllocFormTable
            selectedRow={selectedRow}
            warehouses={warehouses}
            selectedCustomer={selectedCustomer}
            CPOItems={CPOItems}
            setCPOItems={setCPOItems}
            openCreate={openCreate}
            isLoadingItems={isLoadingItems}
            selectedCPO={selectedCPO}
            warehouseStockAvailability={warehouseStockAvailability}
          />
          <div className="flex justify-end mt-4">
            <Button
              sx={{
                ml: 2,
                width: "130px",
              }}
              className="w-[130px]"
              size="sm"
              variant="outlined"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              <DoDisturbIcon className="mr-2" />
              {hasSaved || isEditDisabled ? "Go Back" : "Cancel"}
            </Button>
            {!hasSaved && !isEditDisabled && (
              <Button
                type="submit"
                sx={{
                  ml: 2,
                  width: "130px",
                }}
                className="bg-button-primary"
                size="sm"
                loading={isSaving}
              >
                <SaveIcon className="mr-2" />
                Save
              </Button>
            )}
          </div>
        </>
      )}
    </form>
  );
};

export default AllocForm;
