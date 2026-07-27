// @vitest-environment node

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = path.join(process.cwd(), "src");

const contracts = [
  ["stocks", "components/Items", "get", "/api/items/"],
  ["suppliers", "pages/configuration/supplier.tsx", "get", "/api/suppliers/"],
  ["customers", "components/Customers", "get", "/api/customers/"],
  ["warehouses", "pages/configuration", "get", "/api/warehouses/"],
  [
    "stock adjustments",
    "components/StockAdjustment",
    "get",
    "/api/stock-adjustments/",
  ],
  ["PO", "components/PurchaseOrder", "post", "/api/purchase_orders/"],
  [
    "SDR",
    "components/DeliveryReceipt",
    "post",
    "/api/supplier-delivery-receipts/",
  ],
  ["RR", "components/ReceivingReport", "post", "/api/receiving-reports/"],
  ["ST", "components/StockTransfer", "post", "/api/stock-transfers/"],
  ["CPO", "components/CPO", "post", "/api/customer_purchase_orders/"],
  ["Allocation", "components/Allocation", "post", "/api/allocations/"],
  ["Deallocation", "components/Deallocation", "post", "/api/deallocations/"],
  ["Delivery Planning", "components/CDP", "post", "/api/delivery-plans/"],
  ["Delivery Receipt", "components/CDR", "post", "/api/delivery-receipts/"],
  ["Customer Return", "components/CR", "post", "/api/customer-returns/"],
  ["AR", "components/AR", "post", "/api/ar-receipts/"],
] as const;

function readSourceTree(relativeDirectory: string): string {
  const directory = path.join(ROOT, relativeDirectory);
  if (fs.statSync(directory).isFile()) {
    return fs.readFileSync(directory, "utf-8");
  }

  const files: string[] = [];
  const visit = (currentDirectory: string): void => {
    fs.readdirSync(currentDirectory, { withFileTypes: true }).forEach(
      (entry) => {
        const entryPath = path.join(currentDirectory, entry.name);
        if (entry.isDirectory()) {
          visit(entryPath);
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          files.push(entryPath);
        }
      },
    );
  };
  visit(directory);
  return files.map((file) => fs.readFileSync(file, "utf-8")).join("\n");
}

describe("frontend module API contracts", () => {
  it.each(contracts)("%s uses %s %s", (_, directory, method, endpoint) => {
    const source = readSourceTree(directory);
    const escapedEndpoint = endpoint.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const requestCall = new RegExp(
      `\\.${method}(?:<[^)]*?>)?\\s*\\([\\s\\S]{0,160}${escapedEndpoint}`,
    );

    expect(source).toMatch(requestCall);
  });

  it("preserves company and backend error contracts", () => {
    const axiosSource = fs.readFileSync(
      path.join(ROOT, "utils/axiosConfig.tsx"),
      "utf-8",
    );

    expect(axiosSource).toContain('"X-Company-ID"');
    expect(axiosSource).toContain('"inactive user"');
    expect(axiosSource).toContain('"disabled"');
  });
});
