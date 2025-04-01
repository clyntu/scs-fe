import SDRFormDetails from "./SDRForm/SDRFormDetails";
import SDRFormTable from "./SDRForm/SDRFormTable";
import { Button, Divider } from "@mui/joy";
import SaveIcon from "@mui/icons-material/Save";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosConfig";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import { toast } from "react-toastify";
import type { User } from "../../pages/Login";
import type {
  SDRFormProps,
  Supplier,
  PaginatedSuppliers,
  PurchaseOrder,
} from "../../interface";

const DeliveryReceiptForm = ({
  setOpen,
  openCreate,
  openEdit,
  selectedRow,
  title,
}: SDRFormProps): JSX.Element => {
  const currentDate = new Date().toISOString().split("T")[0];
  const [suppliers, setSuppliers] = useState<PaginatedSuppliers>({
    total: 0,
    items: [],
  });
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [selectedPOs, setSelectedPOs] = useState<PurchaseOrder[]>([]);
  const [status, setStatus] = useState("unposted");
  const [transactionDate, setTransactionDate] = useState(currentDate);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  const [totalGross, setTotalGross] = useState(0);
  const [totalNet, setTotalNet] = useState(0);
  const [amountDiscount, setAmountDiscount] = useState(0);
  const [servedAmt, setServedAmt] = useState<Record<string, number>>({});
  const pesoRate = selectedPOs.length > 0 ? selectedPOs[0].peso_rate : 0;
  const currencyUsed =
    selectedPOs.length > 0 ? selectedPOs[0].currency_used : "USD";
  const fobTotal = totalGross;
  const netAmount = totalNet - amountDiscount;
  const landedTotal = netAmount * pesoRate;

  const isEditDisabled =
    selectedRow !== undefined && selectedRow?.status !== "unposted";

  useEffect(() => {
    // Fetch suppliers
    axiosInstance
      .get<PaginatedSuppliers>("/api/suppliers/")
      .then((response) => setSuppliers(response.data))
      .catch((error) => console.error("Error:", error));

    // Fetch user ID
    axiosInstance
      .get<User>("/api/users/me/")
      .then((response) => setUserId(response.data.id))
      .catch((error) => console.error("Error fetching user ID:", error));
  }, []);

  useEffect(() => {
    // Set fields for Edit
    const supplierID = selectedRow?.purchase_orders[0].supplier_id;

    if (selectedRow !== null && selectedRow !== undefined) {
      setStatus(selectedRow?.status ?? "unposted");
      setTransactionDate(selectedRow?.transaction_date ?? currentDate);
      setReferenceNumber(selectedRow?.reference_number ?? "");
      setRemarks(selectedRow?.remarks ?? "");
      setAmountDiscount(selectedRow?.discount_amount ?? 0);
      setSelectedPOs(selectedRow?.purchase_orders);

      // Get Supplier for Edit
      axiosInstance
        .get<Supplier>(`/api/suppliers/${supplierID}`)
        .then((response) => {
          setSelectedSupplier(response.data);
        })
        .catch((error) => console.error("Error:", error));
    }
  }, [selectedRow]);

  const resetForm = (): void => {
    setSelectedSupplier(null);
    setSelectedPOs([]);
    setStatus("unposted");
    setTransactionDate(currentDate);
    setReferenceNumber("");
    setRemarks("");
    setAmountDiscount(0);
  };

  const handleCreateDeliveryReceipt = async (): Promise<void> => {
    const payload = {
      sdr_data: {
        status,
        transaction_date: transactionDate,
        fob_total: fobTotal,
        net_amount: netAmount,
        landed_total: landedTotal,
        discount_amount: amountDiscount,
        reference_number: referenceNumber,
        remarks,
        created_by: userId,
      },
      items_data: selectedPOs.flatMap((PO, index1) =>
        PO.items.map((POItem, index2) => {
          const key = `${PO.id}-${POItem.id}-${index1}-${index2}`;
          return {
            purchase_order_id: PO.id,
            item_id: POItem.item_id,
            volume: POItem.volume,
            price: POItem.price,
            total_price: POItem.total_price,
            id: POItem.id,
            unserved_spo: POItem.unserved_spo,
            on_stock: POItem.on_stock,
            in_transit: servedAmt[key],
            allocated: POItem.allocated,
          };
        }),
      ),
    };

    try {
      await axiosInstance.post("/api/supplier-delivery-receipts/", payload);
      toast.success("Save successful!");
      resetForm();
      setOpen(false);
      // Handle the response, update state, etc.
    } catch (error: any) {
      toast.error(
        `Error message: ${error?.response?.data?.detail[0]?.msg || error?.response?.data?.detail}`,
      );
    }
  };

  const handleEditDeliveryReceipt = async (): Promise<void> => {
    const payload = {
      sdr_data: {
        status,
        transaction_date: transactionDate,
        fob_total: fobTotal,
        net_amount: netAmount,
        landed_total: landedTotal,
        discount_amount: amountDiscount,
        reference_number: referenceNumber,
        remarks,
        modified_by: userId,
      },
      items_data: selectedPOs.flatMap((PO, index1) =>
        PO.items.map((POItem, index2) => {
          const key = `${PO.id}-${POItem.id}-${index1}-${index2}`;
          return {
            purchase_order_id: PO.id,
            item_id: POItem.item_id,
            volume: POItem.volume,
            price: POItem.price,
            total_price: POItem.total_price,
            id: POItem.id,
            unserved_spo: POItem.unserved_spo,
            on_stock: POItem.on_stock,
            in_transit: servedAmt[key],
            allocated: POItem.allocated,
          };
        }),
      ),
    };

    try {
      await axiosInstance.put(
        `/api/supplier-delivery-receipts/${selectedRow?.id}`,
        payload,
      );
      toast.success("Save successful!");
      resetForm();
      setOpen(false);
      // Handle the response, update state, etc.
    } catch (error: any) {
      toast.error(
        `Error message: ${error?.response?.data?.detail[0]?.msg || error?.response?.data?.detail}`,
      );
    }
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (openCreate) await handleCreateDeliveryReceipt();
        if (openEdit) await handleEditDeliveryReceipt();
      }}
    >
      <div className="flex justify-between">
        <h2 className="mb-6">{title}</h2>
        <Button
          className="w-[130px] h-[35px] bg-button-neutral"
          size="sm"
          color="neutral"
        >
          <LocalPrintshopIcon className="mr-2" />
          Print
        </Button>
      </div>
      <SDRFormDetails
        openEdit={openEdit}
        selectedRow={selectedRow}
        suppliers={suppliers}
        // Fields
        selectedSupplier={selectedSupplier}
        setSelectedSupplier={setSelectedSupplier}
        selectedPOs={selectedPOs}
        setSelectedPOs={setSelectedPOs}
        status={status}
        setStatus={setStatus}
        transactionDate={transactionDate}
        setTransactionDate={setTransactionDate}
        remarks={remarks}
        setRemarks={setRemarks}
        referenceNumber={referenceNumber}
        setReferenceNumber={setReferenceNumber}
        pesoRate={pesoRate}
        currencyUsed={currencyUsed}
        // Summary Amounts
        fobTotal={fobTotal}
        netAmount={netAmount}
        landedTotal={landedTotal}
        amountDiscount={amountDiscount}
        setAmountDiscount={setAmountDiscount}
        isEditDisabled={isEditDisabled}
      />
      <SDRFormTable
        selectedRow={selectedRow}
        selectedPOs={selectedPOs}
        setSelectedPOs={setSelectedPOs}
        totalNet={totalNet}
        servedAmt={servedAmt}
        setServedAmt={setServedAmt}
        setTotalNet={setTotalNet}
        setTotalGross={setTotalGross}
        openEdit={openEdit}
        isEditDisabled={isEditDisabled}
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

export default DeliveryReceiptForm;
