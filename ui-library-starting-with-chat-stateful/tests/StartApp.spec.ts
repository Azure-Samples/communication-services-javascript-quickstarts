import { test } from "@playwright/test";

test("Start the app", async ({ page, context, browser }) => {
  // set timeout to 10 minutes
  test.setTimeout(10 * 60 * 1000);

  await page.goto("http://localhost:3000/");
  // Create a locator that matches both the textarea and the contentEditable component
  const input = page.locator('textarea, [contenteditable="true"]').first();
  await input.click();
  await input.fill(`${new Date()} - Test`);
  await page.getByLabel("Send message").click();

  // the test will work until the page is closed
  await new Promise((resolve) => {
    page.on("close", resolve);
  });

  await context.close();
  await browser.close();
});
