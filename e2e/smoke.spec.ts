import { test, expect } from "@playwright/test";

test("home renders and routes to the sign-in form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByRole("link", { name: /get started/i }).click();
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});
