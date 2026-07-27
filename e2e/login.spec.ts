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
