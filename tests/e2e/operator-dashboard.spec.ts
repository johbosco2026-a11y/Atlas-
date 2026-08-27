import { expect, test } from "@playwright/test";

test("operator dashboard exposes the guarded production flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /autonomous control plane/i })).toBeVisible();
  await expect(page.getByText("Preview-first policy")).toBeVisible();
  await expect(page.getByText("main is production")).toBeVisible();
});
