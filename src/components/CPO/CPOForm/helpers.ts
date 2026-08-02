export const areCustomerDiscountsValid = (discounts: {
  customer: string[];
  transaction: string[];
}): boolean => {
  const isCustomerValid = discounts.customer.every(
    (str) => /^(?:\d+(?:\.\d+)?%)?$/.test(str), // Allows an empty string or percentage only
  );
  const isTransactionValid = discounts.transaction.every(
    (str) => /^(?:\d+(?:\.\d+)?%)?$/.test(str), // Allows an empty string or percentage only
  );

  return isCustomerValid && isTransactionValid;
};

export const calculateDiscount = (
  discountStr: string,
  total: number,
): number => {
  if (discountStr.trim() === "") return 0;
  // All discounts must be percentages now
  const percentage = parseFloat(discountStr);
  return (percentage / 100) * total;
};

export const calculateTotalWithDiscounts = (
  discounts: { customer: string[]; transaction: string[] },
  initialTotal: number,
): number => {
  // Combine all discounts into a single array
  const allDiscounts = [...discounts.customer, ...discounts.transaction];

  // Filter out empty strings
  const validDiscounts = allDiscounts.filter((d) => d.trim() !== "");

  // Apply all discounts (which are now only percentages)
  const subtotal = validDiscounts.reduce(
    (currentTotal, discount) =>
      currentTotal - calculateDiscount(discount, currentTotal),
    initialTotal,
  );

  return subtotal;
};
