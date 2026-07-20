import { expect, test } from "@playwright/test";

async function navigateFromAToB(page: import("@playwright/test").Page) {
  await page.goto("/a");
  await expect(page.getByTestId("profile-label")).toHaveText(
    "Profile survived",
  );
  await page.getByRole("link", { name: "Go to route B" }).click();
  await expect(page).toHaveURL(/\/b$/);
  await expect(page.getByTestId("route-a")).toBeHidden();

  const routes = [
    { epoch: 2, path: "/c" },
    { epoch: 3, path: "/d" },
    { epoch: 4, path: "/e" },
  ];
  for (const { epoch, path } of routes) {
    await page
      .getByTestId(`churn-route-${epoch - 1}`)
      .getByRole("link", { name: "Churn next route owner" })
      .click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(
      page.getByTestId(`churn-route-${epoch}`).getByTestId("churn-state"),
    ).toHaveText(`owner churn complete: ${epoch}`);
  }

  await expect(page.getByTestId("route-a")).toHaveCount(0);
}

test("control: Activity restore succeeds when scheduled GC is not flushed", async ({
  page,
}) => {
  await navigateFromAToB(page);

  await page.getByRole("link", { name: "Restore route A" }).click();
  await expect(page).toHaveURL(/\/a$/);
  await expect(page.getByTestId("profile-label")).toHaveText(
    "Profile survived",
  );
  await expect(page.getByTestId("route-error")).toHaveCount(0);
});

test("reproduces PJM-1564 after public retain release and gcScheduler flush", async ({
  page,
}) => {
  await navigateFromAToB(page);
  const currentRoute = page.getByTestId("churn-route-4");

  await currentRoute
    .getByRole("button", {
      name: "Release route A and flush scheduled Relay GC",
    })
    .click();
  await expect(currentRoute.getByTestId("store-state")).toContainText(
    '"pendingGC":0',
  );
  await expect(currentRoute.getByTestId("store-state")).toContainText(
    '"profile":false',
  );
  await expect(currentRoute.getByTestId("store-state")).toContainText(
    '"user":true',
  );

  await page.getByRole("link", { name: "Restore route A" }).click();
  await expect(page).toHaveURL(/\/a$/);
  await expect(page.getByTestId("route-error")).toBeVisible();
  await expect(page.getByTestId("route-error")).toContainText("TypeError");
  await expect(page.getByTestId("route-error")).toContainText("label");
});
