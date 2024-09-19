import { test } from "@playwright/test";

test("Start the app", async ({ page, browser }) => {
  // set timeout to 10 minutes
  test.setTimeout(10 * 60 * 1000);

  await page.goto("http://localhost:3000/");

  // eslint-disable-next-line testing-library/prefer-screen-queries
  await page.getByRole("button", { name: "Start call" }).click();
  await page.getByLabel("Chat").click();
  const input = page.getByPlaceholder("Enter a message");
  await input.click();
  await input.fill(`${new Date()} - Test`);
  await page.getByLabel("Send message").click();

  // the test will work until the page is closed
  await new Promise((resolve) => {
    page.on("close", resolve);
  });
});
