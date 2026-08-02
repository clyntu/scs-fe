import { describe, expect, it } from "vitest";

import {
  buildInitialSourceAllocations,
  mergeSourceAllocations,
  validateSourceAllocations,
} from "./helpers";

describe("customer return source allocations", () => {
  it("automatically allocates a single fulfillment source", () => {
    expect(
      buildInitialSourceAllocations([
        {
          deliver_event_id: "event-a",
          warehouse_id: 1,
          warehouse_code: "WH-A",
          warehouse_name: "Warehouse A",
          delivered_qty: 5,
          returned_qty: 1,
          remaining_qty: 4,
        },
      ]),
    ).toEqual([{ deliver_event_id: "event-a", quantity: "0" }]);
  });

  it("requires a multi-source split to equal the return quantity", () => {
    const result = validateSourceAllocations(
      "4",
      [
        { deliver_event_id: "event-a", quantity: "2" },
        { deliver_event_id: "event-b", quantity: "1" },
      ],
      [
        {
          deliver_event_id: "event-a",
          warehouse_id: 1,
          warehouse_code: "WH-A",
          warehouse_name: "Warehouse A",
          delivered_qty: 3,
          returned_qty: 0,
          remaining_qty: 3,
        },
        {
          deliver_event_id: "event-b",
          warehouse_id: 2,
          warehouse_code: "WH-B",
          warehouse_name: "Warehouse B",
          delivered_qty: 2,
          returned_qty: 0,
          remaining_qty: 2,
        },
      ],
    );

    expect(result).toBe(
      "Source warehouse quantities must equal the Return Qty.",
    );
  });

  it("restores zero allocations for unused fulfillment sources on edit", () => {
    expect(
      mergeSourceAllocations(
        [
          {
            deliver_event_id: "event-a",
            warehouse_id: 1,
            warehouse_code: "WH-A",
            warehouse_name: "Warehouse A",
            delivered_qty: 3,
            returned_qty: 0,
            remaining_qty: 3,
          },
          {
            deliver_event_id: "event-b",
            warehouse_id: 2,
            warehouse_code: "WH-B",
            warehouse_name: "Warehouse B",
            delivered_qty: 2,
            returned_qty: 0,
            remaining_qty: 2,
          },
        ],
        [{ deliver_event_id: "event-a", quantity: 2 }],
      ),
    ).toEqual([
      { deliver_event_id: "event-a", quantity: "2" },
      { deliver_event_id: "event-b", quantity: "0" },
    ]);
  });

  it("rejects a source quantity above its remaining returnable quantity", () => {
    const result = validateSourceAllocations(
      "3",
      [{ deliver_event_id: "event-a", quantity: "3" }],
      [
        {
          deliver_event_id: "event-a",
          warehouse_id: 1,
          warehouse_code: "WH-A",
          warehouse_name: "Warehouse A",
          delivered_qty: 5,
          returned_qty: 3,
          remaining_qty: 2,
        },
      ],
    );

    expect(result).toBe(
      "Source quantity for WH-A exceeds the remaining returnable quantity.",
    );
  });
});
