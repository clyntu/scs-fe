import { Button, Divider } from "@mui/joy";
import SaveIcon from "@mui/icons-material/Save";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import type { User } from "../../pages/Login";
import {
  type PaginatedWarehouse,
  type WarehouseItem,
  type Item,
  type Customer,
  type PaginatedCustomers,
  PaginatedCPO,
  DeallocItem,
  PaginatedAlloc,
  Alloc,
  DeallocFormProps,
} from "../../interface";
import { convertToQueryParams } from "../../helper";
import { AllocItemFE } from "./interface";
import DeallocFormDetails from "./DeallocForm/DeallocFormDetails";
import DeallocFormTable from "./DeallocForm/DeallocFormTable";

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
  const [userId, setUserId] = useState<number | null>(null);
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
      .get<PaginatedCustomers>("/api/customers/")
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
    if (selectedRow) {
      setSelectedCustomer(selectedRow.customer);
      setSelectedAlloc(selectedRow?.allocation);
      setStatus(selectedRow?.status ?? "unposted");
      setTransactionDate(selectedRow?.transaction_date ?? currentDate);
      setRemarks(selectedRow?.remarks ?? "");

      // Fill up tables
      const formattedItems = selectedRow.deallocation_items.map(
        (deallocItem: DeallocItem) => {
          // get warehouse
          let warehouse_1 = null;
          let warehouse_2 = null;
          let warehouse_3 = null;
          let warehouse_1_qty = undefined;
          let warehouse_2_qty = undefined;
          let warehouse_3_qty = undefined;

          if (deallocItem.warehouse_deallocations.length >= 1) {
            warehouse_1 =
              warehouses.items.find(
                (warehouse) =>
                  warehouse.id ===
                  deallocItem.warehouse_deallocations[0].warehouse_id,
              ) || null;

            warehouse_1_qty = String(
              deallocItem.warehouse_deallocations[0].deallocated_qty,
            );
          }

          if (deallocItem.warehouse_deallocations.length >= 2) {
            warehouse_2 =
              warehouses.items.find(
                (warehouse) =>
                  warehouse.id ===
                  deallocItem.warehouse_deallocations[1].warehouse_id,
              ) || null;
            warehouse_2_qty = String(
              deallocItem.warehouse_deallocations[1].deallocated_qty,
            );
          }

          if (deallocItem.warehouse_deallocations.length === 3) {
            warehouse_3 =
              warehouses.items.find(
                (warehouse) =>
                  warehouse.id ===
                  deallocItem.warehouse_deallocations[2].warehouse_id,
              ) || null;
            warehouse_3_qty = String(
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
            warehouse_1,
            warehouse_1_qty,
            warehouse_2,
            warehouse_2_qty,
            warehouse_3,
            warehouse_3_qty,
          };
        },
      );

      setAllocItems(formattedItems);
    }
  }, [selectedRow, warehouses]);

  const getAllocsByCustomer = (customer_id: number | undefined) => {
    if (customer_id) {
      const params = {
        customer_id,
        sort_order: "desc",
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

  const getAllocItemsByAlloc = (newAlloc: Alloc) => {
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

  const createPayload = () => {
    const payload = {
      status,
      allocation_id: selectedAlloc?.id,
      customer_id: selectedAlloc?.customer.customer_id,
      transaction_date: transactionDate,
      remarks,
      deallocation_items: allocItems
        .map((allocItem: AllocItemFE) => {
          // Construct warehouse_allocations array
          const warehouse_deallocations = [];

          // Dynamically check and add warehouse allocations
          if (allocItem.warehouse_1 && allocItem.warehouse_1_qty) {
            warehouse_deallocations.push({
              warehouse_id: allocItem.warehouse_1.id,
              deallocated_qty: allocItem.warehouse_1_qty,
            });
          }

          if (allocItem.warehouse_2 && allocItem.warehouse_2_qty) {
            warehouse_deallocations.push({
              warehouse_id: allocItem.warehouse_2.id,
              deallocated_qty: allocItem.warehouse_2_qty,
            });
          }

          if (allocItem.warehouse_3 && allocItem.warehouse_3_qty) {
            warehouse_deallocations.push({
              warehouse_id: allocItem.warehouse_3.id,
              deallocated_qty: allocItem.warehouse_3_qty,
            });
          }

          if (warehouse_deallocations.length < 1) return null;

          return {
            allocation_item_id: allocItem.alloc_item_id,
            item_id: allocItem.item_id,
            warehouse_deallocations,
          };
        })
        .filter((item) => !!item?.warehouse_deallocations),
    };

    return payload;
  };

  const handleCreateDealloc = async () => {
    const payload = createPayload();

    try {
      await axiosInstance.post("/api/deallocations/", payload);
      toast.success("Save successful!");
      resetForm();
      setOpen(false);
      // Handle the response, update state, etc.
    } catch (error: any) {
      console.log(error);
      toast.error(
        `Error: ${error?.response?.data?.detail[0]?.msg || error?.response?.data?.detail}`,
      );
    }
  };

  const handleEditDealloc = async () => {
    const payload = createPayload();

    try {
      await axiosInstance.put(`api/deallocations/${selectedRow?.id}`, payload);
      toast.success("Save successful!");
      resetForm();
      setOpen(false);
      // Handle the response, update state, etc.
    } catch (error: any) {
      console.log(error);
      toast.error(
        `Error: ${error?.response?.data?.detail[0]?.msg || error?.response?.data?.detail}`,
      );
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
        <h2 className="mb-6">{title}</h2>
      </div>
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
          className="ml-4 w-[130px]"
          size="sm"
          variant="outlined"
          onClick={() => {
            setOpen(false);
          }}
        >
          <DoDisturbIcon className="mr-2" />
          {isEditDisabled ? "Go Back" : "Cancel"}
        </Button>
        {!isEditDisabled && (
          <Button
            type="submit"
            className="ml-4 w-[130px] bg-button-primary"
            size="sm"
          >
            <SaveIcon className="mr-2" />
            Save
          </Button>
        )}
      </div>
    </form>
  );
};

export default DeallocForm;
