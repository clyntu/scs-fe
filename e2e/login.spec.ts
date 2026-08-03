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
  await expect(loadingRows.locator(".MuiSkeleton-root")).toHaveCount(119);
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
