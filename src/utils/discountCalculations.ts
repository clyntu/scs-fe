export interface CpoStyleDiscounts {
  customer_discount_1: string;
  customer_discount_2: string;
  customer_discount_3: string;
  transaction_discount_1: string;
  transaction_discount_2: string;
  transaction_discount_3: string;
}

// Percentage-only: mirrors the current CDR/CR PDF behavior exactly, including
// its known gap of silently ignoring flat (non-%) discount values.
export function calculatePercentageDiscountedAmount(
  quantity: number,
  unitPrice: number,
  discounts: CpoStyleDiscounts,
): number {
  let result = quantity * unitPrice;

  const percentageFields = [
    discounts.customer_discount_1,
    discounts.customer_discount_2,
    discounts.customer_discount_3,
    discounts.transaction_discount_1,
    discounts.transaction_discount_2,
    discounts.transaction_discount_3,
  ];

  for (const field of percentageFields) {
    if (field.includes("%")) {
      const pct = parseFloat(field.slice(0, -1));
      result = result - result * (pct / 100);
    }
  }

  if (isNaN(result)) return 0;

  return result;
}
