import { describe, expect, it } from "vitest";
import type { Item } from "../../interface";
import { summarizeInventory } from "./useDashboardData";

function item(
  id: number,
  available: number,
  allocated: number,
  status = "active",
): Item {
  return {
    id,
    stock_code: `SKU-${id}`,
    name: `Item ${id}`,
    status,
    category: "Parts",
    brand: "SCS",
    currency: { id: 1, code: "PHP" },
    currency_id: 1,
    total_on_stock: available,
    total_allocated: allocated,
    total_purchased: 0,
    total_sold: 0,
    created_by: 1,
    modified_by: 1,
    date_created: "2026-01-01",
    date_modified: "2026-01-01",
  };
}

describe("summarizeInventory", () => {
  it("counts active inventory and prioritizes stock pressure", () => {
    const summary = summarizeInventory([
      item(1, 0, 4),
      item(2, 3, 3),
      item(3, 12, 2),
      item(4, 99, 0, "inactive"),
    ]);

    expect(summary).toMatchObject({
      activeSkus: 3,
      availableUnits: 15,
      allocatedUnits: 9,
      stockoutCount: 1,
      tightAvailabilityCount: 1,
    });
    expect(summary.attentionItems.map((entry) => entry.id)).toEqual([1, 2, 3]);
  });
});
