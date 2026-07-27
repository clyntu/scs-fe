import { Button, Divider, Typography } from "@mui/joy";
import SaveIcon from "@mui/icons-material/Save";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import type { User } from "../../pages/Login";
import {
  type PaginatedWarehouse,
  type Customer,
  type PaginatedCustomers,
  type DeallocItem,
  type PaginatedAlloc,
  type Alloc,
  type DeallocFormProps,
} from "../../interface";
import { convertToQueryParams, getErrorMessage } from "../../helper";
import { type AllocItemFE } from "./interface";
import DeallocFormDetails from "./DeallocForm/DeallocFormDetails";
import DeallocFormTable from "./DeallocForm/DeallocFormTable";
import CircularProgress from "@mui/joy/CircularProgress";

const DeallocForm = ({
  setOpen,
  openCreate,
  openEdit,
  selectedRow,
  title,
}: DeallocFormProps): JSX.Element => {
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

  const [allocs, setAllocs] = useState<PaginatedAlloc>({
    total: 0,
    items: [],
  });
  const [selectedAlloc, setSelectedAlloc] = useState<Alloc | null>(null);

  const [customers, setCustomers] = useState<PaginatedCustomers>({
    total: 0,
    items: [],
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [allocItems, setAllocItems] = useState<AllocItemFE[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);

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
        "/api/customers/?with_unplanned_allocation=True&sort_by=name",
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
    if (selectedRow !== undefined) {
      setIsFetching(true);
      setSelectedCustomer(selectedRow.customer);
      setSelectedAlloc(selectedRow?.allocation);
      setStatus(selectedRow?.status ?? "unposted");
      setTransactionDate(selectedRow?.transaction_date ?? currentDate);
      setRemarks(selectedRow?.remarks ?? "");

      // Fill up tables
      const formattedItems = selectedRow.deallocation_items.map(
        (deallocItem: DeallocItem) => {
          // get warehouse
          let warehouse1 = null;
          let warehouse2 = null;
          let warehouse3 = null;
          let warehouse1Qty;
          let warehouse2Qty;
          let warehouse3Qty;

          if (deallocItem.warehouse_deallocations.length >= 1) {
            warehouse1 =
              warehouses.items.find(
                (warehouse) =>
                  warehouse.id ===
                  deallocItem.warehouse_deallocations[0].warehouse_id,
              ) ?? null;

            warehouse1Qty = String(
              deallocItem.warehouse_deallocations[0].deallocated_qty,
            );
          }

          if (deallocItem.warehouse_deallocations.length >= 2) {
            warehouse2 =
              warehouses.items.find(
                (warehouse) =>
                  warehouse.id ===
                  deallocItem.warehouse_deallocations[1].warehouse_id,
              ) ?? null;
            warehouse2Qty = String(
              deallocItem.warehouse_deallocations[1].deallocated_qty,
            );
          }

          if (deallocItem.warehouse_deallocations.length === 3) {
            warehouse3 =
              warehouses.items.find(
                (warehouse) =>
                  warehouse.id ===
                  deallocItem.warehouse_deallocations[2].warehouse_id,
              ) ?? null;
            warehouse3Qty = String(
              deallocItem.warehouse_deallocations[2].deallocated_qty,
            );
          }

          return {
            id: selectedRow.allocation_id,
            alloc_item_id: deallocItem.allocation_item_id,
            customer_purchase_order_id:
              deallocItem.allocation_item.customer_purchase_order_id,
            stock_code: deallocItem.allocation_item.item.stock_code,
            stock_description: deallocItem.allocation_item.item.name,
            item_id: deallocItem.item_id,
            warehouse_1: warehouse1,
            warehouse_1_qty: warehouse1Qty,
            warehouse_2: warehouse2,
            warehouse_2_qty: warehouse2Qty,
            warehouse_3: warehouse3,
            warehouse_3_qty: warehouse3Qty,
          };
        },
      );

      setAllocItems(formattedItems);
      setIsFetching(false);
    } else {
      setIsFetching(false);
    }
  }, [selectedRow, warehouses]);

  const getAllocsByCustomer = (customerId: number | undefined): void => {
    if (customerId !== undefined && customerId !== 0) {
      const params = {
        customer_id: customerId,
        sort_order: "desc",
        unplanned: true,
      };

      axiosInstance
        .get<PaginatedAlloc>(
          `/api/allocations/?${convertToQueryParams(params)}`,
        )
        .then((response) => {
          const allocs = response.data;
          setAllocs(allocs);
        })
        .catch((error) => console.error("Error", error));
    }
  };

  const getAllocItemsByAlloc = (newAlloc: Alloc): void => {
    if (newAlloc !== null && newAlloc !== undefined) {
      const allocItems: AllocItemFE[] = newAlloc.allocation_items
        .map((allocItem) => {
          return {
            id: newAlloc.id,
            alloc_item_id: allocItem.id,
            customer_purchase_order_id: allocItem.customer_purchase_order_id,
            stock_code: allocItem.item.stock_code,
            stock_description: allocItem.item.name,
            item_id: allocItem.item_id,

            // deallocations
            warehouse_1: null,
            warehouse_1_qty: undefined,
            warehouse_2: null,
            warehouse_2_qty: undefined,
            warehouse_3: null,
            warehouse_3_qty: undefined,
          };
        })
        .flat();

      setAllocItems(allocItems);
    }
  };

  const createPayload = (): {
    status: string;
    allocation_id: number | undefined;
    customer_id: number | undefined;
    transaction_date: string;
    remarks: string;
    deallocation_items: Array<{
      allocation_item_id: number;
      item_id: number;
      warehouse_deallocations: Array<{
        warehouse_id: number;
        deallocated_qty: string;
      }>;
    } | null>;
  } => {
    const payload = {
      status,
      allocation_id: selectedAlloc?.id,
      customer_id: selectedAlloc?.customer.customer_id,
      transaction_date: transactionDate,
      remarks,
      deallocation_items: allocItems
        .map((allocItem: AllocItemFE) => {
          // Construct warehouse_allocations array
          const warehouseDeallocations = [];

          // Dynamically check and add warehouse allocations
          if (
            allocItem.warehouse_1 !== null &&
            allocItem.warehouse_1_qty !== undefined &&
            allocItem.warehouse_1_qty !== ""
          ) {
            warehouseDeallocations.push({
              warehouse_id: allocItem.warehouse_1.id,
              deallocated_qty: allocItem.warehouse_1_qty,
            });
          }

          if (
            allocItem.warehouse_2 !== null &&
            allocItem.warehouse_2_qty !== undefined &&
            allocItem.warehouse_2_qty !== ""
          ) {
            warehouseDeallocations.push({
              warehouse_id: allocItem.warehouse_2.id,
              deallocated_qty: allocItem.warehouse_2_qty,
            });
          }

          if (
            allocItem.warehouse_3 !== null &&
            allocItem.warehouse_3_qty !== undefined &&
            allocItem.warehouse_3_qty !== ""
          ) {
            warehouseDeallocations.push({
              warehouse_id: allocItem.warehouse_3.id,
              deallocated_qty: allocItem.warehouse_3_qty,
            });
          }

          if (warehouseDeallocations.length < 1) return null;

          return {
            allocation_item_id: allocItem.alloc_item_id,
            item_id: allocItem.item_id,
            warehouse_deallocations: warehouseDeallocations,
          };
        })
        .filter((item) => item?.warehouse_deallocations !== undefined),
    };

    return payload;
  };

  const handleCreateDealloc = async (): Promise<void> => {
    const payload = createPayload();

    try {
      setIsSaving(true);
      await axiosInstance.post("/api/deallocations/", payload);
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

  const handleEditDealloc = async (): Promise<void> => {
    const payload = createPayload();

    try {
      setIsSaving(true);
      await axiosInstance.put(`api/deallocations/${selectedRow?.id}`, payload);
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
        if (openCreate) await handleCreateDealloc();
        if (openEdit) await handleEditDealloc();
      }}
    >
      <div className="flex justify-between">
        <Typography level="h2" component="h1" sx={{ mb: 3 }}>
          {title}
        </Typography>
      </div>

      {isFetching ? (
        <div className="flex justify-center mt-[20%]">
          <CircularProgress size="lg" variant="soft" />
        </div>
      ) : (
        <>
          <DeallocFormDetails
            openEdit={openEdit}
            selectedRow={selectedRow}
            status={status}
            setStatus={setStatus}
            transactionDate={transactionDate}
            setTransactionDate={setTransactionDate}
            remarks={remarks}
            setRemarks={setRemarks}
            warehouses={warehouses}
            allocs={allocs}
            selectedAlloc={selectedAlloc}
            setSelectedAlloc={setSelectedAlloc}
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            getAllocsByCustomer={getAllocsByCustomer}
            getAllocItemsByAlloc={getAllocItemsByAlloc}
            setAllocItems={setAllocItems}
          />
          <DeallocFormTable
            selectedRow={selectedRow}
            selectedAlloc={selectedAlloc}
            allocItems={allocItems}
            setAllocItems={setAllocItems}
            openCreate={openCreate}
            warehouses={warehouses}
          />
          <Divider />
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

export default DeallocForm;
