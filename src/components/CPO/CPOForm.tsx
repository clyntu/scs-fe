import CPOFormDetails from "./CPOForm/CPOFormDetails";
import CPOFormTable from "./CPOForm/CPOFormTable";
import { Button, Divider } from "@mui/joy";
import SaveIcon from "@mui/icons-material/Save";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import type { CPOPayload, CPOItemValues } from "./interface";
import type { User } from "../../pages/Login";
import {
  areCustomerDiscountsValid as areDiscountsValid,
  calculateTotalWithDiscounts,
} from "./CPOForm/helpers";
import type {
  CPOFormProps,
  Customer,
  Item,
  PaginatedCustomers,
  PaginatedItems,
} from "../../interface";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";

//  Initialize state of selectedItems outside of component to avoid creating new object on each render
const INITIAL_SELECTED_ITEMS = [{ id: null }];

const CPOForm = ({
  setOpen,
  openCreate,
  openEdit,
  selectedRow,
  title,
}: CPOFormProps): JSX.Element => {
  const currentDate = new Date().toISOString().split("T")[0];
  const isEditDisabled =
    selectedRow !== undefined && selectedRow?.status !== "unposted";
  const [customers, setCustomers] = useState<PaginatedCustomers>({
    total: 0,
    items: [],
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<any>(
    INITIAL_SELECTED_ITEMS,
  );
  const [discounts, setDiscounts] = useState({
    customer: ["", "", ""],
    transaction: ["", "", ""],
  });

  const [priceLevel, setPriceLevel] = useState("1");

  const [status, setStatus] = useState("unposted");
  const [transactionDate, setTransactionDate] = useState(currentDate);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [indexOfModal, setIndexOfModal] = useState(0);

  useEffect(() => {
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

    // Fetch items
    axiosInstance
      .get<PaginatedItems>(`/api/items`)
      .then((response) => {
        setItems(response.data.items);
      })
      .catch((error) => console.error("Error:", error));
  }, []);

  useEffect(() => {
    // Set fields for Edit
    if (selectedRow !== null && selectedRow?.customer_id !== undefined) {
      setDiscounts({
        customer: [
          selectedRow?.customer_discount_1 ?? 0,
          selectedRow?.customer_discount_2 ?? 0,
          selectedRow?.customer_discount_3 ?? 0,
        ],
        transaction: [
          selectedRow?.transaction_discount_1 ?? 0,
          selectedRow?.transaction_discount_2 ?? 0,
          selectedRow?.transaction_discount_3 ?? 0,
        ],
      });
      setStatus(selectedRow?.status ?? "pending");
      setPriceLevel(selectedRow?.price_level ?? "1");
      setTransactionDate(selectedRow?.transaction_date ?? currentDate);
      setReferenceNumber(selectedRow?.reference_number ?? "");
      setRemarks(selectedRow?.remarks ?? "");

      // Get Customer for Edit
      axiosInstance
        .get<Customer>(`/api/customers/${selectedRow?.customer_id}`)
        .then((response) => {
          setSelectedCustomer(response.data);
        })
        .catch((error) => console.error("Error:", error));
    }
  }, [selectedRow]);

  useEffect(() => {
    // Set CPOItems only after items exist for edit
    if (selectedRow !== undefined && items.length > 0) {
      getAllCPOItems();
    }
  }, [items]);

  const createPayload = (
    itemPayload: CPOItemValues[],
    isEdit: boolean,
  ): CPOPayload => {
    const payload: CPOPayload = {
      status,
      transaction_date: transactionDate,
      customer_id: selectedCustomer?.customer_id ?? 0,
      price_level: priceLevel,
      gross_total: grossTotal,
      customer_discount_1: discounts.customer[0],
      customer_discount_2: discounts.customer[1],
      customer_discount_3: discounts.customer[2],
      transaction_discount_1: discounts.transaction[0],
      transaction_discount_2: discounts.transaction[1],
      transaction_discount_3: discounts.transaction[2],
      net_total: netTotal,
      reference_number: referenceNumber,
      remarks,
      items: itemPayload,
    };

    return payload;
  };

  const grossTotal: number = selectedItems.reduce((acc: number, item: Item) => {
    // Explicitly check for a valid number on id, and ensure price and volume are greater than zero.
    if (
      typeof item.id === "number" && // Check that id is a number.
      item?.price !== undefined &&
      !isNaN(item.price) &&
      item.price > 0 &&
      item?.volume !== undefined &&
      !isNaN(item.volume) &&
      item.volume > 0
    ) {
      return acc + item.price * item.volume;
    }
    return acc;
  }, 0);

  const netTotal = calculateTotalWithDiscounts(discounts, grossTotal);

  const getAllCPOItems = (): void => {
    const CPOItems = selectedRow?.items;
    if (CPOItems === undefined) return;

    // If selected customer is different from the selected row customer (i.e. user edited customer)
    // make CPO blank
    if (selectedRow?.customer.customer_id !== selectedCustomer?.customer_id) {
      setSelectedItems(INITIAL_SELECTED_ITEMS);
      return;
    }

    const selectedItems = CPOItems.map((item) => {
      const id = item.item_id;
      const foundItem = items.find((i) => i.id === id);

      const modifiedItem = {
        ...foundItem,
        price: item.price,
        volume: item.volume,
        allocated: item.allocated,
        p_type: item.p_type,
      };

      return modifiedItem;
    });

    // Sort items
    selectedItems.sort((a, b) => {
      const stockCodeA = a.stock_code ?? ""; // Default to empty string if undefined
      const stockCodeB = b.stock_code ?? ""; // Default to empty string if undefined
      return stockCodeA.localeCompare(stockCodeB);
    });

    // @ts-expect-error (Used null instead of undefined.)
    selectedItems?.push({ id: null });
    setSelectedItems(selectedItems);
  };

  const handleCreateCPO = async (): Promise<void> => {
    if (selectedItems.length === 1) {
      toast.error("Error: No Items Selected");
      return;
    }

    if (!areDiscountsValid(discounts)) {
      toast.error(
        "Error: Discounts must be a positive number with or without %",
      );
      return;
    }

    const itemPayload: CPOItemValues[] = selectedItems
      .filter((item: Item) => item.id !== null)
      .map((item: Item) => ({
        item_id: item.id,
        p_type: item.p_type,
        volume: item.volume,
        unserved_spo: item.volume,
        price: item.price,
        total_price: Number(item.volume) * Number(item.price),
      }));

    const payload = createPayload(itemPayload, false);
    try {
      await axiosInstance.post("/api/customer_purchase_orders/", payload);
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

  const handleEditCPO = async (): Promise<void> => {
    if (selectedItems.length === 1) {
      toast.error("Error: No Items Selected");
      return;
    }

    if (!areDiscountsValid(discounts)) {
      toast.error(
        "Error: Discounts must be a positive number with or without %",
      );
      return;
    }

    const itemPayload: CPOItemValues[] = selectedItems
      .filter((item: Item) => item.id !== null)
      .map((item: Item) => ({
        item_id: item.id,
        p_type: item.p_type,
        volume: Number(item.volume),
        price: Number(item.price),
        unserved_spo: Number(item.volume),
        total_price: Number(item.volume) * Number(item.price),
      }));

    const payload = createPayload(itemPayload, true);
    try {
      await axiosInstance.put(
        `/api/customer_purchase_orders/${selectedRow?.id}`,
        payload,
      );
      setOpen(false);
      toast.success("Save successful!");
      // Handle the response, update state, etc.
    } catch (error: any) {
      toast.error(
        `Error message: ${error?.response?.data?.detail[0]?.msg || error?.response?.data?.detail}`,
      );
    }
  };

  const resetForm = (): void => {
    setSelectedCustomer(null);
    setItems([]);
    setSelectedItems(INITIAL_SELECTED_ITEMS);
    setDiscounts({
      customer: ["0", "0", "0"],
      transaction: ["0", "0", "0"],
    });
    setPriceLevel("1");
    setStatus("unposted");
    setTransactionDate(currentDate);
    setReferenceNumber("");
    setRemarks("");
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (openCreate) await handleCreateCPO();
        if (openEdit) await handleEditCPO();
      }}
      onKeyDown={(e): void => {
        if (isConfirmOpen && e.key === "Enter") {
          e.preventDefault();
        }
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
      <CPOFormDetails
        openEdit={openEdit}
        selectedRow={selectedRow}
        customers={customers}
        // Fields
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        setSelectedItems={setSelectedItems}
        status={status}
        setStatus={setStatus}
        transactionDate={transactionDate}
        setTransactionDate={setTransactionDate}
        discounts={discounts}
        setDiscounts={setDiscounts}
        remarks={remarks}
        setRemarks={setRemarks}
        referenceNumber={referenceNumber}
        setReferenceNumber={setReferenceNumber}
        priceLevel={priceLevel}
        setPriceLevel={setPriceLevel}
        // Summary Amounts
        netTotal={netTotal}
        grossTotal={grossTotal}
      />
      <CPOFormTable
        items={items}
        status={status}
        selectedRow={selectedRow}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        indexOfModal={indexOfModal}
        setIndexOfModal={setIndexOfModal}
        isConfirmOpen={isConfirmOpen}
        setIsConfirmOpen={setIsConfirmOpen}
        selectedCustomer={selectedCustomer}
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

export default CPOForm;
