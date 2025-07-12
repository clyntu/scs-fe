import ARFormDetails from "./ARForm/ARFormDetails";
import ARFormTable from "./ARForm/ARFormTable";
import { Button, Divider } from "@mui/joy";
import SaveIcon from "@mui/icons-material/Save";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosConfig";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import { toast } from "react-toastify";
import { type OutstandingTrans } from "./interface";
import type {
  PaginatedCustomers,
  Customer,
  ARFormProps,
  AR,
} from "../../interface";
import ReverseARModal from "./ReverseARModal";
import CircularProgress from "@mui/joy/CircularProgress";
import { addTwoPlaces } from "../../helper";

const ARForm = ({
  setOpen,
  openCreate,
  openEdit,
  selectedRow,
  title,
}: ARFormProps): JSX.Element => {
  const currentDate = new Date().toISOString().split("T")[0];
  const [customers, setCustomers] = useState<PaginatedCustomers>({
    total: 0,
    items: [],
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [outstandingTrans, setOutstandingTrans] = useState<OutstandingTrans[]>(
    [],
  );
  const [status, setStatus] = useState("unposted");
  const [transactionDate, setTransactionDate] = useState(currentDate);
  const [remarks, setRemarks] = useState("");

  const [paymentMode, setPaymentMode] = useState("cash");
  const [checkDate, setCheckDate] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState("");

  const [addAmount1, setAddAmount1] = useState("");
  const [addAmount2, setAddAmount2] = useState("");
  const [addAmount3, setAddAmount3] = useState("");
  const [lessAmount, setLessAmount] = useState("");

  const [refNo, setRefNo] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [reversalReason, setReversalReason] = useState("");
  const [openReverse, setOpenReverse] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const [selectedCDR, setSelectedCDR] = useState<string | null>(null);
  const [cdrNumbers, setCDRNumbers] = useState<string[]>([]);

  const totalApplied = outstandingTrans.reduce(
    (total, trans) => total + Number(trans.payment),
    0,
  );
  const addAmount = addAmount1 + addAmount2 + addAmount3;
  const paymentAmount = totalApplied - Number(lessAmount) + Number(addAmount);

  const isEditDisabled =
    selectedRow !== undefined && selectedRow?.status !== "unposted";

  useEffect(() => {
    // Fetch customers
    axiosInstance
      .get<PaginatedCustomers>(
        "/api/customers/?with_pending_receivables=True&sort_by=name",
      )
      .then((response) => setCustomers(response.data))
      .catch((error) => console.error("Error:", error));
  }, []);

  useEffect(() => {
    // Set fields for Edit
    const customerID = selectedRow?.customer.customer_id ?? null;

    const fetchValues = (selectedRow: AR) => {
      setStatus(selectedRow?.status ?? "unposted");
      setTransactionDate(selectedRow?.transaction_date ?? currentDate);
      setPaymentMode(selectedRow.payment_method);

      setAmountPaid(String(parseFloat(selectedRow?.check_amount ?? "")));
      setCheckNumber(selectedRow?.check_number ?? "");
      setCheckDate(selectedRow?.check_date ?? "");
      setRefNo(selectedRow.reference_number);

      setLessAmount(String(parseFloat(selectedRow.less_amount)));
      setAddAmount1(String(parseFloat(selectedRow.add_amount)));
      setRemarks(selectedRow?.remarks ?? "");
      setPaymentStatus(selectedRow.payment_status);
      setSelectedCDR(selectedRow?.cdr_number_filter);

      fetchARByCustomer(customerID, true);
    };

    if (selectedRow !== null && selectedRow !== undefined) {
      const promises: Promise<any>[] = [];
      // Get Customer for Edit
      const customerPromise = axiosInstance
        .get<Customer>(`/api/customers/${customerID}`)
        .then((response) => {
          setSelectedCustomer(response.data);
        })
        .catch((error) => console.error("Error:", error));

      promises.push(customerPromise);

      const arPromise = axiosInstance
        .get<AR>(`/api/ar-receipts/${selectedRow.id}`)
        .then((response) => {
          const ARItems = response.data.receipt_items;

          const formattedARItems = ARItems.map((item) => {
            return {
              id: item.source_id,
              source_type: item.source_type,
              transaction_number:
                item.source_type === "customer_dr"
                  ? `DR-${item.source_id}`
                  : `CR-${item.source_id}`,
              transaction_date: item.source_transaction_date,
              original_amount: item.original_amount,
              transaction_amount: item.transaction_amount,
              payment: String(parseFloat(item.payment_amount)),
              balance: String(
                Number(item.transaction_amount) - Number(item.payment_amount),
              ),
              reference: item.reference,
            };
          });
          setOutstandingTrans(formattedARItems);
        })
        .catch((error) => console.error("Error:", error));

      promises.push(arPromise);

      Promise.all(promises).finally(() => {
        fetchValues(selectedRow);
        setIsFetching(false);
      });
    } else {
      setIsFetching(false);
    }
  }, [selectedRow]);

  const fetchARByCustomer = (
    customerId: number | null,
    noSet = false,
    completePayment = false,
  ) => {
    setIsLoadingItems(true);
    // Fetch ARs
    axiosInstance
      .get<OutstandingTrans[]>(
        `/api/ar-receipts/customer/${customerId}/outstanding-transactions`,
      )
      .then((response) => {
        if (!noSet) {
          setOutstandingTrans(
            response.data.map((trans) => {
              if (completePayment) {
                return {
                  ...trans,
                  payment: addTwoPlaces(Number(trans.transaction_amount)),
                };
              }
              return { ...trans, payment: "" };
            }),
          );
        }

        // Combination of transaction numbers and reference(for CR)
        setCDRNumbers([
          ...new Set(
            response.data
              .flatMap((trans) => [trans.transaction_number, trans.reference])
              // DR numbers only
              .filter((transNo) => transNo.startsWith("DR")),
          ),
        ]);
        setIsLoadingItems(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setIsLoadingItems(false);
      });
  };

  const resetForm = (): void => {
    setSelectedCustomer(null);
    setOutstandingTrans([]);
    setStatus("unposted");
    setTransactionDate(currentDate);
    setRemarks("");
    setPaymentMode("cash");
    setCheckDate("");
    setCheckNumber("");
    setAmountPaid("");
    setAddAmount1("");
    setAddAmount2("");
    setAddAmount3("");
    setLessAmount("");
    setRefNo("");
  };

  // Create Receipt
  const handleCreateAR = async (): Promise<void> => {
    const receiptItems = outstandingTrans
      .filter((row) => !!row.payment)
      .map((row) => {
        return {
          source_type: row.source_type,
          source_id: row.id,
          original_amount: row.original_amount,
          transaction_amount: row.transaction_amount,
          payment_amount: Number(row.payment),
          reference: row.reference,
        };
      });

    const payload = {
      reference_number: refNo,
      status,
      transaction_date: transactionDate == "" ? null : transactionDate,
      customer_id: selectedCustomer?.customer_id,
      payment_method: paymentMode,
      check_number: checkNumber,
      check_amount: amountPaid == "" ? null : Number(amountPaid),
      check_date: checkDate == "" ? null : checkDate,
      less_amount: lessAmount == "" ? 0 : Number(lessAmount),
      add_amount: addAmount == "" ? 0 : Number(addAmount),
      remarks,
      days_to_clear: 1,
      receipt_items: receiptItems,
      payment_status:
        status === "posted" && paymentMode === "cash" ? "cleared" : "pending",
      payment_amount: paymentAmount,
      total_applied: totalApplied,
      cdr_number_filter: selectedCDR,
    };

    try {
      setIsSaving(true);
      await axiosInstance.post("/api/ar-receipts/", payload);
      setIsSaving(false);
      toast.success("Save successful!");
      setHasSaved(true);
      // Handle the response, update state, etc.
    } catch (error: any) {
      toast.error(
        `Error message: ${error?.response?.data?.detail[0]?.msg || error?.response?.data?.detail}`,
      );
      setIsSaving(false);
    }
  };

  const handleEditAR = async (): Promise<void> => {
    const receiptItems = outstandingTrans
      .filter((row) => !!row.payment)
      .map((row) => {
        return {
          source_type: row.source_type,
          source_id: row.id,
          original_amount: row.original_amount,
          transaction_amount: row.transaction_amount,
          payment_amount: row.payment,
          reference: row.reference,
        };
      });

    const payload = {
      reference_number: refNo,
      status: "unposted",
      transaction_date: transactionDate == "" ? null : transactionDate,
      customer_id: selectedCustomer?.customer_id,
      payment_method: paymentMode,
      check_number: checkNumber,
      check_amount: amountPaid == "" ? null : Number(amountPaid),
      check_date: checkDate == "" ? null : checkDate,
      less_amount: lessAmount == "" ? 0 : Number(lessAmount),
      add_amount: addAmount == "" ? 0 : Number(addAmount),
      remarks,
      days_to_clear: 1,
      receipt_items: receiptItems,
      payment_amount: paymentAmount,
      total_applied: totalApplied,
      cdr_number_filter: selectedCDR,
    };

    try {
      setIsSaving(true);
      // First unposted PUT request to edit fields
      await axiosInstance.put(`/api/ar-receipts/${selectedRow?.id}`, payload);

      // If status is "posted", send second PUT request to post
      if (status === "posted") {
        try {
          await axiosInstance.put(`/api/ar-receipts/${selectedRow?.id}/post`);
          toast.success("Post successful!");
        } catch (error: any) {
          toast.error(
            `Error message: ${error?.response?.data?.detail?.[0]?.msg || error?.response?.data?.detail}`,
          );
          setIsSaving(false);
          return; // Prevent form reset and closing if post fails
        }
      }

      toast.success("Save successful!");
      setIsSaving(false);
      setHasSaved(true);
    } catch (error: any) {
      toast.error(
        `Error message: ${error?.response?.data?.detail?.[0]?.msg || error?.response?.data?.detail}`,
      );
      setIsSaving(false);
    }
  };

  const onReverse = async () => {
    try {
      await axiosInstance.put(
        `/api/ar-receipts/${selectedRow?.id}/payment-status`,
        {
          payment_status: "reversed",
          reversal_reason: reversalReason,
        },
      );
      toast.success("Reverse successful!");
      setOpenReverse(false);
      setHasSaved(true);
    } catch (error: any) {
      toast.error(
        `Error message: ${error?.response?.data?.detail?.[0]?.msg || error?.response?.data?.detail}`,
      );
    }
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (openCreate) await handleCreateAR();
        if (openEdit) await handleEditAR();
      }}
    >
      <div className="flex justify-between">
        <h2 className="mb-6">{title}</h2>
        <div className="flex">
          {isEditDisabled && paymentStatus === "cleared" && (
            <Button
              className="w-[130px] h-[35px] bg-button-primary"
              size="sm"
              onClick={() => setOpenReverse(true)}
            >
              Bounce Check
            </Button>
          )}
          {/* <Button
            className="w-[130px] h-[35px] bg-button-neutral ml-3"
            size="sm"
            color="neutral"
          >
            <LocalPrintshopIcon className="mr-2" />
            Print
          </Button> */}
        </div>
      </div>
      {isFetching ? (
        <div className="flex justify-center mt-[20%]">
          <CircularProgress size="lg" variant="soft" />
        </div>
      ) : (
        <>
          <ARFormDetails
            openEdit={openEdit}
            selectedRow={selectedRow}
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            fetchARByCustomer={fetchARByCustomer}
            status={status}
            setStatus={setStatus}
            transactionDate={transactionDate}
            setTransactionDate={setTransactionDate}
            remarks={remarks}
            setRemarks={setRemarks}
            isEditDisabled={isEditDisabled}
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            checkDate={checkDate}
            setCheckDate={setCheckDate}
            checkNumber={checkNumber}
            setCheckNumber={setCheckNumber}
            amountPaid={amountPaid}
            setAmountPaid={setAmountPaid}
            addAmount1={addAmount1}
            addAmount2={addAmount2}
            addAmount3={addAmount3}
            setAddAmount1={setAddAmount1}
            setAddAmount2={setAddAmount2}
            setAddAmount3={setAddAmount3}
            lessAmount={lessAmount}
            setLessAmount={setLessAmount}
            totalApplied={totalApplied}
            paymentAmount={paymentAmount}
            refNo={refNo}
            setRefNo={setRefNo}
            paymentStatus={paymentStatus}
            selectedCDR={selectedCDR}
            setSelectedCDR={setSelectedCDR}
            cdrNumbers={cdrNumbers}
            outstandingTrans={outstandingTrans}
            setOutstandingTrans={setOutstandingTrans}
          />
          <ARFormTable
            outstandingTrans={outstandingTrans}
            setOutstandingTrans={setOutstandingTrans}
            selectedRow={selectedRow}
            openEdit={openEdit}
            isLoadingItems={isLoadingItems}
            isEditDisabled={isEditDisabled}
            selectedCDR={selectedCDR}
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

      <ReverseARModal
        open={openReverse}
        setOpen={setOpenReverse}
        title="Bounce Check"
        onDelete={onReverse}
        reverseReason={reversalReason}
        setReverseReason={setReversalReason}
      />
    </form>
  );
};

export default ARForm;
