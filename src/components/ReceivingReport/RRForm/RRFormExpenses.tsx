import { useEffect, useState } from "react";
import { Sheet, Table, Autocomplete, Input, Button, Textarea } from "@mui/joy";
import axiosInstance from "../../../utils/axiosConfig";
import type { DeliveryReceipt } from "../../../interface";
import type { ExpenseFormRow } from "../interface";
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
  expenses: ExpenseFormRow[];
  setExpenses: Dispatch<SetStateAction<ExpenseFormRow[]>>;
  isEditDisabled: boolean;
}): JSX.Element => {
  const [expenseOptions, setExpenseOptions] = useState<string[]>([
    "Brokerage",
    "Freight",
  ]);

  useEffect(() => {
    axiosInstance
      .get<string[]>("/api/receiving-reports/unique-expense-names/")
      .then((response) => {
        if (Array.isArray(response.data) && response.data.length > 0) {
          setExpenseOptions(response.data);
        }
      })
      .catch(() => {
        // fallback to default options if error
        setExpenseOptions(["brokerage", "freight"]);
      });
  }, []);

  useEffect(() => {
    const totalExpense = expenses.reduce(
      (acc, expense) => acc + Number(expense.amount ?? 0),
      0,
    );
    setTotalExpense(totalExpense);
  }, [expenses]);

  const updateExpense = (
    clientKey: string,
    changes: Partial<Pick<ExpenseFormRow, "expense" | "amount" | "comments">>,
  ): void => {
    setExpenses((currentExpenses) =>
      currentExpenses.map((expense) =>
        expense.clientKey === clientKey ? { ...expense, ...changes } : expense,
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
              zIndex: 2,
              left: 0,
              boxShadow: "1px 0 var(--TableCell-borderColor)",
              bgcolor: "background.surface",
            },
            "& tr > *:not(:first-child):not(:last-child)": {
              position: "relative",
              zIndex: 0,
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
                <tr key={expense.clientKey}>
                  <td>
                    <Autocomplete
                      freeSolo
                      options={expenseOptions}
                      value={expense.expense}
                      onInputChange={(_event, value) => {
                        updateExpense(expense.clientKey, { expense: value });
                      }}
                      placeholder="Select or type expense"
                      disabled={isEditDisabled}
                      size="sm"
                      required
                    />
                  </td>
                  <td>
                    <Input
                      onChange={(event) =>
                        updateExpense(expense.clientKey, {
                          amount: event.target.value,
                        })
                      }
                      sx={{
                        input: {
                          textAlign: "right",
                        },
                      }}
                      value={expense.amount ?? ""}
                      placeholder="0"
                      disabled={isEditDisabled}
                    />
                  </td>
                  <td>
                    <Textarea
                      placeholder="Comments"
                      onChange={(event) =>
                        updateExpense(expense.clientKey, {
                          comments: event.target.value,
                        })
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
                          setExpenses((currentExpenses) =>
                            currentExpenses.filter(
                              (row) => row.clientKey !== expense.clientKey,
                            ),
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
            sx={{ mt: 4 }}
            className="bg-button-primary"
            onClick={() =>
              setExpenses((currentExpenses) => [
                ...currentExpenses,
                {
                  clientKey: uuid(),
                  expense: "",
                  amount: undefined,
                  comments: "",
                },
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
