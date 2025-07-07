import { Button, Divider } from "@mui/joy";
import SaveIcon from "@mui/icons-material/Save";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import { useEffect, useMemo, useState, useRef } from "react";
import axiosInstance from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import type { User } from "../../pages/Login";
import {
  type PaginatedWarehouse,
  type WarehouseItem,
  type Item,
  type Customer,
  type PaginatedCustomers,
  type AllocFormProps,
  PaginatedCPO,
  AllocItem,
  Alloc,
} from "../../interface";
import { convertToQueryParams } from "../../helper";
import {
  AllocFormPayload,
  CPOItemFE,
  StockAvailabilityResponse,
  WarehouseStockInfo,
} from "./interface";
import AllocFormDetails from "./AllocForm/AllocFormDetails";
import AllocFormTable from "./AllocForm/AllocFormTable";
import CircularProgress from "@mui/joy/CircularProgress";

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
  const [userId, setUserId] = useState<number | null>(null);
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
  const [isFilterVisible, setIsFilterVisible] = useState(true);

  // Add ref to track if we need to refresh stock availability
  const lastStockFetchTime = useRef<number>(0);
  const STOCK_REFRESH_INTERVAL = 30000; // 30 seconds

  // Add window focus listener to refresh stock data
  useEffect(() => {
    const handleWindowFocus = () => {
      const now = Date.now();
      if (
        CPOItems.length > 0 &&
        now - lastStockFetchTime.current > STOCK_REFRESH_INTERVAL
      ) {
        const itemIds = CPOItems.map((item) => item.item_id);
        fetchWarehouseStockAvailability(itemIds);
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
      .get<PaginatedCustomers>("/api/customers/?with_active_cpo=True")
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
    const fetchValues = (selectedRow: Alloc) => {
      setStatus(selectedRow?.status ?? "unposted");
      setTransactionDate(selectedRow?.transaction_date ?? currentDate);
      setRemarks(selectedRow?.remarks ?? "");

      // Fill up tables
      const formattedItems = selectedRow.allocation_items.map(
        (item: AllocItem) => {
          // get real time volume and alloc_qty
          const item_id = item.item_id;
          const CPOItem = item.customer_purchase_order.items.find((cpoItem) => {
            return cpoItem.item_id === item_id;
          });

          const volume = CPOItem?.volume || 0;
          const alloc_qty =
            volume !== 0 && CPOItem?.unserved_cpo !== undefined
              ? volume - CPOItem?.unserved_cpo
              : 0;

          // get warehouse
          let warehouse_1 = null;
          let warehouse_2 = null;
          let warehouse_3 = null;
          let warehouse_1_qty = undefined;
          let warehouse_2_qty = undefined;
          let warehouse_3_qty = undefined;

          if (item.warehouse_allocations.length >= 1) {
            warehouse_1 =
              warehouses.items.find(
                (warehouse) =>
                  warehouse.id === item.warehouse_allocations[0].warehouse_id,
              ) || null;

            warehouse_1_qty = String(
              item.warehouse_allocations[0].allocated_qty,
            );
          }

          if (item.warehouse_allocations.length >= 2) {
            warehouse_2 =
              warehouses.items.find(
                (warehouse) =>
                  warehouse.id === item.warehouse_allocations[1].warehouse_id,
              ) || null;
            warehouse_2_qty = String(
              item.warehouse_allocations[1].allocated_qty,
            );
          }

          if (item.warehouse_allocations.length === 3) {
            warehouse_3 =
              warehouses.items.find(
                (warehouse) =>
                  warehouse.id === item.warehouse_allocations[2].warehouse_id,
              ) || null;
            warehouse_3_qty = String(
              item.warehouse_allocations[2].allocated_qty,
            );
          }

          return {
            id: item.customer_purchase_order_id,
            name: item.item.name,
            cpo_existing_allocated: item.cpo_existing_allocated,
            volume,
            alloc_qty,
            item_id,
            warehouse_1,
            warehouse_1_qty,
            warehouse_2,
            warehouse_2_qty,
            warehouse_3,
            warehouse_3_qty,
          };
        },
      );

      setCPOItems(formattedItems);

      // Fetch warehouse stock availability for edit mode
      const itemIds = formattedItems.map((item) => item.item_id);
      if (itemIds.length > 0) {
        fetchWarehouseStockAvailability(itemIds);
      }
    };

    if (selectedRow) {
      if (warehouses?.items?.length) {
        axiosInstance
          .get<Customer>(`/api/customers/${selectedRow.customer.customer_id}`)
          .then((response) => {
            fetchValues(selectedRow);
            setSelectedCustomer(response.data);
            setIsFilterVisible(false);
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
  const fetchWarehouseStockAvailability = async (itemIds: number[]) => {
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
    customer_id: number | undefined,
    overwrite = true,
  ) => {
    setIsLoadingItems(true);
    if (customer_id) {
      const params = {
        customer_id,
        has_unserved: true,
      };

      axiosInstance
        .get<PaginatedCPO>(
          `/api/customer_purchase_orders/?${convertToQueryParams(params)}`,
        )
        .then(async (response) => {
          // Get all unique CPO numbers
          setCPONumbers([...new Set(response.data.items.map((CPO) => CPO.id))]);

          // Get all CPO items
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

          setIsLoadingItems(false);
        })
        .catch((error) => {
          console.error("Error", error);
          setIsLoadingItems(false);
        });
    }
  };

  const createPayload = () => {
    const payload = {
      status,
      customer_id: selectedCustomer?.customer_id,
      remarks,
      transaction_date: transactionDate,
      allocation_items: CPOItems.map((cpoItem: CPOItemFE) => {
        // Construct warehouse_allocations array
        const warehouse_allocations = [];

        // Dynamically check and add warehouse allocations
        if (cpoItem.warehouse_1 && cpoItem.warehouse_1_qty) {
          warehouse_allocations.push({
            warehouse_id: cpoItem.warehouse_1.id, // Assuming `warehouse_1` contains an `id`
            allocated_qty: cpoItem.warehouse_1_qty,
          });
        }

        if (cpoItem.warehouse_2 && cpoItem.warehouse_2_qty) {
          warehouse_allocations.push({
            warehouse_id: cpoItem.warehouse_2.id, // Assuming `warehouse_2` contains an `id`
            allocated_qty: cpoItem.warehouse_2_qty,
          });
        }

        if (cpoItem.warehouse_3 && cpoItem.warehouse_3_qty) {
          warehouse_allocations.push({
            warehouse_id: cpoItem.warehouse_3.id, // Assuming `warehouse_3` contains an `id`
            allocated_qty: cpoItem.warehouse_3_qty,
          });
        }

        if (warehouse_allocations.length < 1) return null;

        return {
          customer_purchase_order_id: cpoItem.id,
          item_id: cpoItem.item_id,
          warehouse_allocations,
        };
      }).filter((item) => !!item?.warehouse_allocations),
    };

    return payload;
  };

  const handleCreateAlloc = async () => {
    const payload = createPayload();

    try {
      setIsSaving(true);
      await axiosInstance.post("/api/allocations/", payload);
      setIsSaving(false);
      toast.success("Save successful!");
      setHasSaved(true);

      // Handle the response, update state, etc.
    } catch (error: any) {
      toast.error(
        `Error: ${error?.response?.data?.detail[0]?.msg || error?.response?.data?.detail}`,
      );
      setIsSaving(false);
    }
  };

  const handleEditAlloc = async () => {
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
      toast.error(
        `Error: ${error?.response?.data?.detail[0]?.msg || error?.response?.data?.detail}`,
      );
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
        <h2 className="mb-6">{title}</h2>
      </div>

      {isFetching ? (
        <div className="flex justify-center mt-[20%]">
          <CircularProgress size="lg" variant="soft" />
        </div>
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
            setCPOItems={setCPOItems}
            selectedCPO={selectedCPO}
            setSelectedCPO={setSelectedCPO}
            isFilterVisible={isFilterVisible}
            setIsFilterVisible={setIsFilterVisible}
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
