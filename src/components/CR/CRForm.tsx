import CRFormDetails from "./CRForm/CRFormDetails";
import CRFormTable from "./CRForm/CRFormTable";
import { Button, Divider, Typography } from "@mui/joy";
import SaveIcon from "@mui/icons-material/Save";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import { useEffect, useRef, useState } from "react";
import axiosInstance, { getCompanyId } from "../../utils/axiosConfig";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import { toast } from "react-toastify";
import { type DRItemsFE } from "./interface";
import {
  calculateTotalWithDiscounts,
  mergeSourceAllocations,
  validateSourceAllocations,
} from "./CRForm/helpers";
import type {
  CRFormProps,
  PaginatedCustomers,
  Customer,
  PaginatedWarehouse,
  CR,
} from "../../interface";
import { generateCRPDF } from "./generatePDF";
import { getErrorMessage } from "../../helper";
import { FormLoadingSkeleton } from "../shared/ContentStates";

const CRForm = ({
  setOpen,
  openCreate,
  openEdit,
  selectedRow,
  title,
}: CRFormProps): JSX.Element => {
  const currentDate = new Date().toISOString().split("T")[0];
  const [customers, setCustomers] = useState<PaginatedCustomers>({
    total: 0,
    items: [],
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [formattedDRs, setFormattedDRs] = useState<DRItemsFE[]>([]);

  const [warehouses, setWarehouses] = useState<PaginatedWarehouse>({
    total: 0,
    items: [],
  });
  const [status, setStatus] = useState("unposted");
  const [transactionDate, setTransactionDate] = useState(currentDate);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [discountReturn, setDiscountReturn] = useState<string | number>(0);

  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);
  const idempotencyRef = useRef<{
    payload: string;
    key: string;
  } | null>(null);
  const companyId = getCompanyId();

  const totalItems = formattedDRs.reduce(
    (sum, item) => sum + Number(item.return_qty),
    0,
  );

  const totalGross =
    formattedDRs.reduce((sum, item) => sum + (item.gross_amount ?? 0), 0) -
    Number(discountReturn);

  const isEditDisabled =
    selectedRow !== undefined && selectedRow?.status !== "unposted";

  useEffect(() => {
    // Fetch customers
    axiosInstance
      .get<PaginatedCustomers>(
        "/api/customers/?with_active_delivery_receipt=True&sort_by=name",
      )
      .then((response) => setCustomers(response.data))
      .catch((error) => console.error("Error:", error));

    // Fetch warehouses
    axiosInstance
      .get<PaginatedWarehouse>("/api/warehouses/")
      .then((response) => setWarehouses(response.data))
      .catch((error) => console.error("Error:", error));
  }, []);

  useEffect(() => {
    // Set fields for Edit
    const customerID = selectedRow?.customer.customer_id;

    const fetchValues = (selectedRow: CR): void => {
      setStatus(selectedRow?.status ?? "unposted");
      setTransactionDate(selectedRow?.transaction_date ?? currentDate);
      setReferenceNumber(selectedRow?.reference_number ?? "");
      setRemarks(selectedRow?.remarks ?? "");
      setDiscountReturn(selectedRow?.discount_return_amount ?? 0);

      // Fill in formatted DRs for table
      const formattedDRs = selectedRow.items.map((CRItem) => {
        const allocatedItem =
          CRItem.delivery_receipt_item.delivery_plan_item.allocation_item;
        const itemObj = allocatedItem.customer_purchase_order.items.find(
          (item) => item.item_id === allocatedItem.item_id,
        );
        const sourceFulfillments =
          CRItem.delivery_receipt_item.source_fulfillments ?? [];

        return {
          id: CRItem.delivery_receipt_item.delivery_receipt_id,
          delivery_receipt_item_id: CRItem.delivery_receipt_item_id,
          item_id: allocatedItem.item_id,
          alloc_no: allocatedItem.allocation_id,
          cpo_id: allocatedItem.customer_purchase_order_id,
          stock_code: itemObj?.item.stock_code ?? "",
          name: itemObj?.item.name ?? "",
          return_warehouse: CRItem.warehouse,
          return_qty: String(CRItem.return_qty),
          price: String(CRItem.price),
          gross_amount: calculateNetForRow(
            Number(CRItem.return_qty),
            Number(CRItem.price),
            allocatedItem.customer_purchase_order,
          ),
          customer_discount_1:
            allocatedItem.customer_purchase_order.customer_discount_1,
          customer_discount_2:
            allocatedItem.customer_purchase_order.customer_discount_2,
          customer_discount_3:
            allocatedItem.customer_purchase_order.customer_discount_3,

          transaction_discount_1:
            allocatedItem.customer_purchase_order.transaction_discount_1,
          transaction_discount_2:
            allocatedItem.customer_purchase_order.transaction_discount_2,
          transaction_discount_3:
            allocatedItem.customer_purchase_order.transaction_discount_3,
          source_fulfillments: sourceFulfillments,
          source_allocations:
            sourceFulfillments.length > 0
              ? mergeSourceAllocations(
                  sourceFulfillments,
                  CRItem.source_allocations,
                )
              : CRItem.source_allocations.map((allocation) => ({
                  deliver_event_id: allocation.deliver_event_id,
                  quantity: String(allocation.quantity),
                })),
        };
      });
      setFormattedDRs(formattedDRs);
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
    price: number,
    DRItem: {
      customer_discount_1: string;
      transaction_discount_1: string;
      customer_discount_2: string;
      transaction_discount_2: string;
      customer_discount_3: string;
      transaction_discount_3: string;
    },
  ): number => {
    const grossAmount = newValue * price;

    // Matches the backend's apply_cpo_discounts exactly: interleaved
    // customer/transaction order, percentage and flat discounts both applied
    // sequentially against the running subtotal.
    const result = calculateTotalWithDiscounts(
      [
        DRItem.customer_discount_1,
        DRItem.transaction_discount_1,
        DRItem.customer_discount_2,
        DRItem.transaction_discount_2,
        DRItem.customer_discount_3,
        DRItem.transaction_discount_3,
      ],
      grossAmount,
    );

    if (isNaN(result)) return 0;

    return result;
  };

  const resetForm = (): void => {
    setSelectedCustomer(null);
    setFormattedDRs([]);
    setStatus("unposted");
    setTransactionDate(currentDate);
    setReferenceNumber("");
    setRemarks("");
    setDiscountReturn(0);
  };

  const createPayload = (): {
    status: string;
    transaction_date: string;
    reference_number: string;
    discount_return_amount: string | number;
    remarks: string;
    customer_id: number | undefined;
    items: Array<{
      delivery_receipt_item_id: number;
      warehouse_id: number | null;
      item_id: number;
      return_qty: string;
      price: string;
      source_allocations: Array<{
        deliver_event_id: string;
        quantity: number;
      }>;
    }>;
  } => {
    const payload = {
      status,
      transaction_date: transactionDate,
      reference_number: referenceNumber,
      discount_return_amount: discountReturn,
      remarks,
      customer_id: selectedCustomer?.customer_id,
      items: formattedDRs
        .filter(
          (DRItem) => DRItem.return_qty !== "" && Number(DRItem.return_qty) > 0,
        )
        .map((DRItem) => {
          return {
            delivery_receipt_item_id: DRItem.delivery_receipt_item_id,
            warehouse_id: DRItem?.return_warehouse?.id ?? null,
            item_id: DRItem.item_id,
            return_qty: DRItem.return_qty,
            price: DRItem.price,
            source_allocations: DRItem.source_allocations
              .filter((allocation) => Number(allocation.quantity) > 0)
              .map((allocation) => ({
                deliver_event_id: allocation.deliver_event_id,
                quantity: Number(allocation.quantity),
              })),
          };
        }),
    };
    return payload;
  };

  const getIdempotencyKey = (
    payload: ReturnType<typeof createPayload>,
  ): string => {
    const serializedPayload = JSON.stringify(payload);
    if (idempotencyRef.current?.payload === serializedPayload) {
      return idempotencyRef.current.key;
    }

    const key = globalThis.crypto.randomUUID();
    idempotencyRef.current = { payload: serializedPayload, key };
    return key;
  };

  const validateReturnSources = (): boolean => {
    for (const item of formattedDRs) {
      if (Number(item.return_qty) <= 0) continue;
      const validationError = validateSourceAllocations(
        item.return_qty,
        item.source_allocations,
        item.source_fulfillments,
      );
      if (validationError !== null) {
        toast.error(`${item.stock_code}: ${validationError}`);
        return false;
      }
    }
    return true;
  };

  const handleCreateDeliveryPlanning = async (): Promise<void> => {
    const payload = createPayload();
    if (payload.items.length === 0) {
      toast.error(
        "Customer Return must contain at least one positive quantity.",
      );
      return;
    }
    if (!validateReturnSources()) return;

    try {
      setIsSaving(true);
      await axiosInstance.post("/api/customer-returns/", payload, {
        headers: { "Idempotency-Key": getIdempotencyKey(payload) },
      });
      setIsSaving(false);
      toast.success("Save successful!");
      setHasSaved(true);
      idempotencyRef.current = null;

      // Handle the response, update state, etc.
    } catch (error: any) {
      toast.error(
        `Error message: ${getErrorMessage(error, "Save unsuccessful")}`,
      );
      setIsSaving(false);
    }
  };

  const handleEditDeliveryReceipt = async (): Promise<void> => {
    const payload = createPayload();
    if (payload.items.length === 0) {
      toast.error(
        "Customer Return must contain at least one positive quantity.",
      );
      return;
    }
    if (!validateReturnSources()) return;

    try {
      setIsSaving(true);
      await axiosInstance.put(
        `/api/customer-returns/${selectedRow?.id}`,
        payload,
        { headers: { "Idempotency-Key": getIdempotencyKey(payload) } },
      );
      setIsSaving(false);
      toast.success("Save successful!");
      setHasSaved(true);
      idempotencyRef.current = null;

      // Handle the response, update state, etc.
    } catch (error: any) {
      toast.error(
        `Error message: ${getErrorMessage(error, "Save unsuccessful")}`,
      );
      setIsSaving(false);
    }
  };

  const handlePDFCreate = (): void => {
    if (selectedRow !== null && selectedRow !== undefined) {
      generateCRPDF(selectedRow, companyId);
    }
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (openCreate) await handleCreateDeliveryPlanning();
        if (openEdit) await handleEditDeliveryReceipt();
      }}
    >
      <div className="flex justify-between">
        <Typography level="h2" component="h1" sx={{ mb: 3 }}>
          {title}
        </Typography>
        {isEditDisabled && !isFetching && (
          <Button
            onClick={handlePDFCreate}
            className="w-[130px] h-[35px] bg-button-neutral"
            size="sm"
            color="neutral"
          >
            <LocalPrintshopIcon className="mr-2" />
            Print
          </Button>
        )}
      </div>

      {isFetching ? (
        <FormLoadingSkeleton />
      ) : (
        <>
          <CRFormDetails
            openEdit={openEdit}
            selectedRow={selectedRow}
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            formattedDRs={formattedDRs}
            setFormattedDRs={setFormattedDRs}
            status={status}
            setStatus={setStatus}
            transactionDate={transactionDate}
            setTransactionDate={setTransactionDate}
            remarks={remarks}
            setRemarks={setRemarks}
            referenceNumber={referenceNumber}
            setReferenceNumber={setReferenceNumber}
            isEditDisabled={isEditDisabled}
            totalGross={totalGross}
            totalItems={totalItems}
            discountReturn={discountReturn}
            setDiscountReturn={setDiscountReturn}
          />
          <CRFormTable
            selectedRow={selectedRow}
            warehouses={warehouses}
            formattedDRs={formattedDRs}
            setFormattedDRs={setFormattedDRs}
            totalGross={totalGross}
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

export default CRForm;
