export const areDiscountsValid = (discounts: {
  supplier: string[];
  transaction: string[];
}): boolean => {
  const isSupplierValid = discounts.supplier.every((str) =>
    /^(\d+|\d+%?)$/.test(str),
  );
  const isTransactionValid = discounts.transaction.every((str) =>
    /^(\d+|\d+%?)$/.test(str),
  );

  return isSupplierValid && isTransactionValid;
};

export const calculateDiscount = (
  discountStr: string,
  total: number,
): number => {
  if (discountStr.trim() === "") return 0;
  if (discountStr.includes("%")) {
    const percentage = parseFloat(discountStr.replace("%", ""));
    return (percentage / 100) * total;
  }
  return parseFloat(discountStr);
};

export const calculateTotalWithDiscounts = (
  discountArray: string[],
  initialTotal: number,
): number => {
  return discountArray.reduce(
    (subtotal, discount) => subtotal - calculateDiscount(discount, subtotal),
    initialTotal,
  );
};

export interface ReturnSourceFulfillment {
  deliver_event_id: string;
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  delivered_qty: number;
  returned_qty: number;
  remaining_qty: number;
}

export interface ReturnSourceAllocation {
  deliver_event_id: string;
  quantity: string;
}

export const buildInitialSourceAllocations = (
  fulfillments: ReturnSourceFulfillment[],
): ReturnSourceAllocation[] =>
  fulfillments.map((fulfillment) => ({
    deliver_event_id: fulfillment.deliver_event_id,
    quantity: "0",
  }));

export const mergeSourceAllocations = (
  fulfillments: ReturnSourceFulfillment[],
  savedAllocations: Array<{
    deliver_event_id: string;
    quantity: number;
  }>,
): ReturnSourceAllocation[] => {
  const savedByEvent = new Map(
    savedAllocations.map((allocation) => [
      allocation.deliver_event_id,
      allocation.quantity,
    ]),
  );

  return fulfillments.map((fulfillment) => ({
    deliver_event_id: fulfillment.deliver_event_id,
    quantity: String(savedByEvent.get(fulfillment.deliver_event_id) ?? 0),
  }));
};

export const validateSourceAllocations = (
  returnQty: string,
  allocations: ReturnSourceAllocation[],
  fulfillments: ReturnSourceFulfillment[],
): string | null => {
  const requestedQty = Number(returnQty);
  const fulfillmentByEvent = new Map(
    fulfillments.map((fulfillment) => [
      fulfillment.deliver_event_id,
      fulfillment,
    ]),
  );

  let allocatedQty = 0;
  for (const allocation of allocations) {
    const quantity = Number(allocation.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      return "Source warehouse quantities must be whole numbers.";
    }

    const fulfillment = fulfillmentByEvent.get(allocation.deliver_event_id);
    if (fulfillment === undefined) {
      return "A source warehouse is no longer available for this return.";
    }
    if (quantity > fulfillment.remaining_qty) {
      return `Source quantity for ${fulfillment.warehouse_code} exceeds the remaining returnable quantity.`;
    }

    allocatedQty += quantity;
  }

  if (allocatedQty !== requestedQty) {
    return "Source warehouse quantities must equal the Return Qty.";
  }

  return null;
};
