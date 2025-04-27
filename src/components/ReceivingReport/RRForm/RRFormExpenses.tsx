import { useEffect } from "react";
import {
  Sheet,
  Table,
  Select,
  Option,
  Input,
  Button,
  Textarea,
} from "@mui/joy";
import type { DeliveryReceipt } from "../../../interface";
import type { Expense } from "../interface";
import type { Dispatch, SetStateAction } from "react";
import { v4 as uuid } from "uuid";

const RRFormExpenses = ({
  selectedSDRs,
  setTotalExpense,
  expenses,
  setExpenses,
  isEditDisabled,
}: {
  selectedSDRs: DeliveryReceipt[];
  setTotalExpense: Dispatch<SetStateAction<number>>;
  expenses: Expense[];
  setExpenses: Dispatch<SetStateAction<Expense[]>>;
  isEditDisabled: boolean;
}): JSX.Element => {
  useEffect(() => {
    const totalExpense = expenses.reduce(
      (acc, expense) => acc + Number(expense.amount || 0),
      0,
    );
    setTotalExpense(totalExpense);
  }, [expenses]);

  const handleSelectChange = (id: any, value: string): void => {
    if (value !== null) {
      setExpenses(
        expenses.map((expense) =>
          expense.id === id ? { ...expense, expense: value } : expense,
        ),
      );
    }
  };

  const handleInputChange = (id: any, field: string, value: string): void => {
    setExpenses(
      expenses.map((expense) =>
        expense.id === id ? { ...expense, [field]: value } : expense,
      ),
    );
  };

  const handleStringInputChange = (
    id: any,
    field: string,
    value: string,
  ): void => {
    setExpenses(
      expenses.map((expense) =>
        expense.id === id ? { ...expense, [field]: value } : expense,
      ),
    );
  };

  return (
    <>
      <Sheet
        sx={{
          "--TableCell-height": "40px",
          "--TableHeader-height": "calc(1 * var(--TableCell-height))",
          "--Table-firstColumnWidth": "150px",
          "--TableRow-stripeBackground": "rgba(0 0 0 / 0.04)",
          "--TableRow-hoverBackground": "rgba(0 0 0 / 0.08)",
          overflow: "auto",
          borderRadius: 8,
          marginTop: 3,
          background: (
            theme,
          ) => `linear-gradient(to right, ${theme.vars.palette.background.surface} 30%, rgba(255, 255, 255, 0)),
              linear-gradient(to right, rgba(255, 255, 255, 0), ${theme.vars.palette.background.surface} 70%) 0 100%,
              radial-gradient(farthest-side at 0 50%, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0)) 0 100%`,
          backgroundSize:
            "40px calc(100% - var(--TableCell-height)), 40px calc(100% - var(--TableCell-height)), 14px calc(100% - var(--TableCell-height)), 14px calc(100% - var(--TableCell-height))",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "local, local, scroll, scroll",
          backgroundPosition:
            "var(--Table-firstColumnWidth) var(--TableCell-height), calc(100% - var(--Table-lastColumnWidth)) var(--TableCell-height), var(--Table-firstColumnWidth) var(--TableCell-height), calc(100% - var(--Table-lastColumnWidth)) var(--TableCell-height)",
          backgroundColor: "background.surface",
          maxHeight: "600px",
          width: "60%",
        }}
      >
        <Table
          className="h-5"
          sx={{
            "& tr > *:first-child": {
              position: "sticky",
              left: 0,
              boxShadow: "1px 0 var(--TableCell-borderColor)",
              bgcolor: "background.surface",
            },
            "& tr > *:last-child": {
              position: "sticky",
              right: 0,
              bgcolor: "var(--TableCell-headBackground)",
            },
          }}
          borderAxis="both"
        >
          <thead>
            <tr>
              <th style={{ width: "var(--Table-firstColumnWidth)" }}>
                Expense
              </th>
              <th style={{ width: 100 }}>Amount</th>
              <th style={{ width: 100 }}>Comments</th>
              <th style={{ width: 65 }}></th>
            </tr>
          </thead>
          <tbody>
            {selectedSDRs.length > 0 &&
              expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    <Select
                      onChange={(event, value) => {
                        if (value !== null)
                          handleSelectChange(expense.id, value);
                      }}
                      className="mt-1 border-0"
                      size="sm"
                      placeholder="Select Expense"
                      value={expense.expense}
                      disabled={isEditDisabled}
                      required
                    >
                      <Option value="brokerage">Brokerage</Option>
                      <Option value="freight">Freight</Option>
                    </Select>
                  </td>
                  <td>
                    <Input
                      type="number"
                      slotProps={{ input: { min: 0 } }}
                      onChange={(event) =>
                        handleInputChange(
                          expense.id,
                          "amount",
                          event.target.value,
                        )
                      }
                      value={expense.amount}
                      placeholder="0"
                      disabled={isEditDisabled}
                    />
                  </td>
                  <td>
                    <Textarea
                      placeholder="Comments"
                      onChange={(event) =>
                        handleStringInputChange(
                          expense.id,
                          "comments",
                          event.target.value,
                        )
                      }
                      value={expense.comments}
                      disabled={isEditDisabled}
                    />
                  </td>
                  <td>
                    <div className="flex justify-center">
                      <Button
                        size="sm"
                        variant="soft"
                        color="danger"
                        className="bg-delete-red"
                        onClick={() =>
                          setExpenses(
                            expenses.filter((e) => e.id !== expense.id),
                          )
                        }
                        disabled={expenses.length === 1 || isEditDisabled}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      </Sheet>
      {selectedSDRs.length > 0 && (
        <div>
          <Button
            size="sm"
            color="primary"
            className="bg-button-primary mt-4"
            onClick={() =>
              setExpenses([
                ...expenses,
                { id: uuid(), expense: "", amount: 0, comments: "" },
              ])
            }
            disabled={isEditDisabled}
          >
            Add Expense
          </Button>
        </div>
      )}
    </>
  );
};

export default RRFormExpenses;
