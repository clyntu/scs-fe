import { expect, test } from "@playwright/test";

test("login page renders the required authentication controls", async ({
  page,
}) => {
  await page.route("**/api/users/me/**", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Missing bearer token" }),
    });
  });

  await page.goto("/");

  await expect(page.getByText("Sign in to continue.")).toBeVisible();
  await expect(page.getByPlaceholder("your.email@example.com")).toBeVisible();
  await expect(page.getByPlaceholder("********")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show password" }),
  ).toBeVisible();
});

test("application shell collapses and reflows without sidebar overlap", async ({
  page,
}) => {
  await page.route("**/api/users/me/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 1,
        username: "admin",
        email: "admin@example.com",
        full_name: "Admin User",
        is_admin: true,
      }),
    });
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/forbidden");

  const sidebar = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  const main = page.locator("main.app-main");

  await expect(sidebar).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Collapse sidebar" }),
  ).toBeVisible();

  const expandedSidebarBox = await sidebar.boundingBox();
  const expandedMainBox = await main.boundingBox();
  expect(expandedSidebarBox).not.toBeNull();
  expect(expandedMainBox).not.toBeNull();
  expect(expandedMainBox?.x ?? 0).toBeGreaterThanOrEqual(
    expandedSidebarBox?.width ?? 0,
  );

  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(
    page.getByRole("button", { name: "Expand sidebar" }),
  ).toBeVisible();
  await page.waitForTimeout(250);

  const collapsedSidebarBox = await sidebar.boundingBox();
  const collapsedMainBox = await main.boundingBox();
  expect(collapsedMainBox?.x ?? 0).toBeGreaterThanOrEqual(
    collapsedSidebarBox?.width ?? 0,
  );

  await page.setViewportSize({ width: 320, height: 700 });
  await expect(
    page.getByRole("button", { name: "Open navigation menu" }),
  ).toBeVisible();
  await expect(sidebar).not.toBeInViewport();

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(sidebar).toBeInViewport();
  await page
    .getByRole("button", { name: "Close navigation menu" })
    .first()
    .click();
  await expect(sidebar).not.toBeInViewport();

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
});

test("stocks loading state preserves the real table structure", async ({
  page,
}) => {
  await page.route("**/api/users/me/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 1,
        username: "admin",
        email: "admin@example.com",
        full_name: "Admin User",
        is_admin: true,
      }),
    });
  });
  await page.route(/\/api\/items\/?(?:\?.*)?$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total: 0, items: [] }),
    });
  });
  await page.route("**/api/categories**", async (route) => {
    await route.fulfill({ status: 200, body: "[]" });
  });
  await page.route("**/api/brands**", async (route) => {
    await route.fulfill({ status: 200, body: "[]" });
  });
  await page.route("**/api/warehouses/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total: 0, items: [] }),
    });
  });
  await page.route("**/api/currencies**", async (route) => {
    await route.fulfill({ status: 200, body: "[]" });
  });

  await page.goto("/configuration/item");

  const table = page.locator("table");
  await expect(table.getByText("Stock Code", { exact: true })).toBeVisible();
  await expect(table.getByText("Description", { exact: true })).toBeVisible();
  await expect(table.getByText("Status", { exact: true })).toBeVisible();

  const loadingRows = page.locator('tbody[aria-label="Loading content"]');
  await expect(loadingRows).toBeVisible();
  await expect(loadingRows.locator("tr")).toHaveCount(7);
  await expect(loadingRows.locator(".MuiSkeleton-root")).toHaveCount(112);
});

test("company selector options remain clickable above the sidebar", async ({
  page,
}) => {
  await page.route("**/api/users/me/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 1,
        username: "admin",
        email: "admin@example.com",
        full_name: "Admin User",
        is_admin: true,
      }),
    });
  });

  await page.goto("/forbidden");
  await page.getByRole("combobox", { name: "Current company" }).click();
  await page.getByRole("option", { name: "Medstore Inc." }).click();

  await expect
    .poll(async () =>
      page.evaluate(() => window.localStorage.getItem("currentCompany")),
    )
    .toBe("company-b");
});

test("authenticated root renders the responsive operations dashboard", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "sb-auth-token",
      JSON.stringify({
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user: {
          id: "test-user",
          aud: "authenticated",
          role: "authenticated",
          email: "admin@example.com",
          app_metadata: { provider: "email", providers: ["email"] },
          user_metadata: { full_name: "Admin User" },
          identities: [],
          created_at: new Date().toISOString(),
        },
      }),
    );
    window.localStorage.setItem("currentCompany", "company-a");
    window.localStorage.setItem("companyId", "company-a");
  });

  await page.route("**/api/users/me/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 1,
        username: "admin",
        email: "admin@example.com",
        full_name: "Admin User",
        is_admin: true,
      }),
    });
  });
  await page.route(/\/api\/items\/?(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: 3,
        items: [
          {
            id: 1,
            stock_code: "PUMP-01",
            name: "Hydraulic pump",
            status: "active",
            total_on_stock: 0,
            total_allocated: 8,
          },
          {
            id: 2,
            stock_code: "VALVE-14",
            name: "Control valve",
            status: "active",
            total_on_stock: 4,
            total_allocated: 5,
          },
          {
            id: 3,
            stock_code: "FILTER-07",
            name: "Oil filter",
            status: "active",
            total_on_stock: 24,
            total_allocated: 6,
          },
        ],
      }),
    });
  });

  const countResponse = (total: number): string =>
    JSON.stringify({ total, items: [] });
  await page.route("**/api/purchase_orders/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: countResponse(2),
    });
  });
  await page.route("**/api/receiving-reports/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: countResponse(1),
    });
  });
  await page.route("**/api/allocations/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: countResponse(3),
    });
  });
  await page.route("**/api/delivery-plans/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: countResponse(1),
    });
  });
  await page.route("**/customer-financial/receivables**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total: 1,
        items: [
          {
            customer_id: 1,
            customer_name: "Northstar Trading",
            amount_receivable: "125000",
            uncleared_payment: "15000",
            bounced_payment: "0",
          },
        ],
        total_receivable: "125000",
        total_uncleared: "15000",
        total_bounced: "0",
      }),
    });
  });
  await page.route("**/api/ar-receipts/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: countResponse(2),
    });
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Good day, Admin." }),
  ).toBeVisible();
  await expect(page.getByText("Work the exceptions first")).toBeVisible();
  await expect(page.getByText("Available vs. committed units")).toBeVisible();
  await expect(page.getByText("Northstar Trading")).toBeVisible();
  await expect(page.getByRole("link", { name: /Operations/ })).toHaveAttribute(
    "aria-current",
    "page",
  );

  const sidebarBox = await page
    .getByRole("navigation", { name: "Primary navigation" })
    .boundingBox();
  const mainBox = await page.locator("main.app-main").boundingBox();
  expect(mainBox?.x ?? 0).toBeGreaterThanOrEqual(sidebarBox?.width ?? 0);
  const layoutMetrics = await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>("main.app-main");
    const dashboard = document.querySelector<HTMLElement>(
      '[aria-label="Inventory position"]',
    )?.parentElement;
    return {
      mainLeft: main?.getBoundingClientRect().left ?? 0,
      mainPaddingLeft: main
        ? Number.parseFloat(window.getComputedStyle(main).paddingLeft)
        : 0,
      dashboardLeft: dashboard?.getBoundingClientRect().left ?? 0,
    };
  });
  expect(layoutMetrics.dashboardLeft).toBeGreaterThanOrEqual(
    layoutMetrics.mainLeft + layoutMetrics.mainPaddingLeft - 1,
  );

  await page.setViewportSize({ width: 320, height: 760 });
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
});
