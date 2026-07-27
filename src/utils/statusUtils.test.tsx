import { describe, expect, it } from "vitest";

import {
  canCancelTransaction,
  formatStatusText,
  getAdjustmentTypeColor,
  getStatusColor,
  getStatusVariant,
  isTransactionCancelled,
  isTransactionPosted,
} from "./statusUtils";

describe("status contracts", () => {
  it.each([
    ["posted", "success"],
    ["unposted", "warning"],
    ["cancelled", "danger"],
    ["archived", "warning"],
    ["unknown", "primary"],
  ] as const)("maps %s to %s", (status, color) => {
    expect(getStatusColor(status)).toBe(color);
  });

  it("preserves current transaction action rules", () => {
    expect(isTransactionPosted("POSTED")).toBe(true);
    expect(isTransactionCancelled("cancelled")).toBe(true);
    expect(canCancelTransaction("posted")).toBe(true);
    expect(canCancelTransaction("unposted")).toBe(false);
    expect(getStatusVariant("cancelled")).toBe("outlined");
    expect(formatStatusText("posted")).toBe("POSTED");
  });

  it("maps stock adjustment direction", () => {
    expect(getAdjustmentTypeColor("surplus")).toBe("success");
    expect(getAdjustmentTypeColor("deficit")).toBe("danger");
  });
});
