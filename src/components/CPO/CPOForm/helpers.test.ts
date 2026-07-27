import { describe, expect, it } from "vitest";

import {
  areCustomerDiscountsValid,
  calculateTotalWithDiscounts,
} from "./helpers";

describe("customer purchase order discounts", () => {
  it("accepts percentage-only discounts", () => {
    expect(
      areCustomerDiscountsValid({
        customer: ["10%", "2.5%", ""],
        transaction: ["5%", "", "0%"],
      }),
    ).toBe(true);
    expect(
      areCustomerDiscountsValid({
        customer: ["100", "", ""],
        transaction: ["", "", ""],
      }),
    ).toBe(false);
  });

  it("compounds percentages in order", () => {
    expect(
      calculateTotalWithDiscounts(
        {
          customer: ["10%", "5%"],
          transaction: [],
        },
        1000,
      ),
    ).toBe(855);
  });
});
