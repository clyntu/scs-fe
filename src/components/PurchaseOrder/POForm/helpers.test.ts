import { describe, expect, it } from "vitest";

import {
  areDiscountsValid,
  calculateDiscount,
  calculateTotalWithDiscounts,
} from "./helpers";

describe("purchase order discounts", () => {
  it("accepts percentage and fixed discount formats", () => {
    expect(
      areDiscountsValid({
        supplier: ["10%", "25", ""],
        transaction: ["2.5%", "", "0"],
      }),
    ).toBe(true);
  });

  it("calculates percentage and fixed discounts", () => {
    expect(calculateDiscount("10%", 1000)).toBe(100);
    expect(calculateDiscount("25", 1000)).toBe(25);
  });

  it("compounds percentages before subtracting fixed amounts", () => {
    expect(
      calculateTotalWithDiscounts(
        {
          supplier: ["10%", "100"],
          transaction: ["5%", ""],
        },
        1000,
      ),
    ).toBe(755);
  });
});
