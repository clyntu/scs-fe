import { describe, expect, it, vi } from "vitest";

import {
  convertToQueryParams,
  formatToDate,
  formatToDateTime,
  getErrorMessage,
} from "./helper";

describe("shared helpers", () => {
  it("serializes supported query values and drops undefined", () => {
    expect(
      convertToQueryParams({
        page: 2,
        status: "posted",
        active: true,
        omitted: undefined,
      }),
    ).toBe("page=2&status=posted&active=true");
  });

  it("drops unsupported query values and logs the key", () => {
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(convertToQueryParams({ item_ids: [1, 2] })).toBe("");
    expect(error).toHaveBeenCalledWith(
      'Invalid query parameter value for key "item_ids":',
      [1, 2],
    );
    error.mockRestore();
  });

  it("extracts FastAPI validation and string error details", () => {
    expect(
      getErrorMessage({
        response: { data: { detail: [{ msg: "Invalid quantity" }] } },
      }),
    ).toBe("Invalid quantity");
    expect(
      getErrorMessage({
        response: { data: { detail: "Customer not found" } },
      }),
    ).toBe("Customer not found");
    expect(getErrorMessage({}, "Fallback")).toBe("Fallback");
  });

  it("handles missing dates without rendering invalid values", () => {
    expect(formatToDate(null)).toBe("");
    expect(formatToDate(undefined)).toBe("");
    expect(formatToDateTime(null)).toBe("-");
  });
});
