import CDPFormDetails from "./CDPForm/CDPFormDetails";
import CDPFormTable from "./CDPForm/CDPFormTable";
import { Button, Divider } from "@mui/joy";
import SaveIcon from "@mui/icons-material/Save";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosConfig";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import { toast } from "react-toastify";
import { UnplannedAlloc, type AllocItemsFE } from "./interface";
import CircularProgress from "@mui/joy/CircularProgress";
import type {
  CDPFormProps,
  PaginatedCustomers,
  Customer,
  Alloc,
  DeliveryPlanItem,
  CPO,
  CDP,
} from "../../interface";

const CDPForm = ({
  setOpen,
  openCreate,
  openEdit,
  selectedRow,
  title,
}: CDPFormProps): JSX.Element => {
  const currentDate = new Date().toISOString().split("T")[0];
  const [customers, setCustomers] = useState<PaginatedCustomers>({
    total: 0,
    items: [],
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [formattedAllocs, setFormattedAllocs] = useState<AllocItemsFE[]>([]);

  const [status, setStatus] = useState("unposted");
  const [transactionDate, setTransactionDate] = useState(currentDate);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amountDiscount, setAmountDiscount] = useState(0);
  const [remarks, setRemarks] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);

  const totalItems = formattedAllocs.reduce(
    (sum, item) => sum + (Number(item.dp_qty) > 0 ? 1 : 0),
    0,
  );

  const totalGross = formattedAllocs.reduce(
    (sum, item) => sum + (item.gross_amount ?? 0),
    0,
  );

  const totalNet =
    formattedAllocs.reduce((sum, item) => sum + (item.net_amount ?? 0), 0) -
    amountDiscount;

  const isEditDisabled =
    selectedRow !== undefined && selectedRow?.status !== "unposted";

  useEffect(() => {
    // Fetch customers
    axiosInstance
      .get<PaginatedCustomers>(
        "/api/customers/?with_active_allocation=True&sort_by=name",
      )
      .then((response) => setCustomers(response.data))
      .catch((error) => console.error("Error:", error));
  }, []);

  useEffect(() => {
    // Set fields for Edit
    const customerID = selectedRow?.customer.customer_id;
    const fetchValues = (selectedRow: CDP) => {
      setStatus(selectedRow?.status ?? "unposted");
      setTransactionDate(selectedRow?.transaction_date ?? currentDate);
      setReferenceNumber(selectedRow?.reference_number ?? "");
      setRemarks(selectedRow?.remarks ?? "");
      setAmountDiscount(Number(selectedRow?.discount_amount));

      // Fill in formatted allocs for table
      const formattedAllocs = selectedRow.delivery_plan_items.map((DPItem) => {
        const itemObj =
          DPItem.allocation_item.customer_purchase_order.items.find(
            (item) => item.item_id === DPItem.allocation_item.item_id,
          );

        return {
          id: DPItem.allocation_item.allocation_id,
          alloc_item_id: DPItem.allocation_item_id,
          stock_code: itemObj?.item.stock_code ?? "",
          name: itemObj?.item.name ?? "",
          cpo_id: DPItem.allocation_item.customer_purchase_order_id,

          alloc_qty: DPItem.existing_allocated_qty ?? 0,
          dp_qty: String(DPItem.planned_qty),

          gross_amount: (itemObj?.price ?? 0) * DPItem.planned_qty,
          net_amount: calculateNetForRow(
            Number(DPItem.planned_qty),
            DPItem.allocation_item.customer_purchase_order,
            itemObj?.price ?? 0,
          ),

          cpo_item_volume: itemObj?.volume ?? 0,
          cpo_item_unserved: itemObj?.unserved_cpo ?? 0,
          price: itemObj?.price ?? 0,
          customer_discount_1:
            DPItem.allocation_item.customer_purchase_order.customer_discount_1,
          customer_discount_2:
            DPItem.allocation_item.customer_purchase_order.customer_discount_2,
          customer_discount_3:
            DPItem.allocation_item.customer_purchase_order.customer_discount_3,

          transaction_discount_1:
            DPItem.allocation_item.customer_purchase_order
              .transaction_discount_1,
          transaction_discount_2:
            DPItem.allocation_item.customer_purchase_order
              .transaction_discount_2,
          transaction_discount_3:
            DPItem.allocation_item.customer_purchase_order
              .transaction_discount_3,
        };
      });

      setFormattedAllocs(formattedAllocs);
    };

    if (selectedRow !== null && selectedRow !== undefined) {
      // Get Customer for Edit
      axiosInstance
        .get<Customer>(`/api/customers/${customerID}`)
        .then((response) => {
          setSelectedCustomer(response.data);
          fetchValues(selectedRow);
          setIsFetching(false);
        })
        .catch((error) => {
          console.error("Error:", error);
          fetchValues(selectedRow);
          setIsFetching(false);
        });
    } else {
      setIsFetching(false);
    }
  }, [selectedRow]);

  const calculateNetForRow = (
    newValue: number,
    allocItem: AllocItemsFE | CPO,
    price: number,
  ): number => {
    let result = newValue * price;

    if (allocItem.customer_discount_1.includes("%")) {
      const cd1 = allocItem.customer_discount_1.slice(0, -1);
      result = result - result * (parseFloat(cd1) / 100);
    }

    if (allocItem.customer_discount_2.includes("%")) {
      const cd2 = allocItem.customer_discount_2.slice(0, -1);
      result = result - result * (parseFloat(cd2) / 100);
    }

    if (allocItem.customer_discount_3.includes("%")) {
      const cd3 = allocItem.customer_discount_3.slice(0, -1);
      result = result - result * (parseFloat(cd3) / 100);
    }

    if (allocItem.transaction_discount_1.includes("%")) {
      const td1 = allocItem.transaction_discount_1.slice(0, -1);
      result = result - result * (parseFloat(td1) / 100);
    }

    if (allocItem.transaction_discount_2.includes("%")) {
      const td2 = allocItem.transaction_discount_2.slice(0, -1);
      result = result - result * (parseFloat(td2) / 100);
    }

    if (allocItem.transaction_discount_3.includes("%")) {
      const td3 = allocItem.transaction_discount_3.slice(0, -1);
      result = result - result * (parseFloat(td3) / 100);
    }

    if (isNaN(result)) return 0;

    return result;
  };

  const resetForm = (): void => {
    setSelectedCustomer(null);
    setFormattedAllocs([]);
    setStatus("unposted");
    setTransactionDate(currentDate);
    setReferenceNumber("");
    setRemarks("");
    setAmountDiscount(0);
  };

  const createPayload = () => {
    const payload = {
      status,
      transaction_date: transactionDate,
      discount_amount: amountDiscount,
      reference_number: referenceNumber,
      remarks,
      customer_id: selectedCustomer?.customer_id,
      total_net: totalNet,
      total_gross: totalGross,
      total_items: totalItems,
      delivery_plan_items: formattedAllocs
        .filter((allocItem) => allocItem.dp_qty && Number(allocItem.dp_qty) > 0)
        .map((allocItem) => {
          return {
            allocation_item_id: allocItem.alloc_item_id,
            planned_qty: allocItem.dp_qty,
          };
        }),
    };
    return payload;
  };

  const handleCreateDeliveryPlanning = async (): Promise<void> => {
    const payload = createPayload();
    if (payload.delivery_plan_items.length === 0) {
      toast.error("Delivery Plan must contain at least one positive quantity.");
      return;
    }

    try {
      setIsSaving(true);
      await axiosInstance.post("/api/delivery-plans/", payload);
      setIsSaving(false);
      toast.success("Save successful!");
      setHasSaved(true);

      // Handle the response, update state, etc.
    } catch (error: any) {
      toast.error(
        `Error message: ${error?.response?.data?.detail[0]?.msg || error?.response?.data?.detail || "Save unsuccessful"}`,
      );
      setIsSaving(false);
    }
  };

  const handleEditDeliveryPlanning = async (): Promise<void> => {
    const payload = createPayload();
    if (payload.delivery_plan_items.length === 0) {
      toast.error("Delivery Plan must contain at least one positive quantity.");
      return;
    }

    try {
      setIsSaving(true);
      await axiosInstance.put(
        `/api/delivery-plans/${selectedRow?.id}`,
        payload,
      );
      setIsSaving(false);
      toast.success("Save successful!");
      setHasSaved(true);

      // Handle the response, update state, etc.
    } catch (error: any) {
      toast.error(
        `Error message: ${error?.response?.data?.detail[0]?.msg || error?.response?.data?.detail || "Save unsuccessful"}`,
      );
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (openCreate) await handleCreateDeliveryPlanning();
        if (openEdit) await handleEditDeliveryPlanning();
      }}
    >
      <div className="flex justify-between">
        <h2 className="mb-6">{title}</h2>
        {/* <Button
          className="w-[130px] h-[35px] bg-button-neutral"
          size="sm"
          color="neutral"
        >
          <LocalPrintshopIcon className="mr-2" />
          Print
        </Button> */}
      </div>

      {isFetching ? (
        <div className="flex justify-center mt-[20%]">
          <CircularProgress size="lg" variant="soft" />
        </div>
      ) : (
        <>
          <CDPFormDetails
            openEdit={openEdit}
            selectedRow={selectedRow}
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            formattedAllocs={formattedAllocs}
            setFormattedAllocs={setFormattedAllocs}
            status={status}
            setStatus={setStatus}
            transactionDate={transactionDate}
            setTransactionDate={setTransactionDate}
            remarks={remarks}
            setRemarks={setRemarks}
            referenceNumber={referenceNumber}
            setReferenceNumber={setReferenceNumber}
            isEditDisabled={isEditDisabled}
            totalNet={totalNet}
            totalGross={totalGross}
            totalItems={totalItems}
            amountDiscount={amountDiscount}
            setAmountDiscount={setAmountDiscount}
          />
          <CDPFormTable
            selectedRow={selectedRow}
            formattedAllocs={formattedAllocs}
            setFormattedAllocs={setFormattedAllocs}
            totalGross={totalGross}
            totalNet={totalNet}
            totalItems={totalItems}
            openEdit={openEdit}
            isEditDisabled={isEditDisabled}
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

export default CDPForm;
