import RRFormDetails from "./RRForm/RRFormDetails";
import RRFormTable from "./RRForm/RRFormTable";
import RRFormExpenses from "./RRForm/RRFormExpenses";
import { Button, Divider } from "@mui/joy";
import SaveIcon from "@mui/icons-material/Save";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import axiosInstance from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import type { User } from "../../pages/Login";
import type {
  Supplier,
  PaginatedSuppliers,
  RRFormProps,
  DeliveryReceipt,
} from "../../interface";
import { Expense } from "./interface";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";

const ReceivingReportForm = ({
  setOpen,
  openCreate,
  openEdit,
  selectedRow,
  title,
}: RRFormProps): JSX.Element => {
  const currentDate = new Date().toISOString().split("T")[0];
  const initialExpense: Expense = {
    id: uuid(),
    expense: "",
    amount: undefined,
    comments: "",
  };
  const [suppliers, setSuppliers] = useState<PaginatedSuppliers>({
    total: 0,
    items: [],
  });
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [selectedSDRs, setSelectedSDRs] = useState<DeliveryReceipt[]>([]);
  const [status, setStatus] = useState("unposted");
  const [transactionDate, setTransactionDate] = useState(currentDate);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [pesoRate, setPesoRate] = useState<number | string>(56);
  const [currencyUsed, setCurrencyUsed] = useState<string>("USD");
  const [amountDiscount, setAmountDiscount] = useState(0);
  const [totalGross, setTotalGross] = useState(0);
  const [totalNet, setTotalNet] = useState(0);
  const [servedAmt, setServedAmt] = useState<Record<string, number>>({});
  const [expenses, setExpenses] = useState([initialExpense]);
  const [totalExpense, setTotalExpense] = useState(0);

  const fobTotal = totalGross;
  const netAmount = totalNet - amountDiscount;
  const landedTotal = netAmount * Number(pesoRate);
  const percentNetCost = isNaN(totalExpense / landedTotal)
    ? 0
    : (totalExpense / landedTotal) * 100;

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
    const supplierID = selectedRow?.supplier_id;

    if (selectedRow !== null && selectedRow !== undefined) {
      setStatus(selectedRow?.status ?? "unposted");
      setTransactionDate(selectedRow?.transaction_date ?? currentDate);
      setReferenceNumber(selectedRow?.reference_number ?? "");
      setRemarks(selectedRow?.remarks ?? "");
      setSelectedSDRs(selectedRow?.sdrs);
      setPesoRate(selectedRow?.rate ?? 56);

      // Get Fixed Discounts and sum them
      let totalDiscount = 0;
      selectedRow.sdrs.forEach((sdr) => {
        totalDiscount += sdr.discount_amount;
      });
      setAmountDiscount(totalDiscount);

      // Set expenses
      setExpenses(
        selectedRow.expenses.map((expense) => {
          return {
            id: expense.id,
            expense: expense.expense,
            amount: expense.amount,
            comments: expense.comments,
          };
        }),
      );

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
    setSelectedSDRs([]);
    setStatus("unposted");
    setPesoRate(56);
    setCurrencyUsed("USD");
    setTransactionDate(currentDate);
    setReferenceNumber("");
    setRemarks("");
    setAmountDiscount(0);
    setExpenses([initialExpense]);
  };

  const handleCreateReceivingReport = async (): Promise<void> => {
    const payload = {
      status,
      transaction_date: transactionDate,
      supplier_id: selectedSupplier?.supplier_id,
      currency: currencyUsed,
      rate: Number(pesoRate),
      total_expense: totalExpense,
      reference_number: referenceNumber,
      pct_net_cost: percentNetCost,
      remarks,
      fob_total: fobTotal,
      net_amount: netAmount,
      landed_total: landedTotal,
      created_by: userId,
      sdr_ids: selectedSDRs.map((SDR) => SDR.id),
      expenses: expenses.map((expense) => {
        return {
          expense: expense.expense,
          amount: expense.amount || 0,
          currency: "",
          comments: expense.comments,
          created_by: userId,
        };
      }),
    };

    try {
      await axiosInstance.post("/api/receiving-reports/", payload);
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

  const handleEditReceivingReport = async (): Promise<void> => {
    const payload = {
      status,
      transaction_date: transactionDate,
      supplier_id: selectedSupplier?.supplier_id,
      currency: currencyUsed,
      rate: pesoRate,
      total_expense: totalExpense,
      reference_number: referenceNumber,
      pct_net_cost: percentNetCost,
      remarks,
      fob_total: fobTotal,
      net_amount: netAmount,
      landed_total: landedTotal,
      modified_by: userId,
      sdr_ids: selectedSDRs.map((SDR) => SDR.id),
      expenses: expenses.map((expense) => {
        return {
          id: expense.id,
          expense: expense.expense,
          amount: expense.amount || 0,
          currency: "",
          comments: expense.comments,
          modified_by: userId,
        };
      }),
    };

    try {
      await axiosInstance.put(
        `/api/receiving-reports/${selectedRow?.id}`,
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
      console.log(
        error?.response?.data?.detail[0]?.msg || error?.response?.data?.detail,
      );
    }
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (openCreate) await handleCreateReceivingReport();
        if (openEdit) await handleEditReceivingReport();
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
      <RRFormDetails
        openEdit={openEdit}
        selectedRow={selectedRow}
        suppliers={suppliers}
        // Fields
        selectedSupplier={selectedSupplier}
        setSelectedSupplier={setSelectedSupplier}
        selectedSDRs={selectedSDRs}
        setSelectedSDRs={setSelectedSDRs}
        status={status}
        setStatus={setStatus}
        pesoRate={pesoRate}
        setPesoRate={setPesoRate}
        currencyUsed={currencyUsed}
        setCurrencyUsed={setCurrencyUsed}
        transactionDate={transactionDate}
        setTransactionDate={setTransactionDate}
        remarks={remarks}
        setRemarks={setRemarks}
        referenceNumber={referenceNumber}
        setReferenceNumber={setReferenceNumber}
        amountDiscount={amountDiscount}
        setAmountDiscount={setAmountDiscount}
        // Summary Amounts
        fobTotal={fobTotal}
        netAmount={netAmount}
        landedTotal={landedTotal}
        totalExpense={totalExpense}
        percentNetCost={percentNetCost}
        isEditDisabled={isEditDisabled}
      />
      <RRFormTable
        selectedRow={selectedRow}
        selectedSDRs={selectedSDRs}
        setSelectedSDRs={setSelectedSDRs}
        totalNet={totalNet}
        servedAmt={servedAmt}
        setServedAmt={setServedAmt}
        setTotalNet={setTotalNet}
        setTotalGross={setTotalGross}
        openEdit={openEdit}
        pesoRate={pesoRate}
        percentNetCost={percentNetCost}
      />
      <Divider />
      <RRFormExpenses
        selectedSDRs={selectedSDRs}
        expenses={expenses}
        setExpenses={setExpenses}
        setTotalExpense={setTotalExpense}
        isEditDisabled={isEditDisabled}
      />
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

export default ReceivingReportForm;
